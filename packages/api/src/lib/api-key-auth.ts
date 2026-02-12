import { AppError } from "@progression-labs/fastify-api";
import type { FastifyRequest } from "fastify";

export function requireApiKey(request: FastifyRequest): void {
  const key = request.headers["x-api-key"];
  const expected = process.env.AGENT_API_KEY;
  if (!expected || key !== expected) {
    throw AppError.forbidden("Invalid API key");
  }
}
