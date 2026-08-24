# Deploy produção aplopes.com

Comando único na raiz do monorepo:

```bash
pnpm run deploy:prod
```

Equivalente a `bash scripts/deploy/aplopes-production.sh`.

## Reset local / fresh (devs)

Para zerar Keycloak + database `citybox` e já criar o usuário do **admin-web**:

```bash
pnpm reset:multirealm -- --yes
# custom: --email=voce@empresa.com --password='SuaSenhaForte1!'
# VPS aplopes: --target=prod
```

Script: `scripts/dev/reset-multirealm.sh`. Ao final ele imprime o checklist para
atualizar os `.env` (issuers `citybox-*`, clients `*-web`, secrets `*-dev-secret`
em localhost).

## Modelo de banco

Um único database PostgreSQL **`citybox`**. Cada API usa um schema:

| API | Schema | URL (exemplo Docker) |
|-----|--------|----------------------|
| admin-api | `platform` | `postgresql://aplopes:aplopes@aplopes_postgres:5432/citybox?schema=platform` |
| erp-api | `erp` | `postgresql://aplopes:aplopes@aplopes_postgres:5432/citybox?schema=erp` |
| clinica-api | `clinica` | `postgresql://aplopes:aplopes@aplopes_postgres:5432/citybox?schema=clinica` |
| imoveis-api | `imoveis` | `postgresql://aplopes:aplopes@aplopes_postgres:5432/citybox?schema=imoveis` |

Migrations rodam no **host** via `127.0.0.1:15433` (porta publicada do `aplopes_postgres`).

## Pré-requisitos

1. Docker e pnpm instalados no servidor
2. Rede Docker `aplopes-platform` (criada automaticamente pelo script)
3. Arquivo de ambiente:

```bash
cp services/platform-apps.env.example services/platform-apps.env
# Edite secrets (SMTP, Keycloak, etc.)
```

4. Infra local (opcional na primeira vez — o script copia `services/infra/.env.example` → `.env`):

```bash
cp services/infra/.env.example services/infra/.env
```

## O que o deploy faz

```
[1/5] Preflight (docker, pnpm, platform-apps.env, rede)
[2/5] Infra (postgres citybox, redis, rabbitmq, typesense, minio)
[3/5] Provision citybox + migrations + seeds (platform → erp → clinica → imoveis)
[4/5] Keycloak + admin-api/web + erp-api/web + clinica-api (+worker) + clinica-web + imoveis-api + imoveis-web
[5/5] Health checks (local + HTTPS aplopes.com)
```

**Fora do escopo de produção:** `food-api` / `varejo-api` (código legado no monorepo; containers são parados se ainda existirem), marketplace-api, workers (core), payment-api.

**Seeds:** após as migrations, o deploy roda `db:generate` + `db:seed` em cada API que tiver `prisma/seed.ts` (hoje: platform, clinica). Seeds idempotentes são seguros em re-deploy.

**Workers store-setup:** `clinica_api_worker` consome `citybox.store.#` (fila `clinic.store-setup`). Sem o worker da clínica, criar loja no admin **não** aplica o seed first-contact no schema `clinica`. A `imoveis-api` consome `imoveis.store-setup` no próprio processo da API.

## Flags

```bash
pnpm run deploy:prod -- --skip-infra        # infra já está rodando
pnpm run deploy:prod -- --skip-migrations   # só rebuild/restart apps (pula migrations e seeds)
pnpm run deploy:prod -- --skip-build        # docker compose up -d sem build
pnpm run deploy:prod -- --no-cache          # build sem cache Docker (mais lento; força rebuild total)
```

Por padrão, cada build passa `CACHEBUST=<git HEAD>` para invalidar a camada `COPY` quando o código muda. Isso evita publicar imagens antigas com `docker compose build` em cache stale.

## Migração de dados legados (VPS)

Se o Postgres ainda tiver databases antigos (`aplopes_platform`, `ilheus_dev`):

1. Faça **backup** antes de qualquer alteração
2. Migre schemas para `citybox` manualmente, por exemplo:

```bash
# Exemplo ilustrativo — adapte ao estado real do servidor
pg_dump -h 127.0.0.1 -p 15433 -U aplopes -n platform aplopes_platform | \
  psql -h 127.0.0.1 -p 15433 -U aplopes -d citybox
```

3. Atualize `services/platform-apps.env` com URLs `citybox?schema=*`
4. Rode `pnpm run deploy:prod`

O script **não** renomeia databases automaticamente para evitar perda de dados.

## Estrutura

```
scripts/deploy/
  aplopes-production.sh              # entrypoint (deploy completo)
  aplopes-erp.sh                     # deploy parcial: erp-api + erp-web
  aplopes-clinic.sh                  # deploy parcial: clinica-api/web + erp
  aplopes-imoveis-admin-clinica.sh   # deploy parcial: admin + clinica + imoveis
  lib/
    common.sh                 # preflight, env
    infra.sh                  # services/infra/docker-compose.yml
    provision-citybox-db.sh   # CREATE DATABASE citybox + extensões
    migrations.sh             # prisma migrate deploy + seeds
    seeds.sh                  # db:seed por API (se prisma/seed.ts existir)
    apps.sh                   # Keycloak + admin + erp + clinica + imoveis
    health.sh                 # curls finais

services/infra/docker-compose.yml
services/platform/docker-compose.yml
apps/verticals/clinica/infra/docker-compose.yml
apps/imoveis/infra/docker-compose.yml
```

