# redis — infra

Redis 8 — cache, sessões e **carrinho write-behind** (C-04). Porta **16379**.

## Papel no monorepo

- **BFF:** carrinho rápido em Redis com flush periódico para Postgres.
- **Cache:** read models e rate limiting (roadmap).

## Subir

```bash
docker compose up -d
```

## Conexão

```
redis://localhost:16379
```

Rede interna: `citybox_redis:6379`

## Volumes

- `citybox_redis_data` — AOF persistido