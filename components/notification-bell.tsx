"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { useStore } from "@/lib/store"
import type { AppNotification } from "@/lib/database.types"
import {
  getNotificationsClient, markNotificationReadClient, markAllNotificationsReadClient,
} from "@/lib/data-client"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const POLL_MS = 45_000

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

/** Inbox ideas have no calendar dialog, so they open the Inbox instead. */
function hrefFor(n: AppNotification) {
  if (!n.item_id) return "/"
  const isIdea = n.item && n.item.campaign_id === null && n.item.status === "Idea"
  return isIdea ? "/inbox" : `/?item=${n.item_id}`
}

export function NotificationBell() {
  const { profiles } = useStore()
  const router = useRouter()
  const [items, setItems] = useState<AppNotification[]>([])
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      setItems(await getNotificationsClient(20))
    } catch {
      // Table missing until scripts/008 is run, or a transient network blip —
      // either way, show an empty bell rather than an error in the header.
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, POLL_MS)
    window.addEventListener("focus", load)
    return () => {
      clearInterval(timer)
      window.removeEventListener("focus", load)
    }
  }, [load])

  const unread = items.filter(n => !n.read_at).length
  const actorName = (id: string | null) =>
    profiles.find(p => p.id === id)?.full_name?.split(" ")[0] ?? "Someone"

  const openNotification = async (n: AppNotification) => {
    setOpen(false)
    if (!n.read_at) {
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
      markNotificationReadClient(n.id).catch(() => {})
    }
    router.push(hrefFor(n))
  }

  const markAll = async () => {
    const now = new Date().toISOString()
    setItems(prev => prev.map(x => x.read_at ? x : { ...x, read_at: now }))
    markAllNotificationsReadClient().catch(() => {})
  }

  return (
    <Popover open={open} onOpenChange={o => { setOpen(o); if (o) load() }}>
      <PopoverTrigger asChild>
        <button
          className="relative h-9 w-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
          <span className="text-sm font-semibold text-on-surface">Notifications</span>
          {unread > 0 && (
            <button onClick={markAll} className="text-xs font-semibold text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="px-4 py-8 text-sm text-center text-on-surface-variant">You're all caught up.</p>
        ) : (
          <ul className="max-h-96 overflow-y-auto divide-y divide-border">
            {items.map(n => (
              <li key={n.id}>
                <button
                  onClick={() => openNotification(n)}
                  className={`w-full text-left px-4 py-3 flex gap-2.5 hover:bg-surface-container-low transition-colors ${
                    n.read_at ? "" : "bg-primary/5"
                  }`}
                >
                  <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${n.read_at ? "bg-transparent" : "bg-primary"}`} />
                  <span className="min-w-0 flex flex-col gap-0.5">
                    <span className="text-sm text-on-surface">
                      <strong>{actorName(n.actor_id)}</strong>{" "}
                      {n.type === "mention" ? "mentioned you on" : "started new content:"}{" "}
                      <strong>{n.item?.title ?? "an item"}</strong>
                    </span>
                    {n.type === "mention" && n.body_preview && (
                      <span className="text-xs text-on-surface-variant line-clamp-2">{n.body_preview}</span>
                    )}
                    <span className="text-[11px] text-on-surface-variant">{timeAgo(n.created_at)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
