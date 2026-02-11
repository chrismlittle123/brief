import { z } from "@progression-labs/fastify-api";

export const reportSchema = z.object({
  tldr: z.string(),
  thisWeek: z.array(z.string()),
  challenges: z.array(z.string()),
  currentStatus: z.string(),
  nextWeek: z.array(z.string()),
  dependencies: z.string(),
  supportRequired: z.string(),
  vibe: z.string(),
  status: z.enum(["ON_TRACK", "AT_RISK", "BLOCKED"]),
});
