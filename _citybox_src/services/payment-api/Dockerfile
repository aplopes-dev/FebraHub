# Build a partir da raiz do monorepo (context: citybox)
FROM node:24-alpine@sha256:fb71d01345f11b708a3553c66e7c74074f2d506400ea81973343d915cb64eef0 AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY payment-api/package.json ./payment-api/
COPY packages/events/package.json ./packages/events/
COPY packages/messaging/package.json ./packages/messaging/
COPY packages/nest-common/package.json ./packages/nest-common/
COPY packages/database/package.json ./packages/database/
RUN pnpm install --frozen-lockfile --filter @citybox/payment-api...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/payment-api/node_modules ./payment-api/node_modules
COPY --from=deps /app/packages/events/node_modules ./packages/events/node_modules
COPY --from=deps /app/packages/messaging/node_modules ./packages/messaging/node_modules
COPY --from=deps /app/packages/nest-common/node_modules ./packages/nest-common/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY . .
ENV DATABASE_URL=postgresql://citybox:citybox@postgres:5432/citybox_payments
RUN pnpm --filter @citybox/events build
RUN pnpm --filter @citybox/messaging build
RUN pnpm --filter @citybox/nest-common build
RUN pnpm --filter @citybox/payment-api db:generate
RUN pnpm --filter @citybox/payment-api build

FROM base AS runner
# NODE_ENV=production: em Docker local, compose deve definir PAYMENT_API_IN_DOCKER=true
# para permitir webhooks HTTP internos (ex.: http://citybox_core_api:3101/...).
ENV NODE_ENV=production
ENV PORT=3106
WORKDIR /app/payment-api
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/payment-api/node_modules ./node_modules
COPY --from=build /app/packages/events /app/packages/events
COPY --from=build /app/packages/messaging /app/packages/messaging
COPY --from=build /app/packages/nest-common /app/packages/nest-common
COPY --from=build /app/packages/database /app/packages/database
COPY --from=build /app/payment-api/dist ./dist
COPY --from=build /app/payment-api/src/generated ./dist/generated
COPY --from=build /app/payment-api/package.json ./
COPY --from=build /app/payment-api/prisma ./prisma
COPY --from=build /app/payment-api/prisma.config.ts ./
EXPOSE 3106
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/main.js"]
