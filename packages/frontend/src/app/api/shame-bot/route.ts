import { NextResponse } from "next/server";
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

// Query Notion for this week's submissions using fetch API
async function getSubmittedEmails(): Promise<string[]> {
  const notionApiKey = getNotionApiKey();
  const databaseId = getNotionDatabaseId();
  const weekOf = getCurrentWeekMonday();

  // Query for submissions since this week's Monday
  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${notionApiKey}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filter: {
        property: "Submitted At",
        date: {
          on_or_after: weekOf,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Notion API error: ${response.status}`);
  }

  const data = await response.json();
  const emails: string[] = [];

  for (const page of data.results) {
    const personProp = page.properties?.Person;

    // Handle Email-type property (written by save-to-notion)
    if (personProp?.email) {
      emails.push(personProp.email.toLowerCase());
    }
    // Handle People-type property (fallback)
    if (personProp?.people) {
      for (const person of personProp.people) {
        if (person.person?.email) {
          emails.push(person.person.email.toLowerCase());
        }
      }
    }
  }

  return emails;
}

const REFERENCE_THEMES = [
  "Game of Thrones", "Terminator", "The Matrix", "Jaws", "Star Wars",
  "The Office", "Breaking Bad", "Lord of the Rings", "Pulp Fiction",
  "The Godfather", "Top Gun", "Forrest Gump", "The Shining",
  "Apollo 13", "Jerry Maguire", "A Few Good Men", "Anchorman",
  "Airplane", "Dirty Harry", "Taxi Driver", "Apocalypse Now",
  "James Bond", "Harry Potter", "Field of Dreams", "The Sixth Sense",
  "Scarface", "The Graduate", "Taken", "The Dark Knight",
  "Jurassic Park", "Mean Girls", "Ghostbusters", "Braveheart",
  "Rocky", "The Wizard of Oz", "22 Jump Street", "Snakes on a Plane", "Whiplash",
  "Meet the Parents", "Captain Phillips", "Borat", "Shrek", "Fight Club",
  "Superbad", "Step Brothers", "The Big Lebowski",
];

// Generate shame message using AI
async function generateShameMessage(
  delinquents: { name: string; email: string }[],
  level: EscalationLevel
): Promise<string> {
  const openai = new OpenAI({ apiKey: getOpenAIApiKey() });

  const delinquentList = delinquents.map((d) => `• ${d.name} (${d.email})`).join("\n");

  // Pick a random theme suggestion to nudge variety
  const suggestedTheme = REFERENCE_THEMES[Math.floor(Math.random() * REFERENCE_THEMES.length)];
  const themeHint = `Suggested theme for this message: "${suggestedTheme}" (use this one or pick another, just don't repeat recent ones).`;

  const filledPrompt = SHAME_PROMPT.replace("{THEME_SUGGESTION}", themeHint);

  const prompt = `${filledPrompt}

CURRENT ESCALATION LEVEL: ${level}
DELINQUENT TEAM MEMBERS:
${delinquentList}

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

export async function GET() {
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
export { GET as POST };
