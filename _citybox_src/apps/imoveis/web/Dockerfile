# Build a partir da raiz do monorepo (context: aplopes-city)
FROM node:24-alpine@sha256:fb71d01345f11b708a3553c66e7c74074f2d506400ea81973343d915cb64eef0 AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/imoveis/web/package.json ./apps/imoveis/web/
COPY apps/imoveis/permissions/package.json ./apps/imoveis/permissions/
COPY packages/mui/package.json ./packages/mui/
RUN pnpm install --frozen-lockfile --filter @citybox/imoveis-web...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/imoveis/web/node_modules ./apps/imoveis/web/node_modules
COPY --from=deps /app/apps/imoveis/permissions/node_modules ./apps/imoveis/permissions/node_modules
COPY --from=deps /app/packages/mui/node_modules ./packages/mui/node_modules
ARG CACHEBUST=unknown
RUN echo "cachebust=${CACHEBUST}"
COPY . .
ARG NEXT_PUBLIC_KEYCLOAK_ISSUER=https://auth.aplopes.com/realms/citybox-imoveis
ARG NEXT_PUBLIC_KEYCLOAK_CLIENT=imoveis-web
ARG NEXT_PUBLIC_BACKOFFICE_ORIGIN=https://imoveis.aplopes.com
ARG NEXT_PUBLIC_IMOVEIS_API_URL=https://imoveis.aplopes.com/api
ARG NEXT_PUBLIC_IMOVEIS_STORE_ID=
ARG NEXT_PUBLIC_APP_URL=https://imoveis.aplopes.com
ENV NEXT_PUBLIC_KEYCLOAK_ISSUER=$NEXT_PUBLIC_KEYCLOAK_ISSUER
ENV NEXT_PUBLIC_KEYCLOAK_CLIENT=$NEXT_PUBLIC_KEYCLOAK_CLIENT
ENV NEXT_PUBLIC_BACKOFFICE_ORIGIN=$NEXT_PUBLIC_BACKOFFICE_ORIGIN
ENV NEXT_PUBLIC_IMOVEIS_API_URL=$NEXT_PUBLIC_IMOVEIS_API_URL
ENV NEXT_PUBLIC_IMOVEIS_STORE_ID=$NEXT_PUBLIC_IMOVEIS_STORE_ID
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN pnpm --filter @citybox/imoveis-permissions build
RUN pnpm --filter @citybox/imoveis-web build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3111
ENV HOSTNAME=0.0.0.0
ENV IMOVEIS_API_URL=http://imoveis-api:3112/api
WORKDIR /app
COPY --from=build /app/apps/imoveis/web/.next/standalone ./
COPY --from=build /app/apps/imoveis/web/.next/static ./apps/imoveis/web/.next/static
EXPOSE 3111
CMD ["node", "apps/imoveis/web/server.js"]
