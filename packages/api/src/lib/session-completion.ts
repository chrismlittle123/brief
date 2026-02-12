import { AppError, type Database } from "@progression-labs/fastify-api";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { sessions, updates } from "../db/schema.js";
import { LLMClient } from "./llm.js";
import { getLLMGatewayUrl } from "./secrets.js";

const TRANSCRIPT_PROMPT_PREFIX = `You are an AI assistant helping create a concise weekly status update. Based on the following voice conversation transcript, generate a clean, professional report.

Transcript:
`;

const TRANSCRIPT_PROMPT_SUFFIX = `

Generate a JSON response with the following structure:
{
  "tldr": "Two sentences max: what shipped + current status/any blockers",
  "thisWeek": ["List of accomplishments"],
  "challenges": ["List of challenges WITH context and resolution. Empty array if none."],
  "currentStatus": "Brief summary of what's in progress",
  "nextWeek": ["List of priorities for next week"],
  "dependencies": "Any blockers. Use 'None' if nothing.",
  "supportRequired": "Any help needed. Use 'None' if nothing.",
  "vibe": "One sentence on how the person and client are feeling.",
  "status": "ON_TRACK" | "AT_RISK" | "BLOCKED"
}

Guidelines:
- Keep it concise. No fluff.
- For challenges, include what happened AND how it was handled
- If no challenges mentioned, use empty array
- Status: "ON_TRACK" if well, "AT_RISK" if unresolved challenges, "BLOCKED" if work stopped
- If dependencies or support not mentioned, use "None"

Return ONLY valid JSON, no markdown or explanation.`;

function toStringArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((item) => String(item));
  return [String(val)];
}

export function normalizeReport(raw: Record<string, unknown>) {
  return {
    tldr: String(raw["tldr"] ?? ""),
    thisWeek: toStringArray(raw["thisWeek"]),
    challenges: toStringArray(raw["challenges"]),
    currentStatus: String(raw["currentStatus"] ?? ""),
    nextWeek: toStringArray(raw["nextWeek"]),
    dependencies: String(raw["dependencies"] ?? "None"),
    supportRequired: String(raw["supportRequired"] ?? "None"),
    vibe: String(raw["vibe"] ?? "No concerns"),
    status: String(raw["status"] ?? "ON_TRACK") as
      | "ON_TRACK"
      | "AT_RISK"
      | "BLOCKED",
  };
}

export async function generateReportFromTranscript(transcript: string) {
  const llm = new LLMClient(getLLMGatewayUrl());
  const prompt = TRANSCRIPT_PROMPT_PREFIX + transcript + TRANSCRIPT_PROMPT_SUFFIX;
  const completion = await llm.complete({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    fallbacks: ["claude-3-5-haiku-latest"],
  });
  if (!completion.content) {
    throw AppError.internal("No response from LLM gateway");
  }
  return normalizeReport(
    JSON.parse(completion.content) as Record<string, unknown>
  );
}

export function getWeekOf(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

export async function persistCompletion(
  db: Database,
  opts: { id: string; userId: string; transcript: string; report: ReturnType<typeof normalizeReport> }
) {
  await db.drizzle
    .update(sessions)
    .set({ status: "completed", transcript: opts.transcript, updatedAt: new Date() })
    .where(eq(sessions.id, opts.id));

  await db.drizzle.insert(updates).values({
    id: nanoid(),
    sessionId: opts.id,
    userId: opts.userId,
    weekOf: getWeekOf(new Date()),
    report: opts.report,
  });
}
