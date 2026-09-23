# ==============================================================================
# TinyRide API Production Dockerfile
# Company: Dodail Solutions Private Limited
# Monorepo: NestJS Modular Monolith
# ==============================================================================

# Stage 1: Base image with pnpm enabled
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.23.0 --activate
WORKDIR /app

# Stage 2: Dependencies and build
FROM base AS builder
WORKDIR /app

# Copy root monorepo manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# Copy packages and api application
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install dependencies for API and dependent packages
RUN pnpm --filter @tinyride/api... install --frozen-lockfile

# Build shared packages and NestJS backend
RUN pnpm --filter @tinyride/shared-types build && \
    pnpm --filter @tinyride/shared-validation build && \
    pnpm --filter @tinyride/design-system build && \
    pnpm --filter @tinyride/api build

# Prune dev dependencies for lean production container
RUN pnpm --filter @tinyride/api... --prod deploy /app/deploy

# Stage 3: Minimal hardened production runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Security: run as unprivileged user
USER node

# Copy deployed standalone bundle
COPY --chown=node:node --from=builder /app/deploy ./

# Expose HTTP port
EXPOSE 3000

# Container health probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health/liveness || exit 1

# Launch NestJS production entrypoint
CMD ["node", "dist/main.js"]
