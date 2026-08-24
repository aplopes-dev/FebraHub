# Tasks: Grupos do IPI (019)

**MVP** = US1 (cadastro) + US2 (emissão do bloco IPI) — a fatia vertical.

## Phase 1: Setup / Foundational

- [ ] T001 Confirmar sequência XSD do grupo IPI e posição em `imposto` (feito no plan).
- [ ] T002 Criar tabela estática `cEnq` na fiscal-api + espelho de opções na erp-web.

## Phase 2: US2 — Emissão do bloco IPI (fiscal-api) [P1]

- [ ] T010 [US2] Adicionar `NfeIpiInput` e `NfeItemInput.ipi?` em `nfe-xml.builder.ts`.
- [ ] T011 [US2] Implementar `buildIpiXml(item)` (IPITrib/IPINT, `{}` quando ausente).
- [ ] T012 [US2] Inserir IPI em `buildImpostoXml` entre ICMS e PIS/COFINS.
- [ ] T013 [US2] `ipiItemValue` + total `vIPI` somando itens tributados.
- [ ] T014 [US2] Testes builder: IPITrib (50), IPINT (53), CST 99, total, **não-regressão**.
- [ ] T015 [US2] Tabela `cEnq` + teste de imutabilidade (snapshot dos códigos).

## Phase 3: US1 — Cadastro Grupo IPI (erp-api) [P1]

- [ ] T020 [US1] `FiscalGroup`: `IPI_CST_SUPPORTED`, `IPI_CST_TRIBUTADO`, `IpiGroupInput`,
  `createIpi`/`updateIpi`/`validateIpi`, props + getters.
- [ ] T021 [US1] Testes de domínio `FiscalGroup` IPI (CST suportado, percentual condicional,
  faixa, cEnq obrigatório).
- [ ] T022 [US1] Migration `_ipi_groups` (colunas IPI + FK `ipiGroupId` em ProductFiscal/Branch
  + CHECK). `prisma generate` offline.
- [ ] T023 [US1] Use-cases create/update IPI group + repo Prisma + presenter + route.
- [ ] T024 [US1] Testes dos use-cases (jest in-memory).

## Phase 4: US3 — Vínculo produto + resolver [P2]

- [ ] T030 [US3] `ipiGroupId` em ProductFiscal entity/dto/repo/presenter/route +
  `assertGroupOfType('IPI')`.
- [ ] T031 [US3] `resolve-product-ipi` use-case + teste.
- [ ] T032 [US3] Tenant-scope: nenhuma mudança de allowlist (FiscalGroup já listado);
  assertion exata verde.

## Phase 5: Frontend erp-web [P1] (sem teste — D0)

- [ ] T040 Feature `src/features/fiscal-ipi-group` (api/hooks/lib/components/pages/GUIA).
- [ ] T041 Rota `/configuracoes/fiscal/grupos-ipi` + link em Padrões fiscais.

## Phase 6: Gates, reviewers, docs, conferência

- [ ] T050 Gate: `pnpm --filter @citybox/fiscal-api test` + `@citybox/erp-api test` +
  `erp-web` tsc/lint.
- [ ] T051 Reviewers: database, react, typescript, security.
- [ ] T052 Docs-as-code: erp/web, erp/api, fiscal-api AGENTS.md + GUIA.md.
- [ ] T053 Conferência 5 camadas + EXECUCAO.md (marcar 019 CONCLUÍDA).
