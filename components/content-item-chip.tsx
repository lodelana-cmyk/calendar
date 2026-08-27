"use client"

import type { ContentItemWithCampaign } from "@/lib/database.types"
import { MOTION_ACCENTS, CHANNEL_ICONS, STATUS_COLORS } from "@/lib/database.types"

interface Props {
  item: ContentItemWithCampaign
  onClick: () => void
  onDragStart: (e: React.DragEvent) => void
  compact?: boolean
}

/**
 * Calendar chip — clean card surface with standard text colour.
 * Campaign identity is a small inline dot next to the campaign name
 * (not a border/stripe); status is a small dot before the title.
 * No tinted backgrounds, tinted text, or accent borders.
 */
export function ContentItemChip({ item, onClick, onDragStart, compact }: Props) {
  const accent = MOTION_ACCENTS[item.campaignMotion] || "#94a3b8"
  const statusDot = STATUS_COLORS[item.status]?.dot || "#94a3b8"
  const isProvisional = item.date_confidence === "Provisional"

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      onKeyDown={e => { if (e.key === "Enter") onClick() }}
      title={`${item.title} · ${item.campaignTitle}${isProvisional ? " (Provisional)" : ""}\nDrag to reschedule`}
      className={`flex items-start gap-1.5 rounded-md bg-card text-on-surface px-2 py-1.5 text-[11px] leading-snug font-medium cursor-grab active:cursor-grabbing transition-shadow select-none border border-outline-variant hover:shadow-sm hover:border-outline ${
        isProvisional ? "border-dashed" : ""
      } ${item.status === "Published" ? "opacity-55" : ""} ${compact ? "truncate" : ""}`}
    >
      {/* Status dot */}
      <span
        className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: statusDot }}
        aria-hidden="true"
      />
      <span className={`min-w-0 ${compact ? "truncate" : ""}`}>
        <span className={`block ${compact ? "truncate" : "line-clamp-2"}`}>{item.title}</span>
        {!compact && (
          <span className="flex items-center gap-1 mt-0.5 text-on-surface-variant text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accent }} aria-hidden="true" />
            <span aria-hidden="true">{CHANNEL_ICONS[item.channel] || ""}</span>
            <span className="truncate">{item.campaignTitle}</span>
            {isProvisional && <span className="font-semibold uppercase tracking-wide">TBC</span>}
          </span>
        )}
      </span>
    </div>
  )
}
