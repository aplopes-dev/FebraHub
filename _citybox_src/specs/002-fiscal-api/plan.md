# Implementation Plan: fiscal-api — Emissão de Documentos Fiscais (NF-e e NFS-e)

**Branch**: `002-fiscal-api` | **Date**: 2026-08-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-fiscal-api/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

`fiscal-api` é um novo microserviço NestJS standalone (`services/fiscal-api`, porta 3116) responsável por emitir, consultar, cancelar e corrigir NF-e (via SEFAZ-BA) e NFS-e (Padrão Nacional, piloto Ilhéus/BA) em nome dos Emitentes (Lojas) do CityBox, no v1 restrito a chamadas síncronas de sistemas internos (ERP/PDV/marketplace). A abordagem técnica reaproveita ao máximo: (1) o desenho arquitetural já existente em `packages/docs/fiscal/api_fiscal_completa.md` (Provider/Strategy Pattern, tabelas `fiscal_documents`/`fiscal_events`/`fiscal_sequences`/`provider_requests`, formato de resposta) recortado ao escopo do v1 aprovado; (2) as convenções já estabelecidas no monorepo para apps NestJS single-schema (Clean Architecture por módulo de `food-api`/`clinica-api`, guardas Keycloak locais, `ObjectStorage`/MinIO de `erp-api`). Nenhuma biblioteca de XML/assinatura/SOAP/PKCS12 existe hoje no monorepo — este é um domínio greenfield dentro da plataforma (ver [research.md](./research.md)).

## Technical Context

**Language/Version**: TypeScript `^5.7.3`, Node.js 24 (`node:24-alpine`, mesma imagem de `erp-api`/`food-api`)

