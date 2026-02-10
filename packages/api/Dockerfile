# ---- Builder ----
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
WORKDIR /app

# Copy workspace root files needed for pnpm install
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy only the api package.json for dependency resolution
COPY packages/api/package.json packages/api/

# Install all dependencies (including devDependencies for tsc)
RUN pnpm install --frozen-lockfile --filter api... --ignore-scripts

# Copy api source and build
COPY packages/api/ packages/api/
RUN pnpm --filter api build

# ---- Runner ----
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
WORKDIR /app

# Copy workspace root files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/api/package.json packages/api/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --filter api... --prod --ignore-scripts

# Copy compiled output from builder
COPY --from=builder /app/packages/api/dist packages/api/dist

# Non-root user
RUN addgroup -S fastify && adduser -S fastify -G fastify
USER fastify

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "packages/api/dist/server.js"]
