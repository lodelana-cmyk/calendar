"use client"

import { useState } from "react"
import { Loader2, Sparkles, ArrowLeft, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useStore } from "@/lib/store"
import { useRefreshData } from "@/components/data-provider"
import { createCampaignClient, createContentItemsClient } from "@/lib/data-client"
import { normaliseFormat, normaliseChannel, matchAssignee as matchAssigneeToProfiles, nextSortOrder } from "@/lib/ai-items"
import type {
  CampaignMotion, CampaignType, ItemStatus, DateConfidence, CampaignWithItems,
} from "@/lib/database.types"
import {
  MOTION_OPTIONS, TYPE_OPTIONS, ICON_COLORS, NO_CAMPAIGN_ID,
} from "@/lib/database.types"

const NO_SECTION = "__no_section__"

/** Group an item list by its `section`, preserving first-seen order. */
function groupBySection(items: ParsedItem[]): [string, ParsedItem[]][] {
  const groups = new Map<string, ParsedItem[]>()
  for (const it of items) {
    const key = it.section?.trim() || NO_SECTION
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(it)
  }
  return Array.from(groups.entries())
}

interface ParsedItem {
  title: string
  channel: string
  format: string
  section: string | null
  assignee_name: string | null
  publish_date: string
  date_confidence: string
}

interface ParsedCampaign {
  title: string
  type: string
  motion: string
  product: string | null
  objective: string
  items: ParsedItem[]
}

interface ImportPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Current calendar view, so a parsed plan is dated relative to what you're looking at rather than always "today". */
  calendarYear?: number
  calendarMonth?: number
}

type ImportMode = "single" | "auto"

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]

const selectCls =
  "w-full px-3 py-2.5 bg-surface-container rounded-lg border border-outline-variant text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"

function segmentCls(active: boolean) {
  return `py-2 px-3 rounded-lg text-sm font-semibold border transition-colors ${
    active
      ? "bg-primary text-white border-primary"
      : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container-high"
  }`
}

