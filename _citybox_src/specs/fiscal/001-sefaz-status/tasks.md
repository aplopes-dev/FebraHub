# Tasks: Status de comunicação com o órgão fiscal (NF-e, NFC-e, NFS-e)

**Feature**: `specs/fiscal/001-sefaz-status` | **Serviço**: `@citybox/fiscal-api` (porta 3116)

**Fontes**: [spec.md](./spec.md) · [plan.md](./plan.md) · [research.md](./research.md) · [data-model.md](./data-model.md) · [contracts/sefaz-status.openapi.yaml](./contracts/sefaz-status.openapi.yaml) · [quickstart.md](./quickstart.md)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[US1/US2/US3]**: história a que a tarefa pertence (fases de história só)
- TDD: teste (RED) antes da implementação (GREEN), padrão do serviço — banco real, sem mock de Postgres

## Path Conventions

Módulo novo em `services/fiscal-api/src/modules/sefaz-status/`, arquitetura hexagonal
(domain / application / infrastructure), como `nfe`/`nfce`/`nfse`. Todos os caminhos
abaixo são relativos a `services/fiscal-api/`.

---

## Phase 1 — Setup

- [x] T001 Criar o esqueleto do módulo em `src/modules/sefaz-status/` (pastas `domain/`, `domain/errors/`, `application/use-cases/check-sefaz-status/`, `infrastructure/http/routes/check-status/`, `infrastructure/`, `tests/`) e `sefaz-status.module.ts` vazio (NestJS `@Module`).
- [x] T002 Registrar `SefazStatusModule` em `src/app.module.ts` (lista de `imports`, após `NfseModule`) — garante que a rota entra no Swagger e no boot.
- [x] T003 [P] Adicionar env `SEFAZ_STATUS_MIN_INTERVAL_SECONDS` (default 180) em `.env`, `.env.example` e documentar em `AGENTS.md` (§ variáveis) — valor de R3, configurável.

## Phase 2 — Foundational (bloqueia todas as histórias)

**Estas tarefas são pré-requisito de US1/US2/US3 — nenhuma história funciona sem elas.**

### Domínio compartilhado

- [x] T004 [P] Definir `ServiceStatus` (union `OPERATIONAL|DOWN|UNREACHABLE|UNVERIFIABLE|LOCAL_ERROR`) e `OverallVerdict` (`ALL_OPERATIONAL|HAS_PROBLEM|INCONCLUSIVE`) em `src/modules/sefaz-status/domain/service-status.ts`, com a função `deriveOverallVerdict(results)` (FR-001b, data-model).
- [x] T005 [P] Teste unitário de `deriveOverallVerdict` em `src/modules/sefaz-status/domain/tests/service-status.spec.ts` — cobre: todos OPERATIONAL → ALL_OPERATIONAL; qualquer DOWN/UNREACHABLE/LOCAL_ERROR → HAS_PROBLEM; só UNVERIFIABLE → INCONCLUSIVE (FR-001b).
- [x] T006 Definir `StatusCheck` entity + tipo `StatusModel` (`NFE|NFCE|NFSE`) e `Authority` em `src/modules/sefaz-status/domain/status-check.entity.ts` (Key Entities), imutável.
- [x] T007 [P] Implementar a regra de janela em `src/modules/sefaz-status/domain/status-window.ts`: `isFresh(lastCheckedAt, now, minIntervalSec)`, `nextCheckAt(checkedAt, minIntervalSec)`, `ageSeconds(checkedAt, now)`. **Sem bypass** (FR-005a).
- [x] T008 [P] Teste unitário de `status-window` em `src/modules/sefaz-status/domain/tests/status-window.spec.ts` — fresco vs vencido no limite exato, idade, próxima verificação (FR-007, FR-005).

### Persistência (cache + auditoria)

