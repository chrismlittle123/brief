import {
  createClerkClient,
  verifyToken,
  type ClerkClient,
} from "@clerk/backend";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { AppError } from "@progression-labs/fastify-api";

type ClerkAuth = {
  userId: string;
};

type ClerkAuthOptions = {
  secretKey: string;
  publishableKey: string;
};

declare module "fastify" {
  interface FastifyInstance {
    clerkClient: ClerkClient;
    requireClerkAuth: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<ClerkAuth>;
  }
  interface FastifyRequest {
    clerkAuth?: ClerkAuth;
  }
}

function extractToken(request: FastifyRequest): string | undefined {
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  // Forwarded session cookie from Next.js
  const cookies = request.headers.cookie;
  if (cookies) {
    const match = cookies.match(/__session=([^;]+)/);
    if (match) return match[1];
  }
  return undefined;
}

export function registerClerkAuth(
  app: FastifyInstance,
  options: ClerkAuthOptions
): void {
  const clerk = createClerkClient({
    secretKey: options.secretKey,
    publishableKey: options.publishableKey,
  });

  app.decorate("clerkClient", clerk);

  app.decorate(
    "requireClerkAuth",
    async (request: FastifyRequest, _reply: FastifyReply): Promise<ClerkAuth> => {
      const token = extractToken(request);
      if (!token) {
        throw AppError.unauthorized("Missing authentication token");
      }

      try {
        const verified = await verifyToken(token, {
          secretKey: options.secretKey,
        });
        const auth: ClerkAuth = { userId: verified.sub };
        request.clerkAuth = auth;
        return auth;
      } catch {
        throw AppError.unauthorized("Invalid or expired token");
      }
    }
  );
}
