# packages/ — Bibliotecas compartilhadas

Bibliotecas **pnpm workspace** (`@citybox/*`) compartilhadas entre apps, verticais e workers. Centralizam contratos de dados (Prisma), autenticação (Nest guards), eventos, busca, UI e tooling para evitar duplicação e drift entre dezenas de pacotes deployáveis.

Packages não rodam sozinhos — são dependências compiladas/transpiladas pelos consumidores no build Turborepo.

## Papel no projeto

- **Consistência de dados:** `database` garante um único schema Prisma platform + tenant com multiSchema (C-15).
- **Consistência de segurança:** `nest-common` padroniza JWT, permissions e sync Keycloak (C-07) em todas as APIs.
- **Consistência de contrato:** `contracts` + `events` estabilizam OpenAPI e nomes de eventos para BFF, workers e apps nativos.
- **Consistência de UX:** `ui` entrega design system warm para backoffice e stubs verticais.
- **Consistência de qualidade:** `eslint-config` e `tsconfig` alinham lint e TypeScript strict em todo o monorepo.

## Conteúdo desta pasta

| [database/](database/) | `@citybox/database` |
| [nest-common/](nest-common/) | `@citybox/nest-common` |
| [ui/](ui/) | `@citybox/ui` |
| [contracts/](contracts/) | `@citybox/contracts` |
| [events/](events/) | `@citybox/events` |
| [messaging/](messaging/) | `@citybox/messaging` |
| [search/](search/) | `@citybox/search` |
| [marketplace-projection/](marketplace-projection/) | `@citybox/marketplace-projection` |
| [notifications/](notifications/) | `@citybox/notifications` |
| [eslint-config/](eslint-config/) | `@citybox/eslint-config` |
| [tsconfig/](tsconfig/) | `@citybox/tsconfig` |

Pacotes `domain-*` (catalog, orders, payments) estão **planejados** — lógica hoje em `apps/marketplace/api`.

## Subpastas

- [database/README.md](database/README.md)
- [nest-common/README.md](nest-common/README.md)
- [ui/README.md](ui/README.md)
- [contracts/README.md](contracts/README.md)
- [verticals/events/README.md](verticals/events/README.md)
- [messaging/README.md](messaging/README.md)
- [search/README.md](search/README.md)
- [marketplace-projection/README.md](marketplace-projection/README.md)
- [notifications/README.md](notifications/README.md)
- [eslint-config/README.md](eslint-config/README.md)
- [tsconfig/README.md](tsconfig/README.md)

## Referências

- ADR B-05, C-12, C-15
