"use client"

import type { ContentItemWithCampaign } from "@/lib/database.types"
import { CHANNEL_ICONS, campaignColor } from "@/lib/database.types"

interface Props {
  item: ContentItemWithCampaign
  onClick: () => void
  onDragStart: (e: React.DragEvent) => void
  compact?: boolean
}

/**
 * Calendar chip — the whole box is tinted in its campaign's colour so
 * campaigns (and gaps between them) read at a glance. Dashed border =
 * Provisional date; faded = Published.
 */
export function ContentItemChip({ item, onClick, onDragStart, compact }: Props) {
  const color = campaignColor(item.campaign_id)
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
      style={{ backgroundColor: `${color}1f`, borderColor: `${color}66`, borderLeftColor: color }}
      className={`rounded-md border border-l-[3px] text-on-surface px-2 py-1.5 text-[11px] leading-snug font-medium cursor-grab active:cursor-grabbing transition-shadow select-none hover:shadow-sm ${
        isProvisional ? "border-dashed" : ""
      } ${item.status === "Published" ? "opacity-55" : ""} ${compact ? "truncate" : ""}`}
    >
      <span className={`block ${compact ? "truncate" : "line-clamp-2"}`}>{item.title}</span>
      {!compact && (
        <span className="flex items-center gap-1 mt-0.5 text-on-surface-variant text-[10px]">
          <span aria-hidden="true">{CHANNEL_ICONS[item.channel] || ""}</span>
          <span className="truncate">{item.campaignTitle}</span>
          {isProvisional && <span className="font-semibold uppercase tracking-wide">TBC</span>}
        </span>
      )}
    </div>
  )
}
