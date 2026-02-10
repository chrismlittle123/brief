import { defineRoute, z } from "@palindrom/fastify-api";
import { scheduleReminder, type CalendarResult } from "../lib/calendar.js";

const resultSchema = z.object({
  userId: z.string(),
  email: z.string(),
  calendar: z.object({
    scheduled: z.boolean(),
    eventId: z.string().optional(),
    startTime: z.string().optional(),
    reason: z.string().optional(),
  }),
});

export const cronCalendarRoute = defineRoute({
  method: "GET",
  url: "/v1/cron/calendar-reminders",
  auth: "public",
  tags: ["Cron"],
  summary: "Schedule calendar reminders for all users (cron job)",
  schema: {
    response: {
      200: z.object({
        success: z.boolean(),
        processed: z.number(),
        scheduled: z.number(),
        skipped: z.number(),
        results: z.array(resultSchema),
      }),
    },
  },
  handler: async (request) => {
    // Access clerkClient from the app instance
    const app = request.server;
    const clerk = app.clerkClient;

    const usersResponse = await clerk.users.getUserList({ limit: 100 });
    const users = usersResponse.data;

    const results: {
      userId: string;
      email: string;
      calendar: CalendarResult;
    }[] = [];

    for (const user of users) {
      const email = user.emailAddresses[0]?.emailAddress ?? "unknown";
      try {
        const calendar = await scheduleReminder(user.id, clerk, request.log);
        results.push({ userId: user.id, email, calendar });
      } catch (error) {
        request.log.error({ userId: user.id, error }, "Calendar scheduling failed");
        results.push({
          userId: user.id,
          email,
          calendar: { scheduled: false, reason: "error" },
        });
      }
    }

    const scheduled = results.filter((r) => r.calendar.scheduled).length;
    const skipped = results.length - scheduled;

    request.log.info({ processed: results.length, scheduled, skipped }, "Calendar reminders processed");

    return {
      success: true,
      processed: results.length,
      scheduled,
      skipped,
      results,
    };
  },
});
