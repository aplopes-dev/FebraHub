# Implementation Plan: Emissão de NFS-e com Grupos de ISSQN

**Branch**: `018-nfse-issuance-with-issqn-groups` (acumula em `feat/fiscal-api`) | **Date**: 2026-08-13
**Spec**: [spec.md](./spec.md)

## Summary
Fatia vertical em 3 serviços, **maior que as irmãs de grupos**. **fiscal-api**: o builder da DPS
deixa de fixar `tribISSQN='1'` (passa a vir do pedido; `pAliq`/retenção já corretos — só
protegidos por teste de não-regressão). **erp-api**: `FiscalGroup` ganha a situação de ISSQN
(CRUD `v1/fiscal-issqn-groups`) + `ProductFiscal.issqnGroupId` (FK) + **módulo de emissão** que
monta o `IssueNfseDto` (resolve grupo→valores), chama a fiscal-api server-to-server, gera
idempotência e registra o vínculo documento↔operação. **erp-web**: cadastro de grupos (rota
própria sob o leaf `fiscal`) + **tela de emissão** própria (sob Vendas) + tradução dos erros do
órgão.

## Constitution Check
| Princípio | Situação |
|---|---|
| I. Docs-as-Code | ✅ `apps/erp/{api,web}/AGENTS.md` + `services/fiscal-api/AGENTS.md` (o "único caso v1" deixa de valer) + GUIA.md das 2 features. |
| II. Backend-driven | ✅ erp-api resolve grupo→valores e monta o `IssueNfseDto`; a fiscal-api não conhece grupos. |
| III. pnpm | ✅ |
| IV. DS | ✅ `@citybox/mui`. |
| V. Tenant/Schema | ⚠️ **2 migrations** (situação ISSQN em `fiscal_groups`; `issqn_group_id` em `product_fiscals`/`product_fiscal_branches`; vínculo de emissão) → **database-reviewer**. DB não provisionado → jest in-memory. |
| XML/SEFAZ | ⚠️ **Toca o XML** (`tribISSQN` deixa de ser fixo) → **builder tests obrigatórios**: cada `tribISSQN` suportado + **não-regressão `pAliq` só com retenção** (E0625). |

## Decisões

**D1 — Grupo de ISSQN = extensão de `FiscalGroup` (`taxType='ISSQN'`)**, mesmo padrão de 015
(PIS/COFINS) e 016 (ICMS) — **não** entidade nova. Colunas nuláveis novas em `fiscal_groups`:
`issqnServiceCode` (código municipal `NN.NN`), `issqnNationalCode` (`cTribNac`, 6 díg.),
`issqnRate` (Decimal 7,4), `issqnTribType` (`tribISSQN`). CRUD `v1/fiscal-issqn-groups`
(molde exato dos `v1/fiscal-icms-groups`). Validação na entidade (formatos + situação).

**D2 — Exigibilidade (`tribISSQN`), fatia atual**: o XSD (`TSTribISSQN`) tem **exatamente 4**
valores. Entram os 3 que **não exigem campo extra**: **1** (Operação tributável = "Exigível"),
**2** (Imunidade), **4** (Não Incidência). **3 (Exportação de serviço)** fica **indisponível com
o motivo** (exige dados de exportação na nota). "Isenção" e "suspensões" **não são** valores de
`tribISSQN` (suspensão usa o path `nProcesso`/número de processo, fora de escopo) — por isso não
aparecem no select. Documentar no GUIA e no select.

**D3 — `indIncentivo`**: **indisponível nesta fatia, com o motivo** — o builder não o emite e ele
não está no core do bloco de tributos que tocamos. Backlog nomeado. (Mantém a "primeira fatia"
enxuta.)

**D4 — Builder da DPS deixa `tribISSQN` de ser fixo `'1'`.** `DpsServiceInput` ganha
`tribISSQN?: '1'|'2'|'3'|'4'` (**opcional, default `'1'`** — não-regressão: caller existente sem
o campo continua emitindo tributável). O bloco de retenção/`pAliq` **não muda** (já emite `pAliq`
só quando `issWithheld && issRate!=null`). Builder tests: um por `tribISSQN` suportado + o de
não-regressão (sem retenção → sem `pAliq`). Atualiza o comentário "único caso suportado no v1".

**D5 — Integração erp-api → fiscal-api (server-to-server).** Novo módulo erp-api `nfse-issuance`:
`IssueNfseUseCase` monta o `IssueNfseDto` (customer do `/v1/customers`; service resolvido do grupo:
`municipalServiceCode`/`nationalServiceCode`/`issRate`/`issWithheld`/`tribISSQN`), gera
`idempotencyKey` (determinístico por operação), `externalReference` e `sourceSystem='erp'`, e chama
`POST {FISCAL_API_URL}/v1/nfse` via um **`FiscalApiClient`** (fetch server-side + `Authorization`;
env `FISCAL_API_URL` + auth — **research R1** abaixo). Ambiente **HOMOLOGATION** (produção proibida
nesta plataforma). Registra o **vínculo** (D6b).

**D6 — Schema.** (a) `ProductFiscal.issqnGroupId` + `ProductFiscalBranch.issqnGroupId` (FK →
`FiscalGroup`, `onDelete SetNull`, index), validados na escrita (org + `taxType=ISSQN`, mesma trava
do pisCofins/icms), no pipeline `/v1/fiscal-parameters`. (b) **Vínculo de emissão** `NfseIssuance`
(erp-api): `organizationId`, `companyId`, `sourceSystem`, `externalReference`, `idempotencyKey`
(unique por org), `accessKey?`, `protocol?`, `status`, `environment`, timestamps — registra
documento↔operação e sustenta a idempotência local. Migrations versionadas (⚠️ `migrate deploy`).

