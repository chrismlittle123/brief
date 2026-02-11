type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

type AppConfig = {
  name: string;
  port: number;
  host: string;
  logging: { level: LogLevel; pretty: boolean };
  docs: { title: string; description: string; version: string; path: string };
  clerkSecretKey: string;
  clerkPublishableKey: string;
  databaseUrl: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function loadConfig(): AppConfig {
  return {
    name: "brief-api",
    port: parseInt(process.env["PORT"] ?? "3001", 10),
    host: process.env["HOST"] ?? "0.0.0.0",
    logging: {
      level: (process.env["LOG_LEVEL"] ?? "info") as LogLevel,
      pretty: process.env["NODE_ENV"] !== "production",
    },
    docs: {
      title: "Brief API",
      description: "Brief weekly update API",
      version: "1.0.0",
      path: "/docs",
    },
    clerkSecretKey: requireEnv("CLERK_SECRET_KEY"),
    clerkPublishableKey:
      process.env["CLERK_PUBLISHABLE_KEY"] ??
      requireEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),
    databaseUrl: requireEnv("DATABASE_URL"),
  };
}
