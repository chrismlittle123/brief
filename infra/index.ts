import * as dotenv from "dotenv";
import * as path from "path";
import { defineConfig, createSecret } from "@palindrom-ai/infra";

// Load .env from parent directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Configure for GCP dev environment
defineConfig({
  cloud: "gcp",
  region: "europe-west2",
  project: "brief",
  environment: "dev",
});

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

// Export secret names for reference
export const secrets = {
  openaiApiKey: openaiApiKey.secretName,
  notionApiKey: notionApiKey.secretName,
  notionDatabaseId: notionDatabaseId.secretName,
};
