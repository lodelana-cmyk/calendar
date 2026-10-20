import { generateText, Output } from "ai"
import { z } from "zod"
import { deciderLabel, deciderModel } from "@/lib/ai/models"

/**
 * Fast, structured decisions: hand over some context and a few questions with
 * fixed answers, get back a typed verdict per question with a confidence.
 *
 * This is the shape Jev (TypeSafe AI) works in. Until Jev is connected, the
 * same questions go to a small, fast Claude model instead, and every result
 * says which engine answered — so a demo never passes one off as the other.
 * To switch to Jev: call its API here when JEV_API_KEY is set, mapping these
 * questions to its Choice/Score types, and return engine "jev".
 */

export type Question =
  | { id: string; type: "choice"; question: string; options: string[] }
  | { id: string; type: "score"; question: string; min: number; max: number }

export interface Decision {
  id: string
  answer: string
  confidence: number
  /** Top alternatives with their probability, best first (choice questions) */
  alternatives: { option: string; probability: number }[]
}

export interface DecisionResult {
  engine: "jev" | "stand-in"
  engineLabel: string
  ms: number
  decisions: Record<string, Decision>
}

const decisionSchema = z.object({
  decisions: z.array(z.object({
    id: z.string(),
    alternatives: z
      .array(z.object({ option: z.string(), probability: z.number() }))
      .describe("The most likely answers, best first, with calibrated probabilities that sum to at most 1"),
  })),
})

export async function decide(state: string, questions: Question[]): Promise<DecisionResult> {
  const start = Date.now()

  const prompt = [
    "You are a fast decision model. Read the STATE, then answer every QUESTION by choosing from its allowed answers only.",
    "For each question give up to 3 alternatives, best first, with honest calibrated probabilities (not just 1.0).",
    "For score questions the allowed answers are the whole numbers in the range, written as digits.",
    "",
    "STATE:",
    state,
    "",
    "QUESTIONS:",
    ...questions.map(q => q.type === "choice"
      ? `- id "${q.id}": ${q.question}\n  Allowed answers: ${q.options.map(o => JSON.stringify(o)).join(", ")}`
      : `- id "${q.id}": ${q.question}\n  Allowed answers: whole numbers ${q.min} to ${q.max}`),
  ].join("\n")

  const { output } = await generateText({
    model: deciderModel,
    temperature: 0,
    output: Output.object({ schema: decisionSchema }),
    prompt,
  })

  const decisions: Record<string, Decision> = {}
  for (const q of questions) {
    const allowed = q.type === "choice"
      ? q.options
      : Array.from({ length: q.max - q.min + 1 }, (_, i) => String(q.min + i))
    const raw = output.decisions.find(d => d.id === q.id)?.alternatives ?? []
    // Keep only allowed answers (case-insensitive), clamp probabilities
    const alternatives = raw
      .map(a => ({ option: allowed.find(o => o.toLowerCase() === a.option.trim().toLowerCase()), probability: Math.min(1, Math.max(0, a.probability)) }))
      .filter((a): a is { option: string; probability: number } => !!a.option)
      .slice(0, 3)
    const top = alternatives[0] ?? { option: allowed[allowed.length - 1], probability: 0 }
    decisions[q.id] = { id: q.id, answer: top.option, confidence: top.probability, alternatives }
  }

  return { engine: "stand-in", engineLabel: `${deciderLabel} (Jev stand-in)`, ms: Date.now() - start, decisions }
}
