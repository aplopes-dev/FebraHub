# FebraHub — web (Next.js standalone)
#
# O standalone traz só o que o runtime precisa: sem node_modules inteiro,
# sem código-fonte, sem devDependency.

# ---------- 1. dependências ----------
FROM node:22.14-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY patches ./patches
COPY apps/web-legado/package.json apps/web-legado/
RUN pnpm install --filter @febrahub/web-legado... --frozen-lockfile

# ---------- 2. build ----------
FROM node:22.14-alpine AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web-legado/node_modules ./apps/web-legado/node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY patches ./patches
COPY apps/web-legado ./apps/web-legado

# Variável NEXT_PUBLIC_ entra no bundle em tempo de build: precisa existir
# aqui, não no runtime. É caminho relativo (/api), não segredo.
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

# API_INTERNAL_URL é lida pelo next.config.ts em BUILD-TIME para gerar os
# rewrites. Em standalone o config não existe em runtime — os rewrites ficam
# compilados no routes-manifest.json. Sem este ARG/ENV o bloco de rewrites
# retorna [] e /api/* nunca chega na API NestJS.
ARG API_INTERNAL_URL=http://api:3261
ENV API_INTERNAL_URL=$API_INTERNAL_URL

WORKDIR /app/apps/web-legado
RUN npx next build

# ---------- 3. runtime ----------
FROM node:22.14-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3260
ENV HOSTNAME=0.0.0.0
ENV TZ=America/Bahia
RUN apk add --no-cache tzdata && \
    addgroup -S febra && adduser -S febra -G febra

# O standalone já vem com o servidor e as dependências que ele usa.
COPY --from=build --chown=febra:febra /app/apps/web-legado/.next/standalone ./
COPY --from=build --chown=febra:febra /app/apps/web-legado/.next/static ./apps/web-legado/.next/static
COPY --from=build --chown=febra:febra /app/apps/web-legado/public ./apps/web-legado/public

USER febra
EXPOSE 3260
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3260/api/saude',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "apps/web-legado/server.js"]
