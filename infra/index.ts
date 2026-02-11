import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";
import { defineConfig, createSecret, createDatabase } from "@palindrom-ai/infra";

// Configure for GCP dev environment
defineConfig({
  cloud: "gcp",
  region: "europe-west2",
  project: "brief",
  environment: "dev",
});

// --- Secrets (values managed externally in GCP Secret Manager) ---

const llmGatewayUrl = createSecret("llm-gateway-url");
const openaiApiKey = createSecret("openai-api-key");
const notionApiKey = createSecret("notion-api-key");
const notionDatabaseId = createSecret("notion-database-id");
const slackWebhookUrl = createSecret("slack-webhook-url");
const clerkSecretKey = createSecret("clerk-secret-key");
const clerkPublishableKey = createSecret("clerk-publishable-key");
const livekitApiKey = createSecret("livekit-api-key");
const livekitApiSecret = createSecret("livekit-api-secret");
const livekitUrl = createSecret("livekit-url");
const deepgramApiKey = createSecret("deepgram-api-key");

const allSecrets: Record<string, ReturnType<typeof createSecret>> = {
  "llm-gateway-url": llmGatewayUrl,
  "openai-api-key": openaiApiKey,
  "notion-api-key": notionApiKey,
  "notion-database-id": notionDatabaseId,
  "slack-webhook-url": slackWebhookUrl,
  "clerk-secret-key": clerkSecretKey,
  "clerk-publishable-key": clerkPublishableKey,
  "livekit-api-key": livekitApiKey,
  "livekit-api-secret": livekitApiSecret,
  "livekit-url": livekitUrl,
  "deepgram-api-key": deepgramApiKey,
};

// --- Database (Cloud SQL PostgreSQL via @palindrom-ai/infra) ---

const db = createDatabase("main", { public: true });

// Read the password back from the secret that createDatabase stored
const dbPassword = db.passwordSecretArn.apply(secretName =>
  gcp.secretmanager.getSecretVersion({
    secret: secretName,
    version: "latest",
  })
);

// Store full DATABASE_URL as a secret for Cloud Run to mount
const databaseUrlSecret = new gcp.secretmanager.Secret("database-url-secret", {
  secretId: "brief-database-url-dev",
  replication: { auto: {} },
});

new gcp.secretmanager.SecretVersion("database-url-version", {
  secret: databaseUrlSecret.id,
  secretData: pulumi.all([db.username, dbPassword, db.host, db.port, db.database]).apply(
    ([username, pw, host, port, database]) =>
      `postgresql://${username}:${pw.secretData}@${host}:${port}/${database}?sslmode=require`
  ),
});

// --- Artifact Registry ---

const registry = new gcp.artifactregistry.Repository("brief-registry", {
  repositoryId: "brief",
  location: "europe-west2",
  format: "DOCKER",
  description: "Docker images for Brief API",
});

// --- Cloud Run service (inline for native secret references) ---

const apiImage = "europe-west2-docker.pkg.dev/christopher-little-dev/brief/api:latest";
const serviceName = "brief-api-container-dev";

// Service account (logical name matches createContainer: "api-sa")
const serviceAccount = new gcp.serviceaccount.Account("api-sa", {
  accountId: serviceName.substring(0, 28),
  displayName: `Service account for ${serviceName}`,
});

// Grant secret accessor role to service account (stable names: "api-secret-access-{name}")
const member = pulumi.interpolate`serviceAccount:${serviceAccount.email}`;
for (const [name, secret] of Object.entries(allSecrets)) {
  new gcp.secretmanager.SecretIamMember(`api-secret-access-${name}`, {
    secretId: secret.secretArn,
    role: "roles/secretmanager.secretAccessor",
    member,
  });
}

// Grant secret accessor role to Cloud Run service agent (required for mounting secrets at revision creation)
const projectNumber = "10492061315";
const cloudRunAgent = `serviceAccount:service-${projectNumber}@serverless-robot-prod.iam.gserviceaccount.com`;
for (const [name, secret] of Object.entries(allSecrets)) {
  new gcp.secretmanager.SecretIamMember(`api-agent-secret-access-${name}`, {
    secretId: secret.secretArn,
    role: "roles/secretmanager.secretAccessor",
    member: cloudRunAgent,
  });
}

// Grant Cloud Run access to the database URL secret
new gcp.secretmanager.SecretIamMember("api-secret-access-database-url", {
  secretId: databaseUrlSecret.id,
  role: "roles/secretmanager.secretAccessor",
  member,
});

new gcp.secretmanager.SecretIamMember("api-agent-secret-access-database-url", {
  secretId: databaseUrlSecret.id,
  role: "roles/secretmanager.secretAccessor",
  member: cloudRunAgent,
});

