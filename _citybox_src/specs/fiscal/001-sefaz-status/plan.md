# Implementation Plan: Status de comunicação com o órgão fiscal (NF-e, NFC-e, NFS-e)

**Branch**: `feat/fiscal-api` | **Date**: 2026-08-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/fiscal/001-sefaz-status/spec.md`

## Summary

Expor uma consulta explícita "o órgão está atendendo?" para os três modelos que o
serviço emite (NF-e, NFC-e, NFS-e), separada de qualquer emissão. O valor está em
distinguir **"o órgão respondeu que está fora"** de **"não obtivemos resposta"** —
a segunda pode ser problema nosso (rede, certificado), e confundi-las é o erro de
diagnóstico que motivou o pedido.

Abordagem técnica (de `research.md`): uma rota nova por consulta única com filtro
opcional de modelos; contato **paralelo** aos órgãos com timeout individual; a
última verificação persistida numa tabela do schema `fiscal` que serve de cache
(FR-007) e de auditoria (FR-013) ao mesmo tempo, com serialização por
`pg_advisory_xact_lock` para não furar o limite sob concorrência (FR-007b). NF-e e
NFC-e usam a operação `NFeStatusServico4` já existente no protocolo, roteada por
modelo (código de roteamento já pronto); NFS-e retorna `não verificável` até que
uma operação de disponibilidade do Sistema Nacional seja confirmada.

## Technical Context

**Language/Version**: TypeScript 5.7, Node 24

**Primary Dependencies**: NestJS 11, Prisma 7.8 (adapter-pg), undici (HTTP), cliente
SOAP interno (`callSefazSoapOperation`), toolkit de certificado/PKCS#12 já existente

**Storage**: Postgres, schema `fiscal` (tabela nova `sefaz_status_check`)

**Testing**: Jest (unit + integration contra Postgres real, sem mock de banco —
padrão do serviço); mutation testing nos testes de concorrência/ordenação

**Target Platform**: serviço `@citybox/fiscal-api` (porta 3116), Linux/containers

**Project Type**: web-service (NestJS), backend único

**Performance Goals**: SC-003 — resposta em ≤5s no pior caso (3 modelos, todos os
órgãos inacessíveis). Contato paralelo com timeout individual ~4s.

**Constraints**: só HOMOLOGATION (produção recusada por construção, 424); consulta
não pode consumir numeração nem criar documento (FR-012); limite de contato por
CNPJ respeitado inclusive multi-instância e através de restart (SC-004); não furar
o limite nem a pedido (FR-005a).

**Scale/Scope**: baixo volume por natureza (limitado a 1 contato / 3 min / empresa /
modelo / ambiente); o pico é de leitura em cache durante uma parada.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Situação |
|---|---|
| I. Docs-as-Code (AGENTS.md) | ✅ `services/fiscal-api/AGENTS.md` será atualizado no mesmo PR (nova rota, nova tabela, nova env). Root AGENTS.md não muda (sem nova porta/serviço). |
| II. Backend-driven search/pagination | ➖ N/A — não há coleção paginada; é uma consulta pontual. |
| III. pnpm único | ✅ Sem npm/yarn. |
| IV. Atomic Design / @citybox/ui | ➖ N/A — feature é backend puro, sem UI. |
| V. Tenant isolation + schema próprio + UUID v7 | ✅ Rota passa por `CompanyAccessPolicy` (FR-011, 404 cross-tenant). Tabela nova no schema `fiscal` do próprio serviço, id `citybox_uuid_v7()`. Migration passa pelo `database-reviewer` (gate). |
| Auth via Keycloak + guards locais | ✅ Rota sob `AuthGuard` + `@RequirePermission('fiscal.documents.view')`. |
| Messaging (outbox/CloudEvents) | ➖ N/A — feature não emite evento de plataforma. |
| Gate de verificação (build/lint/typecheck/test) | ✅ Planejado antes de entrega. |
| Sem commit sem aprovação | ✅ |

**Resultado**: PASS. Sem violações — nenhuma entrada em Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/fiscal/001-sefaz-status/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 (R1–R5)
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1
│   └── sefaz-status.openapi.yaml
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks (ainda não criado)
```

### Source Code (repository root)

```text
services/fiscal-api/
├── prisma/
│   ├── schema.prisma                         # + model SefazStatusCheck (schema fiscal)
│   └── migrations/
│       └── <ts>_sefaz_status_check/          # tabela nova + índice único da chave
├── src/
│   ├── modules/
│   │   ├── sefaz-status/                      # MÓDULO NOVO
│   │   │   ├── domain/
│   │   │   │   ├── service-status.ts          # enum de situação + veredito de topo (FR-002, FR-001b)
│   │   │   │   ├── status-check.entity.ts     # entidade de verificação (Key Entities)
│   │   │   │   ├── status-window.ts           # regra do intervalo mínimo (FR-007, R3)
│   │   │   │   └── errors/
│   │   │   ├── application/
│   │   │   │   └── use-cases/check-sefaz-status/
│   │   │   │       └── check-sefaz-status.use-case.ts   # orquestra paralelo (R5), cache+lock (R4)
│   │   │   ├── infrastructure/
│   │   │   │   ├── http/routes/check-status/  # GET + DTO (FR-001, FR-001a, FR-001b)
│   │   │   │   └── prisma-status-check.repository.ts    # advisory lock (FR-007b)
│   │   │   └── sefaz-status.module.ts
│   │   └── providers/
│   │       ├── sefaz-ba/infrastructure/
│   │       │   ├── sefaz-ba-config.ts         # + NFeStatusServico4 no type e no mapa SVRS (R1)
│   │       │   └── sefaz-ba-status.provider?  # ou método checkServiceStatus no provider NF-e/NFC-e
│   │       └── sefin-nacional/infrastructure/ # NFS-e → "não verificável" (R2)
│   └── shared/
│       ├── domain/fiscal-provider.interface.ts  # checkServiceStatus já existe (reuso)
│       └── infra/fiscal-soap/                    # callSefazSoapOperation (reuso)
└── AGENTS.md                                   # atualizar (rota, tabela, env, endpoints R1)
```

**Structure Decision**: módulo novo `sefaz-status` seguindo a mesma arquitetura
hexagonal dos módulos existentes (`nfce`, `nfe`, `nfse`: domain / application /
infrastructure). A resolução de endpoint e o cliente SOAP são **reusados** dos
providers já existentes — a feature acrescenta a operação `NFeStatusServico4` e a
implementação concreta de `checkServiceStatus` (hoje só declarada no contrato e
usada pela contingência de NFC-e). A factory de providers já registra por tipo; a
consulta resolve o provider por modelo, como a emissão faz.

## Complexity Tracking

> Sem violações de constituição. Nada a justificar.
