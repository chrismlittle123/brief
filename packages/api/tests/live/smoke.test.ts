import { describe, it, expect } from "vitest";

const CLOUD_RUN_URL =
  process.env.CLOUD_RUN_URL ??
  "https://brief-api-container-dev-hoon2yvuaq-nw.a.run.app";

const VERCEL_URL =
  process.env.VERCEL_URL ?? "https://brief-palindrom.vercel.app";

async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const body = await res.text();
  return { status: res.status, body, json: () => JSON.parse(body) };
}

describe("Cloud Run API (live)", () => {
  it("serves OpenAPI docs", async () => {
    const res = await fetch(`${CLOUD_RUN_URL}/docs`, { redirect: "follow" });
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("openapi.json");
  });

  it("serves openapi.json", async () => {
    const res = await fetchJSON(`${CLOUD_RUN_URL}/docs/openapi.json`);
    expect(res.status).toBe(200);
    const spec = res.json();
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.paths).toHaveProperty("/v1/transcribe");
  });

  it("POST /v1/transcribe without multipart returns 406", async () => {
    const res = await fetchJSON(`${CLOUD_RUN_URL}/v1/transcribe`, {
      method: "POST",
    });
    expect(res.status).toBe(406);
    expect(res.json().error.code).toBe("BAD_REQUEST");
  });

  it("POST /v1/generate-report with empty body returns 400", async () => {
    const res = await fetchJSON(`${CLOUD_RUN_URL}/v1/generate-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    // Should be a validation error, not a 500
    expect(res.status).toBeLessThan(500);
  });

  it("GET unknown route returns 404 (not 500)", async () => {
    const res = await fetchJSON(`${CLOUD_RUN_URL}/v1/nonexistent`);
    expect(res.status).toBe(404);
  });
});

describe("Vercel proxy (live)", () => {
  it("proxies POST /api/v1/transcribe to Cloud Run", async () => {
    const res = await fetchJSON(`${VERCEL_URL}/api/v1/transcribe`, {
      method: "POST",
    });
    // Should reach Cloud Run and get a validation error, not a Vercel error
    expect(res.status).toBe(406);
    expect(res.json().error.code).toBe("BAD_REQUEST");
  });

  it("proxies POST /api/v1/generate-report to Cloud Run", async () => {
    const res = await fetchJSON(`${VERCEL_URL}/api/v1/generate-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBeLessThan(500);
  });

  it("serves frontend on root", async () => {
    const res = await fetch(VERCEL_URL);
    expect(res.status).toBe(200);
  });
});