export function ImportPlanDialog({ open, onOpenChange, calendarYear, calendarMonth }: ImportPlanDialogProps) {
  const { profiles, campaigns } = useStore()
  const { refreshCampaigns } = useRefreshData()

  const [step, setStep]           = useState<"paste" | "preview" | "done">("paste")
  const [text, setText]           = useState("")
  const [mode, setMode]           = useState<ImportMode>("single")
  const [targetCampaignId, setTargetCampaignId] = useState("") // "" = create new
  const [newCampaignTitle, setNewCampaignTitle] = useState("")
  const [isParsing, setIsParsing] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError]         = useState("")
  const [parsed, setParsed]       = useState<ParsedCampaign[]>([])
  const [importedCount, setImportedCount] = useState(0)

  const realCampaigns = campaigns.filter(c => c.id !== NO_CAMPAIGN_ID)

  const reset = () => {
    setStep("paste"); setText(""); setError("")
    setMode("single"); setTargetCampaignId(""); setNewCampaignTitle("")
    setParsed([]); setIsParsing(false); setIsApplying(false)
  }

  const handleOpenChange = (o: boolean) => {
    if (!o) reset()
    onOpenChange(o)
  }

  const handleParse = async () => {
    setIsParsing(true); setError("")
    try {
      const now = new Date()
      const year = calendarYear ?? now.getFullYear()
      const month = calendarMonth ?? now.getMonth()
      const campaignTitle = mode === "single"
        ? (targetCampaignId ? realCampaigns.find(c => c.id === targetCampaignId)?.title ?? "" : newCampaignTitle.trim())
        : ""

      const res = await fetch("/api/import-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          monthContext: `${MONTH_NAMES[month]} ${year}`,
          mode,
          campaignTitle: campaignTitle || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to parse plan")

      // Support both old `projects` shape and new `campaigns` shape
      const rawList = data.plan?.campaigns || data.plan?.projects || []
      if (!rawList.length) throw new Error("Couldn't find any deliverables. Try adding more detail.")

      // Normalise to ParsedCampaign
      const normalised: ParsedCampaign[] = rawList.map((raw: Record<string, unknown>) => ({
        title: String(raw.title || ""),
        type: String(raw.type || "Always-on"),
        motion: String(raw.motion || "Both"),
        product: (raw.product as string | null) ?? null,
        objective: String(raw.objective || raw.description || ""),
        items: ((raw.items || raw.tasks || []) as Record<string, unknown>[]).map(t => ({
          title: String(t.title || ""),
          channel: String(t.channel || "Other"),
          format: String(t.format || t.task_type || "Video"),
          section: (t.section as string | null) ?? null,
          assignee_name: (t.assignee_name as string | null) ?? null,
          publish_date: String(t.publish_date || t.due_date || ""),
          date_confidence: String(t.date_confidence || "Confirmed"),
        })),
      }))
      setParsed(normalised)
      setStep("preview")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse plan")
    } finally {
      setIsParsing(false)
    }
  }

  const matchAssignee = (name: string | null): string | null => matchAssigneeToProfiles(name, profiles)

  const handleApply = async () => {
    setIsApplying(true); setError("")
    let itemCount = 0
    try {
      for (const pc of parsed) {
        let campaignId: string | undefined
        let existingCampaign: CampaignWithItems | undefined

        if (mode === "single") {
          // Explicit user choice: reuse only what was picked, never dedupe by title.
          if (targetCampaignId) {
            existingCampaign = campaigns.find(c => c.id === targetCampaignId)
            campaignId = existingCampaign?.id
          }
        } else {
          // Auto mode: reuse an existing real campaign with the exact same title.
          existingCampaign = campaigns.find(
            c => c.id !== NO_CAMPAIGN_ID && c.title.toLowerCase() === pc.title.toLowerCase()
          )
          campaignId = existingCampaign?.id
        }

        if (!campaignId) {
          const title = mode === "single" ? (newCampaignTitle.trim() || pc.title) : pc.title
          const iconLabel = title.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
          const iconColor = ICON_COLORS[Math.floor(Math.random() * ICON_COLORS.length)]
          const motion = (MOTION_OPTIONS.includes(pc.motion as CampaignMotion)
            ? pc.motion : "Both") as CampaignMotion
          const type = (TYPE_OPTIONS.includes(pc.type as CampaignType)
            ? pc.type : "Always-on") as CampaignType
          const dates = pc.items.map(it => it.publish_date).filter(Boolean).sort()
          const created = await createCampaignClient({
            title,
            description: "",
            category: "",
            lead_id: null,
            icon_label: iconLabel,
            icon_color: iconColor,
            status: "Active",
            type,
            motion,
            product: pc.product || null,
            objective: pc.objective || null,
            start_date: dates[0] || null,
            end_date: dates[dates.length - 1] || null,
          })
          campaignId = created.id
        }

        const startingSortOrder = nextSortOrder(existingCampaign)
        const rows = pc.items.map((it, i) => ({
          campaign_id: campaignId!,
          title: it.title,
          status: "Planned" as ItemStatus,
          format: normaliseFormat(it.format),
          channel: normaliseChannel(it.channel),
          assignee_id: matchAssignee(it.assignee_name),
          publish_date: it.publish_date || null,
          date_confidence: (it.date_confidence === "Provisional" ? "Provisional" : "Confirmed") as DateConfidence,
          content_role: it.section || null,
          notes: null,
          brief_url: null,
          live_url: null,
          sort_order: startingSortOrder + i,
        }))
        await createContentItemsClient(rows)
        itemCount += rows.length
      }
      await refreshCampaigns()
      setImportedCount(itemCount)
      setStep("done")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to import plan")
    } finally {
      setIsApplying(false)
    }
  }

  const totalItems = parsed.reduce((n, p) => n + p.items.length, 0)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {step === "paste" && "Import Content Plan"}
            {step === "preview" && "Review Parsed Plan"}
            {step === "done" && "Plan Imported"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl text-sm text-red-600 font-medium">{error}</div>
        )}

        {step === "paste" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Paste your content plan as plain text — briefs, Slack messages, meeting notes, anything.
              We&apos;ll turn it into a campaign and dated content items, assigned to your team.
            </p>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">This plan is</span>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setMode("single")} className={segmentCls(mode === "single")}>
                  One campaign
                </button>
                <button type="button" onClick={() => setMode("auto")} className={segmentCls(mode === "auto")}>
                  Multiple campaigns
                </button>
              </div>
            </div>

            {mode === "single" && (
              <div className="flex flex-col gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Campaign</span>
                  <select value={targetCampaignId} onChange={e => setTargetCampaignId(e.target.value)} className={selectCls}>
                    <option value="">+ Create new campaign</option>
                    {realCampaigns.length > 0 && (
                      <optgroup label="Existing campaigns">
                        {realCampaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </optgroup>
                    )}
                  </select>
                </div>
                {!targetCampaignId && (
                  <input
                    value={newCampaignTitle}
                    onChange={e => setNewCampaignTitle(e.target.value)}
                    placeholder="e.g. AI Operator Launch"
                    className={selectCls}
                  />
                )}
              </div>
            )}

            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={12}
              placeholder={"e.g.\nProduct Launch Series — YouTube announce video (week 3, Lionel)\nAlways-on LinkedIn posts 3x/week (Andrea)\nQ3 Promo email blast July 15 -> Angela..."}
              className="w-full px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant text-on-surface text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y font-mono"
            />
            <button
              onClick={handleParse}
              disabled={isParsing || text.trim().length < 10}
              className="w-full py-3 px-4 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isParsing ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Parsing your plan…</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Parse Plan</>
              )}
            </button>
          </div>
        )}

        {step === "preview" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-on-surface-variant">
              {parsed.length === 1 ? (
                <>All <strong className="text-on-surface">{totalItems} item{totalItems !== 1 ? "s" : ""}</strong> will be added to{" "}
                <strong className="text-on-surface">{parsed[0].title}</strong>.</>
              ) : (
                <>Found <strong className="text-on-surface">{parsed.length} campaigns</strong> and{" "}
                <strong className="text-on-surface">{totalItems} items</strong>. Review below, then import.</>
              )}
            </p>
            <div className="flex flex-col gap-3 max-h-[45vh] overflow-y-auto pr-1">
              {parsed.map((camp, pi) => (
                <div key={pi} className="border border-outline-variant rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-surface-container-low flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-on-surface">{camp.title}</span>
                    <span className="text-xs text-on-surface-variant px-2 py-0.5 rounded-full bg-surface-container border border-outline-variant">{camp.motion}</span>
                    {camp.product && (
                      <span className="text-xs text-on-surface-variant px-2 py-0.5 rounded-full bg-surface-container border border-outline-variant">{camp.product}</span>
                    )}
                    <span className="ml-auto text-xs text-on-surface-variant">{camp.items.length} items</span>
                  </div>
                  <div className="divide-y divide-outline-variant/40">
                    {groupBySection(camp.items).map(([section, items]) => (
                      <div key={section}>
                        {section !== NO_SECTION && (
                          <div className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant/70">
                            {section}
                          </div>
                        )}
                        {items.map((it, ii) => (
                          <div key={ii} className="px-4 py-2 flex items-center gap-3 text-sm">
                            <span className="flex-1 min-w-0 truncate text-on-surface">{it.title}</span>
                            <span className="text-xs text-on-surface-variant flex-shrink-0">{it.assignee_name || "Unassigned"}</span>
                            <span className="text-xs font-medium text-on-surface-variant flex-shrink-0">{it.channel}</span>
                            <span className="text-xs text-on-surface-variant flex-shrink-0 w-20 text-right">{it.publish_date}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep("paste")} disabled={isApplying}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-surface-container-high rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-highest transition-colors disabled:opacity-50">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button onClick={handleApply} disabled={isApplying}
                className="flex-1 py-3 px-4 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {isApplying ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Importing {totalItems} items…</>
                ) : `Import ${totalItems} Items`}
              </button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="text-sm text-on-surface-variant">
              <strong className="text-on-surface">{importedCount} items</strong> added to your calendar.
            </p>
            <button onClick={() => handleOpenChange(false)}
              className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
              View Calendar
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
