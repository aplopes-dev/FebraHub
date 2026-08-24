# Build a partir da raiz do monorepo (context: aplopes-city)
FROM node:24-alpine@sha256:fb71d01345f11b708a3553c66e7c74074f2d506400ea81973343d915cb64eef0 AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/marketplace/api/package.json ./apps/marketplace/api/
COPY packages/messaging/package.json ./packages/messaging/
RUN pnpm install --frozen-lockfile --filter @citybox/marketplace-api...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/marketplace/api/node_modules ./apps/marketplace/api/node_modules
COPY --from=deps /app/packages/messaging/node_modules ./packages/messaging/node_modules
COPY . .
RUN pnpm --filter @citybox/messaging build
WORKDIR /app/apps/marketplace/api
RUN pnpm db:generate && pnpm db:generate:tenant

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3101
WORKDIR /app/apps/marketplace/api
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/marketplace/api/node_modules ./node_modules
COPY --from=build /app/packages/messaging /app/packages/messaging
COPY --from=build /app/apps/marketplace/api/src ./src
COPY --from=build /app/apps/marketplace/api/prisma ./prisma
COPY --from=build /app/apps/marketplace/api/tsconfig.json ./tsconfig.json
COPY --from=build /app/packages/tsconfig /app/packages/tsconfig
COPY --from=build /app/apps/marketplace/api/package.json ./package.json
EXPOSE 3101
# Runtime via tsx (ESM, mesmo modo do dev) — o build CJS (tsconfig.docker) e
# incompativel com o client Prisma 7 gerado (import.meta em client.ts).
CMD ["./node_modules/.bin/tsx", "src/main.ts"]
