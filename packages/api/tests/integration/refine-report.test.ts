import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildApp, MOCK_REPORT, jsonResponse } from "./setup.js";
import { refineReportRoute } from "../../src/routes/refine-report.js";

const REFINED = { ...MOCK_REPORT, tldr: "Updated: Shipped feature X and Y." };

describe("POST /v1/refine-report", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    app = await buildApp(refineReportRoute);
    fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ content: JSON.stringify(REFINED), usage: {} })
    );
  });

  afterEach(async () => {
    fetchSpy.mockRestore();
    await app.close();
  });

  it("refines a report with an instruction", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/refine-report",
      payload: { currentReport: MOCK_REPORT, instruction: "Add feature Y" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().tldr).toBe(REFINED.tldr);
  });

  it("sends the current report and instruction to LLM", async () => {
    await app.inject({
      method: "POST",
      url: "/v1/refine-report",
      payload: { currentReport: MOCK_REPORT, instruction: "Add feature Y" },
    });

    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(body.messages).toHaveLength(2);
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[0].content).toContain(MOCK_REPORT.tldr);
    expect(body.messages[1].content).toBe("Add feature Y");
  });
});
