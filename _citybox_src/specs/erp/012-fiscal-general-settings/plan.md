# Implementation Plan: Configurações Gerais Fiscais

**Branch**: `012-fiscal-general-settings` | **Date**: 2026-08-13 | **Spec**: [spec.md](./spec.md)

## Summary

Terceira aba de `/configuracoes/fiscal` ("Configurações gerais") no erp-web: edita os dados fiscais
do Emitente (regime/CRT, IE, IM, ambiente, autXML, NFS-e nacional) via `PUT /v1/companies/{id}`,
e o CSC via `PUT /v1/companies/{id}/csc` (write-only). Campos sem backend renderizados
desabilitados ("em breve"). Backend: **tornar explícito e testado** que o update do Emitente
persiste `accountingOfficeDocument` e `nationalNfseEnabled` (hoje só via `Object.assign`).

## Technical Context
- **fiscal-api**: NestJS 11, Prisma 7.8. Endpoints já existem (`PATCH /v1/companies/:id`, `PATCH …/csc`).
- **erp-web**: Next 16/React 19, `@citybox/mui`, React Query, proxy `/api/proxy/fiscal`.
- **Testing**: só backend (D0) — teste do update-company (contrato explícito).

## Constitution Check
| Princípio | Situação |
|---|---|
| I. Docs-as-Code | ✅ `apps/erp/web/AGENTS.md` (feature + 3ª aba) + `services/fiscal-api/AGENTS.md` (contrato de update explícito) + GUIA.md. |
| II. Backend-driven | ✅ N/A (form de um Emitente, sem coleção). |
| III. pnpm | ✅ |
| IV. DS | ✅ `@citybox/mui`; sem cor hardcoded. |
| V. Tenant/Schema | ✅ **Sem migration** (campos já existem no schema). `fiscal.companies.manage` + isolamento por companyId. Sem `database-reviewer` (nenhuma migration). |

## Decisões (itens deixados ao plano)

**D1 — Onde moram os campos sem backend (QUESTÃO ABERTA do .txt).**
Regra de decisão registrada: **identidade/cadastro do Emitente → fiscal-api**; **default de
comportamento de emissão → erp-api** (que monta o pedido). Concretamente:
- **fiscal-api** (identidade fiscal do contribuinte): Isento IE, Inscrições Estaduais do Substituto
  Tributário (lista por UF), Intermediadores da transação, Dados de pagamento (UF/CNPJ do
  estabelecimento/beneficiário), habilitar venda de gás/medicamentos (regime especial do emitente).
- **erp-api** (defaults de emissão, hoje por-emissão ou hardcoded no builder): indicador de
  consumidor final/presença (`indFinal`/`indPres`), modalidade de frete (`modFrete`, hoje `'9'`
  hardcoded), frete na base de PIS/COFINS, IPI na base, base de cálculo (desc. incondicionado×
  condicionado), taxa de serviço/garçom na NFC-e, lote/validade/GTIN na NF, cliente padrão
  contribuinte de ICMS, alíquota de crédito, justificativas padrão (inutilização/cancelamento/
  contingência) e "contador inutiliza notas", envio automático de XML/DANFE.
Cada um vira backlog nomeado (campo no schema + migration + DTO + uso no builder), no serviço
indicado acima. **Não implementar nesta feature.**

**D2 — Contrato de update explícito (FR-010).**
`accountingOfficeDocument` e `nationalNfseEnabled` já persistem via `Object.assign` no
`Company.update`, mas o tipo `UpdateCompanyInput` (entity) e o `UpdateCompanyDto` (application) não
os listam. Adicionar ambos aos dois tipos e cobrir com teste de use case (PUT persiste
regime/IE/IM/ambiente/autXML/nationalNfseEnabled). Sem mudança de comportamento — só torna o
contrato explícito e testado.

**D3 — Abas.** `/configuracoes/fiscal` passa a ter 3 abas: `certificado`, `geral`, `series`
(`?aba=`). Reusa o container `fiscal-tabs.tsx` (da 011); adiciona a aba `geral` → `FiscalSettingsTab`.

**D4 — CSC.** Bloco próprio, `PUT …/csc`. Leitura só `cscConfigured`. Token só no estado do form,
descartado após envio; nunca em queryKey/cache/URL/log.

**D5 — CRT.** Select com 3 opções fixas exibindo o CRT; valor salvo é o `taxRegime`.

## Estrutura
```
services/fiscal-api/src/modules/companies/
  domain/entities/company.entity.ts            # UpdateCompanyInput += accountingOfficeDocument, nationalNfseEnabled
  application/dtos/company.dto.ts               # UpdateCompanyDto += accountingOfficeDocument
  application/use-cases/update-company/*.spec.ts # teste do contrato (novo/estendido)
apps/erp/web/src/
  app/(app)/configuracoes/fiscal/fiscal-tabs.tsx   # + aba "geral"
  features/fiscal-settings/                     # api/hooks/components/types/lib + GUIA.md
```

## Phase 0/1
Sem NEEDS CLARIFICATION. Contratos consumidos (existentes): `GET /v1/companies?cnpj=` (traz
`cscConfigured`, `taxRegime`, `stateRegistration`, `municipalRegistration`, `defaultEnvironment`,
`accountingOfficeDocument`, `nationalNfseEnabled`), `PATCH /v1/companies/:id`, `PATCH …/csc`.
Post-design Constitution: sem migration → sem database-reviewer.
