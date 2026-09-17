"use client"

import { useState } from "react"
import { X, Plus, ExternalLink, Trash2, Sparkles } from "lucide-react"
import { useStore, useIsEditor } from "@/lib/store"
import { useRefreshData } from "@/components/data-provider"
import { updateCampaignClient, deleteCampaignClient, createContentItemClient, moveContentItemsClient } from "@/lib/data-client"
import type { CampaignWithItems, ContentItemWithCampaign, CampaignMotion, CampaignType } from "@/lib/database.types"
import {
  MOTION_ACCENTS, MOTION_OPTIONS, TYPE_OPTIONS, PRODUCT_OPTIONS,
  CHANNEL_ICONS, STATUS_COLORS, NO_CAMPAIGN_ID
} from "@/lib/database.types"
import { ContentItemDialog } from "@/components/content-item-dialog"
import { GenerateItemsDialog } from "@/components/generate-items-dialog"

interface Props {
  campaign: CampaignWithItems
  onClose: () => void
}

export function CampaignDetailSheet({ campaign, onClose }: Props) {
  const { profiles, setCampaigns, campaigns } = useStore()
  const { refreshCampaigns } = useRefreshData()
  const isEditor = useIsEditor()

  const [title,     setTitle]     = useState(campaign.title)
  const [type,      setType]      = useState<CampaignType>(campaign.type)
  const [motion,    setMotion]    = useState<CampaignMotion>(campaign.motion)
  const [product,   setProduct]   = useState(campaign.product || "")
  const [objective, setObjective] = useState(campaign.objective || "")
  const [saving,    setSaving]    = useState(false)
  const [selectedItem, setSelectedItem] = useState<ContentItemWithCampaign | null>(null)
  const [newItemOpen,  setNewItemOpen]  = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [confirmDel,   setConfirmDel]   = useState(false)

  // Bulk move
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [moveTarget,  setMoveTarget]  = useState("")
  const [moving,      setMoving]      = useState(false)
  const [moveError,   setMoveError]   = useState("")

  const motionAccent = MOTION_ACCENTS[motion] || "#94a3b8"
  const items        = campaign.items || []
  const allSelected  = items.length > 0 && selectedIds.size === items.length
  const someSelected = selectedIds.size > 0
  const otherCampaigns = campaigns.filter(c => c.id !== NO_CAMPAIGN_ID && c.id !== campaign.id)

  const toggleSelected = (id: string) =>
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(items.map(i => i.id)))

  const handleBulkMove = async () => {
    if (selectedIds.size === 0) return
    setMoving(true); setMoveError("")
    try {
      await moveContentItemsClient([...selectedIds], moveTarget || null)
      await refreshCampaigns()
      setSelectedIds(new Set())
      setMoveTarget("")
    } catch (e) {
      setMoveError(e instanceof Error ? e.message : "Failed to move items")
    } finally {
      setMoving(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateCampaignClient(campaign.id, { title, type, motion, product, objective })
      refreshCampaigns()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    await deleteCampaignClient(campaign.id)
    refreshCampaigns()
    onClose()
  }

  const enrichedItems: ContentItemWithCampaign[] = items.map(it => ({ ...it, campaign }))

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-background border-l border-border z-50 flex flex-col shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: motionAccent }} aria-hidden="true" />
            <h2 className="text-lg font-bold text-on-surface truncate">{title || "Campaign"}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmDel(true)}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-6 p-6">
          {/* Fields */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as CampaignType)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Motion</label>
                <select
                  value={motion}
                  onChange={e => setMotion(e.target.value as CampaignMotion)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {MOTION_OPTIONS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Product</label>
                <select
                  value={product}
                  onChange={e => setProduct(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">None</option>
                  {PRODUCT_OPTIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Objective</label>
              <textarea
                value={objective}
                onChange={e => setObjective(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="self-start px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>

          {/* Content items */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {isEditor && items.length > 0 && (
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected && !allSelected }}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-outline-variant accent-primary cursor-pointer"
                    aria-label="Select all items"
                  />
                )}
                <h3 className="text-sm font-bold text-on-surface">Content Items ({items.length})</h3>
              </div>
              {isEditor && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setGenerateOpen(true)}
                    className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Generate with AI
                  </button>
                  <button
                    onClick={() => setNewItemOpen(true)}
                    className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add item
                  </button>
                </div>
              )}
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-on-surface-variant italic">No content items yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {enrichedItems.map(item => {
                  const dot = STATUS_COLORS[item.status]?.dot || "#94a3b8"
                  return (
                    <div key={item.id} className="flex items-center gap-2">
                      {isEditor && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelected(item.id)}
                          className="h-4 w-4 rounded border-outline-variant accent-primary cursor-pointer flex-shrink-0"
                          aria-label={`Select ${item.title}`}
                        />
                      )}
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="flex-1 min-w-0 flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-surface-container-low transition-colors text-left group"
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} aria-hidden="true" />
                        <span className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-on-surface truncate block">{item.title}</span>
                          <span className="text-xs text-on-surface-variant">
                            {CHANNEL_ICONS[item.channel] || ""} {item.channel}
                            {item.publish_date && ` · ${new Date(item.publish_date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md font-medium flex-shrink-0 border border-outline-variant bg-surface-container-low text-on-surface-variant">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} aria-hidden="true" />
                          {item.status}
                        </span>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {isEditor && someSelected && (
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-outline-variant bg-surface-container-low">
                <span className="text-xs font-semibold text-on-surface whitespace-nowrap">
                  {selectedIds.size} selected
                </span>
                <select
                  value={moveTarget}
                  onChange={e => setMoveTarget(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Destination campaign"
                >
                  <option value="">No campaign</option>
                  {otherCampaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                <button
                  onClick={handleBulkMove}
                  disabled={moving}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {moving ? "Moving…" : "Move"}
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  disabled={moving}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                >
                  Clear
                </button>
                {moveError && <span className="text-xs text-red-600 font-medium w-full">{moveError}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Delete confirm */}
        {confirmDel && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-background rounded-2xl border border-border p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl">
              <h3 className="text-base font-bold text-on-surface">Delete campaign?</h3>
              <p className="text-sm text-on-surface-variant">This will permanently delete &ldquo;{campaign.title}&rdquo; and all its content items. This cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setConfirmDel(false)} className="px-4 py-2 rounded-lg text-sm font-semibold border border-outline-variant hover:bg-surface-container-high transition-colors">Cancel</button>
                <button onClick={handleDelete} className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content item dialogs */}
      {selectedItem && (
        <ContentItemDialog
          item={selectedItem}
          open={!!selectedItem}
          onOpenChange={open => { if (!open) setSelectedItem(null) }}
        />
      )}
      {newItemOpen && (
        <ContentItemDialog
          item={null}
          defaultCampaignId={campaign.id}
          open={newItemOpen}
          onOpenChange={open => { if (!open) setNewItemOpen(false) }}
        />
      )}
      {generateOpen && (
        <GenerateItemsDialog
          open={generateOpen}
          onOpenChange={setGenerateOpen}
          campaign={campaign}
        />
      )}
    </>
  )
}
