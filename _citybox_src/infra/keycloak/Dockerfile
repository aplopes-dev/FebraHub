# ---- Stage 1: Build Keycloakify theme ----
FROM node:22-bookworm-slim AS theme-builder

# keycloakify build requires Java + Maven
RUN apt-get update && \
    apt-get install -y --no-install-recommends default-jdk-headless maven && \
    rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /workspace

# Workspace config + lockfile (cached layer)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Only the packages in keycloak-theme's dep chain (@citybox/mui desde a
# migração para MUI — o tema não depende mais de @citybox/ui)
COPY packages/mui/ packages/mui/
COPY packages/tsconfig/ packages/tsconfig/
COPY infra/keycloak/theme/ infra/keycloak/theme/

# Install deps for keycloak-theme + its workspace deps (@citybox/mui)
RUN pnpm install --frozen-lockfile --filter "@citybox/keycloak-theme..."

# Build (vite build + keycloakify build with Maven)
RUN pnpm --filter @citybox/keycloak-theme build-keycloak-theme

# ---- Stage 2: Keycloak with built theme ----
FROM quay.io/keycloak/keycloak:26.6.0

COPY --from=theme-builder /workspace/infra/keycloak/theme/dist_keycloak/*.jar /opt/keycloak/providers/
