import { defineRoute, z, AppError } from "@palindrom/fastify-api";
import OpenAI from "openai";
import { getOpenAIApiKey } from "../lib/secrets.js";

export const transcribeRoute = defineRoute({
  method: "POST",
  url: "/v1/transcribe",
  auth: "public",
  tags: ["Transcription"],
  summary: "Transcribe audio file using OpenAI Whisper",
  schema: {
    response: {
      200: z.object({ text: z.string() }),
    },
  },
  handler: async (request, reply) => {
    const data = await request.file();
    if (!data) {
      throw AppError.badRequest("No audio file provided");
    }

    const buffer = await data.toBuffer();
    const file = new File([buffer], data.filename ?? "recording.webm", {
      type: data.mimetype,
    });

    const openai = new OpenAI({ apiKey: getOpenAIApiKey() });
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "en",
    });

    return reply.send({ text: transcription.text });
  },
});