- [x] T009 Adicionar `model SefazStatusCheck` ao schema `fiscal` em `prisma/schema.prisma` (campos de data-model; id `citybox_uuid_v7()`; índice `(companyId, model, environment, checkedAt DESC)`; **sem** unique — append-only).
- [x] T010 Gerar a migration `prisma/migrations/<ts>_sefaz_status_check/` (`pnpm --filter @citybox/fiscal-api exec prisma migrate dev --name sefaz_status_check`) e revisar o SQL. **Gate**: acionar `database-reviewer` antes de aplicar (Princípio V).
- [x] T011 Definir a porta `StatusCheckRepository` (interface) em `src/modules/sefaz-status/domain/status-check.repository.ts`: `findLatest(company, model, env)`, `save(entry)`, e `withWindowLock(company, model, env, fn)` (serialização FR-007b).
- [x] T012 Implementar `PrismaStatusCheckRepository` em `src/modules/sefaz-status/infrastructure/prisma-status-check.repository.ts` — `withWindowLock` usa `pg_advisory_xact_lock(hashtext(...))` numa `$transaction` e re-checa janela após o lock (double-check, R4). Espelha `prisma-contingency-queue.repository.ts`.

### Resolução de endpoint (R1)

- [x] T013 Estender `src/modules/providers/sefaz-ba/infrastructure/sefaz-ba-config.ts`: acrescentar `'NFeStatusServico4'` ao type `SefazOperation` e a entrada `NFeStatusServico4: 'ws/NfeStatusServico/NfeStatusServico4.asmx'` em `SVRS_NFCE_PATHS` (caixa exata de R1). SEFAZ-BA (55) usa o path padrão `webservices/NFeStatusServico4/NFeStatusServico4.asmx` já derivado.
- [x] T014 [P] Teste unitário em `src/modules/providers/sefaz-ba/infrastructure/tests/sefaz-ba-config.status.spec.ts`: `resolveSefazBaEndpoint('NFeStatusServico4', 'HOMOLOGATION', '55')` → host `hnfe.sefaz.ba.gov.br`; com `'65'` → host SVRS com o path do status; PRODUCTION sem env → lança (FR-009).

**Checkpoint**: domínio, persistência e endpoints prontos. Histórias podem começar.

---

## Phase 3 — User Story 1: Descobrir de que lado está a falha (P1) 🎯 MVP

**Meta**: consulta única cobrindo NF-e e NFC-e, distinguindo DOWN de UNREACHABLE.

**Teste independente**: consultar com órgão respondendo (→ OPERATIONAL) e com host morto (→ UNREACHABLE, nunca OPERATIONAL). Cobre o cerne da feature sozinho.

### Contato com o órgão (SOAP status)

- [x] T015 [US1] Implementar `checkServiceStatus(environment, model)` para NF-e/NFC-e em `src/modules/providers/sefaz-ba/infrastructure/sefaz-ba-nfe.provider.ts` — monta o SOAP de `NFeStatusServico4`, chama `callSefazSoapOperation` no endpoint resolvido por modelo (T013), com timeout individual (R5). Retorna situação + `xMotivo` + `cStat`.
- [x] T016 [US1] Implementar o mapeamento `cStat → ServiceStatus` em `src/modules/sefaz-status/domain/cstat-mapping.ts`: 107 (Serviço em Operação) → OPERATIONAL; 108/109 (paralisado momentâneo/sem previsão) → DOWN; timeout/erro de transporte → UNREACHABLE. **FR-003**: nenhum caminho de ausência de resposta cai em OPERATIONAL.
- [x] T017 [P] [US1] Teste unitário de `cstat-mapping` em `src/modules/sefaz-status/domain/tests/cstat-mapping.spec.ts` — 107→OPERATIONAL, 108/109→DOWN, cStat desconhecido → DOWN com mensagem preservada (edge case "resposta não compreendida"), e a garantia FR-003.

### Caso de uso

- [x] T018 [US1] Implementar `CheckSefazStatusUseCase` em `src/modules/sefaz-status/application/use-cases/check-sefaz-status/check-sefaz-status.use-case.ts`: para cada modelo pedido → lê `findLatest`; se fresco, serve do cache; se vencido, `withWindowLock` + double-check + contato real + `save`. Modelos contatados em **paralelo** com `Promise.allSettled` (R5, FR-008a). Recusa PRODUCTION antes de qualquer contato (FR-009). Deriva `overall` e, por modelo, `ageSeconds`/`nextCheckAt`.
- [x] T019 [US1] Recusa local por certificado: no caso de uso, pré-checar certificado válido da empresa (reusar `CertificateRepository.findValidByCompanyId`); ausente/vencido → `LOCAL_ERROR` no modelo (ou erro 422 se afeta toda a consulta), **sem** contatar o órgão (FR-010).
- [x] T020 [P] [US1] Teste de integração em `src/modules/sefaz-status/tests/check-sefaz-status.integration.spec.ts` (Postgres real): OPERATIONAL quando o duplo do provider responde 107; UNREACHABLE quando o contato estoura timeout; **nunca** OPERATIONAL sem resposta (FR-003, SC-002).

