import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const PROJECT_ID = "brief";
const ENVIRONMENT = "dev";

// Cache secrets in memory to avoid repeated API calls
const secretsCache: Record<string, string> = {};

let client: SecretManagerServiceClient | null = null;

function getClient(): SecretManagerServiceClient {
  if (!client) {
    // Check for base64-encoded service account credentials (for Vercel)
    const credentialsBase64 = process.env.GCP_SERVICE_ACCOUNT_KEY;

    if (credentialsBase64) {
      const credentials = JSON.parse(
        Buffer.from(credentialsBase64, "base64").toString("utf8")
      );
      client = new SecretManagerServiceClient({ credentials });
    } else {
      // Use Application Default Credentials (for local dev with gcloud auth)
      client = new SecretManagerServiceClient();
    }
  }
  return client;
}

async function getSecret(secretName: string): Promise<string> {
  const fullSecretName = `brief-${secretName}-secret-${ENVIRONMENT}`;

  // Check cache first
  if (secretsCache[fullSecretName]) {
    return secretsCache[fullSecretName];
  }

  try {
    const client = getClient();
    const [version] = await client.accessSecretVersion({
      name: `projects/${PROJECT_ID}/secrets/${fullSecretName}/versions/latest`,
    });

    const payload = version.payload?.data;
    if (!payload) {
      throw new Error(`Secret ${fullSecretName} has no payload`);
    }

    const secret = typeof payload === "string" ? payload : payload.toString("utf8");

    // Cache the secret
    secretsCache[fullSecretName] = secret;

    return secret;
  } catch (error) {
    console.error(`Failed to fetch secret ${fullSecretName}:`, error);
    throw error;
  }
}

export async function getOpenAIApiKey(): Promise<string> {
  return getSecret("openai-api-key");
}

export async function getNotionApiKey(): Promise<string> {
  return getSecret("notion-api-key");
}

export async function getNotionDatabaseId(): Promise<string> {
  return getSecret("notion-database-id");
}
