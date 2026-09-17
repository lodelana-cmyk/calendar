// Shared helpers for turning AI-drafted content items into real rows.
// Used by both the plan-import flow (import-plan-dialog.tsx) and the
// per-campaign generate flow (generate-items-dialog.tsx) — kept in one
// place so the enum-clamping and name-matching can't drift between them.

import type { CampaignWithItems, ContentChannel, ContentFormat, Profile } from "@/lib/database.types"
import { CHANNEL_OPTIONS, FORMAT_OPTIONS } from "@/lib/database.types"

/** Clamp AI-returned format to the valid DB enum, defaulting to "Other". */
export function normaliseFormat(raw: string): ContentFormat {
  return (FORMAT_OPTIONS as readonly string[]).includes(raw)
    ? (raw as ContentFormat)
    : "Other"
}

/** Clamp AI-returned channel to the valid DB enum, defaulting to "Other". */
export function normaliseChannel(raw: string): ContentChannel {
  return (CHANNEL_OPTIONS as readonly string[]).includes(raw)
    ? (raw as ContentChannel)
    : "Other"
}

/** Match an AI-returned first name to a real profile id, or null if unassigned/unmatched. */
export function matchAssignee(name: string | null, profiles: Profile[]): string | null {
  if (!name) return null
  const lower = name.toLowerCase().trim()
  return profiles.find(p =>
    p.full_name.toLowerCase().startsWith(lower) ||
    p.full_name.toLowerCase().split(" ")[0] === lower
  )?.id || null
}

/** Next sort_order to append after an existing campaign's current items. */
export function nextSortOrder(existing: CampaignWithItems | undefined): number {
  if (!existing || existing.items.length === 0) return 0
  return existing.items.reduce((max, it) => Math.max(max, it.sort_order + 1), 0)
}