### Rota HTTP

- [x] T021 [US1] Criar o DTO de query em `src/modules/sefaz-status/infrastructure/http/routes/check-status/check-status.dto.ts`: `models?` (array enum `NFE|NFCE|NFSE`, `class-validator`), `environment?` (default HOMOLOGATION). Filtro opcional (FR-001a).
- [x] T022 [US1] Criar a rota `GET /v1/sefaz-status` em `src/modules/sefaz-status/infrastructure/http/routes/check-status/check-status.route.ts` — `@Controller('v1/sefaz-status')`, `@RequirePermission('fiscal.documents.view')`, header `X-Company-Id` via `@CompanyId()`, `CompanyAccessPolicy` (404 cross-tenant, FR-011). Swagger (`@ApiHeader`, `@ApiQuery`, `@ApiResponse`) espelhando o contrato.
- [x] T023 [US1] Fiar tudo em `sefaz-status.module.ts`: providers (use case, repositório), controller, imports (`PrismaModule`, `ProvidersModule`, `CertificatesModule`). Adicionar teste de wiring de DI em `src/modules/sefaz-status/tests/module-wiring.spec.ts` usando `AppModule` (lição da spec 005: módulo isolado não vê `ProvidersModule`).
- [x] T024 [P] [US1] Teste da rota (integração) em `src/modules/sefaz-status/tests/check-status.route.integration.spec.ts`: 200 com detalhe por modelo; 424 quando `environment=PRODUCTION` (FR-009); 404 para empresa de outro tenant (FR-011).

**Checkpoint**: US1 entregue e testável isoladamente. **É o MVP.**

---

## Phase 4 — User Story 2: Mesma resposta para NFS-e (P2)

**Meta**: NFS-e entra na mesma consulta; hoje retorna `UNVERIFIABLE` (R2), sem sondagem sintética.

**Teste independente**: consultar NFS-e enquanto NFC-e está OPERATIONAL — respostas independentes; NFS-e = UNVERIFIABLE com razão declarada, nunca um OPERATIONAL não confirmado.

- [x] T025 [US2] Implementar `checkServiceStatus(environment)` em `src/modules/providers/sefin-nacional/infrastructure/sefin-nacional-nfse.provider.ts` retornando `UNVERIFIABLE` com mensagem "O Sistema Nacional não expõe operação de disponibilidade" (R2, FR-002/FR-003). Comentar a decisão e o gancho para upgrade futuro.
- [x] T026 [US2] Incluir `NFSE` no roteamento do caso de uso (T018): resolve `authority=SEFIN-NACIONAL` e delega ao provider de NFS-e; UNVERIFIABLE não conta para a janela de contato (não há contato) e `nextCheckAt=null`.
- [x] T027 [P] [US2] Teste de integração em `src/modules/sefaz-status/tests/nfse-unverifiable.integration.spec.ts`: consulta só `NFSE` → UNVERIFIABLE + razão; consulta `NFCE,NFSE` → duas situações independentes e `overall=INCONCLUSIVE` quando o resto está OK (FR-002, edge case, SC-002).

**Checkpoint**: US2 entregue. Consulta cobre os três modelos.

---

## Phase 5 — User Story 3: Consultar sem ser bloqueado pelo órgão (P3)

**Meta**: garantir que volume de parada não fura o limite do órgão — multi-instância, sob concorrência, através de restart.

**Teste independente**: disparar muitas consultas simultâneas com janela vencida e confirmar **um** contato real por chave; e que o dado sobrevive a reinício.

