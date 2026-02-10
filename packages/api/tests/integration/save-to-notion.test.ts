import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildApp, MOCK_REPORT, jsonResponse, getFetchUrl } from "./setup.js";
import { saveToNotionRoute } from "../../src/routes/save-to-notion.js";

describe("POST /v1/save-to-notion", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    app = await buildApp(saveToNotionRoute);
    fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ id: "page-abc-123" })
    );
  });

  afterEach(async () => {
    fetchSpy.mockRestore();
    await app.close();
  });

  it("saves a report and returns the Notion page URL", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/save-to-notion",
      headers: { authorization: "Bearer test-token" },
      payload: { report: MOCK_REPORT },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.pageId).toBe("page-abc-123");
    expect(body.url).toContain("notion.so");
  });

  it("calls Notion API with correct properties", async () => {
    await app.inject({
      method: "POST",
      url: "/v1/save-to-notion",
      headers: { authorization: "Bearer test-token" },
      payload: { report: MOCK_REPORT },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const url = getFetchUrl(fetchSpy.mock.calls[0][0]);
    expect(url).toBe("https://api.notion.com/v1/pages");

    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(body.parent.database_id).toBe("test-db-id");
    expect(body.properties.Status.select.name).toBe("On Track");
  });
});
