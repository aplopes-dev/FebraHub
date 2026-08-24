# Implementation Plan: Tela Fiscal — Certificado Digital A1

**Branch**: `010-fiscal-certificate-screen` | **Date**: 2026-08-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/erp/010-fiscal-certificate-screen/spec.md`

## Summary

Substituir o `PlaceholderPage` de `/configuracoes/fiscal` (erp-web) por uma tela real de
Certificado Digital A1, consumindo a `services/fiscal-api` (módulo `certificates`, já
pronto). A tela provisiona o Emitente automaticamente a partir da filial matriz quando ele
não existe, exibe o certificado vigente e o histórico somente-leitura, e traduz cada família
de erro em mensagem de negócio. Uma única mudança de backend: expor `platformStoreId` no
presenter de organizações da erp-api.

## Technical Context

**Language/Version**: TypeScript ~5.8 (erp-web), TypeScript 5.7 (erp-api)
**Primary Dependencies**: Next.js 16 (App Router) + React 19, `@citybox/mui`, `@tanstack/react-query` ^5, NestJS 11 (erp-api)
**Storage**: N/A neste app (erp-web é frontend; fiscal-api e erp-api já persistem)
**Testing**: **Só backend** (decisão do usuário, D0). erp-api: teste do presenter via Node test runner nativo já existente. **Frontend sem testes automatizados** — `apps/erp/web` não tem harness e o usuário optou por não bootstrapá-lo agora; gap documentado na conferência (vale para as 11 features).
**Target Platform**: Web (backoffice comércio, :3107) + erp-api (:3114)
**Project Type**: Web app (frontend Next.js) + alteração pontual de API NestJS
**Performance Goals**: interação de UI padrão; sem meta específica de throughput
**Constraints**: contrato da fiscal-api imutável; multipart deve preservar boundary (não forçar `application/json`); senha do certificado nunca persistida/logada/em URL
**Scale/Scope**: single-city Ilhéus; 1 Emitente por loja/CNPJ nesta entrega

## Constitution Check

*GATE: avaliado antes do design. Reavaliar após Phase 1.*

| Princípio | Situação | Nota |
|-----------|----------|------|
| I. Docs-as-Code (AGENTS.md) | ✅ | Atualizar `apps/erp/web/AGENTS.md` (feature nova, remoção do mock, `fiscalUpload`, harness de teste), `apps/erp/api/AGENTS.md` (campo `platformStoreId` no presenter) e criar `src/features/fiscal-certificate/GUIA.md` — no mesmo PR. |
| II. Backend-Driven Search/Pagination | ✅ N/A | A tela não pagina/pesquisa coleção grande — lista de certificados de um Emitente é pequena e vem inteira da fiscal-api (`GET …/certificates`). Sem violação. |
| III. Single Package Manager (pnpm) | ✅ | Novas devDeps de teste via `pnpm --filter @citybox/erp-web add -D …`. |
| IV. Atomic Design / DS | ✅ | DS = `@citybox/mui` (regra do app; `@citybox/ui` só onde o app já usa). Sem cor hardcoded — tokens MUI. Dropzone construído na feature (o DS não tem). |
| V. Tenant Isolation / Schemas | ✅ | Sem mudança de schema. Isolamento por `companyId` (fiscal-api) e por `X-Organization-Id` (erp-api). `platformStoreId` só é **exposto**, não criado. Sem `database-reviewer` (nenhuma migration). |

**Violações justificadas**: nenhuma. **Alteração de backend**: só o presenter (sem migration).

## Project Structure

### Documentation (this feature)

```
specs/erp/010-fiscal-certificate-screen/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # decisões (D0..D6), resolve os riscos abertos
├── data-model.md        # entidades de UI + mapeamento filial→Emitente
├── quickstart.md        # roteiro de validação manual
├── contracts/
│   └── fiscal-certificate.http.md   # contrato consumido (fiscal-api) + presenter erp-api
└── checklists/requirements.md
```

### Source Code (repository root)

```
apps/erp/web/
├── vitest.config.ts                 # NOVO (harness — ver D0)
├── vitest.setup.ts                  # NOVO (jsdom + jest-dom + MSW server)
├── src/
│   ├── test/                        # NOVO — utils (renderWithProviders, msw handlers base)
│   ├── app/(app)/configuracoes/fiscal/page.tsx   # deixa de ser PlaceholderPage
│   ├── lib/api/fiscal-client.ts     # + fiscalUpload()
│   └── features/
│       ├── fiscal-certificate/      # NOVO
│       │   ├── api/                  # dto + mapper + service (fiscalFetch/fiscalUpload)
│       │   ├── hooks/                # query-keys + queries + upload mutation + provisioning
│       │   ├── components/           # view, current-card, history-table, upload-modal, dropzone, empty-state
│       │   ├── types/
│       │   ├── lib/                  # ibge-lookup, regime-map, error-translate
│       │   ├── pages/               # FiscalCertificatePage
│       │   ├── GUIA.md              # NOVO (negócio, p/ leigo)
│       │   └── index.ts
│       ├── facilita-nfe/hooks/use-fiscal-company.ts   # reutilizado (import), não duplicado
│       └── company-settings/components/company-usage-tab.tsx  # remove seção mock + atalho
│
apps/erp/api/
└── src/modules/tenancy/infrastructure/http/routes/shared/organization.presenter.ts  # + platformStoreId
    (+ DTO/tipo correspondente no erp-web onde a organização é lida)
