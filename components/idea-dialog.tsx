"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import { X, Trash2, Zap } from "lucide-react"
import { useStore, useIsEditor } from "@/lib/store"
import {
  updateContentItemClient, getItemCommentsClient, addItemCommentClient, deleteItemCommentClient,
} from "@/lib/data-client"
import type { IdeaWithCreator, ItemComment } from "@/lib/database.types"
import { parseMentions, toPlainText } from "@/lib/mentions"
import { MentionInput } from "@/components/mention-input"
import { GoogleDocEmbed } from "@/components/google-doc-embed"
import { Avatar, Button, ErrorText, Field, fieldCls, textareaCls } from "@/components/kit"

interface Props {
  idea: IdeaWithCreator
  onClose: () => void
  /** Called after a save so the list can refresh. */
  onSaved: () => void | Promise<void>
}

/**
 * Open an Inbox idea: its creator (and editors) can edit the title, notes
 * and a Google Doc link — which previews inline — and anyone can comment and
 * @-mention teammates. Comments live on the same row, so they carry over
 * when the idea is promoted to a calendar item.
 */
export function IdeaDialog({ idea, onClose, onSaved }: Props) {
  const { currentUser } = useStore()
  const isEditor = useIsEditor()
  const canEdit = isEditor || (!!currentUser && currentUser.id === idea.created_by)

  const [title, setTitle]   = useState(idea.title)
  const [notes, setNotes]   = useState(idea.notes ?? "")
  const [docUrl, setDocUrl] = useState(idea.brief_url ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState("")
  const [saved, setSaved]   = useState(false)

  const [comments, setComments] = useState<ItemComment[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [commentError, setCommentError] = useState("")
  const endRef = useRef<HTMLDivElement>(null)

  // "Ask Jev" on a comment: what is it asking for?
  const [jev, setJev] = useState<Record<string, { loading?: boolean; answer?: string; confidence?: number; engine?: string; ms?: number; error?: string }>>({})
  const askJev = async (c: ItemComment) => {
    setJev(prev => ({ ...prev, [c.id]: { loading: true } }))
    try {
      const res = await fetch("/api/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "intent", comment: toPlainText(c.body), ideaTitle: idea.title }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Jev couldn't read that")
      const d = data.decisions.intent
      setJev(prev => ({ ...prev, [c.id]: { answer: d.answer, confidence: d.confidence, engine: data.engineLabel, ms: data.ms } }))
    } catch (e) {
      setJev(prev => ({ ...prev, [c.id]: { error: e instanceof Error ? e.message : "Jev couldn't read that" } }))
    }
  }

  useEffect(() => {
    getItemCommentsClient(idea.id)
      .then(setComments)
      .catch(e => setCommentError(e instanceof Error ? e.message : "Couldn't load comments"))
      .finally(() => setLoadingComments(false))
  }, [idea.id])

  // Scroll to a newly posted comment, but not on open (that would skip past the details)
  const prevCount = useRef<number | null>(null)
  useEffect(() => {
    if (loadingComments) return
    if (prevCount.current !== null && comments.length > prevCount.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
    prevCount.current = comments.length
  }, [comments, loadingComments])

  // Notes grow to fit what's written, up to half the screen, then scroll
  const notesRef = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = notesRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight + 2, Math.round(window.innerHeight * 0.5))}px`
  }, [notes])

  const dirty = title !== idea.title || notes !== (idea.notes ?? "") || docUrl !== (idea.brief_url ?? "")

  const handleSave = async () => {
    if (!title.trim()) { setError("Give the idea a title"); return }
    setSaving(true); setError("")
    try {
      await updateContentItemClient(idea.id, {
        title: title.trim(),
        notes: notes.trim() || null,
        brief_url: docUrl.trim() || null,
      })
      await onSaved()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the idea")
    } finally {
      setSaving(false)
    }
  }

  const postComment = async (body: string) => {
    setCommentError("")
    try {
      const c = await addItemCommentClient(idea.id, body)
      setComments(prev => [...prev, c])
    } catch (e) {
      setCommentError(e instanceof Error ? e.message : "Couldn't post the comment")
      throw e
    }
  }

  const removeComment = async (id: string) => {
    try {
      await deleteItemCommentClient(id)
      setComments(prev => prev.filter(c => c.id !== id))
    } catch (e) {
      setCommentError(e instanceof Error ? e.message : "Couldn't delete the comment")
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={idea.title}
          className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-4xl max-h-[92vh] pointer-events-auto flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
            <div className="min-w-0">
              <p className="text-[13px] text-on-surface-variant">Idea</p>
              <h2 className="text-[22px] text-on-surface break-words">{title || "Untitled idea"}</h2>
              <p className="flex items-center gap-1.5 text-[13px] text-on-surface-variant mt-1">
                <Avatar src={idea.createdBy?.avatar_url} name={idea.createdBy?.full_name ?? "Someone"} size={18} />
                {idea.createdBy?.full_name ?? "Someone"} · {new Date(idea.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Details */}
            <div className="px-6 py-5 flex flex-col gap-4 border-b border-border">
              {canEdit ? (
                <>
                  <Field label="Title">
                    <input value={title} onChange={e => { setTitle(e.target.value); setError("") }} className={fieldCls} />
                  </Field>
                  <Field label="Notes">
                    <textarea ref={notesRef} value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Context, angle, references…" className={textareaCls} />
                  </Field>
                  <Field label="Google Doc link" hint="Paste a Google Docs, Sheets or Slides link to preview it here.">
                    <input value={docUrl} onChange={e => setDocUrl(e.target.value)} placeholder="https://docs.google.com/document/d/…" className={fieldCls} />
                  </Field>
                  <GoogleDocEmbed url={docUrl} />
                  <div className="flex items-center justify-end gap-3">
                    <ErrorText>{error}</ErrorText>
                    <Button onClick={handleSave} disabled={saving || !dirty}>
                      {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {idea.notes && <p className="text-sm text-on-surface whitespace-pre-wrap">{idea.notes}</p>}
                  <GoogleDocEmbed url={idea.brief_url} />
                  {!idea.notes && !idea.brief_url && <p className="text-sm text-on-surface-variant">No notes yet.</p>}
                </>
              )}
            </div>

            {/* Comments */}
            <div className="px-6 py-5 flex flex-col gap-3">
              <h3 className="text-[17px] font-semibold text-on-surface">
                Comments {comments.length > 0 && <span className="text-on-surface-variant font-normal tabular-nums">{comments.length}</span>}
              </h3>
              {loadingComments && <p className="text-[13px] text-on-surface-variant">Loading…</p>}
              {!loadingComments && comments.length === 0 && (
                <p className="text-[13px] text-on-surface-variant">No comments yet. Type @ to mention a teammate.</p>
              )}
              {comments.map(c => {
                const isOwn = currentUser?.id === c.author_id
                return (
                  <div key={c.id} className="flex gap-2.5 group">
                    <Avatar src={c.author?.avatar_url} name={c.author?.full_name ?? "Unknown"} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-on-surface">{c.author?.full_name ?? "Unknown"}</span>
                        <span className="text-[11px] text-on-surface-variant">
                          {new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <button
                          onClick={() => askJev(c)}
                          disabled={jev[c.id]?.loading}
                          className="ml-auto inline-flex items-center gap-1 rounded-full border border-outline-variant px-2 py-0.5 text-[11px] font-medium text-on-surface-variant hover:text-on-surface hover:border-on-surface/30 transition-colors disabled:opacity-50"
                          title="Ask Jev what this comment is asking for"
                        >
                          <Zap className="h-3 w-3" /> {jev[c.id]?.loading ? "Asking…" : "Ask Jev"}
                        </button>
                        {isOwn && (
                          <button
                            onClick={() => removeComment(c.id)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-on-surface-variant hover:text-error transition-all"
                            aria-label="Delete comment"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap mt-0.5">
                        {parseMentions(c.body).map((seg, i) =>
                          seg.type === "text" ? <span key={i}>{seg.value}</span> : (
                            <span key={i} className={`font-semibold rounded px-0.5 ${seg.id === currentUser?.id ? "bg-on-surface/10" : "underline decoration-on-surface/25 underline-offset-2"}`}>
                              @{seg.name}
                            </span>
                          )
                        )}
                      </p>
                      {jev[c.id] && !jev[c.id].loading && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                          {jev[c.id].error ? (
                            <span className="text-error">{jev[c.id].error}</span>
                          ) : (
                            <>
                              <span className="inline-flex items-center gap-1 text-on-surface">
                                <Zap className="h-3 w-3" />
                                <span className="font-semibold">{jev[c.id].answer}</span>
                                <span className="text-on-surface-variant tabular-nums">{Math.round((jev[c.id].confidence ?? 0) * 100)}%</span>
                              </span>
                              {jev[c.id].answer === "Split into multiple campaigns" && (
                                <Link
                                  href={`/lab?tab=comment&idea=${idea.id}&comment=${c.id}`}
                                  className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-2.5 py-0.5 font-medium hover:bg-primary/85 transition-colors"
                                >
                                  Split into campaigns →
                                </Link>
                              )}
                              <span className="text-on-surface-variant">{jev[c.id].engine} · {jev[c.id].ms} ms</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              <div ref={endRef} />
            </div>
          </div>

          {/* Comment input */}
          <div className="flex-shrink-0 border-t border-border px-6 py-3 flex flex-col gap-1.5">
            <ErrorText>{commentError}</ErrorText>
            <MentionInput onSubmit={postComment} />
          </div>
        </div>
      </div>
    </>
  )
}
