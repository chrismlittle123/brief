import type { FastifyInstance } from "fastify";
import type { RouteDefinition } from "@palindrom/fastify-api";
import { transcribeRoute } from "./transcribe.js";
import { generateReportRoute } from "./generate-report.js";
import { refineReportRoute } from "./refine-report.js";
import { saveToNotionRoute } from "./save-to-notion.js";
import { shameBotGetRoute, shameBotPostRoute } from "./shame-bot.js";
import { calendarStatusRoute } from "./calendar-status.js";
import { calendarScheduleRoute } from "./calendar-schedule.js";
import { cronCalendarRoute } from "./cron-calendar.js";
import { sessionCreateRoute } from "./session-create.js";
import { sessionTokenRoute } from "./session-token.js";
import { sessionCompleteRoute } from "./session-complete.js";
import { sessionGetRoute } from "./session-get.js";

const routes: RouteDefinition[] = [
  transcribeRoute,
  generateReportRoute,
  refineReportRoute,
  saveToNotionRoute,
  shameBotGetRoute,
  shameBotPostRoute,
  calendarStatusRoute,
  calendarScheduleRoute,
  cronCalendarRoute,
  sessionCreateRoute,
  sessionTokenRoute,
  sessionCompleteRoute,
  sessionGetRoute,
];

export function registerAllRoutes(
  app: FastifyInstance,
  registerRoute: (app: FastifyInstance, route: RouteDefinition) => void
): void {
  for (const route of routes) {
    registerRoute(app, route);
  }
}
