// Secrets from environment variables
// Set these in Vercel dashboard or local .env file

export function getOpenAIApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  return key;
}

export function getNotionApiKey(): string {
  const key = process.env.NOTION_API_KEY;
  if (!key) {
    throw new Error("NOTION_API_KEY environment variable is not set");
  }
  return key;
}

export function getNotionDatabaseId(): string {
  const id = process.env.NOTION_DATABASE_ID;
  if (!id) {
    throw new Error("NOTION_DATABASE_ID environment variable is not set");
  }
  return id;
}
