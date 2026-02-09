import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getOpenAIApiKey } from "@/lib/secrets";

function buildPrompt(responses: Record<string, string>): string {
  return `You are an AI assistant helping create a concise weekly status update. Based on the following responses, generate a clean, professional report.

Responses:
- What got done this week: ${responses.done || responses.work_done || responses.transcript || "No response"}
- Challenges and how they were handled: ${responses.challenges || responses.blockers || "No response"}
- Current status / what they're working on: ${responses.current_status || "No response"}
- Plan for next week: ${responses.next_week || "No response"}
- Dependencies / blockers: ${responses.dependencies || "No response"}
- Support required: ${responses.support || "No response"}
- Vibe check (personal and client): ${responses.vibe || responses.client_pulse || responses.other || "No response"}

Generate a JSON response with the following structure:
{
  "tldr": "Two sentences max: what shipped + current status/any blockers",
  "thisWeek": ["List of accomplishments, grouped by workstream if applicable"],
  "challenges": ["List of challenges WITH context and resolution for each. Empty array if none."],
  "currentStatus": "Brief summary of what's in progress and how far along",
  "nextWeek": ["List of priorities for next week"],
  "dependencies": "Any blockers or things being waited on. Use 'None' if nothing.",
  "supportRequired": "Any help needed from the team. Use 'None' if nothing.",
  "vibe": "One sentence on how the person and client/stakeholder are feeling.",
  "status": "On Track" | "At Risk" | "Blocked"
}

Guidelines:
- Keep it concise. No fluff.
- For challenges, include what happened AND how it was handled (e.g., "Scope creep on feature X — added 3 days. Now using stricter change request process.")
- If no challenges mentioned, use empty array
- Status should reflect reality: "On Track" if things are going well, "At Risk" if there are unresolved challenges, "Blocked" if work is stopped
- If dependencies or support are "None" or not mentioned, just use "None"

Return ONLY valid JSON, no markdown or explanation.`;
}

function toStringArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.flatMap(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        return Object.values(item).map(v => String(v));
      }
      return String(item);
    });
  }
  if (typeof val === 'object') {
    return Object.values(val as Record<string, unknown>).flatMap(v => toStringArray(v));
  }
  return [String(val)];
}

function pickString(raw: Record<string, unknown>, keys: string[], fallback: string): string {
  for (const key of keys) {
    if (raw[key]) return String(raw[key]);
  }
  return fallback;
}

function pickArray(raw: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    if (raw[key]) return toStringArray(raw[key]);
  }
  return [];
}

function normalizeReport(raw: Record<string, unknown>) {
  return {
    tldr: pickString(raw, ["tldr", "TLDR", "summary"], ""),
    thisWeek: pickArray(raw, ["thisWeek", "this_week", "accomplishments", "Accomplishments", "done"]),
    challenges: pickArray(raw, ["challenges", "Challenges", "blockers"]),
    currentStatus: pickString(raw, ["currentStatus", "current_status", "CurrentStatus"], ""),
    nextWeek: pickArray(raw, ["nextWeek", "next_week", "NextWeek", "planned"]),
    dependencies: pickString(raw, ["dependencies", "Dependencies"], "None"),
    supportRequired: pickString(raw, ["supportRequired", "support_required", "SupportRequired"], "None"),
    vibe: pickString(raw, ["vibe", "Vibe", "clientPulse", "client_pulse"], "No concerns"),
    status: pickString(raw, ["status", "Status"], "On Track") as "On Track" | "At Risk" | "Blocked",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const responses = body?.responses;

    if (!responses || typeof responses !== "object") {
      return NextResponse.json(
        { error: "Invalid request", message: "Missing or invalid 'responses' object" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey: getOpenAIApiKey() });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: buildPrompt(responses) }],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    return NextResponse.json(normalizeReport(JSON.parse(content)));
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      {
        error: "Report generation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
