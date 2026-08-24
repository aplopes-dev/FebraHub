# Build a partir da raiz do monorepo (context: aplopes-city)
FROM node:24-alpine@sha256:fb71d01345f11b708a3553c66e7c74074f2d506400ea81973343d915cb64eef0 AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/imoveis/api/package.json ./apps/imoveis/api/
COPY apps/imoveis/permissions/package.json ./apps/imoveis/permissions/
COPY packages/messaging/package.json ./packages/messaging/
RUN pnpm install --frozen-lockfile --filter @citybox/imoveis-api...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/imoveis/api/node_modules ./apps/imoveis/api/node_modules
COPY --from=deps /app/apps/imoveis/permissions/node_modules ./apps/imoveis/permissions/node_modules
COPY --from=deps /app/packages/messaging/node_modules ./packages/messaging/node_modules
ARG CACHEBUST=unknown
RUN echo "cachebust=${CACHEBUST}"
COPY . .
# messaging antes das permissions (exports → dist/); Keycloak provisioning é local (ADR C-17).
RUN pnpm --filter @citybox/messaging build
RUN pnpm --filter @citybox/imoveis-permissions build
WORKDIR /app/apps/imoveis/api
RUN rm -rf generated
RUN pnpm exec prisma generate
RUN rm -rf dist tsconfig.tsbuildinfo && pnpm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NODE_PATH=/app/node_modules
WORKDIR /app/apps/imoveis/api
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/imoveis/permissions /app/apps/imoveis/permissions
COPY --from=build /app/packages/messaging /app/packages/messaging
COPY --from=build /app/apps/imoveis/api/dist ./dist
COPY --from=build /app/apps/imoveis/api/node_modules ./node_modules
COPY --from=build /app/apps/imoveis/api/package.json ./
COPY --from=build /app/apps/imoveis/api/prisma ./prisma
COPY --from=build /app/apps/imoveis/api/generated ./generated
EXPOSE 3112
CMD ["node", "dist/src/main.js"]
