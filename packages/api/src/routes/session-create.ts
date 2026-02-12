import { defineRoute, z, AppError } from "@progression-labs/fastify-api";
import { AccessToken } from "livekit-server-sdk";
import { nanoid } from "nanoid";
import { sessions } from "../db/schema.js";
import {
  getLivekitApiKey,
  getLivekitApiSecret,
  getLivekitUrl,
} from "../lib/secrets.js";

export const sessionCreateRoute = defineRoute({
  method: "POST",
  url: "/v1/sessions",
  auth: "public",
  tags: ["Sessions"],
  summary: "Create a new voice session with LiveKit room",
  schema: {
    body: z.object({
      voice: z.string().optional(),
      systemPrompt: z.string().optional(),
      greeting: z.string().optional(),
      userName: z.string().optional(),
      weekOf: z.string().optional(),
    }),
    response: {
      200: z.object({
        sessionId: z.string(),
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

    const sessionId = nanoid();
    const { voice, systemPrompt, greeting, userName, weekOf } = request.body;

    const apiKey = getLivekitApiKey();
    const apiSecret = getLivekitApiSecret();
    const livekitUrl = getLivekitUrl();

    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      ttl: "1h",
    });
    at.addGrant({
      roomJoin: true,
      room: sessionId,
      canPublish: true,
      canSubscribe: true,
    });
    at.metadata = JSON.stringify({ voice, systemPrompt, greeting, userName, weekOf });
    const token = await at.toJwt();

    const metadata = { voice, systemPrompt, greeting, userName, weekOf };

    await app.db.drizzle.insert(sessions).values({
      id: sessionId,
      userId,
      livekitRoom: sessionId,
      status: "created",
      weekOf,
      metadata,
    });

    return { sessionId, token, livekitUrl };
  },
});
