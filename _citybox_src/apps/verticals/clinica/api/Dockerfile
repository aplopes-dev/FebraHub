# Build a partir da raiz do monorepo (context: aplopes-city)
FROM node:24-alpine@sha256:fb71d01345f11b708a3553c66e7c74074f2d506400ea81973343d915cb64eef0 AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/verticals/clinica/api/package.json ./apps/verticals/clinica/api/
COPY apps/verticals/clinica/permissions/package.json ./apps/verticals/clinica/permissions/
COPY packages/messaging/package.json ./packages/messaging/
RUN pnpm install --frozen-lockfile --filter @citybox/clinica-api...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/verticals/clinica/api/node_modules ./apps/verticals/clinica/api/node_modules
COPY --from=deps /app/apps/verticals/clinica/permissions/node_modules ./apps/verticals/clinica/permissions/node_modules
COPY --from=deps /app/packages/messaging/node_modules ./packages/messaging/node_modules
ARG CACHEBUST=unknown
RUN echo "cachebust=${CACHEBUST}"
COPY . .
# messaging antes de clinica-permissions: role-catalog importa
# `@citybox/messaging/clinic-strand` (exports apontam para dist/).
RUN pnpm --filter @citybox/messaging build
RUN pnpm --filter @citybox/clinica-permissions build
WORKDIR /app/apps/verticals/clinica/api
RUN rm -rf generated
RUN pnpm exec prisma generate
RUN rm -rf dist tsconfig.tsbuildinfo && pnpm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NODE_PATH=/app/node_modules
WORKDIR /app/apps/verticals/clinica/api
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/verticals/clinica/permissions /app/apps/verticals/clinica/permissions
COPY --from=build /app/packages/messaging /app/packages/messaging
COPY --from=build /app/apps/verticals/clinica/api/dist ./dist
COPY --from=build /app/apps/verticals/clinica/api/node_modules ./node_modules
COPY --from=build /app/apps/verticals/clinica/api/package.json ./
COPY --from=build /app/apps/verticals/clinica/api/prisma ./prisma
COPY --from=build /app/apps/verticals/clinica/api/generated ./generated
EXPOSE 3172
# HTTP (padrão): node dist/src/main.js
# Worker store-setup: node dist/src/main-worker.js
CMD ["node", "dist/src/main.js"]
