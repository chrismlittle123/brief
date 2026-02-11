import { defineRoute, z, AppError } from "@progression-labs/fastify-api";
import { getNotionApiKey, getNotionDatabaseId } from "../lib/secrets.js";
import { reportSchema } from "../lib/schemas.js";

type ReportData = {
  tldr: string;
  thisWeek: string[];
  nextWeek: string[];
  challenges?: string[];
  currentStatus?: string;
  dependencies?: string;
  supportRequired?: string;
  vibe?: string;
  status: string;
};

function textBlock(type: string, content: string): Record<string, unknown> {
  return {
    object: "block",
    type,
    [type]: {
      rich_text: [{ type: "text", text: { content } }],
    },
  };
}

function heading(content: string): Record<string, unknown> {
  return textBlock("heading_2", content);
}

function bulletItem(content: string): Record<string, unknown> {
  return textBlock("bulleted_list_item", content);
}

function paragraph(content: string): Record<string, unknown> {
  return textBlock("paragraph", content);
}

function buildChildren(report: ReportData): Record<string, unknown>[] {
  return [
    {
      object: "block",
      type: "callout",
      callout: {
        rich_text: [{ type: "text", text: { content: report.tldr } }],
        icon: { type: "emoji", emoji: "📋" },
      },
    },
    heading("Done This Week"),
    ...report.thisWeek.map(bulletItem),
    heading("Challenges"),
    ...(report.challenges && report.challenges.length > 0
      ? report.challenges.map(bulletItem)
      : [paragraph("No challenges this week.")]),
    heading("Next Week"),
    ...report.nextWeek.map(bulletItem),
    heading("Current Status"),
    paragraph(report.currentStatus || "No update"),
    heading("Dependencies"),
    paragraph(report.dependencies || "None"),
    heading("Support Required"),
    paragraph(report.supportRequired || "None"),
    heading("Vibe Check"),
    paragraph(report.vibe || "No concerns"),
  ];
}

function buildProperties(
  report: ReportData,
  now: Date,
  userEmail?: string
) {
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1);
  const weekOfDate = monday.toISOString().split("T")[0];

  const properties: Record<string, unknown> = {
    Name: {
      title: [
        {
          text: {
            content: `Weekly Update - ${now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
          },
        },
      ],
    },
    Status: { select: { name: report.status === "ON_TRACK" ? "On Track" : report.status === "AT_RISK" ? "At Risk" : "Blocked" } },
    "Week Of": { date: { start: weekOfDate } },
    "Submitted At": { date: { start: now.toISOString() } },
  };

  if (userEmail) {
    properties["Person"] = { email: userEmail };
  }

  return properties;
}

async function createNotionPage(report: ReportData, userEmail?: string) {
  const now = new Date();

  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getNotionApiKey()}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: { database_id: getNotionDatabaseId() },
      properties: buildProperties(report, now, userEmail),
      children: buildChildren(report),
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as { message?: string };
    throw AppError.internal(errorData.message || `Notion API error: ${response.status}`);
  }

  const data = (await response.json()) as { id: string };

  return {
    success: true as const,
    pageId: data.id,
    url: `https://notion.so/${data.id.replace(/-/g, "")}`,
  };
}

export const saveToNotionRoute = defineRoute({
  method: "POST",
  url: "/v1/save-to-notion",
  auth: "public",
  tags: ["Notion"],
  summary: "Save a report to Notion",
  schema: {
    body: z.object({ report: reportSchema }),
    response: {
      200: z.object({
        success: z.boolean(),
        pageId: z.string(),
        url: z.string(),
      }),
    },
  },
  handler: async (request) => {
    const app = request.server;
    const { userId } = await app.requireClerkAuth(request, request.raw as never);

    const user = await app.clerkClient.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress;
    const { report } = request.body;

    if (!report.tldr || !Array.isArray(report.thisWeek) || !Array.isArray(report.nextWeek)) {
      throw AppError.badRequest("Report must include 'tldr', 'thisWeek', and 'nextWeek'");
    }

    return createNotionPage(report, userEmail);
  },
});
