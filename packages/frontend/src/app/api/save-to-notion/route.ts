import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { getNotionApiKey, getNotionDatabaseId } from "@/lib/secrets";

export async function POST(request: NextRequest) {
  try {
    const { report } = await request.json();

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
        Progress: {
          number: report.progress,
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
      },
      children: [
        // Summary section
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: "Summary" } }],
          },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: report.summary } }],
          },
        },
        // This Week section
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: "This Week" } }],
          },
        },
        ...report.thisWeek.map((item: string) => ({
          object: "block" as const,
          type: "bulleted_list_item" as const,
          bulleted_list_item: {
            rich_text: [{ type: "text" as const, text: { content: item } }],
          },
        })),
        // Blockers section
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: "Blockers" } }],
          },
        },
        ...(report.blockers.length > 0
          ? report.blockers.map((item: string) => ({
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
                  rich_text: [{ type: "text" as const, text: { content: "No blockers this week!" } }],
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
