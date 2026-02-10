import { describe, it, expect } from "vitest";
import {
  getEscalationLevel,
  TEAM_MEMBERS,
} from "../../src/lib/shame-prompt.js";

describe("getEscalationLevel", () => {
  it("returns FULL_ROAST on Monday", () => {
    const monday = new Date("2026-02-09T08:00:00Z");
    const originalDate = globalThis.Date;

    globalThis.Date = class extends originalDate {
      constructor() {
        super();
        return monday;
      }
    } as DateConstructor;

    expect(getEscalationLevel()).toBe("FULL_ROAST");
    globalThis.Date = originalDate;
  });

  it("returns GENTLE on Friday", () => {
    const friday = new Date("2026-02-13T18:00:00Z");
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
});

describe("TEAM_MEMBERS", () => {
  it("has entries with required fields", () => {
    for (const member of TEAM_MEMBERS) {
      expect(member.email).toBeTruthy();
      expect(member.name).toBeTruthy();
    }
  });
});
