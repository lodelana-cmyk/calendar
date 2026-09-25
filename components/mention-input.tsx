"use client"

import { useMemo, useRef, useState } from "react"
import { Send } from "lucide-react"
import { useStore } from "@/lib/store"
import type { Profile } from "@/lib/database.types"
import { toStorage, type Mention } from "@/lib/mentions"

interface Props {
  /** Receives the stored form (mentions as @[Name](id)). Input clears once this resolves. */
  onSubmit: (body: string) => Promise<void> | void
  disabled?: boolean
  placeholder?: string
}

function avatarFor(p: Profile) {
  return p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.full_name)}`
}

/** "@que" immediately before the caret → the query "que"; null if not typing a mention. */
function activeQuery(text: string, caret: number): { query: string; start: number } | null {
  const match = /(^|\s)@([^\s@]{0,30})$/.exec(text.slice(0, caret))
  if (!match) return null
  return { query: match[2], start: caret - match[2].length - 1 }
}

export function MentionInput({ onSubmit, disabled, placeholder = "Add a comment… type @ to mention" }: Props) {
  const { profiles } = useStore()
  const inputRef = useRef<HTMLInputElement>(null)

  const [text, setText]         = useState("")
  const [mentions, setMentions] = useState<Mention[]>([])
  const [caret, setCaret]       = useState(0)
  const [highlight, setHighlight] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const [sending, setSending]   = useState(false)

  const active = activeQuery(text, caret)

  const matches = useMemo(() => {
    if (!active) return []
    const q = active.query.toLowerCase()
    return profiles
      .filter(p => p.full_name && p.full_name.toLowerCase().split(/\s+/).some(w => w.startsWith(q)))
      .slice(0, 6)
  }, [active?.query, profiles]) // eslint-disable-line react-hooks/exhaustive-deps

  const pickerOpen = !!active && !dismissed && matches.length > 0

  const pick = (p: Profile) => {
    if (!active) return
    const before = text.slice(0, active.start)
    const after = text.slice(caret)
    const inserted = `@${p.full_name} `
    const next = before + inserted + after
    setText(next)
    setMentions(prev => [...prev, { id: p.id, name: p.full_name }])
    const nextCaret = before.length + inserted.length
    setCaret(nextCaret)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(nextCaret, nextCaret)
    })
  }

  const submit = async () => {
    const body = toStorage(text.trim(), mentions)
    if (!body || sending) return
    setSending(true)
    try {
      await onSubmit(body)
      setText("")
      setMentions([])
      setCaret(0)
    } catch {
      // Keep the text so the user can retry; the parent shows the error.
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (pickerOpen) {
      if (e.key === "ArrowDown") { e.preventDefault(); setHighlight(h => (h + 1) % matches.length); return }
      if (e.key === "ArrowUp")   { e.preventDefault(); setHighlight(h => (h - 1 + matches.length) % matches.length); return }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); pick(matches[Math.min(highlight, matches.length - 1)]); return }
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setDismissed(true); return }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="relative flex-1 flex items-center gap-2">
      {pickerOpen && (
        <ul
          role="listbox"
          className="absolute bottom-full left-0 mb-2 w-64 max-h-56 overflow-y-auto rounded-xl border border-outline-variant bg-background shadow-xl py-1 z-10"
        >
          {matches.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === highlight}
                onMouseDown={e => { e.preventDefault(); pick(p) }}
                onMouseEnter={() => setHighlight(i)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left ${
                  i === highlight ? "bg-surface-container-high" : ""
                }`}
              >
                <img src={avatarFor(p)} alt="" className="h-6 w-6 rounded-full bg-surface-container" />
                <span className="truncate text-on-surface">{p.full_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        ref={inputRef}
        value={text}
        disabled={disabled || sending}
        onChange={e => {
          setText(e.target.value)
          setCaret(e.target.selectionStart ?? e.target.value.length)
          setHighlight(0)
          setDismissed(false)
        }}
        onSelect={e => setCaret(e.currentTarget.selectionStart ?? 0)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || sending || !text.trim()}
        className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        aria-label="Post comment"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  )
}
