# Tasks: Naturezas de Operação (020)

**MVP** = US1 (cadastro) + US2 (resolvedor). fiscal-api NÃO tocado (emissão fora de escopo).

## Phase 1: Foundational (erp-api domain)

- [x] T001 `domain/cfop.table.ts` — CFOPs entrada + saída (curados) + `isEntradaCfop`/
  `isSaidaCfop`/`isValidCfop` + `ICMS_LIVRE_CSOSN` + `isIcmsLivre(cst,csosn)`.
- [x] T002 `domain/cfop.table.spec.ts` — imutabilidade (snapshot + unicidade) + isEntrada/Saida.
- [x] T003 `domain/entities/operation-nature.entity.ts` — agregado (cfopRules + groupRules),
  create/update/validate (nome, desc ≤300, CFOP entrada/saída, sem duplicata exata `fromCfop`+
  `icmsLivre`, grupos por tributo, `keepBenefitInUf` sempre false).
- [x] T004 domain repository interface + errors.

## Phase 2: US2 — Resolvedor [P1]

- [x] T010 [US2] DTOs (Create/Update/Resolve).
- [x] T011 [US2] `ResolveOperationNatureUseCase` (CFOP match → mais específico Sim/Não > Ambos;
  não-casa → null; mapeia grupos; ignora regra órfã).
- [x] T012 [US2] Testes do resolvedor (casa-uma, casa-duas especificidade, não-casa, grupos).

## Phase 3: US1 — Cadastro (erp-api) [P1]

- [x] T020 [US1] create/update/list/get use-cases.
- [x] T021 [US1] Migration `_operation_natures` (pai + 2 filhas + CHECKs + FKs SetNull) +
  `prisma generate` offline + schema.
- [x] T022 [US1] Prisma repo (pai + filhas em transação) + presenter + route `v1/operation-natures`
  (`org.view`/`store.catalog.manage`).
- [x] T023 [US1] `TENANT_SCOPED_MODELS` += OperationNature + 3 filhas; tenant-scope spec verde.
- [x] T024 [US1] Testes CRUD + entidade (jest in-memory).
- [x] T025 [US1] Registrar módulo no AppModule.

## Phase 4: Frontend erp-web [P1] (sem teste — D0)

- [x] T030 Feature `src/features/fiscal-operation-natures` (api/hooks/lib/components/pages/GUIA):
  form 4 blocos (Informações gerais c/ benefício **desabilitado**; 3 blocos de-para com linhas
  adicionáveis).
- [x] T031 Rota `/configuracoes/fiscal/naturezas-operacao` + link em Padrões fiscais.

## Phase 5: Gates, reviewers, docs, conferência

- [x] T040 Gate: `pnpm --filter @citybox/erp-api test` + erp-web tsc/lint.
- [x] T041 Reviewers: database, react, typescript, security.
- [x] T042 Docs-as-code: erp/web + erp/api AGENTS.md (fiscal-api NÃO) + GUIA.md.
- [x] T043 Conferência 5 camadas + EXECUCAO.md (marcar 020 CONCLUÍDA → fila fiscal 11/11).
