"use client"

import type { ContentItemWithCampaign } from "@/lib/database.types"
import { CHANNEL_ICONS, campaignColor } from "@/lib/database.types"

interface Props {
  item: ContentItemWithCampaign
  onClick: () => void
  onDragStart: (e: React.DragEvent) => void
  compact?: boolean
  /** Dims items that belong to the previous / next month shown around the current one. */
  muted?: boolean
}

/**
 * Calendar chip — filled with its campaign's colour, white text, no border.
 * Top line spells out the channel ("✍ Blog") so the type is obvious; the
 * bottom line names the campaign. Provisional dates get a "TBC" tag;
 * published items are faded.
 */
export function ContentItemChip({ item, onClick, onDragStart, compact, muted }: Props) {
  const isProvisional = item.date_confidence === "Provisional"
  const channel = `${CHANNEL_ICONS[item.channel] ? CHANNEL_ICONS[item.channel] + " " : ""}${item.channel}`

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      onKeyDown={e => { if (e.key === "Enter") onClick() }}
      title={`${item.channel} · ${item.title}\nCampaign: ${item.campaignTitle} · ${item.status}${isProvisional ? " (Provisional)" : ""}\nDrag to reschedule`}
      style={{ backgroundColor: campaignColor(item.campaign_id) }}
      className={`rounded-lg px-2.5 py-2 text-white cursor-grab active:cursor-grabbing select-none transition-[filter,opacity] hover:brightness-110 ${
        item.status === "Published" || muted ? "opacity-50" : ""
      }`}
    >
      {!compact && (
        <span className="flex items-center gap-1 mb-1">
          <span className="inline-flex items-center rounded-full bg-white/25 px-2 py-px text-[10.5px] font-semibold leading-4 truncate">
            {channel}
          </span>
          {isProvisional && (
            <span className="ml-auto flex-shrink-0 rounded-full bg-black/20 px-1.5 text-[10px] font-semibold leading-4">TBC</span>
          )}
        </span>
      )}
      <span className={`block text-[12px] font-medium leading-snug ${compact ? "truncate" : "line-clamp-2"}`}>{item.title}</span>
      {!compact && (
        <span className="block mt-1 text-[10.5px] font-medium leading-tight text-white/85 truncate">{item.campaignTitle}</span>
      )}
    </div>
  )
}