```

**Structure Decision**: feature nova isolada em `src/features/fiscal-certificate/` (padrão do app, §4.5 do AGENTS), reaproveitando `fiscalFetch`/proxy `/api/proxy/fiscal` já criados na feature 009 e o `useFiscalCompany()` de facilita-nfe. A alteração de erp-api é cirúrgica (um campo no presenter). O harness de teste é a única adição estrutural — ver Constitution I e research.md D0.

## Respostas obrigatórias aos itens deixados para o plano

> O prompt exige que o plano responda explicitamente. Detalhe e alternativas em `research.md`.

1. **Origem do `cityCodeIbge`** (risco #1) → **Tabela IBGE estática (city+UF → código), no frontend** (research.md **D1**).
   - Motivo: a filial **não tem** o campo, e o CEP lookup existente (BrasilAPI v1) **não devolve** IBGE (`BrasilApiCepResponse` = street/neighborhood/city/state). Um novo campo na filial seria migration Prisma na erp-api — maior que a "única alteração de backend" autorizada (presenter). Plataforma é **single-city Ilhéus** (Ilhéus/BA = `2913606`, citado no próprio DTO da fiscal-api).
   - Comportamento: mapa curado (Ilhéus + municípios BA vizinhos) por `(cidade normalizada, UF)`. **Par não encontrado → bloqueia o provisionamento** com mensagem acionável ("não foi possível determinar o código IBGE de {cidade}/{UF}; verifique a cidade no cadastro da filial matriz") — alimenta FR-009. **Nunca** chuta um código.
   - Limite declarado: fonte definitiva futura = campo `cityCodeIbge` na filial (fora de escopo desta entrega, por ser migration).

2. **Regimes MEI/ISENTO** (risco #2) → **Bloquear com mensagem** (research.md **D2**).
   - fiscal-api aceita só `SIMPLES_NACIONAL|LUCRO_PRESUMIDO|LUCRO_REAL` (company.entity.ts:4-8); filial permite também `MEI` e `ISENTO` (branch.entity.ts:9-15). Os três comuns mapeiam 1:1; `MEI`/`ISENTO` → provisionamento bloqueado (FR-008) com texto explicando a incompatibilidade e o caminho (ajustar regime na filial / entrega futura). Nunca mapear para um regime arbitrário.

3. **`platformStoreId` nullable** (risco #3) → **Expor no presenter + estado de tela dedicado** (research.md **D3**).
   - `Organization.platformStoreId: string | null` já existe (organization.entity.ts:43); só falta no `OrganizationPresenter.toHttp`. Adicionar o campo (única mudança de backend). Quando `null`, a tela mostra "loja ainda não habilitada para a parte fiscal" e **não** tenta provisionar (FR-007).

4. **`Company.cnpj`/`storeId` únicos** (risco #4) → **Provisiona só o Emitente da matriz; limite declarado** (research.md **D4**).
   - Um Emitente por `storeId` (platformStoreId) e por CNPJ. Filiais com CNPJ próprio exigiriam Emitentes distintos → fora desta entrega. Erros da API (`StoreAlreadyHasCompanyError`/`CnpjAlreadyRegisteredError`) são tratados como "Emitente já existe" (recarrega e segue), nunca como falha opaca.

## Complexity Tracking

Nenhuma violação constitucional a justificar. O harness de teste de frontend do `apps/erp/web`
**não** será adicionado (decisão do usuário, research.md **D0**): testa-se só o backend
(presenter). A seção TESTES do prompt fica não atendida no frontend por decisão explícita —
registrado na conferência.

## Phase 0 — Outline & Research

Consolidado em [research.md](./research.md): D0 (harness de teste), D1 (IBGE estático),
D2 (regime block), D3 (platformStoreId), D4 (unicidade), D5 (`fiscalUpload` multipart),
D6 (reuso de `useFiscalCompany`).

## Phase 1 — Design & Contracts

- [data-model.md](./data-model.md): entidades de UI (Certificado, Emitente, Filial matriz) + regras de derivação filial→payload de Emitente + estados de tela.
- [contracts/fiscal-certificate.http.md](./contracts/fiscal-certificate.http.md): endpoints consumidos (fiscal-api, imutáveis) + a mudança do presenter da erp-api.
- [quickstart.md](./quickstart.md): roteiro de validação manual dos 4 cenários de sucesso + famílias de erro.

**Post-Design Constitution Re-check**: sem novas violações. Docs-as-Code pendente na entrega (AGENTS.md ×2 + GUIA.md).
