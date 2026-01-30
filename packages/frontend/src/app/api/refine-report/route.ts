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
- TL;DR: ${currentReport.tldr}
- This Week: ${currentReport.thisWeek.join("; ")}
- Challenges: ${currentReport.challenges.length > 0 ? currentReport.challenges.join("; ") : "None"}
- Current Status: ${currentReport.currentStatus}
- Next Week: ${currentReport.nextWeek.join("; ")}
- Dependencies: ${currentReport.dependencies}
- Support Required: ${currentReport.supportRequired}
- Vibe: ${currentReport.vibe}
- Status: ${currentReport.status}

User's instruction: "${instruction}"

Apply the user's requested changes and return the updated report. Keep everything else the same unless the instruction implies otherwise.

Return ONLY valid JSON with this structure:
{
  "tldr": "Two sentences max: what shipped + current status",
  "thisWeek": ["List of accomplishments"],
  "challenges": ["List of challenges with context and resolution"],
  "currentStatus": "Brief summary of what's in progress and how far along",
  "nextWeek": ["List of priorities"],
  "dependencies": "Any blockers or things being waited on",
  "supportRequired": "Any help needed from the team",
  "vibe": "One sentence on personal and client sentiment",
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
