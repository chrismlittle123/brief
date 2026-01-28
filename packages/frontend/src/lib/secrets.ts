// Secrets can come from:
// 1. Vercel environment variables (simplest for Vercel deployments)
// 2. GCP Secret Manager (for local dev with gcloud auth)

const PROJECT_ID = "brief";
const ENVIRONMENT = "dev";

// Check Vercel env vars first, then fall back to GCP Secret Manager
async function getSecret(secretName: string, envVarName: string): Promise<string> {
  // First, check if the secret is available as a direct env var (Vercel)
  const envValue = process.env[envVarName];
  if (envValue) {
    return envValue;
  }

  // Fall back to GCP Secret Manager (local dev)
  const { SecretManagerServiceClient } = await import("@google-cloud/secret-manager");
  const client = new SecretManagerServiceClient();
  const fullSecretName = `brief-${secretName}-secret-${ENVIRONMENT}`;

  try {
    const [version] = await client.accessSecretVersion({
      name: `projects/${PROJECT_ID}/secrets/${fullSecretName}/versions/latest`,
    });

    const payload = version.payload?.data;
    if (!payload) {
      throw new Error(`Secret ${fullSecretName} has no payload`);
    }

    return typeof payload === "string" ? payload : payload.toString("utf8");
  } catch (error) {
    console.error(`Failed to fetch secret ${fullSecretName}:`, error);
    throw error;
  }
}

export async function getOpenAIApiKey(): Promise<string> {
  return getSecret("openai-api-key", "OPENAI_API_KEY");
}

export async function getNotionApiKey(): Promise<string> {
  return getSecret("notion-api-key", "NOTION_API_KEY");
}

export async function getNotionDatabaseId(): Promise<string> {
  return getSecret("notion-database-id", "NOTION_DATABASE_ID");
}
