import { describe, it, expect, afterEach } from "vitest";
import { buildAppWithDb } from "./setup.js";
import { sessionTokenRoute } from "../../src/routes/session-token.js";

const MOCK_SESSION = {
  id: "session-1",
  userId: "user-123",
  livekitRoom: "session-1",
  status: "created",
};

describe("GET /v1/sessions/:id/token — success", () => {
  let app: Awaited<ReturnType<typeof buildAppWithDb>>["app"];

  afterEach(async () => { await app.close(); });

  it("returns a token for a valid session", async () => {
    const result = await buildAppWithDb(sessionTokenRoute);
    app = result.app;
    result.mockDb.drizzle.select().limit.mockResolvedValue([MOCK_SESSION]);

    const res = await app.inject({ method: "GET", url: "/v1/sessions/session-1/token" });
    expect(res.statusCode).toBe(200);
    expect(res.json().token).toBeDefined();
    expect(res.json().livekitUrl).toBe("wss://test.livekit.cloud");
  });
});

describe("GET /v1/sessions/:id/token — errors", () => {
  let app: Awaited<ReturnType<typeof buildAppWithDb>>["app"];

  afterEach(async () => { await app.close(); });

  it("returns 404 for non-existent session", async () => {
    ({ app } = await buildAppWithDb(sessionTokenRoute));
    const res = await app.inject({ method: "GET", url: "/v1/sessions/x/token" });
    expect(res.statusCode).toBe(404);
  });

  it("returns 403 for session owned by another user", async () => {
    const result = await buildAppWithDb(sessionTokenRoute);
    app = result.app;
    result.mockDb.drizzle.select().limit.mockResolvedValue([
      { ...MOCK_SESSION, userId: "other-user" },
    ]);
    const res = await app.inject({ method: "GET", url: "/v1/sessions/session-1/token" });
    expect(res.statusCode).toBe(403);
  });
});
