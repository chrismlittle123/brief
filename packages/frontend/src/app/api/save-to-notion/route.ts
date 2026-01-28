import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { cookies } from "next/headers";
import { getNotionApiKey, getNotionDatabaseId } from "@/lib/secrets";

export async function POST(request: NextRequest) {
  try {
    const { report } = await request.json();

    // Get user email from cookie
    const cookieStore = await cookies();
    const userEmail = cookieStore.get("brief_user_email")?.value;

    const notionApiKey = getNotionApiKey();
    const databaseId = getNotionDatabaseId();

    const notion = new Client({ auth: notionApiKey });

    // Get current week's Monday date
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    const weekOfDate = monday.toISOString().split("T")[0];

    // Create page in Notion
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: `Weekly Update - ${now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
              },
            },
          ],
        },
        Status: {
          select: {
            name: report.status,
          },
        },
        "Week Of": {
          date: {
            start: weekOfDate,
          },
        },
        // Add Person property if user email is available
        ...(userEmail && {
          Person: {
            people: [{ email: userEmail }],
          },
        }),
      },
      children: [
        // TL;DR section
        {
          object: "block",
          type: "callout",
          callout: {
            rich_text: [{ type: "text", text: { content: report.tldr } }],
            icon: { type: "emoji", emoji: "📋" },
          },
        },
        // Done This Week section
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: "Done This Week" } }],
          },
        },
        ...report.thisWeek.map((item: string) => ({
          object: "block" as const,
          type: "bulleted_list_item" as const,
          bulleted_list_item: {
            rich_text: [{ type: "text" as const, text: { content: item } }],
          },
        })),
        // Challenges section
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: "Challenges" } }],
          },
        },
        ...(report.challenges && report.challenges.length > 0
          ? report.challenges.map((item: string) => ({
              object: "block" as const,
              type: "bulleted_list_item" as const,
              bulleted_list_item: {
                rich_text: [{ type: "text" as const, text: { content: item } }],
              },
            }))
          : [
              {
                object: "block" as const,
                type: "paragraph" as const,
                paragraph: {
                  rich_text: [{ type: "text" as const, text: { content: "No challenges this week." } }],
                },
              },
            ]),
        // Next Week section
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: "Next Week" } }],
          },
        },
        ...report.nextWeek.map((item: string) => ({
          object: "block" as const,
          type: "bulleted_list_item" as const,
          bulleted_list_item: {
            rich_text: [{ type: "text" as const, text: { content: item } }],
          },
        })),
        // Client Pulse section
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: "Client Pulse" } }],
          },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: report.clientPulse || "No concerns" } }],
          },
        },
      ],
    });

    return NextResponse.json({
      success: true,
      pageId: response.id,
      url: `https://notion.so/${response.id.replace(/-/g, "")}`,
    });
  } catch (error) {
    console.error("Notion save error:", error);
    return NextResponse.json(
      {
        error: "Failed to save to Notion",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
