# ==============================================================================
# TinyRide Admin Web Console Dockerfile
# Company: Dodail Solutions Private Limited
# ==============================================================================

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.23.0 --activate
WORKDIR /app

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/admin-web/ ./apps/admin-web/

RUN pnpm --filter @tinyride/admin-web... install --frozen-lockfile
RUN pnpm --filter @tinyride/shared-types build && \
    pnpm --filter @tinyride/shared-validation build && \
    pnpm --filter @tinyride/design-system build && \
    pnpm --filter @tinyride/admin-web build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
USER node

COPY --chown=node:node --from=builder /app/apps/admin-web ./
EXPOSE 3001
CMD ["pnpm", "start"]
