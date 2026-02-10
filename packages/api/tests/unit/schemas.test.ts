import { describe, it, expect } from "vitest";
import { reportSchema } from "../../src/lib/schemas.js";

const validReport = {
  tldr: "Shipped auth and calendar features",
  thisWeek: ["Built auth flow", "Added calendar integration"],
  challenges: [],
  currentStatus: "In progress",
  nextWeek: ["Deploy to prod"],
  dependencies: "None",
  supportRequired: "None",
  vibe: "Feeling good",
  status: "ON_TRACK" as const,
};

describe("reportSchema validation", () => {
  it("validates a correct report", () => {
    const result = reportSchema.safeParse(validReport);
    expect(result.success).toBe(true);
  });

  it("rejects invalid status values", () => {
    const result = reportSchema.safeParse({ ...validReport, status: "Invalid" });
    expect(result.success).toBe(false);
  });
});

describe("reportSchema status enum", () => {
  it("accepts all valid status enum values", () => {
    for (const status of ["ON_TRACK", "AT_RISK", "BLOCKED"]) {
      const result = reportSchema.safeParse({ ...validReport, status });
      expect(result.success).toBe(true);
    }
  });
});
