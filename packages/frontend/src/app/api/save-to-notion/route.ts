import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getNotionApiKey, getNotionDatabaseId } from "@/lib/secrets";

export async function POST(request: NextRequest) {
  try {
    const { report } = await request.json();

    // Get user email from Clerk
    const user = await currentUser();
    const userEmail = user?.emailAddresses[0]?.emailAddress;

    const notionApiKey = getNotionApiKey();
    const databaseId = getNotionDatabaseId();

    // Get current week's Monday date
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    const weekOfDate = monday.toISOString().split("T")[0];

    // Build children blocks
    const children: any[] = [
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
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ type: "text", text: { content: item } }],
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
            object: "block",
            type: "bulleted_list_item",
            bulleted_list_item: {
              rich_text: [{ type: "text", text: { content: item } }],
            },
          }))
        : [
            {
              object: "block",
              type: "paragraph",
              paragraph: {
                rich_text: [{ type: "text", text: { content: "No challenges this week." } }],
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
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ type: "text", text: { content: item } }],
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
    ];

    // Build properties
    const properties: any = {
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
    };

    // Add Person property if user email is available
    if (userEmail) {
      properties.Person = {
        email: userEmail,
      };
    }

    // Create page in Notion using fetch API
    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${notionApiKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties,
        children,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Notion API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      pageId: data.id,
      url: `https://notion.so/${data.id.replace(/-/g, "")}`,
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
