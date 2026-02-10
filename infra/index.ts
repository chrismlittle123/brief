import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";
import { defineConfig, createSecret } from "@palindrom-ai/infra";

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

const allSecrets = [
  llmGatewayUrl,
  openaiApiKey,
  notionApiKey,
  notionDatabaseId,
  slackWebhookUrl,
  clerkSecretKey,
  clerkPublishableKey,
];

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

// Grant secret accessor role to service account (logical names: "api-secret-access-{N}")
const member = pulumi.interpolate`serviceAccount:${serviceAccount.email}`;
allSecrets.forEach((secret, index) => {
  new gcp.secretmanager.SecretIamMember(`api-secret-access-${index}`, {
    secretId: secret.secretArn,
    role: "roles/secretmanager.secretAccessor",
    member,
  });
});

// Grant secret accessor role to Cloud Run service agent (required for mounting secrets at revision creation)
const projectNumber = "10492061315";
const cloudRunAgent = `serviceAccount:service-${projectNumber}@serverless-robot-prod.iam.gserviceaccount.com`;
allSecrets.forEach((secret, index) => {
  new gcp.secretmanager.SecretIamMember(`api-agent-secret-access-${index}`, {
    secretId: secret.secretArn,
    role: "roles/secretmanager.secretAccessor",
    member: cloudRunAgent,
  });
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

// --- Exports ---

export const secrets = {
  llmGatewayUrl: llmGatewayUrl.secretName,
  openaiApiKey: openaiApiKey.secretName,
  notionApiKey: notionApiKey.secretName,
  notionDatabaseId: notionDatabaseId.secretName,
  slackWebhookUrl: slackWebhookUrl.secretName,
  clerkSecretKey: clerkSecretKey.secretName,
  clerkPublishableKey: clerkPublishableKey.secretName,
};

export const registryName = registry.name;
export const apiUrl = api.uri;
export const apiServiceName = api.name;
