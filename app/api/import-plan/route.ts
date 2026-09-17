import { generateText, Output } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { PRODUCT_OPTIONS } from "@/lib/database.types"

export const maxDuration = 60

// Vercel AI Gateway model slug. Defaults to a free-tier model so this route
// works with zero configuration; override in Vercel's project env vars (then
// redeploy) to use a paid/BYOK model instead — no code change needed either
// way. See the free-tier model list: vercel.com/ai-gateway/models?freeTier=true
const MODEL = process.env.AI_GATEWAY_MODEL || "inclusionai/ling-3.0-flash-fin"

const itemSchema = z.object({
  title: z.string().describe("The content item title, short and actionable"),
  format: z
    .enum(["Video", "Short", "Reel", "Post", "Article", "Newsletter", "Thread", "Script", "Edit", "Thumbnail", "Other"])
    .describe("Best-fit content format"),
  channel: z
    .enum(["YouTube", "Instagram", "LinkedIn", "TikTok", "Blog", "Email", "Twitter/X", "Podcast", "Webinar", "Other"])
    .describe("Primary distribution channel"),
  section: z
    .string()
    .nullable()
    .describe(
      "The sub-section or workstream this item came from in the plan, e.g. 'Email', 'Paid Social', 'YouTube', 'Launch week'. Null if the plan has no sections.",
    ),
  assignee_name: z
    .string()
    .nullable()
    .describe("First name of the person responsible, or null if unassigned"),
  publish_date: z
    .string()
    .describe("Publish date in YYYY-MM-DD format. MUST be a weekday (Mon-Fri)."),
  date_confidence: z
    .enum(["Confirmed", "Provisional"])
    .describe("Use Confirmed only if the text explicitly pins the date; otherwise Provisional"),
})

const campaignSchema = z.object({
  title: z.string().describe("Short campaign/series name, e.g. 'SmartRepricer Evergreen'"),
  type: z
    .enum(["Pillar", "Launch", "Always-on"])
    .describe("Campaign type: Pillar (big strategic bet), Launch (product/feature launch), Always-on (recurring/evergreen)"),
  motion: z
    .enum(["SMB", "Enterprise", "Both", "Retention"])
    .describe("Target motion: SMB, Enterprise, Both, or Retention"),
  product: z
    .enum(PRODUCT_OPTIONS as [string, ...string[]])
    .nullable()
    .describe("The product this campaign is about, if it clearly matches one of the given options; otherwise null"),
  description: z.string().describe("One sentence describing the campaign"),
  items: z.array(itemSchema),
})

// Single mode forces the model to return exactly one campaign object — not an
// array — so "one launch in, one campaign out" is guaranteed structurally,
// not just by prompt instruction.
const singlePlanSchema = z.object({ campaign: campaignSchema })
const multiPlanSchema = z.object({ campaigns: z.array(campaignSchema) })
// Mode "items": draft items for a campaign that already exists — no
// campaign object needed, just the items array.
const itemsOnlySchema = z.object({ items: z.array(itemSchema) })

