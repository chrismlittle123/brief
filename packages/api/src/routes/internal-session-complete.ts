import { defineRoute, z, AppError } from "@progression-labs/fastify-api";
import { eq } from "drizzle-orm";
import { sessions } from "../db/schema.js";
import { reportSchema } from "../lib/schemas.js";
import { requireApiKey } from "../lib/api-key-auth.js";
import { generateReportFromTranscript, persistCompletion } from "../lib/session-completion.js";

export const internalSessionCompleteRoute = defineRoute({
  method: "POST",
  url: "/internal/sessions/:id/complete",
  auth: "public",
  tags: ["Internal"],
  summary: "Complete a session via agent API key (internal)",
  schema: {
    params: z.object({ id: z.string() }),
    body: z.object({ transcript: z.string() }),
    response: { 200: reportSchema },
  },
  handler: async (request) => {
    const app = request.server;
    requireApiKey(request);

    if (!app.db) {
      throw AppError.internal("Database not configured");
    }

    const { id } = request.params;
    const { transcript } = request.body;

    const [session] = await app.db.drizzle
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);

    if (!session) throw AppError.notFound("Session", id);

    const report = await generateReportFromTranscript(transcript);
    await persistCompletion(app.db, { id, userId: session.userId, transcript, report });

    return report;
  },
});
