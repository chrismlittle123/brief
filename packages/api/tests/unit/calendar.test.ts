import { describe, it, expect } from "vitest";
import { getNextFriday } from "../../src/lib/calendar.js";

describe("getNextFriday", () => {
  it("returns the same date when today is Friday", () => {
    const friday = new Date("2026-02-13T10:00:00Z"); // Friday
    const result = getNextFriday(friday);
    expect(result.getDay()).toBe(5);
    expect(result).toBe(friday);
  });

  it("returns next Friday when today is Monday", () => {
    const monday = new Date("2026-02-09T10:00:00Z"); // Monday
    const result = getNextFriday(monday);
    expect(result.getDay()).toBe(5);
    expect(result.getDate()).toBe(13);
  });

  it("returns next Friday when today is Saturday", () => {
    const saturday = new Date("2026-02-14T10:00:00Z"); // Saturday
    const result = getNextFriday(saturday);
    expect(result.getDay()).toBe(5);
    expect(result.getDate()).toBe(20);
  });
});
