FROM node:22-alpine AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
ARG SCOPE=scheduler
RUN turbo prune --scope=@cron-saas/${SCOPE} --docker

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
COPY .gitignore .
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
ARG SCOPE=scheduler
RUN pnpm turbo build --filter=@cron-saas/${SCOPE}

FROM node:22-alpine AS runner
WORKDIR /app/apps/scheduler
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 scheduser
COPY --from=builder --chown=scheduser:nodejs /app /app
USER scheduser

CMD ["node", "dist/main.js"]
