import { defineRoute, z, AppError } from "@palindrom/fastify-api";
import { AccessToken } from "livekit-server-sdk";
import { eq } from "drizzle-orm";
import { sessions } from "../db/schema.js";
import {
  getLivekitApiKey,
  getLivekitApiSecret,
  getLivekitUrl,
} from "../lib/secrets.js";

export const sessionTokenRoute = defineRoute({
  method: "GET",
  url: "/v1/sessions/:id/token",
  auth: "public",
  tags: ["Sessions"],
  summary: "Get a fresh LiveKit participant token for a session",
  schema: {
    params: z.object({
      id: z.string(),
    }),
    response: {
      200: z.object({
        token: z.string(),
        livekitUrl: z.string(),
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

    const apiKey = getLivekitApiKey();
    const apiSecret = getLivekitApiSecret();
    const livekitUrl = getLivekitUrl();

    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      ttl: "1h",
    });
    at.addGrant({
      roomJoin: true,
      room: session.livekitRoom,
      canPublish: true,
      canSubscribe: true,
    });
    const token = await at.toJwt();

    return { token, livekitUrl };
  },
});
