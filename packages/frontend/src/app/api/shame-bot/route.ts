import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import OpenAI from "openai";
import { getNotionApiKey, getNotionDatabaseId, getOpenAIApiKey } from "@/lib/secrets";
import { SHAME_PROMPT, TEAM_MEMBERS, getEscalationLevel, EscalationLevel } from "@/lib/shame-prompt";

// Get Monday of current week
function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

// Query Notion for this week's submissions
async function getSubmittedEmails(): Promise<string[]> {
  const notion = new Client({ auth: getNotionApiKey() });
  const databaseId = getNotionDatabaseId();
  const weekOf = getCurrentWeekMonday();

  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: "Week Of",
      date: {
        equals: weekOf,
      },
    },
  });

  const emails: string[] = [];
  for (const page of response.results) {
    if ("properties" in page) {
      const personProp = page.properties.Person;
      if (personProp && "people" in personProp) {
        for (const person of personProp.people) {
          if ("email" in person && person.email) {
            emails.push(person.email.toLowerCase());
          }
        }
      }
    }
  }

  return emails;
}

// Generate shame message using AI
async function generateShameMessage(
  delinquents: { name: string; email: string }[],
  level: EscalationLevel
): Promise<string> {
  const openai = new OpenAI({ apiKey: getOpenAIApiKey() });

  const names = delinquents.map((d) => d.name).join(", ");
  const mentions = delinquents.map((d) => `@${d.name}`).join(" ");

  const prompt = `${SHAME_PROMPT}

CURRENT ESCALATION LEVEL: ${level}
DELINQUENT TEAM MEMBERS: ${names}
FORMAT MENTIONS AS: ${mentions}

Generate the shame message now:`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 300,
  });

  return completion.choices[0]?.message?.content || "Updates are due Monday 9am!";
}

// Post to Slack
async function postToSlack(message: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error("SLACK_WEBHOOK_URL not configured");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.status}`);
  }
}

export async function GET(request: NextRequest) {
  try {
    // 1. Get submitted emails from Notion
    const submittedEmails = await getSubmittedEmails();
    console.log("Submitted emails:", submittedEmails);

    // 2. Find delinquents
    const delinquents = TEAM_MEMBERS.filter(
      (member) => !submittedEmails.includes(member.email.toLowerCase())
    );

    // 3. If everyone submitted, send celebration message
    if (delinquents.length === 0) {
      const celebrationMessage = "🎉 *Incredible!* Everyone submitted their Brief this week. The CEO is impressed. You may all have a biscuit. 🍪";
      await postToSlack(celebrationMessage);
      return NextResponse.json({
        success: true,
        message: "All submitted!",
        delinquents: []
      });
    }

    // 4. Generate shame message
    const level = getEscalationLevel();
    const shameMessage = await generateShameMessage(delinquents, level);

    // 5. Post to Slack
    await postToSlack(shameMessage);

    return NextResponse.json({
      success: true,
      level,
      delinquents: delinquents.map((d) => d.email),
      message: shameMessage,
    });
  } catch (error) {
    console.error("Shame bot error:", error);
    return NextResponse.json(
      {
        error: "Shame bot failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also allow POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
