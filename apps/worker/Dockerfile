FROM node:22-alpine AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
ARG SCOPE=worker
RUN turbo prune --scope=@cron-saas/${SCOPE} --docker

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
COPY .gitignore .
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
ARG SCOPE=worker
RUN pnpm turbo build --filter=@cron-saas/${SCOPE}

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 workeruser
COPY --from=builder --chown=workeruser:nodejs /app /app
USER workeruser

CMD ["node", "apps/worker/dist/main.js"]
