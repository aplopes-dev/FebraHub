# postgres — infra

Postgres 17 + **pgvector** — banco transacional de desenvolvimento (`campinas_dev`). Em produção: instância dedicada por município (B-01). Porta host **15433**.

## Papel no monorepo

- **Todos apps transacionais** conectam via `DATABASE_URL` / tenancy.
- **Platform DB** `citybox_platform` no mesmo cluster dev; tenants adicionais (`ilheus_dev`, …) via scripts provision.

Postgres dedicado ao município de desenvolvimento `campinas_dev`. Em produção, uma instância por `municipalityId`.

## Subir

```bash
cp .env.example .env
docker compose up -d
```

## Conexão

```
postgresql://citybox:citybox@localhost:15433/campinas_dev
```

Hostname na rede `citybox-platform`: `citybox_postgres:5432`

## Volumes

- `citybox_postgres_data` — dados persistentes (não versionar)

## Extensões

- `uuid-ossp`, `pg_trgm` — busca e IDs
- `vector` (pgvector) — embeddings / RAG

Novos tenant DBs recebem as extensões via `scripts/bootstrap-tenant-db.sh`. Em volume já existente:

```bash
bash scripts/enable-pgvector.sh
```

## Versão

Imagem `pgvector/pgvector:pg17` (PostgreSQL 17 + pgvector). Atualize em `docker-compose.yml` com teste de migration Prisma.