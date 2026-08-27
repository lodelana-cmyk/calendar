"use client"

import { Calendar, FileText } from "lucide-react"
import type { CampaignWithItems } from "@/lib/database.types"
import { MOTION_ACCENTS, TYPE_ACCENTS, CHANNEL_ICONS } from "@/lib/database.types"

interface Props {
  campaign: CampaignWithItems
  onClick: () => void
}

/**
 * Campaign card — clean neutral surface, standard text colours.
 * Type and motion are shown as neutral badges with a small accent dot.
 * No top colour bar, no tinted backgrounds.
 */
export function CampaignCard({ campaign, onClick }: Props) {
  const motionAccent = MOTION_ACCENTS[campaign.motion] || "#94a3b8"
  const typeAccent   = TYPE_ACCENTS[campaign.type] || "#94a3b8"
  const items   = campaign.items || []
  const total   = items.length
  const done    = items.filter(i => i.status === "Published").length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  // Date range from items
  const dates = items.map(i => i.publish_date).filter(Boolean).sort() as string[]
  const startDate = dates[0]
  const endDate   = dates[dates.length - 1]
  const fmtDate   = (s: string) =>
    new Date(s + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })

  // Used channels
  const channels = [...new Set(items.map(i => i.channel).filter(Boolean))] as string[]

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border bg-card hover:border-outline hover:shadow-sm transition-all group p-5 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type badge — neutral with accent dot */}
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-md border border-outline-variant bg-surface-container-low text-on-surface-variant">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: typeAccent }} aria-hidden="true" />
            {campaign.type}
          </span>
          {/* Motion badge — neutral with accent dot */}
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-md border border-outline-variant bg-surface-container-low text-on-surface-variant">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: motionAccent }} aria-hidden="true" />
            {campaign.motion}
          </span>
          {campaign.product && (
            <span className="text-xs text-on-surface-variant font-medium truncate">{campaign.product}</span>
          )}
        </div>
        <h3 className="text-base font-semibold text-on-surface leading-snug truncate group-hover:text-primary transition-colors">
          {campaign.title}
        </h3>
        {campaign.objective && (
          <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">{campaign.objective}</p>
        )}
      </div>

      {/* Channels */}
      {channels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {channels.slice(0, 4).map(ch => (
            <span key={ch} className="text-xs px-2 py-0.5 rounded-md bg-surface-container-low border border-outline-variant text-on-surface-variant font-medium">
              {CHANNEL_ICONS[ch] || ""} {ch}
            </span>
          ))}
          {channels.length > 4 && (
            <span className="text-xs text-on-surface-variant">+{channels.length - 4}</span>
          )}
        </div>
      )}

      {/* Progress */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{total} item{total !== 1 ? "s" : ""}</span>
            <span className="font-semibold">{done} published</span>
          </div>
          <span className="text-xs font-semibold text-on-surface">{progress}%</span>
        </div>
        <div className="h-1 rounded-full bg-outline-variant overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Date range */}
      {startDate && (
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{fmtDate(startDate)}{endDate !== startDate ? ` – ${fmtDate(endDate)}` : ""}</span>
        </div>
      )}
    </button>
  )
}
