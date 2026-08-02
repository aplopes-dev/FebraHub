# FebraHub — API (NestJS + Prisma)
#
# Quatro estágios: dependências, build, dependências de produção, runtime.
# O runtime não tem toolchain nem devDependency, e roda como usuário próprio.

# ---------- 1. dependências ----------
FROM node:22.14-alpine AS deps
WORKDIR /app
RUN corepack enable
# O argon2 tem parte nativa; sem estas ferramentas o node-gyp falha na Alpine.
RUN apk add --no-cache python3 make g++ openssl
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY patches ./patches
COPY apps/api/package.json apps/api/
RUN pnpm install --filter @febrahub/api... --frozen-lockfile

# ---------- 2. build ----------
FROM node:22.14-alpine AS build
WORKDIR /app
RUN corepack enable && apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY patches ./patches
COPY apps/api ./apps/api
WORKDIR /app/apps/api
# O client do Prisma é gerado antes do tsc: o build importa os tipos dele.
RUN npx prisma generate
RUN npx nest build

# ---------- 3. dependências de produção ----------
FROM node:22.14-alpine AS prod-deps
WORKDIR /app
RUN corepack enable && apk add --no-cache python3 make g++ openssl
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY patches ./patches
COPY apps/api/package.json apps/api/
RUN pnpm install --filter @febrahub/api... --prod --frozen-lockfile
# O client é gerado de novo aqui em vez de copiado do estágio de build: com
# pnpm ele nasce dentro do store (node_modules/.pnpm/@prisma+client@.../),
# não em apps/api/node_modules/.prisma, e copiar o caminho errado quebra o
# build sem dizer por quê. Gerar custa segundos e sempre acerta o lugar.
COPY apps/api/prisma ./apps/api/prisma
WORKDIR /app/apps/api
RUN npx prisma generate

# ---------- 4. runtime ----------
FROM node:22.14-alpine AS runtime
WORKDIR /app/apps/api
ENV NODE_ENV=production
ENV TZ=America/Bahia
RUN apk add --no-cache openssl tzdata && \
    addgroup -S febra && adduser -S febra -G febra

COPY --from=prod-deps --chown=febra:febra /app/node_modules /app/node_modules
COPY --from=prod-deps --chown=febra:febra /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=prod-deps --chown=febra:febra /app/package.json /app/pnpm-workspace.yaml /app/
COPY --from=build --chown=febra:febra /app/apps/api/dist ./dist
COPY --from=build --chown=febra:febra /app/apps/api/package.json ./package.json
# As migrations vão junto: o deploy roda `prisma migrate deploy` deste container.
COPY --from=build --chown=febra:febra /app/apps/api/prisma ./prisma

USER febra
EXPOSE 3261
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3261/api/health/live',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/main.js"]