- [x] T028 [US3] Teste de integração de concorrência em `src/modules/sefaz-status/tests/window-lock.concurrency.integration.spec.ts` (Postgres real): N consultas simultâneas com janela vencida ⇒ **exatamente 1** contato ao órgão (spy no provider), demais leem o resultado gravado (FR-007b, SC-004). Contra o mesmo `companyId+model+env`.
- [x] T029 [US3] Mutation testing dirigido a T028 (Stryker no arquivo do repositório e do use case): confirmar que remover o advisory lock ou o double-check **mata** o teste. Se sobreviver, endurecer o teste (lição das specs 004/005). Registrar o resultado em comentário no teste.
- [x] T030 [P] [US3] Teste em `src/modules/sefaz-status/tests/window-cache.integration.spec.ts`: segunda consulta dentro do intervalo serve do cache (mesmo `checkedAt`, `ageSeconds>0`, **zero** contato novo); `nextCheckAt` correto (FR-007, SC-005). Cobre implicitamente a sobrevivência a restart (dado está no Postgres, não em memória).

**Checkpoint**: US3 entregue. Limite do órgão protegido em cenário realista.

---

## Phase 6 — Polish & Cross-Cutting

- [x] T031 [P] Teste de latência em `src/modules/sefaz-status/tests/latency.integration.spec.ts`: três modelos, todos os órgãos inacessíveis (duplos com atraso > timeout) → resposta em ≤5s (FR-008a, SC-003). Falha se o contato for sequencial.
- [x] T032 [P] Atualizar `services/fiscal-api/AGENTS.md`: nova rota `GET /v1/sefaz-status`, tabela `sefaz_status_check`, env `SEFAZ_STATUS_MIN_INTERVAL_SECONDS`, endpoints de status de R1, e a nota de que NFS-e é UNVERIFIABLE por ora (Princípio I — mesmo PR).
- [x] T033 [P] Registrar as verificações pendentes não-bloqueantes num comentário no provider de NFS-e e no `status-window.ts`: (a) confirmar operação de disponibilidade do Sistema Nacional via mTLS (R2); (b) confirmar o piso real do intervalo por órgão (R3). Método em research.md.
- [x] T034 Rodar o gate completo: `pnpm --filter @citybox/fiscal-api build && lint && typecheck && test` + os cenários de [quickstart.md](./quickstart.md). Confirmar SC-006 (nenhuma linha nova em `fiscal_documents` nem numeração; só `sefaz_status_check` cresce).

---

## Dependencies & Execution Order

- **Setup (T001–T003)** → **Foundational (T004–T014)** → **histórias**.
- **US1 (T015–T024)** depende de Foundational. **É o MVP** — entregável e testável sozinho.
- **US2 (T025–T027)** depende de US1 (reusa o caso de uso T018 e a rota).
- **US3 (T028–T030)** depende de US1 (exercita o lock do repositório T012 pela rota).
- **Polish (T031–T034)** depende das histórias que valida.

### Ordem de história

```
Setup → Foundational → US1 (MVP) → US2 → US3 → Polish
```

US2 e US3 são incrementos sobre o mesmo caso de uso; não são independentes entre si
apenas por compartilharem T018, mas cada uma tem teste próprio e checkpoint próprio.

## Parallel Execution Examples

- **Foundational**: T004, T007 (domínio) em paralelo; T005, T008, T014 (testes) em
  paralelo assim que suas fontes existirem. T009→T010→T012 é sequencial (schema →
  migration → repositório).
- **US1**: T017 e T020 e T024 [P] rodam em paralelo (arquivos de teste distintos)
  após suas implementações; T015/T016/T018 são sequenciais (contato → mapeamento →
  orquestração).
- **Polish**: T031, T032, T033 [P] em paralelo; T034 por último.

## Implementation Strategy (MVP-first)

1. **MVP = Setup + Foundational + US1.** Já entrega o valor central: distinguir "o
   órgão está fora" de "não chegamos até ele", para NF-e e NFC-e. Parável aqui.
2. **US2** acrescenta NFS-e com resposta honesta (UNVERIFIABLE) — barato, reusa tudo.
3. **US3** é o endurecimento operacional (não furar o limite). Sem função nova, mas
   sem ele a própria feature poderia causar bloqueio — tratado com o mesmo advisory
   lock já provado na contingência de NFC-e, e verificado por mutation testing.
