import { generateText, Output } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { PRODUCT_OPTIONS } from "@/lib/database.types"

export const maxDuration = 60

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

export async function POST(req: Request) {
  // Require an authenticated user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { text, monthContext, mode: rawMode, campaignTitle } = await req.json()
  const mode: "single" | "auto" = rawMode === "auto" ? "auto" : "single"

  if (!text || typeof text !== "string" || text.trim().length < 10) {
    return Response.json({ error: "Paste the content plan text first." }, { status: 400 })
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
        model: "openai/gpt-5.4-mini",
        output: Output.object({ schema: singlePlanSchema }),
        prompt,
      })
      return Response.json({ plan: { campaigns: [output.campaign] } })
    }

    const { output } = await generateText({
      model: "openai/gpt-5.4-mini",
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
