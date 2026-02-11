import { defineRoute, z, AppError } from "@palindrom/fastify-api";
import { eq } from "drizzle-orm";
import { sessions, updates } from "../db/schema.js";
import { reportSchema } from "../lib/schemas.js";

export const sessionGetRoute = defineRoute({
  method: "GET",
  url: "/v1/sessions/:id",
  auth: "public",
  tags: ["Sessions"],
  summary: "Get session details with report if completed",
  schema: {
    params: z.object({
      id: z.string(),
    }),
    response: {
      200: z.object({
        id: z.string(),
        status: z.string(),
        livekitRoom: z.string(),
        weekOf: z.string().nullable(),
        transcript: z.string().nullable(),
        metadata: z.unknown().nullable(),
        createdAt: z.string(),
        updatedAt: z.string(),
        report: reportSchema.nullable(),
      }),
    },
  },
  handler: async (request) => {
    const app = request.server;
    const { userId } = await app.requireClerkAuth(request, request.raw as never);

    if (!app.db) {
      throw AppError.internal("Database not configured");
    }

    const { id } = request.params;

    const [session] = await app.db.drizzle
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);

    if (!session) {
      throw AppError.notFound("Session", id);
    }

    if (session.userId !== userId) {
      throw AppError.forbidden("Not authorized to access this session");
    }

    // Look up associated report
    let report = null;
    if (session.status === "completed") {
      const [update] = await app.db.drizzle
        .select()
        .from(updates)
        .where(eq(updates.sessionId, id))
        .limit(1);
      if (update) {
        report = update.report as Record<string, unknown>;
      }
    }

    return {
      id: session.id,
      status: session.status,
      livekitRoom: session.livekitRoom,
      weekOf: session.weekOf,
      transcript: session.transcript,
      metadata: session.metadata,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      report,
    };
  },
});
