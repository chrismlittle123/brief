import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getOpenAIApiKey } from "@/lib/secrets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentReport, instruction } = body ?? {};

    if (!currentReport || typeof currentReport !== "object") {
      return NextResponse.json(
        { error: "Invalid request", message: "Missing or invalid 'currentReport' object" },
        { status: 400 }
      );
    }

    if (!instruction || typeof instruction !== "string" || !instruction.trim()) {
      return NextResponse.json(
        { error: "Invalid request", message: "Missing or empty 'instruction' string" },
        { status: 400 }
      );
    }

    const apiKey = getOpenAIApiKey();
    const openai = new OpenAI({ apiKey });

    const systemPrompt = `You are an AI assistant helping refine a weekly status update report. Apply the user's requested changes to the report and return the updated version. Keep everything else the same unless the instruction implies otherwise.

Current Report:
- TL;DR: ${currentReport.tldr}
- This Week: ${Array.isArray(currentReport.thisWeek) ? currentReport.thisWeek.join("; ") : "None"}
- Challenges: ${Array.isArray(currentReport.challenges) && currentReport.challenges.length > 0 ? currentReport.challenges.join("; ") : "None"}
- Current Status: ${currentReport.currentStatus}
- Next Week: ${Array.isArray(currentReport.nextWeek) ? currentReport.nextWeek.join("; ") : "None"}
- Dependencies: ${currentReport.dependencies}
- Support Required: ${currentReport.supportRequired}
- Vibe: ${currentReport.vibe}
- Status: ${currentReport.status}

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
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: instruction },
      ],
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
