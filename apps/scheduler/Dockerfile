# Stage 1: Build packages & Scheduler
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @cron-saas/shared build
RUN pnpm --filter @cron-saas/database build
RUN pnpm --filter @cron-saas/scheduler build

# Stage 2: Production Runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 scheduser
COPY --from=builder --chown=scheduser:nodejs /app /app
USER scheduser
WORKDIR /app/apps/scheduler
CMD ["node", "dist/main.js"]
