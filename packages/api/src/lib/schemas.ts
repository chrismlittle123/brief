import { z } from "@palindrom/fastify-api";

export const reportSchema = z.object({
  tldr: z.string(),
  thisWeek: z.array(z.string()),
  challenges: z.array(z.string()),
  currentStatus: z.string(),
  nextWeek: z.array(z.string()),
  dependencies: z.string(),
  supportRequired: z.string(),
  vibe: z.string(),
  status: z.enum(["On Track", "At Risk", "Blocked"]),
});

export type Report = z.infer<typeof reportSchema>;
