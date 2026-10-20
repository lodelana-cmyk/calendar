import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

/**
 * Mirror in-app notifications to Slack DMs. The app calls this right after
 * an action that creates notifications (a comment with @-mentions, or
 * "Notify the team"); it finds the notifications that action just created
 * and DMs each recipient, matched to Slack by their login email.
 *
 * Only the person who caused the notifications can trigger them, and only
 * for a couple of minutes afterwards, so this can't be used to spam people.
 *
 * Requires SLACK_BOT_TOKEN (chat:write, users:read, users:read.email) and
 * SUPABASE_SERVICE_ROLE_KEY. Without the Slack token it does nothing, so the
 * app works the same until Slack is connected.
 */

const RECENT_MS = 2 * 60 * 1000

type Body = { commentId?: string; itemId?: string }

interface NotificationRow {
  id: string
  recipient_id: string
  type: "mention" | "new_content"
  item_id: string | null
  body_preview: string | null
  item: { id: string; title: string; campaign_id: string | null; status: string } | null
}

async function slack(method: string, token: string, init: { query?: Record<string, string>; json?: unknown }) {
  const url = new URL(`https://slack.com/api/${method}`)
  for (const [k, v] of Object.entries(init.query ?? {})) url.searchParams.set(k, v)
  const res = await fetch(url, {
    method: init.json ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.json ? { "Content-Type": "application/json; charset=utf-8" } : {}),
    },
    body: init.json ? JSON.stringify(init.json) : undefined,
  })
  return res.json() as Promise<{ ok: boolean; error?: string; user?: { id: string } }>
}

/** Slack mrkdwn treats &, < and > specially */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

/** Same routing as the in-app bell: raw ideas open in the Inbox, everything else on the calendar */
function linkFor(origin: string, n: NotificationRow) {
  const isIdea = n.item && n.item.campaign_id === null && n.item.status === "Idea"
  return isIdea ? `${origin}/inbox?idea=${n.item_id}` : `${origin}/?item=${n.item_id}`
}

export async function POST(req: Request) {
  const token = process.env.SLACK_BOT_TOKEN
  if (!token) return Response.json({ sent: 0, skipped: "Slack not connected" })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !supabaseUrl) {
    return Response.json({ error: "Server is missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 })
  }

  const { commentId, itemId } = (await req.json().catch(() => ({}))) as Body
  if (!commentId && !itemId) return Response.json({ error: "Nothing to notify about" }, { status: 400 })

  const admin = createAdminClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let query = admin
    .from("notifications")
    .select("id, recipient_id, type, item_id, body_preview, item:content_items(id, title, campaign_id, status)")
    .eq("actor_id", user.id)
    .gte("created_at", new Date(Date.now() - RECENT_MS).toISOString())
  query = commentId
    ? query.eq("comment_id", commentId).eq("type", "mention")
    : query.eq("item_id", itemId!).eq("type", "new_content")

  const { data: rows, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  const notifications = (rows ?? []) as unknown as NotificationRow[]
  if (!notifications.length) return Response.json({ sent: 0 })

  const { data: actor } = await admin.from("profiles").select("full_name").eq("id", user.id).single()
  const actorName = esc(actor?.full_name || "Someone")
  const origin = new URL(req.url).origin

  const results = await Promise.all(notifications.map(async n => {
    try {
      const { data: recipient } = await admin.auth.admin.getUserById(n.recipient_id)
      const email = recipient?.user?.email
      if (!email) return "no-email"

      // Not in Slack under the same email — skip rather than guess
      const lookup = await slack("users.lookupByEmail", token, { query: { email } })
      if (!lookup.ok || !lookup.user) return `lookup:${lookup.error}`

      const title = esc(n.item?.title || "an item")
      const headline = n.type === "mention"
        ? `*${actorName}* mentioned you on *${title}*`
        : `*${actorName}* started new content: *${title}*`
      const quote = n.type === "mention" && n.body_preview
        ? `\n>${esc(n.body_preview).replace(/\n/g, "\n>")}`
        : ""

      const post = await slack("chat.postMessage", token, {
        json: {
          channel: lookup.user.id,
          text: n.type === "mention" ? `${actor?.full_name || "Someone"} mentioned you on ${n.item?.title ?? "an item"}` : `New content: ${n.item?.title ?? ""}`,
          unfurl_links: false,
          blocks: [
            { type: "section", text: { type: "mrkdwn", text: headline + quote } },
            {
              type: "actions",
              elements: [{
                type: "button",
                text: { type: "plain_text", text: "Open in Content Calendar" },
                url: linkFor(origin, n),
              }],
            },
          ],
        },
      })
      return post.ok ? "sent" : `post:${post.error}`
    } catch (e) {
      return `error:${e instanceof Error ? e.message : "unknown"}`
    }
  }))

  const sent = results.filter(r => r === "sent").length
  const failed = results.filter(r => r !== "sent")
  if (failed.length) console.warn("[slack-notify] not sent:", failed)
  return Response.json({ sent, notSent: failed.length })
}
