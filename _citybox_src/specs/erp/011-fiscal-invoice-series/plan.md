# Implementation Plan: Séries e Numeração de Notas Fiscais

**Branch**: `011-fiscal-invoice-series` | **Date**: 2026-08-12 | **Spec**: [spec.md](./spec.md)

## Summary

Expor `FiscalSequence` (já existente e usada na emissão) ao lojista: endpoints CRUD na fiscal-api
(list/create/edit-number/deactivate-reactivate/delete) com **`active` passando a bloquear a
emissão** e **auditoria da alteração de número** (tabela nova), e uma aba **Séries** na página
`/configuracoes/fiscal` do erp-web (que passa a ter abas com a aba ativa na URL; Certificado da
feature 010 vira a outra aba). A reserva de número continua exclusiva do fluxo de emissão.

## Technical Context

- **fiscal-api**: NestJS 11, Prisma 7.8 (schema `fiscal`), Node test runner + Postgres real.
- **erp-web**: Next 16 / React 19, `@citybox/mui`, React Query, proxy `/api/proxy/fiscal`.
- **Testing**: backend (Postgres real) — decisão D0 (só backend). Frontend sem harness.

## Constitution Check

| Princípio | Situação |
|---|---|
| I. Docs-as-Code | ✅ `services/fiscal-api/AGENTS.md` (endpoints + `active` efetivo + auditoria) e `apps/erp/web/AGENTS.md` (feature + abas) + GUIA.md. |
| II. Backend-driven | ✅ lista por Emitente é pequena (poucas séries); sem paginação necessária. |
| III. pnpm | ✅ |
| IV. DS | ✅ `@citybox/mui`; sem cor hardcoded. |
| V. Tenant / Schema | ⚠️ **Migration Prisma** (tabela de auditoria) → **`database-reviewer` obrigatório**. UUID v7 default. Isolamento por `companyId`. |

## Decisões (resolvem os itens deixados ao plano)

**D1 — Abas em `/configuracoes/fiscal` com aba ativa na URL.**
A página vira um container de abas MUI. Aba ativa via query param `?aba=` (`certificado` | `series`,
default `certificado`), lida com `useSearchParams` e trocada com `router.replace` (sem recarregar).
A feature 010 (certificado) vira o conteúdo da aba `certificado`; a nova aba `series` recebe a lista/
form. Sem rota/leaf novo (FR-011). Refatoração mínima da page 010: extrair o corpo atual para um
componente de aba e envolver num `FiscalTabs`.

**D2 — Auditoria da alteração de número: tabela nova (migration).**
`model FiscalSequenceNumberChange` (schema `fiscal`): `id` (uuid v7), `sequenceId` (FK), `companyId`,
`previousNumber` (BigInt), `newNumber` (BigInt), `changedByUserId` (string, do JWT), `changedAt`
(timestamptz). Gravada na mesma transação da alteração. Migration hand-written escopada (padrão da
spec fiscal/001), aplicada e registrada; **database-reviewer** roda no gate.

**D3 — `active` passa a bloquear a emissão.**
Cada `reserveNextNumber` (nfe/nfce/nfse) após `findByKey`: se `existing && !existing.active` →
lança `SeriesInactiveError` (nome contém `…Error`; mapeado pelo `AppExceptionFilter` — usar sufixo
que caia em 422/409 apropriado; provavelmente um DomainError → 422). Criação sob demanda (existing
null) permanece `active:true` (FR-007/SC-007 não-regressão).

**D4 — Normalização de `series` casada com a emissão.**
A emissão persiste `series` **sem** zeros à esquerda (`'1'` em `issue-nfe.use-case.ts:99`). Para a
tela editar/gerir a MESMA sequência que a emissão usa, o `series` é **canonicalizado** removendo
zeros à esquerda (numérico), 1–3 dígitos (limite SEFAZ NF-e/NFC-e). Ex.: entrada "001"/"01"/"1" →
canônico `"1"`. **Exibição** na tela: padded a 3 ("001"). O create rejeita não-numérico e >3 dígitos
com mensagem. ⚠️ **Limite conhecido**: a emissão hoje usa série fixa por tipo (`'1'`); gerir o número
dessa série (caso de migração — continuar de 4520) é o valor real e funciona. Criar séries com outro
número/nome fica armazenado mas só será selecionável quando a emissão suportar escolha de série
(fora de escopo) — registrar honestamente.

**D5 — Permissões.** Leitura: `fiscal.documents.view`. Escrita (criar/editar número/desativar/
excluir): **`fiscal.sequences.manage`** (nova, distinta — FR-010).

**D6 — Repositório.** Adicionar ao `FiscalSequenceRepository`: `findAllByCompany(companyId,
environment?)`, `findById(id)`, `delete(id)`, e um método/uso transacional para gravar a auditoria
junto do `save`. Atualizar impl Prisma + in-memory (usada nos testes de emissão).

## Estrutura

```
services/fiscal-api/
├── prisma/schema.prisma                 # + model FiscalSequenceNumberChange
├── prisma/migrations/<ts>_fiscal_sequence_number_change/migration.sql
├── src/modules/fiscal-sequences/        # novo módulo (ou dentro de fiscal-documents)
│   ├── domain/ (errors: SeriesInactiveError, SeriesNumberDecreaseError, SeriesInUseError, SeriesDuplicateError; audit entity/repo)
│   ├── application/use-cases/ (list, create, update-number, set-active, delete)
│   └── infrastructure/http/routes/ (list, create, update-number, set-active, delete)
├── src/modules/fiscal-documents/domain/repositories/fiscal-sequence.repository.interface.ts  # + métodos
├── src/modules/fiscal-documents/infrastructure/database/prisma-fiscal-sequence.repository.ts # + impl
├── src/modules/{nfe,nfce,nfse}/.../issue-*.use-case.ts   # enforce active (D3)
apps/erp/web/src/
├── app/(app)/configuracoes/fiscal/page.tsx   # tabs container (?aba=)
├── features/fiscal-certificate/…             # vira aba "certificado" (extrair corpo)
└── features/fiscal-invoice-series/           # nova aba "series" (api/hooks/components/pages/lib/GUIA.md)
```

## Phase 0/1 — resumo

Sem NEEDS CLARIFICATION. Contratos: endpoints REST sob `/v1/companies/{companyId}/sequences`
(list com `?environment=`, POST create), `/v1/sequences/{id}` (PATCH number, PATCH active, DELETE).
Data model: `FiscalSequence` (existente) + `FiscalSequenceNumberChange` (nova). Post-design
Constitution: migration → database-reviewer no gate.
