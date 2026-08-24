# metabase — infra

Metabase 0.53 — **BI/DRE** sobre réplica (C-08). Porta **13002**.

## Papel no monorepo

- **Operadores e lojistas:** dashboards GMV, categorias, churn.
- **Somente schema public** — dados verticais ficam fora da réplica analítica.

BI e DRE sobre réplica de leitura. Metadados do Metabase ficam no Postgres interno desta pasta.

## Subir

```bash
cp .env.example .env
docker compose up -d
```

UI: http://localhost:13002

No primeiro acesso, conecte a fonte:

| Campo | Dev |
|-------|-----|
| Host | `host.docker.internal` |
| Porta | `15433` |
| Database | `campinas_dev` |
| User | `citybox_readonly` |

Em produção, aponte para `citybox_postgres_replica` na rede `citybox-platform`.

## Volumes

- `citybox_metabase_data` — configuração e cache
- `citybox_metabase_db_data` — app DB do Metabase