import * as dotenv from "dotenv";
import * as path from "path";
import * as gcp from "@pulumi/gcp";
import { defineConfig, createSecret, createContainer } from "@palindrom-ai/infra";

// Load .env from parent directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Configure for GCP dev environment
defineConfig({
  cloud: "gcp",
  region: "europe-west2",
  project: "brief",
  environment: "dev",
});

// --- Secrets ---

// OpenAI credentials (for Whisper transcription and GPT)
const openaiApiKey = createSecret("openai-api-key", {
  value: process.env.OPENAI_API_KEY,
});

// Notion credentials
const notionApiKey = createSecret("notion-api-key", {
  value: process.env.NOTION_API_KEY,
});

const notionDatabaseId = createSecret("notion-database-id", {
  value: process.env.NOTION_DATABASE_ID,
});

// Slack
const slackWebhookUrl = createSecret("slack-webhook-url", {
  value: process.env.SLACK_WEBHOOK_URL,
});

// Clerk auth
const clerkSecretKey = createSecret("clerk-secret-key", {
  value: process.env.CLERK_SECRET_KEY,
});

const clerkPublishableKey = createSecret("clerk-publishable-key", {
  value: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
});

// --- Artifact Registry ---

const registry = new gcp.artifactregistry.Repository("brief-registry", {
  repositoryId: "brief",
  location: "europe-west2",
  format: "DOCKER",
  description: "Docker images for Brief API",
});

// --- Cloud Run container ---

const apiImage = "europe-west2-docker.pkg.dev/christopher-little-dev/brief/api:latest";

const api = createContainer("api", {
  image: apiImage,
  port: 8080,
  size: "small",
  minInstances: 0,
  maxInstances: 2,
  healthCheckPath: "/health",
  environment: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
    NOTION_API_KEY: process.env.NOTION_API_KEY ?? "",
    NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID ?? "",
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL ?? "",
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ?? "",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
    PORT: "8080",
  },
  link: [
    openaiApiKey,
    notionApiKey,
    notionDatabaseId,
    slackWebhookUrl,
    clerkSecretKey,
    clerkPublishableKey,
  ],
});

// --- Exports ---

export const secrets = {
  openaiApiKey: openaiApiKey.secretName,
  notionApiKey: notionApiKey.secretName,
  notionDatabaseId: notionDatabaseId.secretName,
  slackWebhookUrl: slackWebhookUrl.secretName,
  clerkSecretKey: clerkSecretKey.secretName,
  clerkPublishableKey: clerkPublishableKey.secretName,
};

export const registryName = registry.name;
export const apiUrl = api.url;
