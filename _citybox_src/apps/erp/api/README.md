# ERP Comércio · api (`@citybox/erp-api`)

Backend do backoffice de comércio Citybox — NestJS 11, Clean Architecture por módulo, Prisma 7 (schema `erp_comercio`), Zod (domínio) + class-validator (HTTP).

Scaffold: ainda **sem módulos de negócio** — só a estrutura base (`shared/core`, `shared/domain`, `shared/infra`) pronta para o primeiro módulo. Ver [`AGENTS.md`](AGENTS.md).

## Dev

```bash
cp .env.example .env   # já existe um .env local pronto neste scaffold
pnpm --filter @citybox/erp-api dev
# http://127.0.0.1:3114/api/health
```

Precisa do Postgres local rodando (`pnpm infra:up:postgres` na raiz) — o `PrismaModule` é global e conecta no `onModuleInit`.

## Scripts

```bash
pnpm --filter @citybox/erp-api dev              # nest start --watch (roda prisma generate antes)
pnpm --filter @citybox/erp-api build             # nest build
pnpm --filter @citybox/erp-api typecheck         # tsc --noEmit
pnpm --filter @citybox/erp-api lint               # eslint --fix
pnpm --filter @citybox/erp-api db:generate        # prisma generate
pnpm --filter @citybox/erp-api db:migrate:dev     # prisma migrate dev
```

## Estrutura

Clean Architecture por módulo (`domain` / `application` / `infrastructure`), mesmo padrão de `apps/verticals/food/api`. Ver `AGENTS.md` para o guia completo de como adicionar o primeiro módulo.
