import { describe, it, expect, vi, afterEach } from "vitest";
import { buildAppWithDb, MOCK_REPORT, jsonResponse } from "./setup.js";
import { sessionCompleteRoute } from "../../src/routes/session-complete.js";

const MOCK_SESSION = {
  id: "session-1",
  userId: "user-123",
  livekitRoom: "session-1",
  status: "in_progress",
};

describe("POST /v1/sessions/:id/complete — success", () => {
  let app: Awaited<ReturnType<typeof buildAppWithDb>>["app"];
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  afterEach(async () => {
    fetchSpy?.mockRestore();
    await app.close();
  });

  it("completes session and returns report", async () => {
    const result = await buildAppWithDb(sessionCompleteRoute);
    app = result.app;
    result.mockDb.drizzle.select().limit.mockResolvedValue([MOCK_SESSION]);
    fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ content: JSON.stringify(MOCK_REPORT), usage: {} })
    );

    const res = await app.inject({
      method: "POST",
      url: "/v1/sessions/session-1/complete",
      payload: { transcript: "I built feature X this week." },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().tldr).toBe(MOCK_REPORT.tldr);
  });
});

describe("POST /v1/sessions/:id/complete — errors", () => {
  let app: Awaited<ReturnType<typeof buildAppWithDb>>["app"];

  afterEach(async () => { await app.close(); });

  it("returns 404 for non-existent session", async () => {
    ({ app } = await buildAppWithDb(sessionCompleteRoute));
    const res = await app.inject({
      method: "POST",
      url: "/v1/sessions/nonexistent/complete",
      payload: { transcript: "test" },
    });
    expect(res.statusCode).toBe(404);
  });
});