**D7 — Permissões (nomeadas, distintas).** Cadastro de grupos: **`store.catalog.manage`** (como os
outros grupos fiscais). **Emissão**: **`store.fiscal.issue`** (nova — emitir documento fiscal é
alto impacto, distinta do cadastro). Registrar a permissão nova no catálogo do erp-api.

**D8 — Localização.** Cadastro de grupos: **rota própria** `/(app)/configuracoes/fiscal/
grupos-issqn` (lista + Dialog ou form — seguir 016), entrada pela aba **Padrões fiscais**
("Gerenciar grupos de ISSQN →"). Tela de **emissão**: **não** é config → **Vendas**, grupo
**FISCAL** (ao lado de NF-e/SAT CF-e, hoje placeholders): novo leaf `/vendas/nfse` em
`src/lib/navigation.ts` + ícone.

**D9 — Resolução na emissão.** A tela escolhe o Grupo de ISSQN **diretamente** (US2) e preenche
códigos/alíquota/exigibilidade; item de serviço com `issqnGroupId` (US3) é atalho que pré-seleciona
o grupo. `ResolveServiceIssqnUseCase` (erp-api): item → `issqnGroupId` → grupo → valores; fallback
sem grupo exige escolha explícita.

**D10 — Estados do Emitente (mensagens acionáveis).** A tela detecta e explica, **antes** de deixar
transmitir: sem `nationalNfseEnabled` (a fiscal-api recusa 422), sem certificado A1 válido, e
traduz E0116 (IM não no CNC), E0310 (cTribNac ausente/inválido), E0625 (alíquota sem retenção) e
demais em mensagem de negócio. Reusa `useFiscalCompany` (facilita-nfe/fiscal-certificate) para
resolver `companyId` + estado do Emitente.

**D11 — Confirmação + ambiente.** Emissão exige confirmação explícita (`ConfirmationDialog`) com o
ambiente em destaque (HOMOLOGAÇÃO). Irreversível dentro do prazo legal → deixar claro antes.

## Research (Phase 0)
- **R1 — Transporte erp-api → fiscal-api.** Confirmar como um serviço NestJS chama a fiscal-api
  server-to-server (env base URL + header de auth). A fiscal-api aceita `Authorization: Bearer`
  (dev-bypass `dev-admin` em dev; JWT/serviço em prod). Decisão: `FiscalApiClient` com `FISCAL_API_URL`
  (default `http://127.0.0.1:3116/api`) + token de serviço via env; isolar num único ponto para trocar
  a auth sem espalhar. **Verificar** se já existe cliente server-to-server no monorepo antes de criar.
- **R2 — `IssueNfseDto` exato** (`services/fiscal-api/.../issue-nfse/issue-nfse.dto.ts`): mapear
  campo a campo o que o erp-api precisa montar (customer/service/items/idempotência/environment).
- **R3 — Idempotência**: chave determinística por operação do ERP (ex.: hash de
  `organizationId+externalReference`); a fiscal-api **já** é idempotente por
  `(sourceSystem, externalReference, documentType, idempotencyKey, companyId)` — o erp-api espelha
  localmente no vínculo `NfseIssuance` para não reemitir.

## Estrutura
```
services/fiscal-api/
  src/modules/nfse/infrastructure/xml/dps-xml.builder.ts   # tribISSQN vem do input (default '1')
  + specs do builder (cada tribISSQN + não-regressão pAliq sem retenção)
apps/erp/api/
  prisma/schema.prisma + 2 migrations (situação ISSQN em fiscal_groups; issqn_group_id; NfseIssuance)
  src/modules/fiscal-defaults/         # FiscalGroup += ISSQN (create/update/validate) + rota fiscal-issqn-groups + ResolveServiceIssqn
  src/modules/nfse-issuance/           # IssueNfseUseCase + FiscalApiClient + entidade NfseIssuance + rota v1/nfse-issuances (emitir/consultar)
apps/erp/web/src/
  features/fiscal-issqn-group/         # cadastro (rota própria) + GUIA.md
  features/nfse-issuance/              # tela de emissão + GUIA.md
  app/(app)/configuracoes/fiscal/grupos-issqn/page.tsx
  app/(app)/vendas/nfse/page.tsx
  lib/navigation.ts                    # novo leaf /vendas/nfse (grupo FISCAL)
```

## Fases / Testes
- Sem NEEDS CLARIFICATION (decisões no `.txt` + D1–D11; R1–R3 resolvidos na implementação).
- **fiscal-api**: builder tests — um por `tribISSQN` (1/2/4), **não-regressão** (sem retenção → sem
  `pAliq`; com retenção → `pAliq` do grupo), default '1' sem o campo (não-regressão de caller).
- **erp-api**: jest in-memory — CRUD do grupo ISSQN (persistência + situação); FK no item
  (`issqnGroupId` validado por org+taxType); montagem do `IssueNfseDto` a partir do grupo
  (com/sem retenção → `issRate`/`issWithheld`/`tribISSQN` corretos); idempotência local (não reemite);
  `FiscalApiClient` com transporte **mockado** (sem rede real nos testes).
- **erp-web**: sem harness (D0) — só backend testado; documentar.
- Gates + **database-reviewer** (2 migrations) + react/typescript/security reviewers.
- ⚠️ **Pré-requisito operacional (produção)**: IM no CNC do município (E0116) — declarado na spec;
  a entrega valida em **HOMOLOGAÇÃO**.
