import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getOpenAIApiKey } from "@/lib/secrets";

export async function POST(request: NextRequest) {
  try {
    const { responses } = await request.json();

    const apiKey = getOpenAIApiKey();
    const openai = new OpenAI({ apiKey });

    const prompt = `You are an AI assistant helping create a concise weekly status update. Based on the following responses, generate a clean, professional report.

Responses:
- What got done this week: ${responses.done || responses.work_done || responses.transcript || "No response"}
- Challenges and how they were handled: ${responses.challenges || responses.blockers || "No response"}
- Plan for next week: ${responses.next_week || "No response"}
- Client/stakeholder pulse: ${responses.client_pulse || responses.other || "No response"}

Generate a JSON response with the following structure:
{
  "tldr": "Two sentences max: what shipped + current status/any blockers",
  "thisWeek": ["List of accomplishments, grouped by workstream if applicable"],
  "challenges": ["List of challenges WITH context and resolution for each. Empty array if none."],
  "nextWeek": ["List of priorities for next week"],
  "clientPulse": "One sentence on stakeholder sentiment and any action taken. Use 'No concerns' if positive.",
  "status": "On Track" | "At Risk" | "Blocked"
}

Guidelines:
- Keep it concise. No fluff.
- For challenges, include what happened AND how it was handled (e.g., "Scope creep on feature X — added 3 days. Now using stricter change request process.")
- If no challenges mentioned, use empty array
- Status should reflect reality: "On Track" if things are going well, "At Risk" if there are unresolved challenges, "Blocked" if work is stopped

Return ONLY valid JSON, no markdown or explanation.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const rawReport = JSON.parse(content);

    // Normalize field names in case AI uses different keys
    const report = {
      tldr: rawReport.tldr || rawReport.TLDR || rawReport.summary || "",
      thisWeek: rawReport.thisWeek || rawReport.this_week || rawReport.accomplishments || rawReport.Accomplishments || rawReport.done || [],
      challenges: rawReport.challenges || rawReport.Challenges || rawReport.blockers || [],
      nextWeek: rawReport.nextWeek || rawReport.next_week || rawReport.NextWeek || rawReport.planned || [],
      clientPulse: rawReport.clientPulse || rawReport.client_pulse || rawReport.ClientPulse || rawReport.stakeholder || "No concerns",
      status: rawReport.status || rawReport.Status || "On Track",
    };

    // Ensure arrays are arrays
    if (!Array.isArray(report.thisWeek)) report.thisWeek = [report.thisWeek].filter(Boolean);
    if (!Array.isArray(report.challenges)) report.challenges = [report.challenges].filter(Boolean);
    if (!Array.isArray(report.nextWeek)) report.nextWeek = [report.nextWeek].filter(Boolean);

    return NextResponse.json(report);
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
