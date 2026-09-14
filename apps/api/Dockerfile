# Stage 1: Build packages & NestJS API
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @cron-saas/shared build
RUN pnpm --filter @cron-saas/database build
RUN pnpm --filter @cron-saas/api build

# Stage 2: Production Runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
COPY --from=builder --chown=nestjs:nodejs /app /app
USER nestjs
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/main.js"]
