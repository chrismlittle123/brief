import { createApp, registerRoute } from "@palindrom/fastify-api";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { loadConfig } from "./config.js";
import { registerClerkAuth } from "./plugins/clerk-auth.js";
import { registerAllRoutes } from "./routes/index.js";

async function main() {
  const config = loadConfig();

  const app = await createApp({
    name: config.name,
    server: { port: config.port, host: config.host },
    db: { connectionString: config.databaseUrl },
    docs: config.docs,
    logging: config.logging,
  });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(multipart, { limits: { fileSize: 25 * 1024 * 1024 } });

  registerClerkAuth(app, {
    secretKey: config.clerkSecretKey,
    publishableKey: config.clerkPublishableKey,
  });

  registerAllRoutes(app, registerRoute);

  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  for (const signal of signals) {
    process.on(signal, async () => {
      await app.shutdown();
      process.exit(0);
    });
  }

  await app.start();
}

main().catch((err) => {
  process.stderr.write(`Failed to start server: ${err}\n`);
  process.exit(1);
});
