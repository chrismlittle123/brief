import { createApp, registerRoute, type RouteDefinition } from "@palindrom/fastify-api";
import multipart from "@fastify/multipart";
import { vi } from "vitest";

// Required env vars for route handlers
process.env.OPENAI_API_KEY = "test-key";
process.env.LLM_GATEWAY_URL = "http://llm-gateway.test";
process.env.NOTION_API_KEY = "test-notion-key";
process.env.NOTION_DATABASE_ID = "test-db-id";
process.env.SLACK_WEBHOOK_URL = "http://slack.test/webhook";

export const MOCK_REPORT = {
  tldr: "Shipped feature X. On track for release.",
  thisWeek: ["Built feature X", "Fixed bug Y"],
  challenges: [],
  currentStatus: "Feature X in review",
  nextWeek: ["Deploy feature X"],
  dependencies: "None",
  supportRequired: "None",
  vibe: "Team is feeling good",
  status: "ON_TRACK",
};

export function createMockClerk() {
  return {
    users: {
      getUser: vi.fn().mockResolvedValue({
        id: "user-123",
        emailAddresses: [{ emailAddress: "test@example.com" }],
      }),
      getUserList: vi.fn().mockResolvedValue({
        data: [
          { id: "user-1", emailAddresses: [{ emailAddress: "alice@test.com" }] },
          { id: "user-2", emailAddresses: [{ emailAddress: "bob@test.com" }] },
        ],
      }),
      getUserOauthAccessToken: vi.fn().mockResolvedValue({
        data: [{ token: "mock-google-token" }],
      }),
    },
  };
}

export async function buildApp(...routes: RouteDefinition[]) {
  const app = await createApp({
    name: "test-api",
    server: { port: 0, host: "127.0.0.1" },
    docs: { title: "Test", description: "Test", version: "1.0.0", path: "/docs" },
    logging: { level: "fatal", pretty: false },
  });

  await app.register(multipart, { limits: { fileSize: 25 * 1024 * 1024 } });
  app.decorate("clerkClient", createMockClerk());
  app.decorate("requireClerkAuth", vi.fn().mockResolvedValue({ userId: "user-123" }));

  for (const route of routes) {
    registerRoute(app, route);
  }

  await app.ready();
  return app;
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function getFetchUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return (input as Request).url;
}
