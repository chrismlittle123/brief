import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import OpenAI from "openai";
import { Readable } from "stream";

const fastify = Fastify({
  logger: true,
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Register plugins
await fastify.register(cors, {
  origin: true,
});

await fastify.register(multipart, {
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max (Whisper limit)
  },
});

// Health check
fastify.get("/health", async () => {
  return { status: "ok" };
});

// Transcribe audio endpoint
fastify.post("/transcribe", async (request, reply) => {
  try {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: "No audio file provided" });
    }

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Create a File object for OpenAI
    const file = new File([buffer], data.filename || "audio.webm", {
      type: data.mimetype || "audio/webm",
    });

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "en",
    });

    return {
      text: transcription.text,
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({
      error: "Transcription failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Generate report endpoint (for later use with GPT)
fastify.post("/generate-report", async (request, reply) => {
  try {
    const { responses } = request.body as {
      responses: Record<string, string>;
    };

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
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const report = JSON.parse(content);
    return report;
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({
      error: "Report generation failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Refine report endpoint - allows user to make corrections via chat
fastify.post("/refine-report", async (request, reply) => {
  try {
    const { currentReport, instruction } = request.body as {
      currentReport: {
        summary: string;
        thisWeek: string[];
        blockers: string[];
        nextWeek: string[];
        progress: number;
        status: string;
      };
      instruction: string;
    };

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
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const report = JSON.parse(content);
    return report;
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({
      error: "Report refinement failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "3001", 10);
    await fastify.listen({ port, host: "0.0.0.0" });
    console.log(`Server running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
