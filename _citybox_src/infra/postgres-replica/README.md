# postgres-replica — infra

Réplica de **leitura** para analytics (C-08). Dev: instância separada :15434 simulando replicação.

## Papel no monorepo

- **Metabase** consulta somente aqui — zero carga no transacional.
- **BI:** DRE e dashboards; schemas verticais **não** replicados para analytics.

Réplica de leitura para Metabase e relatórios, sem carga no transacional (B-01).

## Dev local

Instância Postgres independente na porta **15434**. Sincronize dados do transacional quando necessário:

```bash
pg_dump -h localhost -p 15433 -U citybox campinas_dev | \
  psql -h localhost -p 15434 -U citybox_replica campinas_dev_ro
```

Ou aponte Metabase diretamente ao transacional com usuário `citybox_readonly` (criado em `postgres/init/`).

## Produção

Configurar replicação física/streaming entre o Postgres municipal primário e esta instância. Customizações em `config/` (a adicionar por município).

## Subir

```bash
cp .env.example .env
docker compose up -d
```

## Volumes

- `citybox_postgres_replica_data`