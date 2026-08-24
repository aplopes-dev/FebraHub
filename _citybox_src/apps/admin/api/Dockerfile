# Build a partir da raiz do monorepo (context: aplopes-city)
FROM node:24-alpine@sha256:fb71d01345f11b708a3553c66e7c74074f2d506400ea81973343d915cb64eef0 AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin/api/package.json ./apps/admin/api/
COPY packages/messaging/package.json ./packages/messaging/
RUN pnpm install --frozen-lockfile --filter @citybox/admin-api...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/admin/api/node_modules ./apps/admin/api/node_modules
COPY --from=deps /app/packages/messaging/node_modules ./packages/messaging/node_modules
ARG CACHEBUST=unknown
RUN echo "cachebust=${CACHEBUST}"
COPY . .
RUN pnpm --filter @citybox/messaging build
WORKDIR /app/apps/admin/api
RUN rm -rf generated
RUN pnpm exec prisma generate
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3103
WORKDIR /app/apps/admin/api
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/admin/api/node_modules ./node_modules
COPY --from=build /app/packages/messaging /app/packages/messaging
COPY --from=build /app/apps/admin/api/dist ./dist
COPY --from=build /app/apps/admin/api/generated ./generated
COPY --from=build /app/apps/admin/api/package.json ./
EXPOSE 3103
CMD ["node", "dist/src/main.js"]
