import { defineRoute, z } from "@palindrom/fastify-api";
import { scheduleReminder } from "../lib/calendar.js";

export const calendarScheduleRoute = defineRoute({
  method: "POST",
  url: "/calendar/schedule-reminder",
  auth: "public",
  tags: ["Calendar"],
  summary: "Schedule a calendar reminder for the next Friday",
  schema: {
    response: {
      200: z.object({
        success: z.boolean(),
        scheduled: z.boolean(),
        eventId: z.string().optional(),
        startTime: z.string().optional(),
        reason: z.string().optional(),
      }),
    },
  },
  handler: async (request) => {
    const app = request.server;
    const { userId } = await app.requireClerkAuth(request, request.raw as never);

    const result = await scheduleReminder(userId, app.clerkClient);

    return {
      success: true,
      ...result,
    };
  },
});
