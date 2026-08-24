# Tasks: Séries e Numeração de Notas Fiscais

**Feature**: `specs/erp/011-fiscal-invoice-series` | **Branch**: `011-fiscal-invoice-series`
**Testes**: fiscal-api (Postgres real). Frontend sem harness (D0).

## Phase 1 — Setup / Domínio (fiscal-api)
- [x] T001 Erros de domínio: `SeriesInactiveError`, `SeriesNumberDecreaseError`, `SeriesInUseError`, `SeriesDuplicateError`, `SeriesInvalidFormatError` em `modules/fiscal-sequences/domain/errors/` (nomes com sufixo mapeável pelo `AppExceptionFilter`).
- [x] T002 `lib/series-format.ts`: `canonicalizeSeries("001")→"1"` (1–3 dígitos numéricos; rejeita inválido) + `displaySeries("1")→"001"`.

## Phase 2 — Persistência (fiscal-api) — inclui MIGRATION
- [x] T003 Prisma: `model FiscalSequenceNumberChange` (schema fiscal; id uuidv7, sequenceId FK, companyId, previousNumber/newNumber BigInt, changedByUserId, changedAt). Atualizar `services/fiscal-api/prisma/schema.prisma`.
- [x] T004 Migration hand-written escopada + aplicar (docker psql) + `prisma migrate resolve --applied` + `prisma generate`. **→ database-reviewer no gate.**
- [x] T005 `FiscalSequenceRepository`: + `findAllByCompany(companyId, environment?)`, `findById(id)`, `delete(id)`. Impl Prisma + in-memory (usada nos testes de emissão).
- [x] T006 Repo de auditoria: `FiscalSequenceNumberChangeRepository.save()` + impl Prisma + in-memory.

## Phase 3 — US1 Listar/criar (fiscal-api + web)
- [x] T007 [US1] UseCase `ListFiscalSequences` (companyId + environment?) + rota `GET /v1/companies/{companyId}/sequences?environment=` (`fiscal.documents.view`).
- [x] T008 [US1] UseCase `CreateFiscalSequence` (canonicaliza series; 409 duplicidade → `SeriesDuplicateError`; `active:true`, currentNumber inicial) + rota `POST /v1/companies/{companyId}/sequences` (`fiscal.sequences.manage`).
- [x] T009 [P] [US1] Testes Postgres: list por company+environment; create; conflito de chave única.
- [x] T010 [US1] erp-web: abas em `/configuracoes/fiscal` (`?aba=`); extrair certificado (010) para aba; nova aba Séries com lista (filtro ambiente) + criar. feature `features/fiscal-invoice-series/` (api/hooks/components/lib/GUIA.md); reusa `useFiscalCompany`.

## Phase 4 — US2 Ajustar número (fiscal-api + web)
- [x] T011 [US2] UseCase `UpdateSequenceNumber` (só aumentar → senão `SeriesNumberDecreaseError`; grava auditoria na mesma transação com `changedByUserId` do JWT) + rota `PATCH /v1/sequences/{id}/number` (`fiscal.sequences.manage`).
- [x] T012 [P] [US2] Testes: aumentar grava auditoria; reduzir bloqueia.
- [x] T013 [US2] web: editar número com passo de confirmação (aumento) + mensagem de bloqueio (redução).

## Phase 5 — US3 Desativar/excluir + enforce active (fiscal-api + web)
- [x] T014 [US3] UseCase `SetSequenceActive` (desativar/reativar) + rota `PATCH /v1/sequences/{id}/active` (`fiscal.sequences.manage`).
- [x] T015 [US3] UseCase `DeleteFiscalSequence` (só `currentNumber=0` → senão `SeriesInUseError`) + rota `DELETE /v1/sequences/{id}` (`fiscal.sequences.manage`).
- [x] T016 [US3] **Enforce `active` na emissão**: nfe/nfce/nfse `reserveNextNumber` — `existing && !active` → `SeriesInactiveError`. Criação sob demanda mantém `active:true`.
- [x] T017 [P] [US3] Testes: excluir zerada ok; excluir usada bloqueia; desativar; **emissão em série inativa falha com erro específico**; **NÃO-REGRESSÃO: emissão cria série inexistente sob demanda** (SC-007).
- [x] T018 [US3] web: desativar (com aviso que bloqueia emissão) + reativar + excluir (só número 0).

## Phase 6 — Polish & Docs
- [x] T019 [P] `services/fiscal-api/AGENTS.md` (endpoints novos + `active` efetivo + tabela auditoria) e `apps/erp/web/AGENTS.md` (feature + abas).
- [x] T020 [P] `features/fiscal-invoice-series/GUIA.md` (negócio, leigo).
- [x] T021 Sem `@ts-ignore`/`eslint-disable @typescript-eslint/*`; barrels/imports.

## Phase 7 — Gates & Conferência
- [x] T022 Gates fiscal-api: build/lint/typecheck/test (Postgres). Gates erp-web: typecheck/lint(diff)/build.
- [x] T023 **database-reviewer** (migration) + react-reviewer + typescript-reviewer + security-reviewer (numeração/permissão sensível).
- [x] T024 Conferência (5 camadas) + EXECUCAO.md + entrega.

## Não-regressão (destaque do .txt)
- SC-007: emitir com série inexistente continua criando sob demanda — coberto por T017.