**Primary Dependencies**: NestJS 11.1.24 (via `catalog:`), Prisma 7.8.0 + `@prisma/adapter-pg`, `class-validator`/`class-transformer` (DTOs HTTP), `zod` (validadores de domínio), `jose` (verificação local de JWT Keycloak), `minio` 8.0.5 (storage), `xmlbuilder2` (build XML), `libxmljs2` (validação XSD), `xml-crypto` (assinatura XMLDSig), `node-forge` (parse de certificado PKCS#12/.pfx), `soap` (cliente SOAP para webservices SEFAZ-BA)

**Storage**: PostgreSQL — schema próprio `fiscal` no banco compartilhado `citybox` (`127.0.0.1:15433`, mesma instância de food/clinica); MinIO — bucket dedicado `fiscal` para XML autorizado e certificados `.pfx` criptografados

**Testing**: Jest + `ts-jest` (padrão food/clinica) — testes unitários com providers/repositórios fake em memória; `tests/integration/` com Postgres real gated por `DATABASE_URL` (padrão clinica); fixtures de XML de homologação para testes de contrato dos providers SEFAZ-BA/Ilhéus

**Target Platform**: Linux (Docker), serviço HTTP standalone sem frontend

**Project Type**: web-service (API backend)

**Performance Goals**: SC-001/SC-002 — protocolo de autorização (ou rejeição) em até 30s em homologação; SC-003 — XML autorizado disponível para download em até 5s após o protocolo

**Constraints**: só ambiente de homologação/sandbox no v1 (nenhuma transmissão em produção neste escopo — ver Assumptions do spec); senha e certificado digital nunca aparecem em log, resposta de API ou storage em texto claro (FR-007); TLS mútuo com a SEFAZ usando o certificado do próprio Emitente

**Scale/Scope**: v1 restrito a Emitentes internos do CityBox (FR-015) — sem onboarding self-service de clientes externos; NF-e modelo 55 (SEFAZ-BA) + NFS-e Padrão Nacional para o município de Ilhéus/BA (FR-002); relação 1 Loja : 1 Emitente

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Notas |
|---|---|---|
| I. Docs-as-Code (hierarquia AGENTS.md) | ✅ PASS (com ação obrigatória) | A implementação deve criar `services/fiscal-api/AGENTS.md` e atualizar o `AGENTS.md` raiz (§3 mapa de portas, §4 índice de Services) na mesma unidade de trabalho — ver research.md §1. |
| II. Backend-Driven Search and Pagination | ✅ PASS | Endpoints de listagem/consulta (`GET /fiscal-documents`, `GET /nfe`, `GET /nfse`) usam `skip`/`take` + `WHERE` + `ORDER BY` no Prisma; não há frontend nesta feature, então não se aplica debounce/`DataTable`. |
| III. Single Package Manager (pnpm) | ✅ PASS (com ação obrigatória) | Novo serviço entra no workspace via `pnpm@9.15.0`; é necessário adicionar `"services/*"` ao `pnpm-workspace.yaml` (hoje só existe o glob morto `apps/services/*`) — ver research.md §1. |
| IV. Atomic Design and Shared UI Components | N/A | Feature é 100% backend (API), sem componente de UI. |
| V. Tenant Isolation and Independent Database Schemas | ✅ PASS | Schema Prisma próprio (`fiscal`), sem pacote `database` central; todo ID usa `citybox_uuid_v7()` por padrão desde o início (nasce em conformidade — diferente de food/clinica, que hoje usam `uuid()` legado). `database-reviewer` deve revisar o schema antes da implementação. |
| Auth via Keycloak (Additional Constraints) | ✅ PASS | Reaproveita `AuthGuard`/`PermissionGuard`/verificação local de JWT via `jose`, igual a food/clinica — ver research.md §8. |
| Messaging via RabbitMQ + outbox (Additional Constraints) | N/A no v1 | FR-016 do spec já decidiu interação síncrona (chamada de API, não evento) para o disparo de emissão; não há hoje nenhum consumidor de eventos `fiscal.*` na plataforma, então publicar eventos via outbox seria especulativo (YAGNI) — decisão registrada em research.md §8/§9, não uma violação da regra (que rege comunicação *baseada em evento* quando ela existe, não obriga que toda comunicação seja assíncrona). |
| Framework/Engine Versions (Additional Constraints) | ✅ PASS | NestJS 11 via `catalog:`, mesmas versões dos demais apps. |
| Development Workflow & Quality Gates | ✅ PASS (processo, não gate de design) | Implementação segue `/feature`, `pnpm build/lint/typecheck/test`, sem commit sem aprovação, sem `@ts-ignore`/`eslint-disable`. |

Nenhuma violação exige entrada na tabela de Complexity Tracking — os dois pontos "N/A no v1" acima são decisões de escopo documentadas em `research.md`, não desvios da constituição.

**Re-check pós-Phase 1** (após `data-model.md` e `contracts/`): tabela confirmada sem mudanças — `citybox_uuid_v7()` aplicado em toda entidade de `data-model.md`, todo endpoint de listagem em `contracts/*.md` exige paginação/filtro no backend, nenhum segredo hardcoded (chave de criptografia do certificado via `FISCAL_CERT_ENCRYPTION_KEY`, não commitada). Gate segue ✅ PASS.

## Project Structure

### Documentation (this feature)

```text
specs/002-fiscal-api/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   ├── companies-api.md
│   ├── certificates-api.md
│   ├── nfe-api.md
│   ├── nfse-api.md
│   └── fiscal-documents-api.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
services/fiscal-api/                       # @citybox/fiscal-api — porta 3116
├── AGENTS.md                              # criado na implementação (Constitution I)
├── package.json
├── Dockerfile                             # FROM node:24-alpine, mesmo padrão de erp-api/food-api
├── .env.example
├── prisma/
│   └── schema.prisma                      # datasource.schemas = ["fiscal"]; citybox_uuid_v7() em todo ID
├── src/
│   ├── main.ts                            # Swagger em api/v1/docs, prefixo global "api"
│   ├── app.module.ts
│   ├── modules/
│   │   ├── companies/                     # Emitente — US: provisionamento (research.md §9)
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   ├── repositories/          # <x>.repository.interface.ts (token DI)
│   │   │   │   └── validators/            # Zod
│   │   │   ├── application/
│   │   │   │   └── use-cases/
│   │   │   ├── infrastructure/
│   │   │   │   ├── database/              # prisma-<x>.repository.ts
│   │   │   │   └── http/routes/<action>/  # route + dto + presenter
│   │   │   ├── tests/                     # in-memory-<x>.repository.ts (fakes)
│   │   │   └── companies.module.ts
│   │   ├── certificates/                  # US3 — upload/validação/guarda do A1
│   │   ├── fiscal-documents/              # entidade base + consulta genérica (US1/US2/US4, FR-003)
│   │   ├── nfe/                           # US1, US4 — emitir/cancelar/carta de correção/inutilizar
│   │   ├── nfse/                          # US2, US4 — emitir/cancelar/consultar (Ilhéus/BA)
│   │   ├── providers/
│   │   │   ├── sefaz-ba/                  # FiscalProvider: NF-e (Strategy Pattern)
│   │   │   │   └── infrastructure/        # usa shared/infra/fiscal-{xml,signature,soap}
│   │   │   └── ilheus-metropolis/         # FiscalProvider: NFS-e Ilhéus (Strategy Pattern)
│   │   └── health/
│   └── shared/
│       ├── core/                          # entity.ts, use-case.interface.ts, errors/
│       ├── domain/
│       │   ├── fiscal-provider.interface.ts   # contrato Strategy: issue/cancel/consult
│       │   └── storage/object-storage.interface.ts
│       └── infra/
│           ├── prisma/
│           ├── keycloak/                  # keycloak-jwt.ts (padrão food/clinica)
│           ├── storage/minio/             # MinioObjectStorage (padrão erp/imoveis/clinica/food)
│           ├── fiscal-xml/                # xmlbuilder2 + libxmljs2
│           ├── fiscal-signature/          # xml-crypto + node-forge
│           ├── fiscal-soap/               # cliente `soap` p/ webservices SEFAZ-BA
│           └── http/{guards,decorators,filters}/
└── tests/
    ├── integration/                       # Postgres real, gated por DATABASE_URL (padrão clinica)
    └── fixtures/                          # XMLs de homologação (SEFAZ-BA, Ilhéus) p/ testes de contrato
```

**Structure Decision**: serviço backend único (`services/fiscal-api`), sem frontend — não se aplica a divisão "Option 2: Web application". Segue a mesma anatomia Clean-Architecture-por-módulo (`domain`/`application`/`infrastructure`) já usada em `apps/verticals/food/api` e `apps/verticals/clinica/api`, com o padrão Provider/Strategy pedido no briefing original isolado em `modules/providers/` e as capacidades técnicas (XML/assinatura/SOAP) vivendo em `shared/infra/` por não terem entidade de domínio própria — ver justificativa completa em [research.md §3](./research.md#3-arquitetura-interna-dos-módulos).

## Complexity Tracking

*Nenhuma violação da Constitution exige justificativa nesta tabela — ver seção "Constitution Check" acima.*
