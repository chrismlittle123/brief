import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildApp, MOCK_REPORT, jsonResponse } from "./setup.js";
import { generateReportRoute } from "../../src/routes/generate-report.js";

describe("POST /v1/generate-report", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    app = await buildApp(generateReportRoute);
    fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ content: JSON.stringify(MOCK_REPORT), usage: {} })
    );
  });

  afterEach(async () => {
    fetchSpy.mockRestore();
    await app.close();
  });

  it("returns a report for valid input", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/generate-report",
      payload: { responses: { work_done: "Built feature X" } },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.tldr).toBe(MOCK_REPORT.tldr);
    expect(body.thisWeek).toEqual(MOCK_REPORT.thisWeek);
    expect(body.status).toBe("ON_TRACK");
  });

  it("calls the LLM gateway", async () => {
    await app.inject({
      method: "POST",
      url: "/v1/generate-report",
      payload: { responses: { work_done: "Built feature X" } },
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://llm-gateway.test/v1/complete",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("POST /v1/generate-report error handling", () => {
  it("returns 500 when LLM returns empty content", async () => {
    const app = await buildApp(generateReportRoute);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ content: "", usage: {} })
    );

    const res = await app.inject({
      method: "POST",
      url: "/v1/generate-report",
      payload: { responses: { work_done: "Built feature X" } },
    });

    expect(res.statusCode).toBe(500);
    fetchSpy.mockRestore();
    await app.close();
  });
});
