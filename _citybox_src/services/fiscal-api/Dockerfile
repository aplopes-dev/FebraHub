# Build a partir da raiz do monorepo (context: aplopes-city)
FROM node:24-alpine@sha256:fb71d01345f11b708a3553c66e7c74074f2d506400ea81973343d915cb64eef0 AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
# libxmljs2 compila um addon nativo via node-gyp (vendoriza o próprio libxml2 em
# vendor/libxml, então NÃO precisa de libxml2-dev — só do toolchain C/C++ + python3).
# Sem isto o `pnpm install` abaixo falha com "gyp ERR! stack Error: not found: make"
# e o serviço nem sobe: xsd-validator.ts está na cadeia de imports dos módulos.
# Fica só no estágio `deps` — o runner recebe apenas o node_modules já compilado.
RUN apk add --no-cache python3 make g++
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/fiscal-api/package.json ./services/fiscal-api/
RUN pnpm install --frozen-lockfile --filter @citybox/fiscal-api...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/fiscal-api/node_modules ./services/fiscal-api/node_modules
ARG CACHEBUST=unknown
RUN echo "cachebust=${CACHEBUST}"
COPY . .
WORKDIR /app/services/fiscal-api
RUN rm -rf generated
RUN pnpm exec prisma generate
RUN rm -rf dist tsconfig.tsbuildinfo && pnpm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NODE_PATH=/app/node_modules
WORKDIR /app/services/fiscal-api
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/services/fiscal-api/dist ./dist
COPY --from=build /app/services/fiscal-api/node_modules ./node_modules
COPY --from=build /app/services/fiscal-api/package.json ./
COPY --from=build /app/services/fiscal-api/prisma ./prisma
COPY --from=build /app/services/fiscal-api/generated ./generated
COPY --from=build /app/services/fiscal-api/resources ./resources
EXPOSE 3116
CMD ["node", "dist/src/main.js"]
