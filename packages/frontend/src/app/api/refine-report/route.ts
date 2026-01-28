import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getOpenAIApiKey } from "@/lib/secrets";

export async function POST(request: NextRequest) {
  try {
    const { currentReport, instruction } = await request.json();

    const apiKey = getOpenAIApiKey();
    const openai = new OpenAI({ apiKey });

    const prompt = `You are an AI assistant helping refine a weekly status update report. The user wants to make changes to their report.

Current Report:
- Summary: ${currentReport.summary}
- This Week: ${currentReport.thisWeek.join(", ")}
- Blockers: ${currentReport.blockers.length > 0 ? currentReport.blockers.join(", ") : "None"}
- Next Week: ${currentReport.nextWeek.join(", ")}
- Progress: ${currentReport.progress}%
- Status: ${currentReport.status}

User's instruction: "${instruction}"

Apply the user's requested changes and return the updated report. Keep everything else the same unless the instruction implies otherwise.

Return ONLY valid JSON with this structure:
{
  "summary": "Updated summary if needed",
  "thisWeek": ["Updated list of accomplishments"],
  "blockers": ["Updated list of blockers"],
  "nextWeek": ["Updated list of planned items"],
  "progress": number (0-100),
  "status": "On Track" | "At Risk" | "Blocked"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const report = JSON.parse(content);
    return NextResponse.json(report);
  } catch (error) {
    console.error("Report refinement error:", error);
    return NextResponse.json(
      {
        error: "Report refinement failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