export async function POST(req: Request) {
  // Require an authenticated user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const {
    text, monthContext, mode: rawMode, campaignTitle,
    campaignType, campaignMotion, campaignProduct,
    channels, startDate, endDate, existingTitles, count,
  } = await req.json()

  const mode: "single" | "auto" | "items" =
    rawMode === "auto" ? "auto" : rawMode === "items" ? "items" : "single"

  if (!text || typeof text !== "string" || text.trim().length < 10) {
    return Response.json(
      {
        error: mode === "items"
          ? "Describe what this campaign should cover first."
          : "Paste the content plan text first.",
      },
      { status: 400 },
    )
  }

  // ── Mode "items": draft items for an EXISTING campaign — no campaign object,
  //    just an items array constrained to the channels/dates given. ──
  if (mode === "items") {
    const channelList = (Array.isArray(channels) ? channels : []).filter(
      (c: unknown): c is string => typeof c === "string" && c.length > 0,
    )
    if (channelList.length === 0) {
      return Response.json({ error: "Pick at least one channel." }, { status: 400 })
    }
    const existingList = (Array.isArray(existingTitles) ? existingTitles : [])
      .filter((t: unknown): t is string => typeof t === "string" && t.length > 0)
      .slice(0, 50)
    const targetCount = Number.isFinite(count) && count > 0 ? Math.min(Math.round(count), 40) : 10

    const itemsPrompt = `You are drafting content items for an EXISTING marketing campaign on a content calendar. Do not invent a new campaign or restate its details — only produce the items array.

Campaign: "${campaignTitle || "Untitled campaign"}"${campaignType ? `\nType: ${campaignType}` : ""}${campaignMotion ? `\nMotion: ${campaignMotion}` : ""}${campaignProduct ? `\nProduct: ${campaignProduct}` : ""}

Intended outcomes for this campaign:
"""
${text.slice(0, 4000)}
"""

Rules:
- Produce approximately ${targetCount} items.
- Only use these channels, spelled exactly as given: ${channelList.join(", ")}. Do not use any other channel.
- Spread publish_date across ${startDate} through ${endDate} inclusive. Prefer weekdays (Mon-Fri), but a weekend date in this range is acceptable if it fits the plan better.
- Do NOT repeat or closely rephrase any of these titles, which already exist in this campaign:
${existingList.length > 0 ? existingList.map((t: string) => `- ${t}`).join("\n") : "(none yet)"}
- assignee_name should be a first name only if the outcomes text names someone responsible; otherwise null.
- Every item's date_confidence should be "Provisional" — none of these dates are confirmed yet.
- Keep titles concise and actionable. Vary the items so they don't all sound the same.`

    try {
      const { output } = await generateText({
        model: MODEL,
        output: Output.object({ schema: itemsOnlySchema }),
        prompt: itemsPrompt,
      })
      return Response.json({ items: output.items })
    } catch (error) {
      console.error("Generate items error:", error)
      return Response.json(
        { error: error instanceof Error ? error.message : "Failed to generate items" },
        { status: 500 },
      )
    }
  }

  const groupingRules =
    mode === "single"
      ? `- ALL of these deliverables belong to ONE campaign${campaignTitle ? `: "${campaignTitle}"` : ""}. Do NOT split them into multiple campaigns, even if the plan spans several channels or workstreams.
- The plan's sub-sections (e.g. Email, Paid Social, YouTube, Launch week) are NOT separate campaigns — record each item's section on its own \`section\` field instead.`
      : `- Group content items into campaigns by series/product/theme (e.g. "SmartRepricer Evergreen", "UniCon Launch").
- Record each item's sub-section (e.g. Email, Paid Social) on its \`section\` field when the plan has one.`

  const prompt = `You are parsing a monthly content plan into structured campaign(s) and content items for a content marketing calendar.

Context: The plan is for ${monthContext || "the current month"}.

Rules:
${groupingRules}
- Choose a campaign type: Pillar (big strategic bet), Launch (product/feature launch), or Always-on (recurring/evergreen series).
- Choose a motion: SMB, Enterprise, Both, or Retention. Default to Both if unclear.
- Choose a product only if the plan clearly names or implies one of the given options; otherwise null.
- Every item MUST have a publish_date on a WEEKDAY (Mon-Fri). If the text implies a weekend, move to the next Monday.
- If something recurs (e.g. "2x/week"), create separate items spread across the month.
- assignee_name should be just the first name (e.g. "Lionel", "Naufal", "Andrea", "Angela"), or null.
- Set date_confidence to Confirmed only when the text explicitly pins a date; otherwise use Provisional.
- Infer the channel from context (YouTube for videos, LinkedIn for articles, Instagram for reels, etc.).
- Keep item titles concise. Include quantities if given (e.g. "MPP News x2").

Content plan to parse:
"""
${text.slice(0, 12000)}
"""`

  try {
    // Branched (rather than a ternary on `schema`) so each generateText call
    // keeps its own concrete schema type instead of a union the SDK's types
    // can't unify.
    if (mode === "single") {
      const { output } = await generateText({
        model: MODEL,
        output: Output.object({ schema: singlePlanSchema }),
        prompt,
      })
      return Response.json({ plan: { campaigns: [output.campaign] } })
    }

    const { output } = await generateText({
      model: MODEL,
      output: Output.object({ schema: multiPlanSchema }),
      prompt,
    })
    return Response.json({ plan: output })
  } catch (error) {
    console.error("Import plan parse error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to parse plan" },
      { status: 500 },
    )
  }
}
