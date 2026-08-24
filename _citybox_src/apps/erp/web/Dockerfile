FROM node:24-alpine@sha256:fb71d01345f11b708a3553c66e7c74074f2d506400ea81973343d915cb64eef0 AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/erp/web/package.json ./apps/erp/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/mui/package.json ./packages/mui/
RUN pnpm install --frozen-lockfile --filter @citybox/erp-web...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/erp/web/node_modules ./apps/erp/web/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=deps /app/packages/mui/node_modules ./packages/mui/node_modules
ARG CACHEBUST=unknown
RUN echo "cachebust=${CACHEBUST}"
COPY . .
ARG NEXT_PUBLIC_KEYCLOAK_ISSUER=https://auth.aplopes.com/realms/citybox-erp
ARG NEXT_PUBLIC_KEYCLOAK_CLIENT=erp-web
ARG NEXT_PUBLIC_BACKOFFICE_ORIGIN=https://backoffice.aplopes.com
ENV NEXT_PUBLIC_KEYCLOAK_ISSUER=$NEXT_PUBLIC_KEYCLOAK_ISSUER
ENV NEXT_PUBLIC_KEYCLOAK_CLIENT=$NEXT_PUBLIC_KEYCLOAK_CLIENT
ENV NEXT_PUBLIC_BACKOFFICE_ORIGIN=$NEXT_PUBLIC_BACKOFFICE_ORIGIN
RUN pnpm --filter @citybox/erp-web build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3107
ENV ERP_API_URL=http://erp-api:3114/api
WORKDIR /app
COPY --from=build /app/apps/erp/web/.next/standalone ./
COPY --from=build /app/apps/erp/web/.next/static ./apps/erp/web/.next/static
EXPOSE 3107
CMD ["node", "apps/erp/web/server.js"]
