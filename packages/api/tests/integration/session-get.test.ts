import { describe, it, expect, afterEach } from "vitest";
import { buildAppWithDb, MOCK_REPORT } from "./setup.js";
import { sessionGetRoute } from "../../src/routes/session-get.js";

const now = new Date();

const MOCK_SESSION = {
  id: "session-1",
  userId: "user-123",
  livekitRoom: "session-1",
  status: "completed",
  weekOf: "2026-02-10",
  transcript: "I built feature X.",
  metadata: { voice: "alloy" },
  createdAt: now,
  updatedAt: now,
};

describe("GET /v1/sessions/:id — completed", () => {
  let app: Awaited<ReturnType<typeof buildAppWithDb>>["app"];

  afterEach(async () => { await app.close(); });

  it("returns session with report", async () => {
    const result = await buildAppWithDb(sessionGetRoute);
    app = result.app;
    let callCount = 0;
    result.mockDb.drizzle.select().limit.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve([MOCK_SESSION]);
      return Promise.resolve([{ report: MOCK_REPORT }]);
    });

    const res = await app.inject({ method: "GET", url: "/v1/sessions/session-1" });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("completed");
    expect(res.json().report.tldr).toBe(MOCK_REPORT.tldr);
  });
});

describe("GET /v1/sessions/:id — not completed", () => {
  let app: Awaited<ReturnType<typeof buildAppWithDb>>["app"];

  afterEach(async () => { await app.close(); });

  it("returns session without report", async () => {
    const result = await buildAppWithDb(sessionGetRoute);
    app = result.app;
    result.mockDb.drizzle.select().limit.mockResolvedValue([
      { ...MOCK_SESSION, status: "created" },
    ]);

    const res = await app.inject({ method: "GET", url: "/v1/sessions/session-1" });
    expect(res.statusCode).toBe(200);
    expect(res.json().report).toBeNull();
  });
});

describe("GET /v1/sessions/:id — errors", () => {
  let app: Awaited<ReturnType<typeof buildAppWithDb>>["app"];

  afterEach(async () => { await app.close(); });

  it("returns 404 for non-existent session", async () => {
    ({ app } = await buildAppWithDb(sessionGetRoute));
    const res = await app.inject({ method: "GET", url: "/v1/sessions/x" });
    expect(res.statusCode).toBe(404);
  });

  it("returns 403 for wrong user", async () => {
    const result = await buildAppWithDb(sessionGetRoute);
    app = result.app;
    result.mockDb.drizzle.select().limit.mockResolvedValue([
      { ...MOCK_SESSION, userId: "other-user" },
    ]);

    const res = await app.inject({ method: "GET", url: "/v1/sessions/session-1" });
    expect(res.statusCode).toBe(403);
  });
});
