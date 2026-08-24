# Implementation Plan: Informações Adicionais da Nota Fiscal

**Branch**: `017-fiscal-additional-info` (acumula em `feat/fiscal-api`) | **Date**: 2026-08-13
**Spec**: [spec.md](./spec.md)

## Summary
Fatia vertical em 3 serviços. erp-api (entidade `FiscalAdditionalInfo` + CRUD + resolvedor que
concatena por tipo/destino), erp-web (lista com abas por tipo + Dialog de cadastro, sem toggle),
fiscal-api (`infAdic` com `infCpl`/`infAdFisco` nos 3 builders: NF-e, NFC-e, DPS).

## Constitution Check
| Princípio | Situação |
|---|---|
| I. Docs-as-Code | ✅ `apps/erp/{api,web}/AGENTS.md` + `services/fiscal-api/AGENTS.md` + GUIA.md. |
| II. Backend-driven | ✅ concatenação/validação no erp-api antes da fiscal-api. |
| III. pnpm | ✅ |
| IV. DS | ✅ `@citybox/mui`. |
| V. Tenant/Schema | ⚠️ Migration (nova tabela `fiscal_additional_infos`) → **database-reviewer**. DB não provisionado → jest in-memory. |
| XML/SEFAZ | ⚠️ **Toca o XML** (novo grupo `infAdic` nos 3 builders) → **builder tests obrigatórios** (SC-003/004/005). |

## Decisões

**D1 — Entidade.** Nova entidade `FiscalAdditionalInfo` (**não** reutiliza `FiscalGroup` — é outro
conceito): `organizationId`, `name`, `text`, `documentType` (`NFE`|`NFCE`|`NFSE`), `target`
(`INF_CPL`|`INF_AD_FISCO`), timestamps. Tabela `fiscal_additional_infos`, index `(organizationId,
documentType)`. Ordem de concatenação = `createdAt` (ordem de criação).

**D2 — Cadastro por tipo.** Cada registro serve a **um** tipo de documento (não N:N). Motivo:
espelha as abas NF-e/NFC-e/NFS-e e o botão "Nova informação NF-e" por aba; concatenação e limite
são por tipo; um registro multi-tipo obscureceria qual limite ele consome. Se um texto vale para
vários tipos, cadastra-se um por tipo (raro; textos legais diferem por documento).

**D3 — Cadastro em rota própria** sob o leaf `fiscal` (`/(app)/configuracoes/fiscal/
informacoes-adicionais`) com **abas internas por tipo** (NFE/NFCE/NFSE, aba na URL). Form pequeno
(nome, descrição, destino) → **Dialog** de criar/editar (não página inteira). Busca por nome.

**D4 — Destino no campo certo.** `target` decide `infCpl` (contribuinte) vs `infAdFisco` (fisco) —
campos distintos no XML, tetos próprios. **Nunca** trocar (SC-002). A referência não distingue; nós
sim (observação do fisco no campo do contribuinte fica errada num documento já transmitido).

**D5 — Modo automático fixo, sem toggle.** Toda info é automática (aplicada a todo documento do
tipo). Não renderizar o toggle "Informação automática" (único estado nesta entrega).

**D6 — Limites do XSD, por campo.** NF-e/NFC-e (mesmo XSD): `infCpl` máx. **5000**, `infAdFisco`
máx. **2000** (`TString`). DPS (NFS-e nacional): confirmar o teto do campo equivalente no XSD do
builder `dps-xml.builder.ts` na implementação. Validar o **total concatenado por (tipo, destino)**
≤ limite — no cadastro (ao adicionar/editar) e no resolvedor antes da emissão. Impedir, nunca truncar.

**D7 — Resolução na emissão (erp-api).** `ResolveDocumentAdditionalInfoUseCase`: dado
`documentType`, busca as infos do tipo, concatena por destino (na ordem de criação, separador
definido — ex.: espaço/`; `), valida o total ≤ limite (senão erro claro), devolve
`{ infCpl?: string, infAdFisco?: string }` (undefined quando vazio). O emissor envia pronto; a
fiscal-api recebe conteúdo. Disparo real PDV→fiscal-api = **B7** (deferido).

**D8 — Builders.** `BuildNfeXmlInput` += `additionalInfo?: { infAdFisco?; infCpl? }` (cobre NF-e
**e** NFC-e — o `nfce-xml.builder` só insere o QR, não é um builder de documento separado). Emite
`<infAdic>` com `<infAdFisco>` e/ou `<infCpl>` na `xs:sequence` (infAdFisco antes de infCpl, após
`pag`); **omite `infAdic`** quando ambos vazios (não-regressão SC-005). Tetos NF-e: infAdFisco 2000,
infCpl 5000. A fiscal-api reforça o limite do XSD (defesa — coerente com B10).

**D10 — NFS-e (DPS) NÃO tem `infAdic`/`infAdFisco` (achado do XSD — decisão do usuário: opção A).**
⚠️ Correção da premissa do `.txt`: o `DPS_v1.01.xsd` não tem grupo `infAdic` nem campo
`infAdFisco`; a informação complementar é **`serv/infoCompl/xInfComp`** (`TSDescInfCompl`, **máx.
2000**, análogo do `infCpl`, dentro de `serv` após `cServ`). **Decisão (opção A):** para NFS-e só o
destino **`infCpl`** é permitido → emitido em `xInfComp`; o destino **`infAdFisco` é indisponível
para NFS-e** no cadastro (mostrado com o motivo). `BuildDpsXmlInput` += `additionalInfo?:
{ infCpl?: string }`; emite `serv/infoCompl/xInfComp` quando presente, **omite `infoCompl`** quando
vazio (não-regressão). A entidade rejeita `documentType=NFSE` com `target=INF_AD_FISCO`.

**D9 — Permissão.** Leitura `org.view`; escrita `store.catalog.manage` (texto que entra em documento
transmitido — permissão de gestão, distinta da leitura).

## Estrutura
```
apps/erp/api/
  prisma/schema.prisma            # nova FiscalAdditionalInfo
  prisma/migrations/<ts>_fiscal_additional_info/migration.sql
  src/modules/fiscal-additional-info/   # entidade/repo/usecases CRUD + ResolveDocumentAdditionalInfo
apps/erp/web/src/
  app/(app)/configuracoes/fiscal/informacoes-adicionais/page.tsx
  features/fiscal-additional-info/       # api/hooks/components (lista + abas + Dialog) + GUIA.md
services/fiscal-api/
  src/modules/nfe/infrastructure/xml/nfe-xml.builder.ts     # + infAdic
  src/modules/nfce/infrastructure/xml/nfce-xml.builder.ts   # + infAdic
  src/modules/nfse/infrastructure/xml/dps-xml.builder.ts    # + infAdic (equivalente DPS)
  + specs dos 3 builders (infAdic com infCpl/infAdFisco; limite; não-regressão sem info)
```

## Fases / Testes
- Sem NEEDS CLARIFICATION (decisões no `.txt` + D1–D9).
- fiscal-api: **builder tests** (unit) nos 3 builders — infAdic com infCpl/infAdFisco no campo
  certo; validação de limite; **não-regressão** (sem info → sem infAdic, XML idêntico).
- erp-api: jest in-memory (persistência/consulta por tipo e destino; resolvedor concatena +
  valida limite).
- erp-web: sem harness (D0) — só backend testado; documentar.
- Gates + database-reviewer (migration) + react/typescript/security reviewers.
