import { describe, it, expect, afterEach } from "vitest";
import { buildAppWithDb } from "./setup.js";
import { sessionCreateRoute } from "../../src/routes/session-create.js";

describe("POST /v1/sessions", () => {
  let app: Awaited<ReturnType<typeof buildAppWithDb>>["app"];

  afterEach(async () => {
    await app.close();
  });

  it("creates a session and returns token", async () => {
    ({ app } = await buildAppWithDb(sessionCreateRoute));
    const res = await app.inject({
      method: "POST",
      url: "/v1/sessions",
      payload: { voice: "alloy", greeting: "Hello!" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.sessionId).toBeDefined();
    expect(body.token).toBeDefined();
    expect(body.livekitUrl).toBe("wss://test.livekit.cloud");
  });

  it("inserts a row into sessions table", async () => {
    const result = await buildAppWithDb(sessionCreateRoute);
    app = result.app;
    await app.inject({
      method: "POST",
      url: "/v1/sessions",
      payload: { voice: "alloy" },
    });
    expect(result.mockDb.drizzle.insert).toHaveBeenCalled();
  });

  it("works with empty body", async () => {
    ({ app } = await buildAppWithDb(sessionCreateRoute));
    const res = await app.inject({
      method: "POST",
      url: "/v1/sessions",
      payload: {},
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().sessionId).toBeDefined();
  });
});
