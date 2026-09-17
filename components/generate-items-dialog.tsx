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
import { createContentItemsClient } from "@/lib/data-client"
import { normaliseFormat, normaliseChannel, matchAssignee, nextSortOrder } from "@/lib/ai-items"
import type { CampaignWithItems, ItemStatus, DateConfidence } from "@/lib/database.types"
import { CHANNEL_OPTIONS, CHANNEL_ICONS } from "@/lib/database.types"

/** Shape returned by /api/import-plan in mode "items" — matches the shared itemSchema. */
interface DraftedItem {
  title: string
  format: string
  channel: string
  section: string | null
  assignee_name: string | null
  publish_date: string
  date_confidence: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign: CampaignWithItems
}

const fieldCls =
  "w-full px-3 py-2.5 bg-surface-container rounded-lg border border-outline-variant text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** The campaign's own date range if it has one, else today through 4 weeks out. */
function dateWindow(campaign: CampaignWithItems): { start: string; end: string } {
  if (campaign.start_date && campaign.end_date) {
    return { start: campaign.start_date, end: campaign.end_date }
  }
  const today = new Date()
  const end = new Date(today)
  end.setDate(end.getDate() + 28)
  return { start: toISO(today), end: toISO(end) }
}

export function GenerateItemsDialog({ open, onOpenChange, campaign }: Props) {
  const { profiles } = useStore()
  const { refreshCampaigns } = useRefreshData()

  const [step, setStep]                       = useState<"input" | "preview" | "done">("input")
  const [description, setDescription]         = useState(campaign.objective || "")
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set())
  const [count, setCount]                     = useState(10)
  const [isGenerating, setIsGenerating]       = useState(false)
  const [isApplying, setIsApplying]           = useState(false)
  const [error, setError]                     = useState("")
  const [drafted, setDrafted]                 = useState<DraftedItem[]>([])
  const [checkedIndices, setCheckedIndices]   = useState<Set<number>>(new Set())
  const [addedCount, setAddedCount]           = useState(0)

  const toggleChannel = (c: string) =>
    setSelectedChannels(prev => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })

  const toggleChecked = (i: number) =>
    setCheckedIndices(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  const handleGenerate = async () => {
    setIsGenerating(true); setError("")
    try {
      const { start, end } = dateWindow(campaign)
      const res = await fetch("/api/import-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: description,
          mode: "items",
          campaignTitle: campaign.title,
          campaignType: campaign.type,
          campaignMotion: campaign.motion,
          campaignProduct: campaign.product,
          channels: [...selectedChannels],
          startDate: start,
          endDate: end,
          existingTitles: (campaign.items || []).map(i => i.title),
          count,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to generate items")
      const items: DraftedItem[] = Array.isArray(data.items) ? data.items : []
      if (!items.length) throw new Error("Couldn't draft any items. Try adding more detail.")
      setDrafted(items)
      setCheckedIndices(new Set(items.map((_, i) => i)))
      setStep("preview")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate items")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApply = async () => {
    setIsApplying(true); setError("")
    try {
      const toCreate = drafted.filter((_, i) => checkedIndices.has(i))
      const startingSortOrder = nextSortOrder(campaign)
      const rows = toCreate.map((it, i) => ({
        campaign_id: campaign.id,
        title: it.title,
        status: "Planned" as ItemStatus,
        format: normaliseFormat(it.format),
        channel: normaliseChannel(it.channel),
        assignee_id: matchAssignee(it.assignee_name, profiles),
        publish_date: it.publish_date || null,
        date_confidence: (it.date_confidence === "Confirmed" ? "Confirmed" : "Provisional") as DateConfidence,
        content_role: it.section || null,
        notes: null,
        brief_url: null,
        live_url: null,
        sort_order: startingSortOrder + i,
      }))
      await createContentItemsClient(rows)
      await refreshCampaigns()
      setAddedCount(rows.length)
      setStep("done")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add items")
    } finally {
      setIsApplying(false)
    }
  }

  const checkedCount = checkedIndices.size

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {step === "input" && "Generate Content Items"}
            {step === "preview" && "Review Drafted Items"}
            {step === "done" && "Items Added"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl text-sm text-red-600 font-medium">{error}</div>
        )}

        {step === "input" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Describe what <strong className="text-on-surface">{campaign.title}</strong> should cover and pick channels —
              we&apos;ll draft a list of content items and add the ones you keep straight into this campaign.
            </p>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Intended outcomes</span>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
                placeholder="What is this campaign trying to achieve? Any specific angles, offers, or messages to hit?"
                className={`${fieldCls} resize-y`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Channels</span>
              <div className="flex flex-wrap gap-2">
                {CHANNEL_OPTIONS.filter(c => c !== "Other").map(c => {
                  const active = selectedChannels.has(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleChannel(c)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        active
                          ? "bg-primary text-white border-primary"
                          : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container-high"
                      }`}
                    >
                      {CHANNEL_ICONS[c] || ""} {c}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 max-w-[140px]">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Roughly how many</span>
              <input
                type="number"
                min={1}
                max={40}
                value={count}
                onChange={e => setCount(Math.max(1, Math.min(40, Number(e.target.value) || 1)))}
                className={fieldCls}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || selectedChannels.size === 0 || description.trim().length < 10}
              className="w-full py-3 px-4 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Drafting items…</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generate</>
              )}
            </button>
          </div>
        )}

        {step === "preview" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-on-surface-variant">
              Drafted <strong className="text-on-surface">{drafted.length} items</strong>. Untick anything you don&apos;t want, then add the rest.
            </p>
            <div className="flex flex-col divide-y divide-outline-variant/40 border border-outline-variant rounded-xl overflow-hidden max-h-[45vh] overflow-y-auto">
              {drafted.map((it, i) => (
                <label key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer hover:bg-surface-container-low/60">
                  <input
                    type="checkbox"
                    checked={checkedIndices.has(i)}
                    onChange={() => toggleChecked(i)}
                    className="h-4 w-4 rounded border-outline-variant accent-primary cursor-pointer flex-shrink-0"
                  />
                  <span className="flex-1 min-w-0 truncate text-on-surface">{it.title}</span>
                  <span className="text-xs text-on-surface-variant flex-shrink-0">{it.assignee_name || "Unassigned"}</span>
                  <span className="text-xs font-medium text-on-surface-variant flex-shrink-0">{CHANNEL_ICONS[it.channel] || ""} {it.channel}</span>
                  <span className="text-xs text-on-surface-variant flex-shrink-0 w-16 text-right">{it.format}</span>
                  <span className="text-xs text-on-surface-variant flex-shrink-0 w-20 text-right">{it.publish_date}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep("input")} disabled={isApplying}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-surface-container-high rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-highest transition-colors disabled:opacity-50">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button onClick={handleApply} disabled={isApplying || checkedCount === 0}
                className="flex-1 py-3 px-4 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {isApplying ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Adding {checkedCount} items…</>
                ) : `Add ${checkedCount} Item${checkedCount !== 1 ? "s" : ""}`}
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
              <strong className="text-on-surface">{addedCount} items</strong> added to {campaign.title}.
            </p>
            <button onClick={() => onOpenChange(false)}
              className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
              Done
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
