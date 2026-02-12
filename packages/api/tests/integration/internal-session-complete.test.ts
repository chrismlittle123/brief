import { describe, it, expect, vi, afterEach } from "vitest";
import { buildAppWithDb, MOCK_REPORT, jsonResponse } from "./setup.js";
import { internalSessionCompleteRoute } from "../../src/routes/internal-session-complete.js";

const MOCK_SESSION = {
  id: "session-1",
  userId: "user-123",
  livekitRoom: "session-1",
  status: "in_progress",
};

describe("POST /internal/sessions/:id/complete — success", () => {
  let app: Awaited<ReturnType<typeof buildAppWithDb>>["app"];
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  afterEach(async () => {
    fetchSpy?.mockRestore();
    await app.close();
  });

  it("completes session with valid API key and returns report", async () => {
    const result = await buildAppWithDb(internalSessionCompleteRoute);
    app = result.app;
    result.mockDb.drizzle.select().limit.mockResolvedValue([MOCK_SESSION]);
    fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ content: JSON.stringify(MOCK_REPORT), usage: {} })
    );

    const res = await app.inject({
      method: "POST",
      url: "/internal/sessions/session-1/complete",
      headers: { "x-api-key": "test-agent-api-key" },
      payload: { transcript: "I built feature X this week." },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().tldr).toBe(MOCK_REPORT.tldr);
  });
});

describe("POST /internal/sessions/:id/complete — errors", () => {
  let app: Awaited<ReturnType<typeof buildAppWithDb>>["app"];

  afterEach(async () => { await app.close(); });

  it("returns 403 without API key", async () => {
    ({ app } = await buildAppWithDb(internalSessionCompleteRoute));
    const res = await app.inject({
      method: "POST",
      url: "/internal/sessions/session-1/complete",
      payload: { transcript: "test" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("returns 403 with wrong API key", async () => {
    ({ app } = await buildAppWithDb(internalSessionCompleteRoute));
    const res = await app.inject({
      method: "POST",
      url: "/internal/sessions/session-1/complete",
      headers: { "x-api-key": "wrong-key" },
      payload: { transcript: "test" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("returns 404 for non-existent session", async () => {
    ({ app } = await buildAppWithDb(internalSessionCompleteRoute));
    const res = await app.inject({
      method: "POST",
      url: "/internal/sessions/nonexistent/complete",
      headers: { "x-api-key": "test-agent-api-key" },
      payload: { transcript: "test" },
    });
    expect(res.statusCode).toBe(404);
  });
});