// Cloud Run service (logical name: "api")
const api = new gcp.cloudrunv2.Service("api", {
  name: serviceName,
  location: "europe-west2",
  ingress: "INGRESS_TRAFFIC_ALL",
  deletionProtection: false,
  template: {
    serviceAccount: serviceAccount.email,
    labels: {
      environment: "dev",
      project: "brief",
      "managed-by": "palindrom-infra",
    },
    maxInstanceRequestConcurrency: 80,
    scaling: {
      minInstanceCount: 0,
      maxInstanceCount: 2,
    },
    containers: [{
      image: apiImage,
      ports: { containerPort: 8080 },
      resources: {
        limits: {
          cpu: "1",
          memory: "512Mi",
        },
        cpuIdle: true,
      },
      envs: [
        {
          name: "LLM_GATEWAY_URL",
          valueSource: { secretKeyRef: { secret: llmGatewayUrl.secretName, version: "latest" } },
        },
        {
          name: "OPENAI_API_KEY",
          valueSource: { secretKeyRef: { secret: openaiApiKey.secretName, version: "latest" } },
        },
        {
          name: "NOTION_API_KEY",
          valueSource: { secretKeyRef: { secret: notionApiKey.secretName, version: "latest" } },
        },
        {
          name: "NOTION_DATABASE_ID",
          valueSource: { secretKeyRef: { secret: notionDatabaseId.secretName, version: "latest" } },
        },
        {
          name: "SLACK_WEBHOOK_URL",
          valueSource: { secretKeyRef: { secret: slackWebhookUrl.secretName, version: "latest" } },
        },
        {
          name: "CLERK_SECRET_KEY",
          valueSource: { secretKeyRef: { secret: clerkSecretKey.secretName, version: "latest" } },
        },
        {
          name: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
          valueSource: { secretKeyRef: { secret: clerkPublishableKey.secretName, version: "latest" } },
        },
        {
          name: "LIVEKIT_API_KEY",
          valueSource: { secretKeyRef: { secret: livekitApiKey.secretName, version: "latest" } },
        },
        {
          name: "LIVEKIT_API_SECRET",
          valueSource: { secretKeyRef: { secret: livekitApiSecret.secretName, version: "latest" } },
        },
        {
          name: "LIVEKIT_URL",
          valueSource: { secretKeyRef: { secret: livekitUrl.secretName, version: "latest" } },
        },
        {
          name: "DEEPGRAM_API_KEY",
          valueSource: { secretKeyRef: { secret: deepgramApiKey.secretName, version: "latest" } },
        },
        {
          name: "DATABASE_URL",
          valueSource: { secretKeyRef: { secret: databaseUrlSecret.secretId, version: "latest" } },
        },
      ],
    }],
  },
  traffics: [{
    type: "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST",
    percent: 100,
  }],
});

// Public access (logical name: "api-invoker")
new gcp.cloudrunv2.ServiceIamMember("api-invoker", {
  name: api.name,
  location: "europe-west2",
  role: "roles/run.invoker",
  member: "allUsers",
});

// --- Cloud Scheduler cron jobs ---

// Calendar reminders — Wednesday 9am UK time (before Friday)
new gcp.cloudscheduler.Job("cron-calendar-reminders", {
  name: "brief-calendar-reminders-dev",
  region: "europe-west2",
  schedule: "0 9 * * 3",
  timeZone: "Europe/London",
  description: "Schedule Friday calendar reminders for all users",
  attemptDeadline: "300s",
  retryConfig: { retryCount: 2 },
  httpTarget: {
    httpMethod: "GET",
    uri: pulumi.interpolate`${api.uri}/v1/cron/calendar-reminders`,
  },
});

// Shame bot — 3 escalation levels per spec
// Friday 4pm (GENTLE), Sunday 6pm (MEDIUM), Monday 8am (FULL_ROAST)
new gcp.cloudscheduler.Job("cron-shame-friday", {
  name: "brief-shame-friday-dev",
  region: "europe-west2",
  schedule: "0 16 * * 5",
  timeZone: "Europe/London",
  description: "Shame bot gentle reminder",
  attemptDeadline: "300s",
  retryConfig: { retryCount: 2 },
  httpTarget: {
    httpMethod: "GET",
    uri: pulumi.interpolate`${api.uri}/v1/shame-bot`,
  },
});

new gcp.cloudscheduler.Job("cron-shame-sunday", {
  name: "brief-shame-sunday-dev",
  region: "europe-west2",
  schedule: "0 18 * * 0",
  timeZone: "Europe/London",
  description: "Shame bot medium escalation",
  attemptDeadline: "300s",
  retryConfig: { retryCount: 2 },
  httpTarget: {
    httpMethod: "GET",
    uri: pulumi.interpolate`${api.uri}/v1/shame-bot`,
  },
});

new gcp.cloudscheduler.Job("cron-shame-monday", {
  name: "brief-shame-monday-dev",
  region: "europe-west2",
  schedule: "0 8 * * 1",
  timeZone: "Europe/London",
  description: "Shame bot full roast",
  attemptDeadline: "300s",
  retryConfig: { retryCount: 2 },
  httpTarget: {
    httpMethod: "GET",
    uri: pulumi.interpolate`${api.uri}/v1/shame-bot`,
  },
});

// --- Exports ---

export const secrets = {
  llmGatewayUrl: llmGatewayUrl.secretName,
  openaiApiKey: openaiApiKey.secretName,
  notionApiKey: notionApiKey.secretName,
  notionDatabaseId: notionDatabaseId.secretName,
  slackWebhookUrl: slackWebhookUrl.secretName,
  clerkSecretKey: clerkSecretKey.secretName,
  clerkPublishableKey: clerkPublishableKey.secretName,
  livekitApiKey: livekitApiKey.secretName,
  livekitApiSecret: livekitApiSecret.secretName,
  livekitUrl: livekitUrl.secretName,
  deepgramApiKey: deepgramApiKey.secretName,
};

export const registryName = registry.name;
export const apiUrl = api.uri;
export const apiServiceName = api.name;
export const dbHost = db.host;
export const dbPort = db.port;
export const dbName = db.database;
