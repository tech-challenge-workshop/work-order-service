# Base
FROM node:24-alpine AS base
WORKDIR /app

RUN corepack enable pnpm

# Dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate && pnpm build && pnpm prune --prod

# Migrator — carries the Prisma CLI and the migrations, which the runtime stage
# deliberately drops. Run as a Job before the rollout, never as an init
# container: with an HPA there would be N replicas racing for the same lock.
FROM base AS migrator
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
# prisma.config.ts is where Prisma 7 reads datasource.url from; without it
# `migrate deploy` refuses to run even with DATABASE_URL in the environment.
COPY package.json prisma.config.ts ./
COPY prisma ./prisma
USER node
CMD ["pnpm", "prisma", "migrate", "deploy"]

# Runtime
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/main"]
