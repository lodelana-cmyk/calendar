"use client"

import { useState } from "react"
import { Lightbulb, Megaphone, CalendarPlus, Trash2, Send } from "lucide-react"
import { useStore, useIsEditor } from "@/lib/store"
import { useRefreshData } from "@/components/data-provider"
import {
  createIdeaClient,
  deleteContentItemClient,
  getIdeasClient,
  promoteIdeaToCampaignClient,
  promoteIdeaToItemClient,
} from "@/lib/data-client"
import type { IdeaWithCreator } from "@/lib/database.types"
import { CreateCampaignDialog } from "@/components/create-campaign-dialog"

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export function InboxView({ initialIdeas }: { initialIdeas: IdeaWithCreator[] }) {
  const { currentUser } = useStore()
  const isEditor = useIsEditor()
  const { refreshCampaigns } = useRefreshData()

  const [ideas, setIdeas] = useState<IdeaWithCreator[]>(initialIdeas)
  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const [showNotes, setShowNotes] = useState(false)
  const [adding, setAdding] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirmDiscardId, setConfirmDiscardId] = useState<string | null>(null)
  const [promoteIdea, setPromoteIdea] = useState<IdeaWithCreator | null>(null)

  const reload = async () => setIdeas(await getIdeasClient())

  const handleAdd = async () => {
    if (!title.trim()) return
    setAdding(true)
    try {
      await createIdeaClient({ title: title.trim(), notes: notes.trim() || null, createdById: currentUser?.id ?? null })
      setTitle("")
      setNotes("")
      setShowNotes(false)
      await reload()
    } finally {
      setAdding(false)
    }
  }

  const handlePromoteToItem = async (idea: IdeaWithCreator) => {
    setBusyId(idea.id)
    try {
      await promoteIdeaToItemClient(idea.id)
      await Promise.all([reload(), refreshCampaigns()])
    } finally {
      setBusyId(null)
    }
  }

  const handleDiscard = async (id: string) => {
    setBusyId(id)
    try {
      await deleteContentItemClient(id)
      setConfirmDiscardId(null)
      await reload()
    } finally {
      setBusyId(null)
    }
  }

  const handlePromoted = async () => {
    setPromoteIdea(null)
    await Promise.all([reload(), refreshCampaigns()])
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      {/* Quick-add bar */}
      <div className="rounded-2xl border border-border bg-surface-container-low p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onFocus={() => setShowNotes(true)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229 && !showNotes) {
                e.preventDefault()
                handleAdd()
              }
            }}
            placeholder="Capture an idea… e.g. &quot;Customer story about X&quot;"
            className="flex-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
          <button
            onClick={handleAdd}
            disabled={!title.trim() || adding}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex-shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
            {adding ? "Adding…" : "Add"}
          </button>
        </div>
        {showNotes && (
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional notes…"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
        )}
      </div>

      {/* Idea list */}
      {ideas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center rounded-2xl border-2 border-dashed border-outline-variant">
          <Lightbulb className="h-6 w-6 text-on-surface-variant" aria-hidden="true" />
          <p className="text-sm text-on-surface-variant">No ideas yet. Capture the first one above.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {ideas.map(idea => (
            <li
              key={idea.id}
              className="rounded-2xl border border-border bg-card px-4 py-3 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface text-pretty">{idea.title}</p>
                  {idea.notes && (
                    <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{idea.notes}</p>
                  )}
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    {idea.createdBy?.full_name ?? "Someone"} &middot; {timeAgo(idea.created_at)}
                  </p>
                </div>
              </div>

              {isEditor && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setPromoteIdea(idea)}
                    disabled={busyId === idea.id}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-outline-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
                  >
                    <Megaphone className="h-3.5 w-3.5 text-primary" />
                    Promote to campaign
                  </button>
                  <button
                    onClick={() => handlePromoteToItem(idea)}
                    disabled={busyId === idea.id}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-outline-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
                  >
                    <CalendarPlus className="h-3.5 w-3.5 text-primary" />
                    Promote to item
                  </button>
                  <button
                    onClick={() => setConfirmDiscardId(idea.id)}
                    disabled={busyId === idea.id}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors ml-auto disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Discard
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Promote to campaign — reuses the New Campaign dialog, pre-filled */}
      {promoteIdea && (
        <CreateCampaignDialog
          open={!!promoteIdea}
          onOpenChange={open => { if (!open) setPromoteIdea(null) }}
          initialTitle={promoteIdea.title}
          initialObjective={promoteIdea.notes ?? ""}
          onCreated={async campaign => {
            await promoteIdeaToCampaignClient(promoteIdea.id, campaign.id)
            await handlePromoted()
          }}
        />
      )}

      {/* Discard confirm */}
      {confirmDiscardId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background rounded-2xl border border-border p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl">
            <h3 className="text-base font-bold text-on-surface">Discard idea?</h3>
            <p className="text-sm text-on-surface-variant">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDiscardId(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-outline-variant hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDiscard(confirmDiscardId)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
