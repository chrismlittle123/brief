import { describe, it, expect } from "vitest";
import { getNextMonday } from "../../src/lib/calendar.js";

describe("getNextMonday", () => {
  it("returns the same date when today is Monday", () => {
    const monday = new Date("2026-02-09T10:00:00Z"); // Monday
    const result = getNextMonday(monday);
    expect(result.getDay()).toBe(1);
    expect(result).toBe(monday);
  });

  it("returns next Monday when today is Wednesday", () => {
    const wednesday = new Date("2026-02-11T10:00:00Z"); // Wednesday
    const result = getNextMonday(wednesday);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(16);
  });

  it("returns next Monday when today is Friday", () => {
    const friday = new Date("2026-02-13T10:00:00Z"); // Friday
    const result = getNextMonday(friday);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(16);
  });

  it("returns next Monday when today is Saturday", () => {
    const saturday = new Date("2026-02-14T10:00:00Z"); // Saturday
    const result = getNextMonday(saturday);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(16);
  });

  it("returns next Monday when today is Sunday", () => {
    const sunday = new Date("2026-02-15T10:00:00Z"); // Sunday
    const result = getNextMonday(sunday);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(16);
  });
});
