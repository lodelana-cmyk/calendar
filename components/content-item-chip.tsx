"use client"

import type { ContentItemWithCampaign } from "@/lib/database.types"
import { CHANNEL_ICONS } from "@/lib/database.types"

interface Props {
  item: ContentItemWithCampaign
  onClick: () => void
  onDragStart: (e: React.DragEvent) => void
  compact?: boolean
  /** Dims items that belong to the previous / next month shown around the current one. */
  muted?: boolean
}

/**
 * Calendar chip — solid ink card with white text. A provisional date shows
 * as a dashed outline instead, and published items are faded.
 */
export function ContentItemChip({ item, onClick, onDragStart, compact, muted }: Props) {
  const isProvisional = item.date_confidence === "Provisional"

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      onKeyDown={e => { if (e.key === "Enter") onClick() }}
      title={`${item.title} · ${item.campaignTitle} · ${item.status}${isProvisional ? " (Provisional)" : ""}\nDrag to reschedule`}
      className={`rounded-lg px-2.5 py-1.5 text-[11.5px] leading-snug font-medium cursor-grab active:cursor-grabbing select-none transition-opacity ${
        isProvisional
          ? "border border-dashed border-on-surface/50 text-on-surface hover:bg-surface-container-low"
          : "bg-primary text-primary-foreground hover:bg-primary/85"
      } ${item.status === "Published" || muted ? "opacity-50" : ""} ${compact ? "truncate" : ""}`}
    >
      <span className={`block ${compact ? "truncate" : "line-clamp-2"}`}>{item.title}</span>
      {!compact && (
        <span className={`flex items-center gap-1 mt-0.5 text-[10px] ${isProvisional ? "text-on-surface-variant" : "text-primary-foreground/60"}`}>
          <span aria-hidden="true">{CHANNEL_ICONS[item.channel] || ""}</span>
          <span className="truncate">{item.campaignTitle}</span>
          {isProvisional && <span className="font-semibold">TBC</span>}
        </span>
      )}
    </div>
  )
}