## Troubleshooting

| Sintoma | Verificação |
|---------|-------------|
| App desatualizada após deploy | Rode sem `--skip-build`. Se persistir: `pnpm run deploy:prod -- --no-cache`. Confira `docker images` (Created) e logs da API (rotas novas). |
| 500 em stores / API | `docker ps` — `aplopes_postgres` healthy? `DATABASE_URL` aponta para `/citybox?schema=platform`? |
| imoveis_api sem DB | `docker inspect imoveis_api` — `DATABASE_URL` com `citybox?schema=imoveis` |
| RabbitMQ não sobe | mount em `infra/rabbitmq/config/`; logs `docker logs aplopes_rabbitmq` |
| MinIO porta em uso | ajuste `MINIO_API_PORT` em `services/infra/.env` (padrão 9002 no host) |
| Volumes ausentes | script cria `aplopes_*_data`; em VPS existente use `external: true` |
| `prisma` not found (clinica-api) | o deploy roda `pnpm install` antes das migrations; após `git pull`, rode `pnpm install` manualmente se pular migrations |
| Upload de imagem 503 (`StorageUnavailableError`) | `MINIO_ENDPOINT` deve ser `minio:9000` (service name), **não** `aplopes_minio` — underscore quebra o SDK S3. Confira bucket via `mc ls local/` na rede `aplopes-platform`. |
| Seed falha (`generated/prisma ... doesn't look like a generated Prisma Client`) | Pasta `generated/prisma` incompleta no host — o deploy remove e regenera antes do seed. Rode de novo ou: `rm -rf apps/verticals/clinica/api/generated/prisma && pnpm --filter @citybox/clinica-api db:generate` |
| Clínica criada sem planos/anamneses/seed | Confirme `docker ps` tem `clinica_api_worker` e `rabbitmqctl list_queues -p citybox` mostra `clinic.store-setup` com `consumers=1`. Sem worker o evento `citybox.store.created.v1` se perde. Reprocesse: `docker compose … up -d worker` e republicar o evento ou `POST /api/v1/store-setup/:storeId/retry` (após espelho em `clinic_stores`). |
| `imoveis-api → 000` no health | Cold start Nest — o deploy agora faz poll até ~48s. Confira `docker logs imoveis_api`. |
| Catálogo `/agents/:slug` → 404 Next | Confirme que o corretor existe em `imoveis.team_members` (`agent_id` = slug, `active=true`). A API resolve a loja no banco via `/v1/public/agents/:slug` (não depende mais de `IMOVEIS_STORE_ID` único). |

## Nginx

O reverse proxy do host (sites em `/etc/nginx/sites-enabled/`) não faz parte deste compose.
Após deploy, os vhosts relevantes apontam para:

| Host | Upstream |
|------|----------|
| `admin.aplopes.com` | `127.0.0.1:3108` (admin-web) |
| `backoffice.aplopes.com` | `127.0.0.1:3107` (erp-web) |
| `clinica.aplopes.com` | `127.0.0.1:3113` (clinica-web) |
| `imoveis.aplopes.com` | `127.0.0.1:3111` (imoveis-web); `/api/v1` + `/api/health` → `:3112` (imoveis-api). Template: `infra/nginx/host/imoveis.aplopes.com.conf` |
| `auth.aplopes.com` | Keycloak |

Recarregue o nginx do host se alterar vhosts (`nginx -t && systemctl reload nginx`).

## Deploy parcial ERP

```bash
pnpm run deploy:prod:erp                    # erp-api :3114 + erp-web :3107
pnpm run deploy:prod:erp -- --skip-migrations
pnpm run deploy:prod:erp -- --skip-build
pnpm run deploy:prod:erp -- --no-cache
```

Não sobe Keycloak, admin-api/web, clínica nem imóveis. Pré-requisito: infra já rodando (ex.: após `pnpm run deploy:prod` completo).

## Deploy parcial clínica

```bash
pnpm run deploy:prod:clinic              # api + worker + web + ERP
pnpm run deploy:prod:clinic -- --web-only
pnpm run deploy:prod:clinic -- --api-only
pnpm run deploy:prod:clinic -- --erp-only
```

## Deploy parcial admin + clínica + imóveis

```bash
pnpm run deploy:prod:imoveis-admin-clinica
pnpm run deploy:prod:imoveis-admin-clinica -- --imoveis-only
pnpm run deploy:prod:imoveis-admin-clinica -- --admin-only
pnpm run deploy:prod:imoveis-admin-clinica -- --clinica-only
pnpm run deploy:prod:imoveis-admin-clinica -- --imoveis-only --api-only   # só imoveis-api (health não exige web)
pnpm run deploy:prod:imoveis-admin-clinica -- --imoveis-only --web-only   # só imoveis-web
```

> Health checks respeitam `--admin-only` / `--clinica-only` / `--imoveis-only` e `--api-only` / `--web-only` (não falham checando serviços que o deploy não subiu).

## Script legado

`services/platform/scripts/deploy-production.sh` redireciona para este entrypoint (deprecated).
