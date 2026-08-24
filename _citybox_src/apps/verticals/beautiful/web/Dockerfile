FROM node:24-alpine@sha256:fb71d01345f11b708a3553c66e7c74074f2d506400ea81973343d915cb64eef0 AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/verticals/beautiful/web/package.json ./apps/verticals/beautiful/web/
COPY apps/verticals/beautiful/permissions/package.json ./apps/verticals/beautiful/permissions/
COPY packages/mui/package.json ./packages/mui/
RUN pnpm install --frozen-lockfile --filter @citybox/beautiful-web...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/verticals/beautiful/web/node_modules ./apps/verticals/beautiful/web/node_modules
COPY --from=deps /app/apps/verticals/beautiful/permissions/node_modules ./apps/verticals/beautiful/permissions/node_modules
COPY --from=deps /app/packages/mui/node_modules ./packages/mui/node_modules
ARG CACHEBUST=unknown
ARG NEXT_PUBLIC_BACKOFFICE_ORIGIN=https://salao.aplopes.com
ARG NEXT_PUBLIC_KEYCLOAK_ISSUER=https://auth.aplopes.com/realms/citybox-beautiful
ARG NEXT_PUBLIC_KEYCLOAK_CLIENT=beautiful-web
RUN echo "cachebust=${CACHEBUST}"
ENV NEXT_PUBLIC_BACKOFFICE_ORIGIN=$NEXT_PUBLIC_BACKOFFICE_ORIGIN
ENV NEXT_PUBLIC_KEYCLOAK_ISSUER=$NEXT_PUBLIC_KEYCLOAK_ISSUER
ENV NEXT_PUBLIC_KEYCLOAK_CLIENT=$NEXT_PUBLIC_KEYCLOAK_CLIENT
COPY . .
RUN pnpm --filter @citybox/beautiful-permissions build
RUN pnpm --filter @citybox/beautiful-web build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3115
ENV HOSTNAME=0.0.0.0
ENV BEAUTIFUL_API_URL=http://api:3173/api
WORKDIR /app
COPY --from=build /app/apps/verticals/beautiful/web/.next/standalone ./
COPY --from=build /app/apps/verticals/beautiful/web/.next/static ./apps/verticals/beautiful/web/.next/static
EXPOSE 3115
CMD ["node", "apps/verticals/beautiful/web/server.js"]
