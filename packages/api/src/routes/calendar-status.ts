import { defineRoute, z } from "@palindrom/fastify-api";
import {
  getGoogleAccessToken,
  getNextFriday,
  hasExistingReminder,
} from "../lib/calendar.js";

export const calendarStatusRoute = defineRoute({
  method: "GET",
  url: "/v1/calendar/status",
  auth: "public",
  tags: ["Calendar"],
  summary: "Check if a calendar reminder is scheduled",
  schema: {
    response: {
      200: z.object({
        scheduled: z.boolean(),
        eventId: z.string().optional(),
        startTime: z.string().optional(),
      }),
    },
  },
  handler: async (request) => {
    const app = request.server;
    const { userId } = await app.requireClerkAuth(request, request.raw as never);

    const accessToken = await getGoogleAccessToken(userId, app.clerkClient);
    if (!accessToken) {
      return { scheduled: false };
    }

    const fridayDate = getNextFriday();
    const existing = await hasExistingReminder(accessToken, fridayDate, request.log);

    return {
      scheduled: existing.exists,
      eventId: existing.eventId,
      startTime: existing.startTime,
    };
  },
});
