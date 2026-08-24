# Build a partir da raiz do monorepo (context: citybox)
FROM node:24-alpine@sha256:fb71d01345f11b708a3553c66e7c74074f2d506400ea81973343d915cb64eef0 AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/verticals/beautiful/api/package.json ./apps/verticals/beautiful/api/
COPY apps/verticals/beautiful/permissions/package.json ./apps/verticals/beautiful/permissions/
COPY packages/messaging/package.json ./packages/messaging/
RUN pnpm install --frozen-lockfile --filter @citybox/beautiful-api...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/verticals/beautiful/api/node_modules ./apps/verticals/beautiful/api/node_modules
COPY --from=deps /app/apps/verticals/beautiful/permissions/node_modules ./apps/verticals/beautiful/permissions/node_modules
COPY --from=deps /app/packages/messaging/node_modules ./packages/messaging/node_modules
ARG CACHEBUST=unknown
RUN echo "cachebust=${CACHEBUST}"
COPY . .
RUN pnpm --filter @citybox/messaging build
RUN pnpm --filter @citybox/beautiful-permissions build
WORKDIR /app/apps/verticals/beautiful/api
RUN rm -rf generated
RUN pnpm exec prisma generate --config prisma.config.ts
RUN rm -rf dist tsconfig.tsbuildinfo && pnpm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NODE_PATH=/app/node_modules
WORKDIR /app/apps/verticals/beautiful/api
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/verticals/beautiful/permissions /app/apps/verticals/beautiful/permissions
COPY --from=build /app/packages/messaging /app/packages/messaging
COPY --from=build /app/apps/verticals/beautiful/api/dist ./dist
COPY --from=build /app/apps/verticals/beautiful/api/node_modules ./node_modules
COPY --from=build /app/apps/verticals/beautiful/api/package.json ./
COPY --from=build /app/apps/verticals/beautiful/api/prisma ./prisma
COPY --from=build /app/apps/verticals/beautiful/api/generated ./generated
EXPOSE 3173
CMD ["node", "dist/src/main.js"]
