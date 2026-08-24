# Implementation Plan: Padrões Fiscais

**Branch**: `014-fiscal-default-taxes` | **Date**: 2026-08-13 | **Spec**: [spec.md](./spec.md)

## Summary
Base de 015/016/018/019. No **erp-api** (schema `erp`): nova entidade `FiscalGroup` (grupo por
tributo, leitura/seed), nova entidade `FiscalDefaultTaxes` (um padrão por org), e campo `issqn` em
`ProductFiscal` (+ override em `ProductFiscalBranch`). No **erp-web**: aba "Padrões fiscais"
(5 selects, salvar explícito, estado vazio por tributo) + exibição do **valor herdado** em
`/catalogo/parametros-fiscais`. Herança por referência (exibição), sem escrever no catálogo. **Nada
na fiscal-api**; a emissão não passa a consumir (limitação declarada).

## Constitution Check
| Princípio | Situação |
|---|---|
| I. Docs-as-Code | ✅ `apps/erp/api/AGENTS.md` + `apps/erp/web/AGENTS.md` + GUIA.md. |
| II. Backend-driven | ✅ selects pequenos (grupos por tributo); padrão é singleton por org. |
| III. pnpm | ✅ |
| IV. DS | ✅ `@citybox/mui`. |
| V. Tenant/Schema | ⚠️ **Migrations Prisma** (FiscalGroup, FiscalDefaultTaxes, issqn em ProductFiscal/Branch) → **database-reviewer**. ⚠️ DB erp `citybox_platform` **não provisionado** neste env → migrations versionadas + `prisma generate` offline + testes **jest in-memory** (a spec pede Postgres real; indisponível — documentado). |

## Decisões

**D1 — CFOP (QUESTÃO ABERTA do .txt).** O CFOP padrão é um **código CFOP (String de 4 dígitos)**,
escolhido do **catálogo estático de CFOP já existente** no erp-web
(`features/fiscal-parameters/data/fiscal-options.ts` → `CFOP_OPTIONS`), **não** um `FiscalGroup` e
**não** uma Natureza de Operação. Motivo: `FiscalGroup` é por-tributo (ICMS/IPI/PIS_COFINS/ISSQN);
CFOP não é grupo (não há "Grupo do CFOP"); Natureza de Operação é a feature **020** (futura, ainda
inexistente). Armazenado como `cfop: String` em `FiscalDefaultTaxes`, coerente com `ProductFiscal.cfop`
(também String). Quando 020 existir, o padrão de CFOP pode passar a referenciar uma Natureza — backlog.

**D2 — Onde vivem os campos.** `FiscalGroup` + `FiscalDefaultTaxes` no **erp-api** (schema `erp`).
`issqn` em `ProductFiscal` + `ProductFiscalBranch` (módulo `catalog` do erp-api). ⚠️ `FiscalGroup`
(entidade catálogo de grupos) é **distinto** do tipo `FiscalGroupField` (`{value, applyToAll}`) já
existente no `ProductFiscal` — nomear com cuidado.

**D3 — Herança.** Por referência, **na exibição** (frontend): `fiscal-parameters` busca os padrões +
o `ProductFiscal`; para cada campo vazio do produto, mostra o valor do padrão marcado "herdado". O
backend só persiste o padrão; a emissão não consome (limitação). Sem cópia/migração.

**D4 — Permissão.** Leitura `org.view`; escrita `store.catalog.manage` (padrões afetam o catálogo
inteiro — permissão de gestão de catálogo, distinta da leitura). (fiscal-parameters hoje não exige
permissão fina; padrões são mais sensíveis → exigimos manage.)

**D5 — Grupos sem CRUD.** Só leitura (`GET /v1/fiscal-groups?taxType=`). Seed mínimo para os selects
terem opções (senão a tela nasce toda em estado vazio); documentar que o cadastro real é backoffice.

## Estrutura
```
apps/erp/api/
  prisma/schema.prisma            # + FiscalGroup, FiscalDefaultTaxes; ProductFiscal/Branch += issqn
  prisma/migrations/<ts>_fiscal_default_taxes/migration.sql
  src/modules/fiscal-defaults/    # novo módulo: FiscalGroup (list) + FiscalDefaultTaxes (get/put)
  src/modules/catalog/…           # ProductFiscal entity/dto/mapper/routes += issqn
apps/erp/web/src/
  app/(app)/configuracoes/fiscal/fiscal-tabs.tsx   # + aba "padroes"
  features/fiscal-default-taxes/  # api/hooks/components + GUIA.md
  features/fiscal-parameters/…    # exibir valor herdado (marcado) nos campos vazios
```

## Phase 0/1
Sem NEEDS CLARIFICATION (CFOP resolvido em D1). Contratos: `GET /v1/fiscal-groups?taxType=`,
`GET/PUT /v1/fiscal-default-taxes`, e `issqn` no contrato de `/v1/fiscal-parameters`. Testes:
jest in-memory (padrões persistem; issqn no ProductFiscal; herança por referência resolvida). ⚠️ Toca
`ProductFiscal` (catalog) — cuidado com entity/normalizeGroupField/dto/mapper/presenter/rotas + o
frontend `fiscal-parameters`. Migrations → database-reviewer.
