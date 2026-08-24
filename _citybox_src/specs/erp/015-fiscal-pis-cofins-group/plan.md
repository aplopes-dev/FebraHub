# Implementation Plan: Grupo de PIS/COFINS

**Branch**: `015-fiscal-pis-cofins-group` (acumula em `feat/fiscal-api`) | **Date**: 2026-08-13
**Spec**: [spec.md](./spec.md) | **Base**: 014 (`FiscalGroup`, `FiscalDefaultTaxes`)

## Summary
Fatia vertical em **três serviços**: erp-api (grupo com regra PIS/COFINS + FK no produto +
resolução na emissão), erp-web (CRUD do grupo + aba Produtos), fiscal-api (`buildPisCofinsXml`
apura de verdade). Reutiliza a entidade `FiscalGroup` da 014.

## Constitution Check
| Princípio | Situação |
|---|---|
| I. Docs-as-Code | ✅ `apps/erp/{api,web}/AGENTS.md` + `services/fiscal-api/AGENTS.md` (comentário do builder deixa de valer) + GUIA.md. |
| II. Backend-driven | ✅ selects pequenos; regra resolvida no backend antes da fiscal-api. |
| III. pnpm | ✅ |
| IV. DS | ✅ `@citybox/mui`. |
| V. Tenant/Schema | ⚠️ **Migration Prisma** (extensão de `FiscalGroup` + FK em `ProductFiscal`/`ProductFiscalBranch`) → **database-reviewer**. ⚠️ DB `citybox_platform` não provisionado → migration versionada + jest in-memory. |
| XML/SEFAZ | ⚠️ **Toca o XML transmitido** → **teste do builder obrigatório** (SC-003/005/006). |

## Decisões

**D1 — Onde vive a regra do grupo.** Estende-se **`FiscalGroup`** (14) com colunas **nuláveis**
específicas de PIS/COFINS: `pisCst`, `pisAliquota` (Decimal?), `cofinsCst`, `cofinsAliquota`
(Decimal?). Motivo: `FiscalDefaultTaxes.pisCofinsGroupId` (14) **já** referencia `FiscalGroup(id)`;
uma tabela dedicada quebraria essa FK. "Mesma entidade Grupo fiscal" (o `.txt` confirma). As
features irmãs (016 ICMS, 019 IPI) acrescentarão suas próprias colunas nuláveis à mesma tabela,
usadas conforme `taxType`. A entidade valida que, quando `taxType=PIS_COFINS`, os campos PIS/COFINS
respeitam o conjunto de CST suportado (01,02,04–09) e alíquota 0–100.

**D2 — FK no produto.** `ProductFiscal` ganha `pisCofinsGroupId String?` (FK → `FiscalGroup`,
`onDelete: SetNull`), preservando `pisCofinsApplyToAll` e o override por unidade
(`ProductFiscalBranch.pisCofinsGroupId String?`). O campo livre `pisCofins` (String, da 014)
permanece por compatibilidade/legado, mas a **emissão passa a resolver pela FK**; o front do
parâmetro fiscal do produto migra o seletor de PIS/COFINS para escolher um grupo (fora do escopo
mínimo desta feature se ficar grande — ver D6).

**D3 — Cadastro: rota própria sob o leaf `fiscal`.** Os grupos (PIS/COFINS, ICMS, IPI) são
**lista→detalhe** (CRUD com formulário rico), não cabem como aba de formulário único ao lado de
Certificado/Séries. Decisão (vale para 016/019): **rota própria** `/(app)/configuracoes/fiscal/
grupos-pis-cofins` (+ `/novo`, `/[id]`) sob o mesmo leaf `fiscal`, com o mesmo shell da tela.
As abas de `fiscal-tabs` continuam para os singletons (certificado/geral/pdv/padroes/series).

**D4 — Permissão.** Leitura `org.view`; escrita `store.catalog.manage` (mesma dos demais
cadastros de catálogo/fiscais — coerente com 014).

**D5 — Resolução na emissão (erp-api).** Quem monta o pedido de emissão resolve, por item:
produto → `pisCofinsGroupId` (ou herança do `FiscalDefaultTaxes.pisCofinsGroupId` da org →
fallback nenhum) → CST + alíquota → envia `pis`/`cofins` já resolvidos no `NfeItemInput`. Serviço
de resolução (`ResolveItemPisCofins`) no erp-api, testado in-memory (produto com grupo; herança
do padrão; fallback sem nada). ⚠️ **A integração real emissor→fiscal-api do PDV está deferida
(B7)** — nesta feature entregamos o resolvedor + o contrato do item; o disparo no fechamento de
venda é do app PDV (Flutter/legado). Documentar.

**D6 — Simples Nacional intacto.** `taxRegimeCode='1'` → `buildPisCofinsXml` mantém CST 49
zerado. O resolvedor do erp-api **não** envia CST/alíquota tributados para Simples (ou a fiscal-api
ignora quando regime=1). Caminho preservado byte a byte (não-regressão 1).

## Estrutura
```
apps/erp/api/
  prisma/schema.prisma                       # FiscalGroup += pisCst/pisAliquota/cofinsCst/cofinsAliquota; ProductFiscal(+Branch) += pisCofinsGroupId
  prisma/migrations/<ts>_fiscal_pis_cofins_group/migration.sql
  src/modules/fiscal-defaults/               # FiscalGroup entity/repo/rotas CRUD de PIS/COFINS (create/update/list/get + produtos do grupo)
  src/modules/catalog/…                      # ProductFiscal += pisCofinsGroupId (entity/dto/mapper/rotas)
  src/modules/…/resolve-item-pis-cofins…     # resolvedor produto→grupo→padrão→fallback (emissão)
apps/erp/web/src/
  app/(app)/configuracoes/fiscal/grupos-pis-cofins/{page,novo,[id]}
  features/fiscal-pis-cofins-group/          # api/hooks/components + GUIA.md
services/fiscal-api/
  src/modules/nfe/infrastructure/xml/nfe-xml.builder.ts   # NfeItemInput += pis/cofins; buildPisCofinsXml apura; totais somam
  src/modules/nfe/infrastructure/xml/tests/nfe-xml.builder.spec.ts  # PISAliq/COFINSAliq, PISNT/COFINSNT, totais, 2 não-regressão
```

## Fases / Testes
- Sem NEEDS CLARIFICATION (decisões no `.txt` + D1–D6).
- erp-api: jest in-memory (grupo persiste; FK no produto; resolvedor produto→grupo→padrão→fallback).
- fiscal-api: **builder tests** (unit, sem DB) — PISAliq/COFINSAliq calculado, PISNT/COFINSNT,
  totais somados, não-regressão Simples (CST 49) e Regime Normal sem CST (CST 01 zerado).
- erp-web: sem harness (D0) — só backend testado; documentar o gap.
- Gates + database-reviewer (migration) + react/typescript/security reviewers.
