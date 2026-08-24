# Implementation Plan: Grupo de ICMS

**Branch**: `016-fiscal-icms-group` (acumula em `feat/fiscal-api`) | **Date**: 2026-08-13
**Spec**: [spec.md](./spec.md) | **Base**: 014/015 (`FiscalGroup`, resolvedor, FK pattern)

## Summary
Fatia vertical em 3 serviços, **resolve B1**. erp-api (grupo ICMS com situação + matriz de
alíquotas por UF em tabela filha + FK no produto + resolvedor de ICMS por UF), erp-web (cadastro
com as 2 matrizes de 27 UFs), fiscal-api (`buildImpostoXml` emite `vBC`/`pICMS`/`vICMS`/`orig` reais).

## Constitution Check
| Princípio | Situação |
|---|---|
| I. Docs-as-Code | ✅ `apps/erp/{api,web}/AGENTS.md` + `services/fiscal-api/AGENTS.md` + GUIA.md. |
| II. Backend-driven | ✅ regra resolvida no erp-api antes da fiscal-api. |
| III. pnpm | ✅ |
| IV. DS | ✅ `@citybox/mui`. |
| V. Tenant/Schema | ⚠️ Migration (FiscalGroup += situação ICMS; nova tabela `fiscal_group_uf_rates`; FK em ProductFiscal/Branch) → **database-reviewer**. DB não provisionado → jest in-memory. |
| XML/SEFAZ | ⚠️ **Toca o XML** (`buildImpostoXml`) → **teste do builder obrigatório** (SC-004/006). |

## Decisões

**D1 — Entidade.** Reutiliza `FiscalGroup` (`taxType=ICMS`), + colunas nuláveis `icmsCst` e
`icmsCsosn` (exatamente uma preenchida, conforme regime). As **alíquotas por UF** vão em
**tabela filha** `FiscalGroupUfRate` (`fiscalGroupId, organizationId, uf, rateType`
INTERNA|INTERESTADUAL, `aliquota Decimal`), `@@unique([fiscalGroupId, uf, rateType])` — acomoda
FCP/ST/cBenef depois sem redesenho. Não criar entidade paralela.

**D2 — FK no produto.** `ProductFiscal.icmsGroupId` (FK → `FiscalGroup`, SetNull) + override por
unidade (`ProductFiscalBranch.icmsGroupId`), validado na escrita (org + `taxType=ICMS`), mesmo
padrão do `pisCofinsGroupId` da 015. `ProductFiscal.icms` (String legado da 014) permanece; a
emissão usa a FK. ⚠️ Migration só adiciona a coluna FK — DB não provisionado, sem dado real a migrar.

**D3 — Cadastro em rota própria** sob o leaf `fiscal` (`/(app)/configuracoes/fiscal/grupos-icms`
+ `/novo` + `/[id]`), como a 015 (D3). Lista + formulário de página inteira não cabem como aba.

**D4 — Situação por regime.** Regime Normal → CST **00**; Simples → CSOSN **102/103/300/400**.
Demais indisponíveis com motivo. O select filtra pelo regime do Emitente (`useEmitterRegime`, 015).

**D5 — Resolução na emissão (erp-api).** `ResolveItemIcmsUseCase`: produto → `icmsGroupId` (ou
herança do `FiscalDefaultTaxes.icmsGroupId` da org → fallback null) → escolhe a alíquota da UF de
destino (INTERNA se destino = UF do emitente; INTERESTADUAL caso contrário) → devolve
`{cst?|csosn?, base, aliquota, origem}`. O emissor envia pronto; fiscal-api não conhece grupos.
Disparo real PDV→fiscal-api = **B7** (deferido) — entregamos resolvedor + contrato + builder.

**D6 — Builder.** `NfeItemInput` += `icms?: { cst?; csosn?; aliquota?; origem? }` (ou campos
soltos `icmsAliquota`/`origem`). `buildImpostoXml`: Regime Normal com dados → `ICMS00` com
`orig` real, `vBC` (base do item), `pICMS`/`vICMS` calculados; sem dados → `ICMS00` zerado
(não-regressão, fecha o hardcode do B1 só onde há grupo). Simples → `ICMSSN{csosn}` intacto.
⚠️ `orig` passa a ser real (`ProductFiscal.origin`), não mais `'0'` fixo.

**D7 — B2 fora.** O builder aceitar qualquer CSOSN (ICMSSN inválido p/ 101) segue como **B2**
(bugfix próprio) — a tela desta fatia só oferece CSOSN 102/103/300/400. Registrar.

**D8 — Permissão.** Leitura `org.view`; escrita `store.catalog.manage` (coerente com 015).

## Estrutura
```
apps/erp/api/
  prisma/schema.prisma            # FiscalGroup += icmsCst/icmsCsosn; nova FiscalGroupUfRate; ProductFiscal(+Branch) += icmsGroupId
  prisma/migrations/<ts>_fiscal_icms_group/migration.sql
  src/modules/fiscal-defaults/    # ICMS group CRUD (create/update/get/list + uf rates) + ResolveItemIcms
  src/modules/catalog/…           # ProductFiscal += icmsGroupId (entity/dto/mapper/rotas), validado na escrita
apps/erp/web/src/
  app/(app)/configuracoes/fiscal/grupos-icms/{page,novo,[id]}
  features/fiscal-icms-group/     # api/hooks/lib(UF defaults)/components + GUIA.md
services/fiscal-api/
  src/modules/nfe/infrastructure/xml/nfe-xml.builder.ts   # NfeItemInput += icms; ICMS00 real; Simples intacto
  .../tests/nfe-xml.builder.spec.ts                        # vBC/pICMS/vICMS por UF; Simples sem alíquota; fallback zerado
```

## Fases / Testes
- Sem NEEDS CLARIFICATION (decisões no `.txt` + D1–D8).
- fiscal-api: **builder tests** (unit) — ICMS00 com vBC/pICMS/vICMS por UF de destino (interna/interestadual),
  orig real, Simples sem alíquota, fallback zerado.
- erp-api: jest in-memory (grupo + uf rates persistem; FK validada; resolvedor por UF).
- erp-web: sem harness (D0) — só backend testado; documentar.
- Gates + database-reviewer (migration) + react/typescript/security reviewers.
