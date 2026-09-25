// Mentions are stored inside comment text as @[Full Name](profile-uuid).
// The database trigger in scripts/008 reads the same format to send
// notifications, so keep the two in sync.

export interface Mention {
  id: string
  name: string
}

export type MentionSegment =
  | { type: "text"; value: string }
  | { type: "mention"; id: string; name: string }

const MENTION_RE = /@\[([^\]]+)\]\(([0-9a-fA-F-]{36})\)/g

export function parseMentions(body: string): MentionSegment[] {
  const segments: MentionSegment[] = []
  let last = 0
  for (const match of body.matchAll(MENTION_RE)) {
    const index = match.index ?? 0
    if (index > last) segments.push({ type: "text", value: body.slice(last, index) })
    segments.push({ type: "mention", name: match[1], id: match[2] })
    last = index + match[0].length
  }
  if (last < body.length) segments.push({ type: "text", value: body.slice(last) })
  return segments
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Convert what the user typed ("@Andrea Smith") into the stored form.
 * Longest names first so "@Andrea" can't match inside "@Andrea Smith".
 * A mention whose name text was edited away is simply left as plain text.
 */
export function toStorage(text: string, mentions: Mention[]): string {
  const unique = [...new Map(mentions.map(m => [m.id, m])).values()]
    .sort((a, b) => b.name.length - a.name.length)
  let out = text
  for (const m of unique) {
    out = out.replace(new RegExp(`(?<![\\w])@${escapeRegExp(m.name)}(?![\\w])`, "g"), `@[${m.name}](${m.id})`)
  }
  return out
}
