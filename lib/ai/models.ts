import { createAnthropic } from "@ai-sdk/anthropic"

// Which model writes (open-ended generation) and which one decides (fast,
// structured judgments) when Jev isn't connected. With ANTHROPIC_API_KEY set,
// both run on Claude with that key; otherwise they fall back to AI Gateway.
const anthropicKey = process.env.ANTHROPIC_API_KEY
const anthropic = anthropicKey ? createAnthropic({ apiKey: anthropicKey }) : null

export const writerModel = anthropic
  ? anthropic(process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5")
  : process.env.AI_GATEWAY_MODEL || "inclusionai/ling-3.0-flash-fin"

export const deciderModel = anthropic
  ? anthropic(process.env.ANTHROPIC_FAST_MODEL || "claude-haiku-5-5")
  : process.env.AI_GATEWAY_MODEL || "inclusionai/ling-3.0-flash-fin"

export const deciderLabel = anthropic ? "Claude Haiku 5.5" : "Free AI Gateway model"
