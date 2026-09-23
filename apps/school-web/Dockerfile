# ==============================================================================
# TinyRide School Web Portal Dockerfile
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
COPY apps/school-web/ ./apps/school-web/

RUN pnpm --filter @tinyride/school-web... install --frozen-lockfile
RUN pnpm --filter @tinyride/shared-types build && \
    pnpm --filter @tinyride/shared-validation build && \
    pnpm --filter @tinyride/design-system build && \
    pnpm --filter @tinyride/school-web build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002
USER node

COPY --chown=node:node --from=builder /app/apps/school-web ./
EXPOSE 3002
CMD ["pnpm", "start"]
