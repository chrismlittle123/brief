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

// LiveKit credentials
const livekitUrl = createSecret("livekit-url", {
  value: process.env.LIVEKIT_URL,
});

const livekitApiKey = createSecret("livekit-api-key", {
  value: process.env.LIVEKIT_API_KEY,
});

const livekitApiSecret = createSecret("livekit-api-secret", {
  value: process.env.LIVEKIT_API_SECRET,
});

// Notion credentials
const notionApiKey = createSecret("notion-api-key", {
  value: process.env.NOTION_API_KEY,
});

const notionDatabaseId = createSecret("notion-database-id", {
  value: process.env.NOTION_DATABASE_ID,
});

// Anthropic credentials
const anthropicApiKey = createSecret("anthropic-api-key", {
  value: process.env.ANTHROPIC_API_KEY,
});

// Export secret names for reference
export const secrets = {
  livekitUrl: livekitUrl.secretName,
  livekitApiKey: livekitApiKey.secretName,
  livekitApiSecret: livekitApiSecret.secretName,
  notionApiKey: notionApiKey.secretName,
  notionDatabaseId: notionDatabaseId.secretName,
  anthropicApiKey: anthropicApiKey.secretName,
};
