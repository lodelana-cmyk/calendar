"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { useRefreshData } from "@/components/data-provider"
import { createCampaignClient } from "@/lib/data-client"
import type { Campaign, CampaignMotion, CampaignType } from "@/lib/database.types"
import { MOTION_OPTIONS, TYPE_OPTIONS, PRODUCT_OPTIONS } from "@/lib/database.types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pre-fill the title, e.g. when promoting an Inbox idea */
  initialTitle?: string
  /** Pre-fill the objective, e.g. from an idea's notes */
  initialObjective?: string
  /** Called with the newly created campaign, in addition to the default refresh + close */
  onCreated?: (campaign: Campaign) => void | Promise<void>
}

export function CreateCampaignDialog({ open, onOpenChange, initialTitle, initialObjective, onCreated }: Props) {
  const { refreshCampaigns } = useRefreshData()

  const [title,     setTitle]     = useState(initialTitle ?? "")
  const [type,      setType]      = useState<CampaignType>("Always-on")
  const [motion,    setMotion]    = useState<CampaignMotion>("Both")
  const [product,   setProduct]   = useState("")
  const [objective, setObjective] = useState(initialObjective ?? "")
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState("")

  if (!open) return null

  const handleCreate = async () => {
    if (!title.trim()) { setError("Title is required"); return }
    setSaving(true)
    setError("")
    try {
      const campaign = await createCampaignClient({ title: title.trim(), type, motion, product: product || null, objective: objective || null })
      await onCreated?.(campaign)
      refreshCampaigns()
      onOpenChange(false)
      setTitle(""); setType("Always-on"); setMotion("Both"); setProduct(""); setObjective("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create campaign")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={() => onOpenChange(false)} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-md pointer-events-auto flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-on-surface">New Campaign</h2>
            <button onClick={() => onOpenChange(false)} className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Title *</label>
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Q3 Brand Push"
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Type *</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as CampaignType)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Motion *</label>
                <select
                  value={motion}
                  onChange={e => setMotion(e.target.value as CampaignMotion)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {MOTION_OPTIONS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Product</label>
              <select
                value={product}
                onChange={e => setProduct(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">None</option>
                {PRODUCT_OPTIONS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Objective</label>
              <textarea
                value={objective}
                onChange={e => setObjective(e.target.value)}
                rows={2}
                placeholder="What is this campaign trying to achieve?"
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex justify-end gap-3">
            <button onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-lg text-sm font-semibold border border-outline-variant hover:bg-surface-container-high transition-colors">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {saving ? "Creating…" : "Create Campaign"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
