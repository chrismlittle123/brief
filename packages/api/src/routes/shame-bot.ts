import { defineRoute, z } from "@palindrom/fastify-api";
import { LLMClient } from "../lib/llm.js";
import {
  getLLMGatewayUrl,
  getNotionApiKey,
  getNotionDatabaseId,
  getSlackWebhookUrl,
} from "../lib/secrets.js";
import {
  SHAME_PROMPT,
  TEAM_MEMBERS,
  getEscalationLevel,
  type EscalationLevel,
} from "../lib/shame-prompt.js";

function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

async function getSubmittedEmails(): Promise<string[]> {
  const notionApiKey = getNotionApiKey();
  const databaseId = getNotionDatabaseId();
  const weekOf = getCurrentWeekMonday();

  const response = await fetch(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionApiKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: {
          property: "Submitted At",
          date: { on_or_after: weekOf },
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Notion API error: ${response.status}`);
  }

  interface NotionPerson {
    properties?: {
      Person?: {
        email?: string;
        people?: Array<{ person?: { email?: string } }>;
      };
    };
  }
  const data = (await response.json()) as { results: NotionPerson[] };
  const emails: string[] = [];

  for (const page of data.results) {
    const personProp = page.properties?.Person;
    if (personProp?.email) {
      emails.push(personProp.email.toLowerCase());
    }
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
  "Game of Thrones",
  "Terminator",
  "The Matrix",
  "Jaws",
  "Star Wars",
  "The Office",
  "Breaking Bad",
  "Lord of the Rings",
  "Pulp Fiction",
  "The Godfather",
  "Top Gun",
  "Forrest Gump",
  "The Shining",
  "Apollo 13",
  "Jerry Maguire",
  "A Few Good Men",
  "Anchorman",
  "Airplane",
  "Dirty Harry",
  "Taxi Driver",
  "Apocalypse Now",
  "James Bond",
  "Harry Potter",
  "Field of Dreams",
  "The Sixth Sense",
  "Scarface",
  "The Graduate",
  "Taken",
  "The Dark Knight",
  "Jurassic Park",
  "Mean Girls",
  "Ghostbusters",
  "Braveheart",
  "Rocky",
  "The Wizard of Oz",
  "22 Jump Street",
  "Snakes on a Plane",
  "Whiplash",
  "Meet the Parents",
  "Captain Phillips",
  "Borat",
  "Shrek",
  "Fight Club",
  "Superbad",
  "Step Brothers",
  "The Big Lebowski",
];

async function generateShameMessage(
  delinquents: { name: string; email: string }[],
  level: EscalationLevel
): Promise<string> {
  const llm = new LLMClient(getLLMGatewayUrl());

  const delinquentList = delinquents
    .map((d) => `• ${d.name} (${d.email})`)
    .join("\n");

  const suggestedTheme =
    REFERENCE_THEMES[Math.floor(Math.random() * REFERENCE_THEMES.length)];
  const themeHint = `Suggested theme for this message: "${suggestedTheme}" (use this one or pick another, just don't repeat recent ones).`;

  const filledPrompt = SHAME_PROMPT.replace("{THEME_SUGGESTION}", themeHint);

  const prompt = `${filledPrompt}

CURRENT ESCALATION LEVEL: ${level}
DELINQUENT TEAM MEMBERS:
${delinquentList}

Generate the shame message now:`;

  const completion = await llm.complete({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    fallbacks: ["claude-3-5-haiku-latest"],
  });

  return completion.content || "Updates are due Monday 9am!";
}

async function postToSlack(message: string): Promise<void> {
  const webhookUrl = getSlackWebhookUrl();

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.status}`);
  }
}

const shameBotResponseSchema = z.object({
  success: z.boolean(),
  level: z.string().optional(),
  delinquents: z.array(z.string()),
  message: z.string(),
});

async function shameBotHandler() {
  const submittedEmails = await getSubmittedEmails();
  console.warn("Submitted emails:", submittedEmails);

  const delinquents = TEAM_MEMBERS.filter(
    (member) => !submittedEmails.includes(member.email.toLowerCase())
  );

  if (delinquents.length === 0) {
    const celebrationMessage =
      "🎉 *Incredible!* Everyone submitted their Brief this week. The CEO is impressed. You may all have a biscuit. 🍪";
    await postToSlack(celebrationMessage);
    return {
      success: true,
      message: "All submitted!",
      delinquents: [],
    };
  }

  const level = getEscalationLevel();
  const shameMessage = await generateShameMessage(delinquents, level);
  await postToSlack(shameMessage);

  return {
    success: true,
    level,
    delinquents: delinquents.map((d) => d.email),
    message: shameMessage,
  };
}

export const shameBotGetRoute = defineRoute({
  method: "GET",
  url: "/shame-bot",
  auth: "public",
  tags: ["Shame Bot"],
  summary: "Run the shame bot (cron trigger)",
  schema: {
    response: { 200: shameBotResponseSchema },
  },
  handler: async () => shameBotHandler(),
});

export const shameBotPostRoute = defineRoute({
  method: "POST",
  url: "/shame-bot",
  auth: "public",
  tags: ["Shame Bot"],
  summary: "Run the shame bot (manual trigger)",
  schema: {
    response: { 200: shameBotResponseSchema },
  },
  handler: async () => shameBotHandler(),
});
