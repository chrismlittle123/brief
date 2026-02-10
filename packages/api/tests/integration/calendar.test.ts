import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildApp, jsonResponse, getFetchUrl } from "./setup.js";
import { calendarStatusRoute } from "../../src/routes/calendar-status.js";
import { calendarScheduleRoute } from "../../src/routes/calendar-schedule.js";
import { cronCalendarRoute } from "../../src/routes/cron-calendar.js";

function mockGoogleFetch() {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = getFetchUrl(input);
    const method = init?.method?.toUpperCase() ?? "GET";

    if (url.includes("googleapis.com/calendar/v3/freeBusy")) {
      return jsonResponse({ calendars: { primary: { busy: [] } } });
    }
    if (url.includes("googleapis.com/calendar/v3/calendars/primary/events")) {
      if (method === "POST") {
        return jsonResponse({ id: "evt-123", start: { dateTime: "2026-02-13T09:00:00Z" } });
      }
      return jsonResponse({ items: [] });
    }
    throw new Error(`Unhandled fetch: ${method} ${url}`);
  });
}

describe("GET /v1/calendar/status", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    app = await buildApp(calendarStatusRoute);
    fetchSpy = mockGoogleFetch();
  });

  afterEach(async () => {
    fetchSpy.mockRestore();
    await app.close();
  });

  it("returns scheduled=false when no reminders exist", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/calendar/status",
      headers: { authorization: "Bearer test-token" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().scheduled).toBe(false);
  });
});

describe("POST /v1/calendar/schedule-reminder", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    app = await buildApp(calendarScheduleRoute);
    fetchSpy = mockGoogleFetch();
  });

  afterEach(async () => {
    fetchSpy.mockRestore();
    await app.close();
  });

  it("schedules a reminder and returns event details", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/calendar/schedule-reminder",
      headers: { authorization: "Bearer test-token" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.scheduled).toBe(true);
  });
});

describe("GET /v1/cron/calendar-reminders", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    app = await buildApp(cronCalendarRoute);
    fetchSpy = mockGoogleFetch();
  });

  afterEach(async () => {
    fetchSpy.mockRestore();
    await app.close();
  });

  it("processes users and returns results", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/cron/calendar-reminders",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.processed).toBe(2);
    expect(body.results).toHaveLength(2);
  });
});
