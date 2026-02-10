import { AppError } from "@palindrom/fastify-api";

export function getOpenAIApiKey(): string {
  const key = process.env["OPENAI_API_KEY"];
  if (!key) {
    throw AppError.internal("OPENAI_API_KEY environment variable is not set");
  }
  return key;
}

export function getLLMGatewayUrl(): string {
  const url = process.env["LLM_GATEWAY_URL"];
  if (!url) {
    throw AppError.internal("LLM_GATEWAY_URL environment variable is not set");
  }
  return url;
}

export function getNotionApiKey(): string {
  const key = process.env["NOTION_API_KEY"];
  if (!key) {
    throw AppError.internal("NOTION_API_KEY environment variable is not set");
  }
  return key;
}

export function getNotionDatabaseId(): string {
  const id = process.env["NOTION_DATABASE_ID"];
  if (!id) {
    throw AppError.internal("NOTION_DATABASE_ID environment variable is not set");
  }
  return id;
}

export function getSlackWebhookUrl(): string {
  const url = process.env["SLACK_WEBHOOK_URL"];
  if (!url) {
    throw AppError.internal("SLACK_WEBHOOK_URL environment variable is not set");
  }
  return url;
}
