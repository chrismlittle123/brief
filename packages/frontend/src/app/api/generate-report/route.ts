import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getOpenAIApiKey } from "@/lib/secrets";

export async function POST(request: NextRequest) {
  try {
    const { responses } = await request.json();

    const apiKey = await getOpenAIApiKey();
    const openai = new OpenAI({ apiKey });

    const prompt = `You are an AI assistant helping create a weekly status update report. Based on the following responses from a team member, generate a clean, professional weekly update report.

Responses:
- What did you work on this week? ${responses.work_done || "No response"}
- Progress percentage: ${responses.progress || "No response"}
- On track for deadline? ${responses.on_track || "No response"}
- Blockers or challenges: ${responses.blockers || "No response"}
- Plans for next week: ${responses.next_week || "No response"}
- Anything else to flag: ${responses.other || "No response"}

Generate a JSON response with the following structure:
{
  "summary": "A 2-3 sentence summary of the week",
  "thisWeek": ["List of accomplishments"],
  "blockers": ["List of blockers, empty if none"],
  "nextWeek": ["List of planned items"],
  "progress": number (0-100),
  "status": "On Track" | "At Risk" | "Blocked"
}

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

    const report = JSON.parse(content);
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
