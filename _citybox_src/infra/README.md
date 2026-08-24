# services/ — Infra compartilhada

Pasta de **infra Docker** da plataforma. A vertical Serviços ficou em [`verticals/services/`](../verticals/services/).

Pasta com **dois papéis históricos** que frequentemente confundem novos contribuidores:

1. **Infra Docker compartilhada** — Postgres, Redis, RabbitMQ, Typesense, Keycloak, Unleash, MinIO, Metabase, Nginx. Cada serviço em subpasta própria com `docker-compose.yml`, volumes e README. Rede: `citybox-platform`.
2. **Vertical de negócio "Serviços"** — ordens de serviço e field service (`ServiceItem`), com `app/api`, `app/web`, `infra/` e `docs/` como qualquer outra vertical.

Comandos `npm run infra:*` afetam a infra; `npm run services:*` afetam a vertical.

## Papel no projeto

- **Para todos os apps:** fornece Postgres transacional (B-01), cache/carrinho (C-04), event bus (B-09), busca (C-01), SSO (C-07) e object storage.
- **Para BI:** réplica de leitura + Metabase (C-08) — analytics lê somente schema `public`, não schemas verticais.
- **Para dev local:** Nginx (:8088) unifica subdomínios (`api.local`, `app.local`, …) apontando para apps no host.
- **Para vertical Serviços:** mesma estrutura `verticals/{vertical}/app/api` das demais verticais, schema PG `services`, backoffice `/m/services`.

## Infra Docker (plataforma)

| Pasta | Portas | Uso |
|-------|--------|-----|
| [postgres/](postgres/) | 15433 | Postgres transacional dev |
| [postgres-replica/](postgres-replica/) | 15434 | Réplica BI |
| [redis/](redis/) | 16379 | Cache, carrinho |
| [rabbitmq/](rabbitmq/) | 5672, 15672 | Event bus |
| [typesense/](typesense/) | 8108 | Busca |
| [keycloak/](keycloak/) | 8080 | SSO |
| [unleash/](unleash/) | 4242 | Feature flags |
| [minio/](minio/) | 9000, 9001 | Object storage |
| [metabase/](metabase/) | 13002 | BI/DRE |
| [nginx/](nginx/) | 8088 | Borda dev |
| [platform/](platform/) | 3101, 3104, 3105 | Deploy marketplace-api, workers, realtime-gateway |

## Vertical Serviços

Movida para [`verticals/services/`](../verticals/services/) — API :3211, web :3210, compose em `verticals/services/infra/`.

## Comandos

```bash
npm run infra:up
npm run services:up
```

## Referências

- [README raiz](../README.md)
- [gestao/content/pages/operacao.html](../gestao/content/pages/operacao.html)
