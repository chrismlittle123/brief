import { defineRoute, z, AppError } from "@palindrom/fastify-api";
import OpenAI from "openai";
import { getOpenAIApiKey } from "../lib/secrets.js";
import { reportSchema } from "../lib/schemas.js";

export const refineReportRoute = defineRoute({
  method: "POST",
  url: "/refine-report",
  auth: "public",
  tags: ["Reports"],
  summary: "Refine an existing report with natural language instructions",
  schema: {
    body: z.object({
      currentReport: reportSchema,
      instruction: z.string().min(1),
    }),
    response: {
      200: reportSchema,
    },
  },
  handler: async (request) => {
    const { currentReport, instruction } = request.body;

    if (!instruction.trim()) {
      throw AppError.badRequest("Missing or empty 'instruction' string");
    }

    const openai = new OpenAI({ apiKey: getOpenAIApiKey() });

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
      throw AppError.internal("No response from OpenAI");
    }

    return JSON.parse(content);
  },
});
