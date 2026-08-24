FROM node:24-alpine@sha256:fb71d01345f11b708a3553c66e7c74074f2d506400ea81973343d915cb64eef0 AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/verticals/clinica/web/package.json ./apps/verticals/clinica/web/
COPY apps/verticals/clinica/permissions/package.json ./apps/verticals/clinica/permissions/
COPY packages/messaging/package.json ./packages/messaging/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --frozen-lockfile --filter @citybox/clinica-web...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/verticals/clinica/web/node_modules ./apps/verticals/clinica/web/node_modules
COPY --from=deps /app/apps/verticals/clinica/permissions/node_modules ./apps/verticals/clinica/permissions/node_modules
COPY --from=deps /app/packages/messaging/node_modules ./packages/messaging/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
ARG CACHEBUST=unknown
RUN echo "cachebust=${CACHEBUST}"
COPY . .
ARG NEXT_PUBLIC_KEYCLOAK_ISSUER=https://auth.aplopes.com/realms/citybox-clinica
ARG NEXT_PUBLIC_KEYCLOAK_CLIENT=clinica-web
ARG NEXT_PUBLIC_BACKOFFICE_ORIGIN=https://clinica.aplopes.com
ENV NEXT_PUBLIC_KEYCLOAK_ISSUER=$NEXT_PUBLIC_KEYCLOAK_ISSUER
ENV NEXT_PUBLIC_KEYCLOAK_CLIENT=$NEXT_PUBLIC_KEYCLOAK_CLIENT
ENV NEXT_PUBLIC_BACKOFFICE_ORIGIN=$NEXT_PUBLIC_BACKOFFICE_ORIGIN
# messaging antes de clinica-permissions (clinic-strand em dist/).
RUN pnpm --filter @citybox/messaging build
RUN pnpm --filter @citybox/clinica-permissions build
RUN pnpm --filter @citybox/clinica-web build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3113
ENV CLINICA_API_URL=http://api:3172/api
ENV HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /app/apps/verticals/clinica/web/.next/standalone ./
COPY --from=build /app/apps/verticals/clinica/web/.next/static ./apps/verticals/clinica/web/.next/static
EXPOSE 3113
CMD ["node", "apps/verticals/clinica/web/server.js"]
