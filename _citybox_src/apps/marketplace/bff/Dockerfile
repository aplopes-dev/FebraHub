# Build a partir da raiz do monorepo (context: citybox/)
FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/marketplace/bff/package.json ./apps/marketplace/bff/
RUN pnpm install --frozen-lockfile --filter @citybox/marketplace-bff...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/marketplace/bff/node_modules ./apps/marketplace/bff/node_modules
ARG CACHEBUST=unknown
RUN echo "cachebust=${CACHEBUST}"
COPY . .
WORKDIR /app/apps/marketplace/bff
RUN rm -rf src/generated/consumer && CONSUMER_DATABASE_URL=postgresql://build:build@localhost:5432/build pnpm exec prisma generate --schema prisma/consumer/schema.prisma
RUN rm -rf dist tsconfig.tsbuildinfo && pnpm run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app/apps/marketplace/bff
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/marketplace/bff/dist ./dist
COPY --from=build /app/apps/marketplace/bff/node_modules ./node_modules
COPY --from=build /app/apps/marketplace/bff/package.json ./
COPY --from=build /app/apps/marketplace/bff/prisma ./prisma
COPY --from=build /app/apps/marketplace/bff/prisma.config.ts ./
COPY --from=build /app/apps/marketplace/bff/scripts ./scripts
COPY --from=build /app/apps/marketplace/bff/src ./src
COPY --from=build /app/apps/marketplace/bff/tsconfig.json ./
EXPOSE 3102
CMD ["node", "dist/main.js"]
