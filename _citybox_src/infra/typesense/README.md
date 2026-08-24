# typesense — infra

Typesense 27 — motor de **busca** marketplace (C-01). Porta **8108**.

## Papel no monorepo

- **App consumidor:** busca full-text, filtros, geo.
- **Workers:** única escrita nas collections — via search-indexer.

Motor de busca do marketplace: full-text, facets, ranking, geo.

## Subir

```bash
cp .env.example .env
docker compose up -d
```

## Conexão

```
Host: localhost:8108
API Key: valor de TYPESENSE_API_KEY no .env
```

Rede interna: `citybox_typesense:8108`

## Volumes

- `citybox_typesense_data` — índices persistidos

## Collections (dev)

Criar via worker `search-indexer-worker` ou script de seed municipal.