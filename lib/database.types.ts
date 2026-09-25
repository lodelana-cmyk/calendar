// ============================================================
// V1 Database Types — Content Marketing Planner (spec-aligned)
// ============================================================

export type AppRole = "editor" | "viewer"

// ---- Campaigns ----
/** Spec: Type = Pillar / Launch / Always-on */
export type CampaignType = "Pillar" | "Launch" | "Always-on"

/** Spec: Motion = SMB / Enterprise / Both / Retention */
export type CampaignMotion = "SMB" | "Enterprise" | "Both" | "Retention"

export type CampaignStatus = "Active" | "On Hold" | "Completed" | "Archived"

export interface Campaign {
  id: string
  title: string
  description: string
  category: string
  lead_id: string | null
  icon_label: string
  icon_color: string
  status: CampaignStatus
  type: CampaignType
  motion: CampaignMotion
  product: string | null
  objective: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

// ---- Content Items ----
export type ContentChannel =
  | "YouTube"
  | "Instagram"
  | "LinkedIn"
  | "TikTok"
  | "Blog"
  | "Email"
  | "Twitter/X"
  | "Podcast"
  | "Webinar"
  | "Other"

export type DateConfidence = "Confirmed" | "Provisional"

/** Spec statuses: Idea / Planned / In progress / In review / Scheduled / Published */
export type ItemStatus =
  | "Idea"
  | "Planned"
  | "In progress"
  | "In review"
  | "Scheduled"
  | "Published"

/** Alias used in older code paths */
export type ContentStatus = ItemStatus

export type ContentFormat =
  | "Video"
  | "Short"
  | "Reel"
  | "Post"
  | "Article"
  | "Newsletter"
  | "Thread"
  | "Script"
  | "Edit"
  | "Thumbnail"
  | "Other"

/** Spec: contributors with role Writer / Designer / Video / Reviewer */
export type ContributorRole = "Writer" | "Designer" | "Video" | "Reviewer"

export interface Contributor {
  profile_id: string
  role: ContributorRole
}

export interface ContentItem {
  id: string
  /** Null when the item isn't tied to a campaign yet — Inbox ideas and campaign-less "single" items */
  campaign_id: string | null
  title: string
  format: ContentFormat
  status: ItemStatus
  assignee_id: string | null
  publish_date: string | null
  sort_order: number
  channel: ContentChannel
  date_confidence: DateConfidence
  content_role: string | null
  contributors: Contributor[]
  /** Target audiences — values from AUDIENCE_SEGMENTS */
  audience_segments: string[]
  notes: string | null
  brief_url: string | null
  live_url: string | null
  /** Who submitted the item — used to attribute Inbox ideas */
  created_by: string | null
  created_at: string
  updated_at: string
}

/** Idea enriched with its submitter, for the Inbox view */
export interface IdeaWithCreator extends ContentItem {
  createdBy: Profile | null
}

// ---- Comments ----
export interface ItemComment {
  id: string
  item_id: string
  author_id: string
  body: string
  created_at: string
  author?: Profile | null
}

// ---- Notifications ----
export type NotificationType = "mention" | "new_content"

export interface AppNotification {
  id: string
  recipient_id: string
  actor_id: string | null
  type: NotificationType
  item_id: string | null
  comment_id: string | null
  body_preview: string | null
  read_at: string | null
  created_at: string
  /** Embedded so the bell can title and route the notification */
  item?: { id: string; title: string; campaign_id: string | null; status: string } | null
}

// ---- Profiles ----
export interface Profile {
  id: string
  full_name: string
  role: string | null
  avatar_url: string | null
  timezone: string | null
  is_online: boolean
  app_role: AppRole
  created_at: string
  updated_at: string
}

// ---- Join types ----
export interface ContentItemWithCampaign extends ContentItem {
  /** The parent campaign (full object with items) */
  campaign: CampaignWithItems
  /** Convenience denorms kept for backward compat */
  campaignTitle: string
  campaignMotion: CampaignMotion
  campaignType: CampaignType
  campaignProduct: string | null
  assignee: Profile | null
}

export interface CampaignWithItems extends Campaign {
  items: ContentItemWithCampaign[]
  lead: Profile | null
}

// ============================================================
// Design tokens — neutral cards, subtle accents only.
// Cards/chips always use bg-card + text-foreground; the motion
// colour appears ONLY as a small accent (left border or dot).
// ============================================================

/** Motion accent colour — used for a 3px left border or dot ONLY, never as text or card colour */
export const MOTION_ACCENTS: Record<CampaignMotion, string> = {
  SMB:        "#3b82f6", // blue
  Enterprise: "#8b5cf6", // violet
  Both:       "#10b981", // emerald
  Retention:  "#f59e0b", // amber
}

/** Campaign type accent — small badge tint */
export const TYPE_ACCENTS: Record<CampaignType, string> = {
  Pillar:      "#6366f1",
  Launch:      "#ec4899",
  "Always-on": "#14b8a6",
}

// ---- Status: neutral badge + coloured dot only ----
export const STATUS_COLORS: Record<ItemStatus, { dot: string }> = {
  Idea:          { dot: "#94a3b8" },
  Planned:       { dot: "#64748b" },
  "In progress": { dot: "#3b82f6" },
  "In review":   { dot: "#f59e0b" },
  Scheduled:     { dot: "#8b5cf6" },
  Published:     { dot: "#10b981" },
}

// ---- Channel icons (short marks) ----
export const CHANNEL_ICONS: Record<string, string> = {
  YouTube:   "▶",
  Instagram: "◈",
  LinkedIn:  "in",
  TikTok:    "♪",
  Blog:      "✍",
  Email:     "✉",
  "Twitter/X": "𝕏",
  Podcast:   "◉",
  Webinar:   "⊙",
  Other:     "·",
}

// ---- Option lists ----
export const TYPE_OPTIONS: CampaignType[] = ["Pillar", "Launch", "Always-on"]

export const MOTION_OPTIONS: CampaignMotion[] = ["SMB", "Enterprise", "Both", "Retention"]

export const CHANNEL_OPTIONS: ContentChannel[] = [
  "YouTube", "Instagram", "LinkedIn", "TikTok", "Blog", "Email", "Twitter/X", "Podcast", "Webinar", "Other",
]

export const FORMAT_OPTIONS: ContentFormat[] = [
  "Video", "Short", "Reel", "Post", "Article", "Newsletter", "Thread", "Script", "Edit", "Thumbnail", "Other",
]

export const STATUS_OPTIONS: ItemStatus[] = [
  "Idea", "Planned", "In progress", "In review", "Scheduled", "Published",
]

export const CONTRIBUTOR_ROLE_OPTIONS: ContributorRole[] = ["Writer", "Designer", "Video", "Reviewer"]

/** Audience tags for content items, grouped for display. Add values here freely — the DB column has no CHECK. */
export const AUDIENCE_SEGMENT_GROUPS: { label: string; segments: string[] }[] = [
  { label: "Lifecycle stage",     segments: ["Onboarding", "Product adoption", "Upsell", "Retention", "Win-back"] },
  { label: "Subscription status", segments: ["Trial", "Free", "Paid", "Churned"] },
]
export const AUDIENCE_SEGMENTS: string[] = AUDIENCE_SEGMENT_GROUPS.flatMap(g => g.segments)

export const ROLE_OPTIONS = ["Editor", "Videographer", "Designer", "Copywriter", "Strategist", "Producer", "Other"]

export const PRODUCT_OPTIONS = [
  // Seller 365 suite
  "Seller 365",
  "AI Operator",
  "InventoryLab",
  "Tactical Arbitrage",
  "FeedbackWhiz Emails",
  "FeedbackWhiz Alerts",
  "FeedbackWhiz Profits",
  "SmartRepricer",
  "InventoryLab Accounting",
  "ScoutIQ",
  "Scoutify",
  "ScoutX",
  // Standalone products
  "Margin Pro",
  "UniCon",
  "Onsite Support",
  "Retail 365",
  "CedCommerce",
  "ExportYourStore",
  "Marketplace Pulse",
  // Brand / other
  "Threecolts (brand)",
  "Other",
]

// ---- Campaign statuses ----
export const CAMPAIGN_STATUSES: CampaignStatus[] = ["Active", "On Hold", "Completed", "Archived"]

// ---- Synthetic bucket for campaign-less content items in campaign-shaped views ----
export const NO_CAMPAIGN_ID = "__no_campaign__"
export const NO_CAMPAIGN_LABEL = "No campaign"

// ---- Misc ----
export const ICON_COLORS = [
  "bg-indigo-500", "bg-emerald-500", "bg-rose-500", "bg-violet-500",
  "bg-amber-500",  "bg-cyan-500",    "bg-teal-500", "bg-blue-500",
  "bg-orange-500", "bg-pink-500",    "bg-slate-600",
]

// Calendar colour per campaign. Derived from the id rather than the stored
// icon_color, which is a Tailwind class that most campaigns leave at the
// same default — so it can't tell campaigns apart.
const CAMPAIGN_PALETTE = [
  "#6366f1", "#10b981", "#f43f5e", "#f59e0b", "#0ea5e9",
  "#8b5cf6", "#14b8a6", "#ec4899", "#84cc16", "#f97316",
]
const NO_CAMPAIGN_COLOR = "#94a3b8"

export function campaignColor(campaignId: string | null | undefined): string {
  if (!campaignId || campaignId === NO_CAMPAIGN_ID) return NO_CAMPAIGN_COLOR
  let hash = 0
  for (let i = 0; i < campaignId.length; i++) hash = (hash * 31 + campaignId.charCodeAt(i)) | 0
  return CAMPAIGN_PALETTE[Math.abs(hash) % CAMPAIGN_PALETTE.length]
}

export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
