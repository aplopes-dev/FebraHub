FROM node:24-alpine@sha256:fb71d01345f11b708a3553c66e7c74074f2d506400ea81973343d915cb64eef0 AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin/web/package.json ./apps/admin/web/
COPY packages/messaging/package.json ./packages/messaging/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --frozen-lockfile --filter @citybox/admin-web...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/admin/web/node_modules ./apps/admin/web/node_modules
COPY --from=deps /app/packages/messaging/node_modules ./packages/messaging/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
ARG CACHEBUST=unknown
RUN echo "cachebust=${CACHEBUST}"
COPY . .
ARG NEXT_PUBLIC_KEYCLOAK_ISSUER=https://auth.aplopes.com/realms/citybox-admin
ARG NEXT_PUBLIC_KEYCLOAK_CLIENT=admin-web
ARG NEXT_PUBLIC_ADMIN_ORIGIN=https://admin.aplopes.com
ENV NEXT_PUBLIC_KEYCLOAK_ISSUER=$NEXT_PUBLIC_KEYCLOAK_ISSUER
ENV NEXT_PUBLIC_KEYCLOAK_CLIENT=$NEXT_PUBLIC_KEYCLOAK_CLIENT
ENV NEXT_PUBLIC_ADMIN_ORIGIN=$NEXT_PUBLIC_ADMIN_ORIGIN
# messaging antes do next build (clinic-strand em dist/).
RUN pnpm --filter @citybox/messaging build
RUN pnpm --filter @citybox/admin-web build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3108
ENV ADMIN_API_URL=http://127.0.0.1:3103/api
WORKDIR /app
COPY --from=build /app/apps/admin/web/.next/standalone ./
COPY --from=build /app/apps/admin/web/.next/static ./apps/admin/web/.next/static
EXPOSE 3108
CMD ["node", "apps/admin/web/server.js"]
