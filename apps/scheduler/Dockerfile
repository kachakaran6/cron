FROM node:20-alpine AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=@cron-saas/scheduler --docker

FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
COPY .gitignore .
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
RUN pnpm turbo build --filter=@cron-saas/scheduler

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 scheduser
USER scheduser

COPY --from=builder --chown=scheduser:nodejs /app/apps/scheduler/dist ./dist
COPY --from=builder --chown=scheduser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=scheduser:nodejs /app/apps/scheduler/package.json ./package.json

CMD ["node", "dist/main.js"]
