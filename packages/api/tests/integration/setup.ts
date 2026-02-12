import { createApp, registerRoute, type RouteDefinition } from "@progression-labs/fastify-api";
import multipart from "@fastify/multipart";
import { vi } from "vitest";

// Required env vars for route handlers
process.env.OPENAI_API_KEY = "test-key";
process.env.LLM_GATEWAY_URL = "http://llm-gateway.test";
process.env.NOTION_API_KEY = "test-notion-key";
process.env.NOTION_DATABASE_ID = "test-db-id";
process.env.SLACK_WEBHOOK_URL = "http://slack.test/webhook";
process.env.LIVEKIT_API_KEY = "test-livekit-key";
process.env.LIVEKIT_API_SECRET = "test-livekit-secret-that-is-long-enough";
process.env.LIVEKIT_URL = "wss://test.livekit.cloud";
process.env.AGENT_API_KEY = "test-agent-api-key";

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

function createMockClerk() {
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

function createMockDb() {
  const chainable = () => {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    chain.values = vi.fn().mockReturnValue(chain);
    chain.from = vi.fn().mockReturnValue(chain);
    chain.where = vi.fn().mockReturnValue(chain);
    chain.set = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockResolvedValue([]);
    return chain;
  };

  return {
    drizzle: {
      insert: vi.fn().mockReturnValue(chainable()),
      select: vi.fn().mockReturnValue(chainable()),
      update: vi.fn().mockReturnValue(chainable()),
      delete: vi.fn().mockReturnValue(chainable()),
    },
    ping: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
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

export async function buildAppWithDb(...routes: RouteDefinition[]) {
  const app = await createApp({
    name: "test-api",
    server: { port: 0, host: "127.0.0.1" },
    docs: { title: "Test", description: "Test", version: "1.0.0", path: "/docs" },
    logging: { level: "fatal", pretty: false },
  });

  await app.register(multipart, { limits: { fileSize: 25 * 1024 * 1024 } });
  app.decorate("clerkClient", createMockClerk());
  app.decorate("requireClerkAuth", vi.fn().mockResolvedValue({ userId: "user-123" }));

  const mockDb = createMockDb();
  app.decorate("db", mockDb);

  for (const route of routes) {
    registerRoute(app, route);
  }

  await app.ready();
  return { app, mockDb };
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
