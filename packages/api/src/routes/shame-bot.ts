import { defineRoute, z, AppError } from "@progression-labs/fastify-api";
import type { FastifyInstance } from "fastify";
import { gte } from "drizzle-orm";
import { updates } from "../db/schema.js";
import { LLMClient } from "../lib/llm.js";
import { getLLMGatewayUrl, getSlackWebhookUrl } from "../lib/secrets.js";
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

async function getSubmittedEmails(app: FastifyInstance): Promise<string[]> {
  if (!app.db) throw AppError.internal("Database not configured");

  const weekOf = getCurrentWeekMonday();
  const rows = await app.db.drizzle
    .selectDistinct({ userId: updates.userId })
    .from(updates)
    .where(gte(updates.weekOf, weekOf));

  const emails: string[] = [];
  for (const row of rows) {
    const user = await app.clerkClient.users.getUser(row.userId);
    const email = user.emailAddresses[0]?.emailAddress;
    if (email) emails.push(email.toLowerCase());
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
    throw AppError.internal(`Slack webhook failed: ${response.status}`);
  }
}

const shameBotResponseSchema = z.object({
  success: z.boolean(),
  level: z.string().optional(),
  delinquents: z.array(z.string()),
  message: z.string(),
});

async function shameBotHandler(app: FastifyInstance) {
  const submittedEmails = await getSubmittedEmails(app);

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
  url: "/v1/shame-bot",
  auth: "public",
  tags: ["Shame Bot"],
  summary: "Run the shame bot (cron trigger)",
  schema: {
    response: { 200: shameBotResponseSchema },
  },
  handler: async (request) => shameBotHandler(request.server),
});

export const shameBotPostRoute = defineRoute({
  method: "POST",
  url: "/v1/shame-bot",
  auth: "public",
  tags: ["Shame Bot"],
  summary: "Run the shame bot (manual trigger)",
  schema: {
    response: { 200: shameBotResponseSchema },
  },
  handler: async (request) => shameBotHandler(request.server),
});
