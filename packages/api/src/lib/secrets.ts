import { AppError } from "@progression-labs/fastify-api";

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

export function getSlackWebhookUrl(): string {
  const url = process.env["SLACK_WEBHOOK_URL"];
  if (!url) {
    throw AppError.internal("SLACK_WEBHOOK_URL environment variable is not set");
  }
  return url;
}

export function getLivekitApiKey(): string {
  const key = process.env["LIVEKIT_API_KEY"];
  if (!key) {
    throw AppError.internal("LIVEKIT_API_KEY environment variable is not set");
  }
  return key;
}

export function getLivekitApiSecret(): string {
  const secret = process.env["LIVEKIT_API_SECRET"];
  if (!secret) {
    throw AppError.internal(
      "LIVEKIT_API_SECRET environment variable is not set"
    );
  }
  return secret;
}

export function getLivekitUrl(): string {
  const url = process.env["LIVEKIT_URL"];
  if (!url) {
    throw AppError.internal("LIVEKIT_URL environment variable is not set");
  }
  return url;
}
