import { describe, it, expect } from "vitest";
import {
  getEscalationLevel,
  TEAM_MEMBERS,
} from "../../src/lib/shame-prompt.js";

describe("getEscalationLevel", () => {
  it("returns GENTLE on Friday", () => {
    const friday = new Date("2026-02-13T16:00:00Z");
    const originalDate = globalThis.Date;

    globalThis.Date = class extends originalDate {
      constructor() {
        super();
        return friday;
      }
    } as DateConstructor;

    expect(getEscalationLevel()).toBe("GENTLE");
    globalThis.Date = originalDate;
  });

  it("returns MEDIUM on Monday", () => {
    const monday = new Date("2026-02-09T16:00:00Z");
    const originalDate = globalThis.Date;

    globalThis.Date = class extends originalDate {
      constructor() {
        super();
        return monday;
      }
    } as DateConstructor;

    expect(getEscalationLevel()).toBe("MEDIUM");
    globalThis.Date = originalDate;
  });

  it("returns FULL_ROAST on Tuesday", () => {
    const tuesday = new Date("2026-02-10T11:00:00Z");
    const originalDate = globalThis.Date;

    globalThis.Date = class extends originalDate {
      constructor() {
        super();
        return tuesday;
      }
    } as DateConstructor;

    expect(getEscalationLevel()).toBe("FULL_ROAST");
    globalThis.Date = originalDate;
  });
});

describe("TEAM_MEMBERS", () => {
  it("has entries with required fields", () => {
    for (const member of TEAM_MEMBERS) {
      expect(member.email).toBeTruthy();
      expect(member.name).toBeTruthy();
    }
  });
});
