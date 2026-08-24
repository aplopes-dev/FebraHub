# AGENTS.md — Feature Clinic (UI da vertical Clínica)

> ⚠️ **Migrado do ERP em 2026-07-29.** Este arquivo veio do módulo `clinic` do
> antigo shell multi-vertical `apps/erp` (removido em 2026-07-31 — `apps/erp`
> foi reaproveitado como novo nome de `apps/erp-comercio`). Caminhos e rotas
> foram reescritos para o app dedicado `@citybox/clinica-web` (rotas na
> **raiz**, sem `/clinic`), mas o texto é longo e pode conter resquícios da
> fase multi-vertical — corrija ao encontrar. **A cópia original no ERP legado
> não existe mais — este arquivo é a única fonte de verdade.**
>
> **Para agentes de IA:** Este arquivo é a fonte de verdade sobre a **camada de
> frontend/UI da clínica** (`apps/verticals/clinica/web/src/features/clinic/`).
> Leia-o integralmente antes de qualquer ação. Ao modificar código nesta pasta,
> atualize as seções relevantes na mesma operação. Nunca remova seções — apenas
> atualize ou adicione.
>
> **Escopo deste arquivo:** apenas a **interface**. O backend `clinica-api`
> (`apps/verticals/clinica/api`) expõe configurações e **cadastro base de pacientes**
> (jul/2026). A UI consome via proxy `/api/proxy/clinica` (header `X-Store-Id`), com
> mocks como fallback apenas onde o backend ainda não existe. Shell, proxies,
> auth e envs em [`apps/verticals/clinica/web/AGENTS.md`](../../AGENTS.md).

---

## 1. Identidade do Módulo

| Campo            | Valor                                                        |
| ---------------- | ------------------------------------------------------------ |
| **Nome**         | `apps/verticals/clinica/web/src/features/clinic` — UI da vertical **Clínica**  |
| **Tipo**         | Feature slice (frontend) do `@citybox/clinica-web` · gestão de clínicas/consultórios |
| **Backend**      | `clinica-api` (🟡 parcial) via proxy `/api/proxy/clinica` (header `X-Store-Id`) |
| **Permissão**    | CASL `@citybox/clinica-permissions` — sidebar/rotas via `createClinicNavPermissions` + `usesStorePermissionsApi` (`members/me`) |

| **Rota base**    | `/`                                                    |
| **Tema**         | Cyan `#0891b2` (`CLINIC_THEME`)                              |
| **Status**       | 🟡 **Configurações** + **Pacientes** + **Agenda** + **Estoque** + **Financeiro (fluxo de caixa + Transações + Comissões API)** + **Vendas (CRM)** + **Marketing** (`form_lead` + Aniversariantes WhatsApp + **Indicações API**) + **WhatsApp Baileys MVP** + **Dashboard Indicadores (`/clinic`) via API** (KPIs + cards `GET /v1/dashboard/*`; freshness React Query); **Relatórios (`/clinic/relatorios`) parcial API** (Aniversariantes, procedimentos abertos, orçamentos aprovados/em aberto; demais catálogo mock); **Tarefas (`/clinic/tarefas`) Consultas canceladas via API**; ficha (orçamentos/**Prontuário**/anamnese/documentos/financeiro/arquivos) via API |
| **Última atualização deste arquivo** | 2026-08-21 — Fluxo de caixa UX + ícone contrato orçamentos + PDFs |


**Propósito em uma linha:**
Backoffice **de clínicas e consultórios**. Duas camadas coexistem: (a) **Configurações**
(perfil da clínica, equipe, planos, anamneses, contratos) que consome a `clinica-api` via
React Query; e (b) **features de produto** — **Agenda**, **Estoque**, **Financeiro**, **Vendas (CRM)**
e **Marketing** integradas à `clinica-api` por `clinicaFetch`/BFF público.

> **Dois modelos de dados nesta vertical:**
> 1. **Configurações + Pacientes + Agenda + Estoque + Financeiro (caixa + Transações + Comissões) + Vendas + Marketing backoffice** → **TanStack Query + `clinicaFetch`** (`/v1/*`).
> 2. **Marketing público** → BFF `/api/public/clinic/campaigns/*` → rotas públicas da
>    `clinica-api`; QR Code é a única geração local (client-side), não um mock.

---

## 2. Posição no ERP

```
apps/verticals/clinica/web/src/
├── app/(clinic)/                   ← rotas Next.js da vertical (layout + _shell + [...segments])
├── features/clinic/              ← VOCÊ ESTÁ AQUI (UI da vertical Clínica)
│   ├── manifest.ts               ← VerticalManifest (registrado no registry lazy)
│   ├── layout/clinic-erp-layout  ← shell próprio (AppSidebar 1 coluna + fillViewport — §5.4)
│   ├── components/               ← clinic-settings-nav · clinic-compact-switch
│   ├── lib/                      ← theme · icons · navigation · clinic-sheet-styles
│   ├── pages/                    ← dashboard (adaptador fino) · placeholder · settings (roteadores de aba)
│   ├── shared/api/               ← clinicaFetch / clinicaUpload (settings + pacientes)
│   ├── modules/dashboard/        ← Dashboard em rotas: Indicadores `/` + Relatórios/Tarefas
│   ├── modules/settings/         ← clínica · team · plans · anamneses · contracts · categories
│   ├── modules/patients/         ← lista + cadastro API; ficha 7 abas (Sobre/orçamentos/tratamentos/anamnese/documentos/financeiro/arquivos = API)
│   ├── clinic-sheets.css         ← CSS dos sheets (animações/overlay) — ver §7
│   │
│   │ # ─── Features de produto ───
│   ├── agenda/                   ← Agenda + encaixe + alerta de retorno (`clinicaFetch` → `/v1/appointments*`, etc.)
│   ├── vendas/                   ← CRM kanban (`sales.api.service.ts` → `/v1/funnels|opportunities|labels`)
│   ├── estoque/                  ← Estoque/DataTable (via `clinica-api`)
│   ├── financeiro/               ← Fluxo de caixa + Transações + **Comissões** via `financial.api.service` / `comissoes/services/commissions.api.service`
│   ├── loja/                     ← Pacotes de Comunicação (saldo + solicitar + relatório via API)
│   └── marketing/                ← Comunicação (`campaigns/`) + Indicações API (`indicacoes/`) + `ComunicacaoNav`
├── features/shared/team/         ← base de equipe compartilhada (clinic estende — §5.5)
└── lib/ · shell/                 ← infra do ERP — ver apps/verticals/clinica/web/AGENTS.md
```

> Rotas correspondentes em `app/(clinic)/`: `agenda/`, `vendas/`, `estoque/`,
> `financeiro/{fluxo-de-caixa,transacoes,comissoes,configuracoes}`, `loja/` (+ `assinatura-eletronica`),
> `marketing/{campaigns,campaigns/new,campaigns/[id],indicacoes}`
> (`/marketing` redireciona para campaigns; PageNav Comunicação | Indicações),
> além da **rota pública** do formulário de captação em `app/campanha/[clinic]/[slug]`.

---

## 3. Stack de UI (herda do ERP)

Mesma stack do `apps/verticals/clinica/web` (Next.js 16, React 19, Tailwind v4 com `tailwind.config.ts`,
`@citybox/ui`). Específico desta feature:

| Aspecto | Situação no clinic |
| ------- | ------------------ |
| **Server state** | **TanStack Query** + `clinicaFetch` (settings, pacientes, agenda, estoque, financeiro caixa/Transações/Comissões, vendas, marketing backoffice); form público/submissões via BFF. |
| **Formulários** | **Pacientes:** RHF + Zod (`patient-form.schema.ts`). Demais settings ainda legado (`use-*-form.ts`) — migrar ao tocar. |
| **Sheets** | Forte uso de **Side Sheets** (`@citybox/ui`) com variantes próprias (floating, nested, fullscreen-bottom) — estilos em `lib/clinic-sheet-styles.ts` + `clinic-sheets.css`. |
| **Tabelas** | `DataTable` (`@citybox/ui`) em planos, anamneses, contratos e categorias; estilos via `erpDataTableStyleProps` (`features/shared/lib/data-table-styles.ts`) — cabeçalhos alinhados ao conteúdo (`text-left`; última coluna `text-right` para Ações). |

---

## 4. Estrutura de Pastas

~42 arquivos `.ts/.tsx`. Quase tudo concentrado em `modules/settings`.

```
features/clinic/
├── manifest.ts                   ← id:'clinic', permissão vertical.clinic.view, brand/theme (cyan), navModules, navDefaults
├── clinic-sheets.css             ← CSS de sheets (overlay aninhado, animação fullscreen-bottom) — só no layout
├── layout/clinic-erp-layout.tsx  ← shell: AppSidebar de 1 coluna + logo temático + breadcrumb
├── components/
│   ├── clinic-settings-nav.tsx   ← abas Configurações via PageNav `scrollMode="buttons"` (setas < >)
│   └── clinic-compact-switch.tsx ← Switch compacto (h-5 w-9) p/ toggles de status
├── lib/
│   ├── theme.ts                  ← CLINIC_THEME (cyan #0891b2)
│   ├── icons.ts                  ← resolvedores de ícone Lucide (sidebar/seções/abas)
│   ├── navigation.ts             ← CLINIC_NAV_MODULES (Clínica + Administrativo)
│   └── clinic-sheet-styles.ts    ← classes Tailwind por tipo de sheet (floating/nested/narrow/fullscreen/footer)
├── pages/
│   ├── dashboard-page.tsx        ← reexport fino → modules/dashboard/pages/clinic-dashboard-page
│   ├── placeholder-page.tsx      ← fallback de rota sem página
│   └── settings/                 ← roteadores que delegam para os módulos de settings
├── shared/api/
│   └── clinica-client.ts         ← clinicaFetch / clinicaUpload; 403 mutation → modal PermissionDeniedDialog (OK = reload)
├── modules/dashboard/            ← 🟢 Indicadores `/` via API (ver §8.2); Relatórios parcial API em `reports/`; Tarefas = card Consultas canceladas via `GET /v1/dashboard/tasks/cancelled-appointments` em `tasks/`; freshness + invalidate em mutações financeiras
│   ├── pages/clinic-dashboard-page.tsx · clinic-reports-page.tsx · clinic-dashboard-section-page.tsx
│   ├── components/               ← KPI · receitas · financeiro · pacientes · metas · orçamentos
│   ├── reports/                  ← Aniversariantes + procedimentos abertos + orçamentos aprovados/em aberto/reprovados + vendas por especialidade/plano via API; demais tabelas mock; Accordion + scroll tablet
│   ├── data/                     ← mock-clinic-dashboard · fixtures só testes/lib legado · …
│   ├── lib/                      ← summary · sales-goals · budget-analysis · PDFs
│   └── types/clinic-dashboard.ts
└── modules/settings/
    ├── pages/clinica-settings-page.tsx  ← aba "Clínica" (perfil)
    ├── lib/use-clinic-settings-state.ts ← React Query (getClinicProfile/upsert) + mock default
    ├── data/mock-clinic-settings.ts
    ├── anamneses/  (≈8 tsx · 🟡)  ← templates de anamnese (perguntas globais + customizadas, sortable)
    ├── team/       (≈9 tsx · 🟢)  ← equipe (estende shared/team: permissões granulares + horários)
    ├── plans/      (≈10 tsx · 🟡) ← planos de tratamento (especialidades, tratamentos, valores BRL)
    └── contracts/  (≈5 tsx · 🟡)  ← contratos (editor fullscreen-bottom, variáveis)
```

### 4.1 Anatomia de um sub-módulo de settings
```
modules/settings/<sub>/
├── pages/<sub>-settings-page.tsx ← container: hook de estado + tabela + sheet
├── components/                   ← table · sheet (form) · sidebars/panels · dialogs · sortable rows
├── lib/{use-<x>-form.ts, <x>-ui.ts, factories, resolvers}  ← form LEGADO + helpers de UI/domínio
├── services/<x>.service.ts       ← clinicaFetch para /v1/clinic-* (perfil/planos/anamneses/contratos)
├── types/<x>.ts                  ← tipos de domínio
├── hooks/                        ← React Query (use-*-queries) + use-*-management
└── data/mock-clinic-<x>.ts       ← defaults/exemplos da UI
```

### 4.2 Features de produto

A **Agenda**, o **Estoque**, o **Financeiro (fluxo de caixa + Transações + Comissões)**,
as **Vendas (CRM)** e o **Marketing** consomem a `clinica-api`.

| Feature | Arqs | Dados | Rota | Destaques |
| ------- | ---- | ----- | ---- | --------- |
| **agenda** | ~95 | `agenda/api/*` via **`clinicaFetch`**; equipe → `shared/team` (platform-api); pacientes → `modules/patients`; horário → `clinic-profile` | `/clinic/agenda` | Calendário, sheet de agendamento, encaixe, alerta de retorno, slots disponíveis |
| **vendas** | ~55 | `services/sales.api.service.ts` (`clinicaFetch`) | `/clinic/vendas` | CRM kanban; `sortOrder`/`reorder`; colunas terminais fixas; período custom (dia civil BRT); `KanbanProvider.onCardDrop`; cards com `budgetId` **não** dropam em Ganha/Perdida (toast + revert); origem `budget` → **Orçamento**; marketing reusa `useFunnels` |
| **estoque** | ~45 | `services/stock.api.service.ts` via `clinicaFetch`/`clinicaUpload` | `/clinic/estoque` | `DataTable` + `erpDataTableStyleProps` + ordenação asc/desc server-side; `StockPaginationBar` (10/20/50/100); entrada/retirada; fornecedores (`SupplierSelect`); histórico de retiradas (`WithdrawalTable`) |
| **financeiro** | ~80 | caixa + transações + **comissões API** | `/clinic/financeiro/{fluxo-de-caixa,transacoes,comissoes,configuracoes}` | Fluxo de caixa + contas/categorias + Transações + **Comissões** (`comissoes/services/commissions.api.service.ts` + React Query); Em aberto/Histórico; regras na Equipe; **Exportar PDF** (fluxo + Transações, `build-cash-flow-pdf` / `build-transactions-pdf`); **`FinancialNav`** |
| **loja** | ~20 | `services/signature-packages.api.service.ts` + `electronic-signatures-report.api.service.ts` (`clinicaFetch`); catálogo `ASSINATURA_PACKAGES` | `/loja` + `/loja/assinatura-eletronica` | Saldo; Solicitar; card cinza (`AssinaturaSolicitacoesCard`) + modal `DataTable` paginado (Data/Assinatura/Status; Pendente/Aprovado/Recusado); relatório documentos; sem CASL dedicado |
| **marketing** | ~100 | `campaigns.api.service.ts` + `indicacoes.api.service.ts` (`clinicaFetch`) + BFF público | `/marketing/campaigns*` + `/marketing/indicacoes` + `/campanha/[clinic]/[slug]` | Leaf **Marketing**; **`ComunicacaoNav`** (Comunicação \| Indicações); campanhas `form_lead` + Aniversariantes; **Indicações** API: KPIs + tabelas server-side (§8.1) + PDF pacientes + WhatsApp + modal pacientes por indicador |

**Padrão de substituição de componentes (obrigatório ao criar/tocar):**

1. **Campos** — os campos `input-field`, `select-field`, `textarea-field`, `date-picker-field`,
   `number-field`, `multiple-selector-field`, `time-picker-field` usam equivalentes do
   `@citybox/ui`, **sempre com um `Label` fixo acima** (nunca label flutuante). Dois modos,
   ambos válidos:
   - **inline** (agenda, vendas, estoque): `<div className="flex flex-col gap-1.5"><Label className={cn(error && "text-destructive")}>{label}</Label><Input aria-invalid={error} .../></div>`.
   - **vendorizado** em `_ui/fields.tsx` (financeiro, marketing): wrappers `TextField/NumberField/TextareaField/SelectField/DatePickerField/MultipleSelectorField`.
   - Mapeamentos: money → `CurrencyInput` (molecule); data → `DatePicker` (molecule); multi → `MultiSelect` (molecule); número → `Input type="number"`.
2. **Modais/Sheets** — `@/components/modals/{dialog-modal,sheet-modal}` e `@/components/ui/modal`
   viram `ModalForm`/`ConfirmDialog`/`Sheet` do `@citybox/ui`, ou **wrappers vendorizados** em
   `marketing/campaigns/_ui/{dialog-modal,sheet-modal,modal}.tsx` (reproduzem a API original).
3. **Sem equivalente no `@citybox/ui`** → vendorizar em `_ui/` (ex.: marketing tem `stepper`,
   `key-value`, `page-container`, `format`, `use-can`, `use-upload`, `campaign-view-cookie`).
4. **Navegação horizontal de seção** → `PageNav` (financeiro + marketing/`ComunicacaoNav`).
   Financeiro/dashboard/settings: breakout `-mx-4 -mt-4 bg-background px-4` na própria nav.
   Marketing: `app/(clinic)/marketing/layout.tsx` faz `-m-4` + `min-h-[calc(100%+2rem)]`
   (cancela o `p-4` da main, inclusive rodapé) e **não** usa overflow interno — a `main`
   scrolla e as abas somem ao descer. Nav: `bg-background px-4`.
   **Não** usar `sticky` — ver §5.8.
5. **Rotas/paths** — reescrever `/marketing/...` → `/marketing/...` e imports
   `@/features/marketing/...` → `@/features/clinic/marketing/...` (idem para as outras).
6. **Cross-feature** — marketing depende dos **funis de vendas**: importa de
   `@/features/clinic/vendas/{hooks/use-funnels,services/sales.service}` (não recriar).

---

## 5. Restrições Críticas (UI clinic)

> Herdam as restrições gerais do ERP (`apps/verticals/clinica/web/AGENTS.md` §5). Específicas daqui:

### 5.1 Acesso à API só via `clinicaFetch`/`clinicaUpload`
```ts
import { clinicaFetch, clinicaUpload } from '@/features/clinic/shared/api';
await clinicaFetch<T>(storeId, '/v1/clinic-plans');   // → /api/proxy/clinica/v1/clinic-plans (X-Store-Id)
// Endpoints em uso: /v1/clinic-profile (+ /logo), /v1/clinic-plans, /v1/anamnesis-*,
//                   /v1/patients, /v1/patient-categories, /v1/patient-referral-origins, /v1/appointments*, /v1/internal-events*,
//                   /v1/fit-ins*, /v1/return-alerts*, /v1/appointment-categories, /v1/available-slots,
//                   /v1/stock-suppliers, /v1/stock-products*, /v1/stock-entries*, /v1/stock-withdrawals,
//                   /v1/stock-movements, /v1/stock-stats.
// ❌ chamar a clinica-api direto · ❌ esquecer o storeId · ❌ logar CPF/RG/telefone em console
```

### 5.2 Backend parcial — mocks só onde não há API
```
clinica-api implementa configurações, pacientes, orçamentos, tratamentos/evoluções (CLIN-041 Fase 1),
anamnese preenchida, documentos emitidos, financeiro da ficha, arquivos/drive, estoque e **agenda**
(CLIN-020/021 — módulo `scheduling`).
Lista/cadastro/categorias/aba Sobre, abas Orçamentos, Prontuário (rota `tratamentos`), Anamnese, Documentos, Financeiro
e Arquivos usam API real com busca/paginação server-side (§5.11). **Agenda** (`/agenda`) usa
`clinicaFetch` para appointments, internal-events, fit-ins, return-alerts, categories e available-slots.
Alertas de retorno na ficha do paciente também via API (`return-alerts?patientId=`).
**Vendas** (`/vendas`) via `sales.api.service.ts` → `/v1/funnels`, `/v1/opportunities`, `/v1/labels`.
Ordem dos cards: `sortOrder` + `useReorderOpportunities` / `PATCH …/reorder` (+ move com `sortOrder`).
Etapas **Agendada/Ganha** e **Perdida** fixas no fim (não arrastáveis); novas etapas só antes delas.
Filtro **Escolher período**: datas `yyyy-MM-dd` (`formatLocalDateString`); API = dia civil BRT; date pickers na mesma linha do select.
Modal editar etapa: cor pré-selecionada (normaliza hex UPPERCASE da API).
Financeiro global (fluxo de caixa + Transações + Comissões) via API (`v1/financial/*`, `v1/commissions/*`, `v1/team/:id/commission-rules`).
Marketing ponta a ponta: backoffice em `campaigns.api.service.ts` → `/v1/campaigns`;
form/submissão/views públicos pelo BFF `/api/public/clinic/campaigns/*` (§5.7).
```

### 5.11 Listagens — busca e paginação sempre no backend

> Política global: `AGENTS.md` raiz §8.1. **Nunca** `filter*` / `.slice()` no React para dados da API.

```
Pacientes (lista): patients-page.tsx → GET /v1/patients (page, perPage, search, sortBy, sortOrder).
Orçamentos (ficha): patient-budgets-tab.tsx → GET /v1/patients/:id/budgets (mesmos params).
Anamneses (ficha): patient-anamnesis-tab.tsx → GET /v1/patients/:id/anamneses (mesmos params; search em templateName).
Financeiro (ficha): patient-financial-tab.tsx → GET /v1/patients/:id/financial-entries
  (page, perPage, search, status, periodFrom, periodTo, sortBy, sortOrder; meta.totals).
Transações (global): transactions-page.tsx → GET /v1/financial/entries (page, perPage, dateField=paidAt, statuses=paid,received)
  + GET /v1/financial/entries/by-payment-method; paginação server-side na visão detalhe.
Debounce: hooks/use-debounced-search.ts (PATIENT_LIST_SEARCH_DEBOUNCE_MS = 400).
Queries de lista: keepPreviousData para evitar flash ao digitar/paginar.
DataTable (@citybox/ui): com barra de paginação externa, SEMPRE manualPagination + pageIndex/pageCount/totalRowCount
  — senão getPaginationRowModel() fatia no cliente (bug: perPage 20 exibe só 10 linhas).
  Referências: patients-table, patient-budgets-table, patient-anamneses-table, patient-financial-table,
  stock-table, withdrawal-table (histórico de retiradas).
Tratamentos (ficha): paginação client-side via paginateTreatments() antes da lista — não usa DataTable paginado.
Estoque (listagem): stock-listing.tsx → GET /v1/stock-products (page, perPage, search, sortBy, sortOrder).
  Debounce 400ms na busca; barra StockPaginationBar externa; cabeçalhos com erpDataTableStyleProps + StockSortableHeader.
Histórico retiradas: GET /v1/stock-movements (type=withdrawal, startDate/endDate yyyy-MM-dd, sortBy, sortOrder).
  Datas: formatLocalDateString (agenda/lib/local-date.ts); backend interpreta dia civil inteiro (T00:00–T23:59:59.999Z).

❌ Removido legado search-patients.ts e filter-patient-budgets.ts (filtro client-side morto).
❌ Removidos patient-anamnesis-mock-store.ts, public-anamnesis-token-registry.ts e patient-financial-mock-store (jul/2026).
❌ Não recriar helpers de busca/paginação local para endpoints que já listam no servidor.
```

### 5.9 Pacientes — integração API (jul/2026)
```
modules/patients/services/{patients,patient-categories,patient-referral-origins,patient-external-professionals}.service.ts → clinicaFetch/clinicaUpload.
Hooks: use-patients-list-query, use-patient-detail-query, use-patient-mutations, use-patient-photo-mutations, use-patient-categories-query, use-patient-referral-origins-query (+ create mutation via `usePatientReferralOrigins`), use-patient-external-professionals-query (+ create via `usePatientExternalProfessionals`).
Lista: busca/ordenação/paginação server-side (GET /v1/patients); barra custom patients-pagination-bar (10/20/50/100).
Inativar/reativar via PATCH /status (sem DELETE). Formulários: RHF + Zod; só nome obrigatório; gênero default male.
Menu ⋮ da lista: status `active` → Inativar; `inactive` → Ativar (`patient-status-toggle.ts`).
**Origem do paciente (cadastro):** select estilo categoria (`PatientReferralOriginField`) alimentado por `GET /v1/patient-referral-origins`; footer **Nova origem** → `POST /v1/patient-referral-origins` (sem página em Configurações). Labels vêm da API (`name`); `systemKey` `indicacao` exige paciente indicador (`PatientSearchField`, debounce 400ms); `indicacao_profissional` exige membro da equipe (`ProfessionalSearchField`, filtro client-side após debounce, mín. 2 caracteres); `indicacao_profissional_externo` exige profissional do catálogo (`ExternalProfessionalField` com lápis/lixeira na linha + footer **Novo profissional** → popover Nome/Celular/CRO → `POST/PUT/DELETE /v1/patient-external-professionals`). Payload: `referralOriginId`, `referredByPatientId`, `referredByMemberId`, `referredByMemberName`, `referredByExternalProfessionalId`.
Foto: PatientPhotoDialog no header; POST/DELETE /v1/patients/:id/photo; URL via proxy com storeId (?storeId=).
Validação: patient-form-validation.ts (toast + foco em aba/campo). CEP: platform-api (inalterado).
LGPD: nunca logar CPF/RG/contatos em console ou analytics.
```

### 5.13 Pacientes — aba Prontuário (jul/2026)
```
modules/patients/services/patient-treatments.service.ts → clinicaFetch (CRUD, reorder, finalize).
Hooks: use-patient-treatments-queries.ts — finalizeMutation invalida tratamentos + evoluções.
Finalize: patient-treatment-finalize-sheet.tsx → PATCH /v1/patients/:id/treatments/:treatmentId/finalize
  (profissional + data + notas clínicas → evolução source=treatment + status completed na API).
Odontograma UI: patient-treatments-odontogram-card.tsx abaixo de Adicionar Procedimento —
  PatientBudgetOdontogram com showHof={false}; checkboxes Aberto/Finalizado (legenda) + Anotações;
  dentes com tratamento `active` (avulso **ou** orçamento aprovado / source=budget) → amarelo,
  `finalized`/`completed` → verde (`partitionPatientTreatmentTeeth`: por dente prevalece o
  tratamento **mais recente** — `finalizedAt` se finalizado, senão `updatedAt`/`createdAt`);
  approve do orçamento materializa `PatientTreatment` com `locationLabel` → Aberto no odontograma;
  clique no dente → spinner na coroa (`loadingToothNumber` / `tooth__crown-loading`, posicionado
  na área da coroa: top ~78% superior / ~22% inferior) + refetch das anotações, depois popover
  (`patient-tooth-annotations-dialog.tsx`) via
  `GET/POST/DELETE /v1/patients/:id/tooth-annotations` (`patient-tooth-annotations.service.ts` +
  `use-patient-tooth-annotations-queries.ts`); content ≤255; FDI 11–85;
  dentes com anotação mostram "!" roxo (`annotatedToothNumbers`).
Mapa anatômico (fisioterapia): `patient-treatments-corpogram-card.tsx` — mesmo padrão Aberto/Finalizado
  + Anotações; clique na região (`onRegionOpen`, mesmo com `readOnly`) → loading + refetch + popover
  genérico (`patient-location-annotations-dialog.tsx`, título = label da região) via
  `GET/POST/DELETE /v1/patients/:id/body-region-annotations`
  (`patient-body-region-annotations.service.ts` + hooks); `annotatedRegionIds` + marca "!" no SVG.
  **Pacote de sessões:** `partitionPatientTreatmentBodyRegions` só pinta a região de **verde** quando
  **todas** as sessões (`sessionTotal ≥ 2`) daquele pacote estão finalizadas; com 1/N…(N-1)/N
  permanece amarela; 1 sessão (sem pacote) → verde ao finalizar o único item.
Layout SVG (`budgets/odontogram/odontogram.css` + `odontogram-tooth.tsx`):
  slot 24×136; canvas da coroa **24×56** (mesmo em cima/baixo); faces 24×24;
  `preserveAspectRatio` xMidYMax (superior) / xMidYMin (inferior) — vão faces↔coroa = gap 4px
  (igual nas duas arcadas); mirror em `.tooth__crown-wrap` + `.tooth__face` (scaleX(-1)).
Orçamento (sheet): odontograma + HOF conforme `locationUiType` da especialidade/tratamento (`face_region` → aba HOF; `session`/`none` → item sem mapa; `body_region` → select corporeal na fisio). Faces M/O/I/D/V/L/P só se tratamento `acceptsFaces`.
Aba sem badge "Em breve" (PATIENT_DETAIL_IMPLEMENTED_TABS inclui tratamentos).
**Copy (ago/2026):** label da aba = **Prontuário**; restante da UI = **Procedimento(s)**
  (Adicionar Procedimento, lista, toasts). IDs/rotas/Prisma/CASL inalterados.
**Nutrição:** `showNutritionInitializeFlow` → Inicializar (não Finalizar);
  tratamento permanece `active`; toggle Mostrar finalizados usa `concludedTreatmentIds`
  (`filterBudgetTreatmentsForDisplay`). Adipometria Petróski: ≥2 medidas/dobra,
  mediana no FE, gráficos em **Distribuição de gordura** (barras + pizza %).
**Fisio:** Adicionar Procedimento não mostra aviso de “sem região anatômica” em `none`.
Pendente Fase 2: upload de imagens na evolução (CLIN-051); débito financeiro ao finalizar (CLIN-060).
```

### 5.12 Pacientes — aba Anamnese (jul/2026)
```
modules/patients/services/patient-anamnesis.service.ts → clinicaFetch (CRUD autenticado).
modules/patients/services/public-patient-anamnesis.service.ts → BFF /api/public/clinic/anamnesis/[token]
  (GET/PATCH sem auth; proxy server-side para clinica-api @Public).
Hooks: use-patient-anamnesis-queries.ts (list, detail, mutations, alerts); anamnesisKeys em query-keys.ts.
Tab: patient-anamnesis-tab.tsx — listagem server-side + debounce 400ms; sheet nova anamnese; modal compartilhar;
  PDF preview (build-patient-anamnesis-pdf.ts — Dados do Paciente em 2 colunas:
  nome/telefone/nascimento | sexo/endereço; endereço no padrão do letterhead:
  `Rua, número, complemento, bairro, Cidade /UF, 00000-000`; quebra de linha
  alinhada ao rótulo `Endereço:`, sem recuo);
  badge alertas (evaluate-patient-anamnesis-alerts.ts);
  **assinatura eletrônica ZapSign** (Emitir assinatura → se saldo 0, modal Loja;
  senão preview `request-signature` + Solicitar assinatura →
  modal e-mail opcional / skip localStorage → API → `PatientAnamnesisSignatureIssuedDialog`).
Público: app/public/clinic/anamnese/public-anamnesis-fill-view.tsx consome BFF (não mock store);
  cabeçalho usa `clinicDisplayName` da API (fallback genérico `"Clínica"` — sem hardcode de loja).
Modos: professional (issued na criação) | patient (awaiting_response + publicToken + linkExpiresAt +30d).
  Validação: em `yes_no_unknown_text`, “Descreva resposta” só aparece/é obrigatório ao marcar **Sim**; erros por pergunta no sheet.
  Sheet nova anamnese (ficha): `yes_no_unknown` / `yes_no_unknown_text` já vêm com **Não** pré-selecionado (`getClinicNewAnamnesisAnswerForQuestion`); link público segue sem pré-seleção.
Assinatura: `signatureStatus` unsigned|pending|signed; serviço `electronic-signatures.service.ts`.
Pendente: consentimento LGPD persistido na API; termos de consentimento; espelho no ERP.
```

### 5.12b Assinatura eletrônica ZapSign (jul/2026)
```
services/electronic-signatures.service.ts → request anamnese/contrato/lote evolução + cancel + GET by-target + signed-pdf proxy.
Anamnese: se saldo 0 → `SignatureCreditsInsufficientDialog` (Ir para a Loja);
  senão PatientAnamnesisPdfSheet (mode request-signature) → PatientSignatureEmailDialog
  (e-mail opcional + “Não mostrar novamente” em localStorage
  `citybox.clinic.skip-anamnesis-email-prompt:{patientId}`) → PatientSignatureIssuedDialog
  (Documento emitido; card 1 signatário; copiar/WhatsApp).
Evolução: PatientTreatmentSignEvolutionDialog (seleção → Emitir documento)
  → PatientTreatmentEvolutionPdfSheet mode request-signature
  → requestEvolutionBatchSignature → PatientSignatureIssuedDialog + poll by-target
  (evolution_batch) + sync pending ao carregar lista.
  Badge: Sem assinatura | Pendente | Assinada; signed → menu ⋮ só Baixar + Histórico.
  Dialogs compartilhados em components/detail/signatures/ (issued; e-mail só na anamnese).
Contrato: PatientContractSignatureRequestSheet (modal: Clínica + Paciente, editar e-mail, checkbox política ZapSign)
  → após request, ContractSignatoriesAccordion no preview (0/2, copiar/WhatsApp/Assinar agora na clínica, cancelar).
  E-mail automático ZapSign quando e-mail preenchido.
  Preview: GET by-target **sem** sync (accordion imediato); poll 5s com `sync=true`.
Orçamento aprovado: ícone FileText na coluna status → emitir (budgetId + template padrão) / ver contrato;
  draft/rejected = ícone disabled + tooltip "Contrato somente para orçamento aprovado".
  Cores do ícone: cinza = sem contrato emitido; mostarda `#C4A000` = contrato emitido / assinatura
  solicitada ou parcial; verde = 2/2 assinadas (`patient-budgets-table.tsx`).
PDF contrato: build-patient-contract-pdf.ts (texto a partir do HTML) na solicitação;
  **imprimir depois de assinado pelas 2 partes** usa o PDF da ZapSign (`fetchSignedPdfBlob` via
  `printPatientContractDocument`) — o HTML do preview não tem as assinaturas.
  **imprimir sem assinatura completa** = HTML via iframe (`printPatientContractHtml` +
  `PATIENT_CONTRACT_PAPER_CSS`): `box-sizing:border-box` + iframe em 210mm×297mm (evita corte
  da margem direita no preview de impressão).
SignatureRequestSheet: legado (evolução migrou para issued dialog).
PDF evolução: seção após Dados do Paciente = **Evoluções do Paciente** (`build-patient-evolution-pdf.ts`).
Excluir procedimento finalizado: ConfirmDialog sem ícone (`icon={null}`); texto
  "Este procedimento, as receitas e os serviços vinculados, serão excluídos permanentemente da sua clínica."
Lista "Mostrar finalizados": card verde; menu ⋮ ghost (só ícone cinza, sem fundo); grip transparente.
```

### 5.15 Estoque — integração API (jul/2026)
```
features/clinic/estoque/services/stock.api.service.ts → clinicaFetch/clinicaUpload (re-export em stock.service.ts).
useClinicId → useStore() (storeId real no proxy).

Produtos: GET /v1/stock-products (page, perPage, search, sortBy, sortOrder); sortBy:
  name | category | sku | supplier | quantity | status | activeValue.
Fornecedores: CRUD /v1/stock-suppliers; SupplierSelect (popover + "Criar fornecedor"); telefone mascarado
  (formatPhone de modules/settings/lib/format-clinic-fields.ts).
Movimentos: POST /v1/stock-entries (+ bulk), POST /v1/stock-withdrawals; GET /v1/stock-movements
  (type, productId, startDate, endDate, sortBy, sortOrder); sortBy: product | quantity | withdrawnBy |
  authorizedBy | date (padrão date desc no histórico).
Foto produto: POST/DELETE /v1/stock-products/:id/photo (MinIO); URL via proxy com ?storeId=.

UI: stock-table + stock-pagination-bar; withdrawal-table no sheet de histórico; erpDataTableStyleProps
  (cabeçalhos text-left); StockSortableHeader em todas as colunas de dados.
Mock legado em stock.service.ts (store em memória) — produção usa apenas stock.api.service.ts.

Backend (jul/2026): CreateStockSupplierUseCase usa repository.create() (não save()); interface abstrata
  StockSupplierRepository declara create() — sem isso o Nest watch não recompilava e mantinha save() (P2025).
```

### 5.14 Agenda — integração API e UX (jul/2026)
```
features/clinic/agenda/api/* → clinicaFetch (appointments, internal-events, fit-ins, return-alerts,
  appointment-categories, available-slots). Equipe via platform-api; pacientes/perfil reutilizam módulos existentes.
Hooks: useStore() + query keys com storeId; mock-data.ts removido (CLIN-021).

Profissionais na agenda (`agenda/api/team.ts` · `isAgendaSchedulableMember`):
  - Cargos com aba “Horários de Atendimento” (`aluno` | `dentista_admin` | `dentista`)
    **ou** permissão `schedule_attend` (“Fazer atendimentos”) — ex.: Gerente customizado.
  - Sem `schedule_attend` e fora desses cargos → fora de selects, colunas e “Buscar horário livre”.
  - Estoque (retirada) usa `useTeamMembers` de `@/features/shared/team` (todos os ativos), não o da agenda.
  - Sheet: `usePrefillAgendaProfessional` (layout effect) pré-preenche o logado se estiver na lista
    ou tiver `canAttend`; Select usa `field.value || defaultProfessionalId`; reset parcial do sheet
    preserva `professionalId`. Sem `create` Schedule + com attend → `lockToSelf`.

Datas:
  - lib/local-date.ts — campos só calendário (DatePicker, yyyy-MM-dd) sem off-by-one UTC.
  - lib/clinic-datetime.ts — horários wall-clock da clínica (Ilhéus) persistidos como UTC na API:
    parseClinicDateTimeIso, formatClinicTimeFromIso, formatClinicDateFromIso, buildClinicDateTimeIso,
    clinicDateTimeToIso. Exibição e posicionamento no calendário SEM shift de fuso local (15:00 na API = 15:00 na UI).
  - Payloads de consulta/compromisso enviam `.000Z` (scheduling-form.tsx).

Compromissos vs consultas (bloqueio de horário):
  - Todo compromisso (timed ou all-day, qualquer availability) bloqueia consultas no intervalo sobreposto.
  - Backend: internal-event-blocking.utils + AssertAppointmentSlotAvailableService + GET available-slots.
  - Calendário: isSlotBlockedByCommitment (helpers.ts) alinhado à mesma regra.
  - Modal "Buscar horário livre" só lista slots com available=true da API (compromissos já excluídos).

Modal "Buscar horário livre" (find-free-slot-dialog.tsx):
  - Manhã: slots com início < 12:00; tarde: início ≥ 14:00 (intervalo 12:00–13:59 oculto na UI).
  - Backend (available-slots): step padrão = durationMin (mín. 15) — sem slots sobrepostos na grade.
  - No dia de hoje, horários com início ≤ agora (wall-clock clínica) vêm com `available=false` e não aparecem; dias anteriores ficam todos indisponíveis.

Categorias no sheet: GET /v1/appointment-categories (CRUD próprio, sem espelho de pacientes).
  Configurações: rotas separadas `/categoria-paciente` e `/categoria-agendamento`.

Alerta de retorno — agenda (return-alert-popover.tsx):
  - Badge e lista filtram por semana (seg–dom, weekStartsOn: 1) nas visões dia/semana; visão mês agrupa por semana.
  - lib/return-alert-period.ts + group-return-alerts-by-week.ts.
  - Item com menu ⋮: Agendar + Excluir; tooltip de observação com fallback quando reason vazio (return-alert-item.tsx).

Alerta de retorno — ficha do paciente (patient-return-alerts-popover.tsx):
  - Popover 672×301px no header; CRUD via return-alerts API (patientId).
  - Agendar → storeSchedulingSheetIntent + router.push('/clinic/agenda'); sheet abre com paciente/categoria/data.
  - lib/build-return-alert-scheduling-intent.ts + lib/scheduling-sheet-intent.ts + scheduling-sheet-intent-listener.tsx.
  - Ao criar consulta com returnAlertId, alerta removido (create-appointment + invalidate returnAlertQueryKeys).

Sheet agendamento: scheduling-sheet max-w-3xl; compromisso — accordion "Configurações extras" sem borda/fundo;
  checkbox "Dia inteiro" / "Repetir compromisso" com space-y-0 no FormItem (alinha label ao checkbox);
  consulta — campos Data/Hora/Duração com h-11 alinhados ao botão "Buscar horário livre".

Status cancelada/falta no calendário:
  - `missed` | `cancelled_patient` | `cancelled_pro` → cor do card vermelha (`calendar-transform` / `resolveCalendarEventColor`);
  - header do popover de detalhes (`EventDetailsPopover`) usa `bg-red-400` (vermelho suave) em vez de `bg-primary`.
  - API permite reabrir cancelada/falta → `scheduled`|`confirmed`|`patient_waiting` (com assert de slot).
  - Select de status no popover filtra só transições válidas (`appointment-status-transitions.ts`, espelho da API);
    `confirmed`/`scheduled` podem ir direto para `in_progress` (sem obrigar `patient_waiting`).

Cor do card de consulta:
  - Por status: **Agendada** → azul; **Confirmada** (manual/WhatsApp) → verde; **Cancelada/Falta** → vermelho.
  - Demais status usam a categoria (`colorFromCategoryColor`: nome `blue`/`teal` ou hex).
  - Header do popover: Agendada/`bg-primary` (cyan da clínica); Confirmada `bg-green-400`; Cancelada/Falta `bg-red-400`.

category-select.tsx: estado de erro quando a query falha; categories.ts usa (res.data ?? []).
```

### 5.15 Pacientes — aba Financeiro (jul/2026 · CLIN-061)
```
modules/patients/services/patient-financial-entries.service.ts → clinicaFetch (list, CRUD avulso, receive, delete).
Hooks: use-patient-financial-entries-queries.ts; financialEntryKeys em query-keys.ts.
Tab: patient-financial-tab.tsx — filtros período/status, totais de meta.totals, debounce 400ms, listagem server-side.
Tabela: patient-financial-table.tsx — manualPagination no DataTable; barra patient-financial-pagination-bar.
Sheets: patient-financial-receive-sheet (PATCH …/receive;
  select de caixa via useFinancialAccounts → v1/financial/accounts — mesmas contas das configurações do financeiro;
  padrão visual clinic sheets: PaymentMethodPicker + PaymentFields; mock MOCK_FINANCIAL_CASH_REGISTERS removido).
Modal: patient-financial-debit-sheet (Dialog com abas Debito/Documentos, sem título além das tabs).
Header da ficha (patient-detail-header): seta ← preta ao lado da foto (sem texto "Voltar"); abas ao lado da foto abaixo do nome;
  border-b full-width no limite do branco; espaçamento telefone → abas (pt-4);
  linha de contato = celular + CPF, com ` - ` só quando os dois existem (`formatPatientHeaderContactLine`).
Approve orçamento: use-patient-budgets-queries invalida financialEntryKeys → parcelas aparecem na aba.
Aba sem badge "Em breve" (PATIENT_DETAIL_IMPLEMENTED_TABS inclui financeiro).
Pendente: payments-api; upload MinIO de comprovante na aba Transações.
```

### 5.17 Financeiro global — fluxo de caixa + Transações + Comissões (jul/2026 · CLIN-061 / CLIN-062)
```
services/financial.api.service.ts + lib/financial-api-mappers.ts (BRL UI ↔ cents API) via clinicaFetch → v1/financial/*.
Hooks: use-financial-entries/stats/accounts + income/expense categories; useClinicId; query keys com storeId.
CASL (`use-financial-permissions`): views (`*_view`) abrem o módulo e as listagens; `financial_summary`
  é **plus** (cards de KPI) e **sozinho não abre** Financeiro (sidebar/rotas). Só expense_view → Fluxo + despesas;
  income_view + expense_view → também Transações. Configurações **só** com
  `financial_account_*` / `financial_category_*` (create|delete no JSON da Equipe;
  OWNER sem esses checkboxes **não** vê a aba — gate não usa `manage all`).
  Receber: `settle` = só vencimento hoje; `settleFuture` = parcelas futuras; `settleRetroactive` = vencidas
  (`settle` sozinho NÃO libera futuro/atraso).
  API list/find restringe `types` às views (resumo não amplia).
Fluxo de caixa: perPage≤100; KPIs via useFinancialStats **somente** com summary + view; view isolado = só lista;
  sheets receber/pagar no padrão clinic
  (CLINIC_* sheet styles + PatientFinancialReceive* components; pay usa dateLabel "Data do pagamento").
  Tabela (`cash-flow-table.tsx`): colunas checkbox · tipo · Data · **Nome** · Valor · ⋮
  (sem Status/Pagamento). Ao lado do nome: ícone ExternalLink (`text-primary`) abre ficha em nova aba
  (`/pacientes/:id/sobre`, tooltip "Abrir ficha do paciente em uma nova aba"). Badge do meio de
  pagamento ao lado do valor (cores `payment-method-labels`); valor recebido/pago em verde (também
  despesa); slot fixo Receber|Pagar|✓ alinhado; cabeçalho Valor espelha o layout badge|valor|ação.
  Menu ⋮ em receita `received`: **Emitir recibo** (mesmo fluxo de Transações — `useEmitIncomeReceipt` +
  `build-income-receipt-pdf` + `EmitIncomeReceiptDialog` + preview `PatientDocumentPdfSheet`).
  Header: label **Exibindo financeiro** + botão **Exportar** (PDF da tabela via `build-cash-flow-pdf.ts`
  + `to-pdf-clinic-info` / `getClinicProfile`) ao lado de Filtrar. PDF: título só `FLUXO DE CAIXA`;
  meta = Período em datas reais (`08/2026` se o filtro cobre o mês inteiro; senão `dd/MM/yyyy` ou intervalo)
  + Total de lançamentos — sem segundo título "Fluxo de caixa" e sem labels de filtro ("Desse mês").
Categorias receita/despesa nos sheets: mesmo padrão CategorySelect da agenda (Popover + "Adicionar categoria"
  + AppointmentCategoryCreatePopover reutilizado).
  Tabelas de config: cor como bolinha + nome (sem coluna “Cor” separada).
Configurações (`/financeiro/configuracoes`): TabsList cinza full-width retangular (rounded-xl),
  triggers à esquerda (contas / categorias despesa / categorias receita) — não PageTabs linha full-bleed.
Transações (`/financeiro/transacoes`):
  - Dados: só liquidados (statuses=paid,received); período dateField=paidAt; Agendadas → paidAtFrom=amanhã.
  - Meio de pagamento: GET …/by-payment-method; KPIs recalculados do agregador.
  - Detalhe: listagem server-side page/perPage; Ver / Emitir recibo (PDF client via `useEmitIncomeReceipt`) / Cancelar (desfaz liquidação → `pending`; vencido se dueDate passou) / Excluir despesa.
  - Header: **Exibindo transações** + **Exportar** PDF (`build-transactions-pdf.ts` — visão meio ou lista).
  - Deep-link dashboard (`?types=income&paymentMethods=…&view=transactions&period=…`): aplica filtros e limpa a query (`parseTransactionsDeepLink`).
  - Cards de KPI só com `financial_summary`; com só income_view + expense_view → header + tabelas.
  - Anexar comprovante MinIO: toast “em breve” (fora de escopo).
  - Invalidação: useDeleteFinancialEntry / useCancelPayment também invalidam TRANSACTIONS_KEY.
Comissões (`/financeiro/comissoes`): API CLIN-062 — ver §5.18; label **Exibindo comissões**.
Responsivo (jul/2026 · `feat/clinic/responsive-screen`):
  - PageNav (FinancialNav): `scrollMode="buttons"` + `buttonsHideFrom="xl"` — sem setas em 1280/1366.
  - Layout financeiro: fundo **branco** (sem cinza tipo dashboard); no mobile NÃO usar overflow-hidden/flex-1 travando altura — página cresce;
    scroll no shell; tabela aparece. Desktop mantém scroll interno da tabela.
  - KPIs tablet (`cash-flow-stats`): Receita|Despesa na 1ª linha; Saldo full-width abaixo
    (evitar 3 colunas apertadas ou 3 empilhados roubando altura).
  - Header: período + Filtrar + Exportar + Adicionar na mesma linha (`flex-wrap`); label Adicionar visível no mobile.
  - FilterPopover: largura `min(..., calc(100vw-2rem))`, 1 col no mobile, `align="center"` + collisionPadding.
  - Sheets nova despesa/receita: `max-w-[min(48rem,calc(100%-2rem))]` (nunca px fixo ~767 — vazava à esquerda).
  - Categorias receita/despesa: edição pré-preenche cor (normalize hex case-insensitive);
    criação deixa SelectField de cor vazio até o usuário escolher.
```

### 5.19 Responsivo mobile/tablet — padrões clinic (jul/2026)
```
PageNav (@citybox/ui): dashboard usa scroll nativo; **Configurações** `buttons` + `buttonsHideFrom="2xl"`
  (setas até 1366); **Financeiro** `buttons` + `buttonsHideFrom="xl"` (sem setas em 1280/1366 —
  setas só abaixo de 1280).
Tabelas densas (planos, anamneses, comissões no sheet): wrapper `overflow-x-auto` + `min-w-max` quando
  necessário — não cortar nome/badge no mobile.
Equipe sheet (`team-member-sheet`):
  - E-mail editável na criação e na edição (username continua bloqueado após cadastro).
  - Abas Permissões/Horários/Comissão: scroll horizontal no mobile.
  - Permissões: accordion inicia **fechado**; módulos e checkboxes em ordem alfabética `pt-BR`
    (`invite-professional-permissions-panel`).
  - Cargos: 8 keys em `CLINIC_ROLES`; preset via `permissionsForRole` ao trocar cargo;
    legados (auxiliar/recepcionista/financeiro) com label no select de edição.
  - Horários: só `aluno` | `dentista_admin` | `dentista` (`team-role-bridge`); grade 7 cols → stack.
  - Comissão: lista/tabela com overflow-x; body do sheet usa overflow-y-auto (não ScrollArea) —
    scroll horizontal interno falha dentro de ScrollArea Radix.
Planos (`clinic-plan-sheet`):
  - Passo configurar: especialidades + tratamentos empilhados no mobile; footer Cancelar/Voltar/Salvar em coluna.
  - Após ConfirmDialog “Trocar plano padrão”: guard ~400ms + onInteractOutside/onPointerDownOutside
    para não fechar o Sheet por toque fantasma no overlay (mesmo padrão em clinic-contract-sheet).
  - Tratamento: checkbox **Aceita faces** (abaixo do nome) → `acceptsFaces` na API `clinic-plans`; **só odontologia** (`storeSupportsTreatmentToothFaces`); no orçamento, faces M/O/I/D/V/L/P só se `acceptsFaces` (`facesInteractive`).
    Faces do dente persistem em `locationLabel` (`15 · M,O/I`).
  - **Criar/editar nome de especialidade:** `addSpecialty` retorna id + setStates puros;
    sidebar usa `flushSync` + focus no DOM; especialidade **sem nome sempre mostra input**
    (nunca botão "Sem nome"); edição não encerra no blur (Enter/Esc); `onChange` trava
    `editingSpecialtyNameId` na 1ª letra (`plan-specialties-sidebar`, `use-clinic-plan-configure`).
  - **Novo plano · “Não copiar (plano vazio)”:** pré-preenche as 17 especialidades do catálogo
    (`DEFAULT_CLINIC_PLAN_SPECIALTY_NAMES` / seed Particular) **sem tratamentos**; “Copiar do padrão”
    segue copiando especialidades+tratamentos do plano default.
API: marcar padrão NÃO pode delete-all de tratamentos (FK budget_items) — ver clinica-api replaceTree upsert.
```

### 5.16 Pacientes — aba Arquivos (jul/2026)
```
modules/patients/services/patient-files.service.ts → clinicaFetch / clinicaUpload (drive, pastas, arquivos).
Hooks: use-patient-files-queries.ts (drive, breadcrumb, move-destinations, mutations); patientFileKeys em query-keys.ts.
Mappers: lib/patient-file-api-mappers.ts — previewUrl/contentUrl via proxy /api/proxy/clinica/.../files/:id/content?storeId=….
Tab: patient-files-tab.tsx — busca server-side + debounce 400ms (useDebouncedSearch); upload multipart; preview fullscreen (imagens);
  PDF/outros abrem em nova aba; fila de upload inferior; seleção múltipla (ações em lote = fase 2).
CASL: aba com create|update|delete PatientFile; Novo=`create`; Renomear/Mover/Editar=`update` (patient_file_manage);
  Excluir=`delete`. Sem patient_file_manage, rename/move/edit somem na UI e a API responde 403.
Navegação: PATIENT_DETAIL_IMPLEMENTED_TABS inclui arquivos (sem badge "Em breve").
Store mock (data/patient-files-mock-store.ts) mantido só para testes unitários — produção usa API.
Pendente fase 2: presigned URLs MinIO; drag-and-drop; ações em lote na seleção; viewer PDF embutido.
```

### 5.3 Formulários no padrão legado — migrar ao tocar
```
use-*-form.ts (useState + patch + validate manual) em: team, plans, anamneses, contracts,
clinic-settings. SEM React Hook Form / Zod. Ao alterar de forma não-trivial, migrar para
RHF + Zod (padrão canônico do ERP). Não criar NOVOS use-*-form.ts manuais.
```

### 5.4 Shell de **1 coluna** (difere de food/varejo)
```
clinic-erp-layout usa AppSidebar simples (1 coluna), não o AppSidebarDual de food/varejo.
navModules: grupo "Clínica" (visão geral, pacientes, agenda, vendas, marketing, loja) + grupo
"Administrativo" (estoque, financeiro, configurações). Ícones via lib/icons.ts.
```

### 5.5 Equipe **estende** o shared/team
```ts
// modules/settings/team usa useTeamMembers() de @/features/shared/team (CRUD real na clinica-api)
// e ADICIONA camadas próprias da clínica: permissões CASL editáveis
// (`STORE_PERMISSIONS_MODULES` granular + defaults `permissionsForRole` por cargo —
// `dentista_admin` = todos os checkboxes; demais subsets; persistidas no vínculo;
// aliases legados expandem no mapper),
// horários de atendimento (service-hours.service.ts; só aluno/dentista/dentista_admin)
// e regras de comissão
// (commission-rules.service.ts → GET/PUT /v1/team/:memberId/commission-rules).
// Não duplicar o CRUD base — só estender.
// UX mobile: abas do sheet com scroll-x; horários empilhados; comissão com overflow-x + body overflow-y-auto.
```

### 5.6 Sheets com estilos próprios
```
Usar as constantes de lib/clinic-sheet-styles.ts (CLINIC_FLOATING/NESTED/NARROW/FULLSCREEN_BOTTOM_*).
clinic-sheets.css (importado só no layout) controla overlay de sheet aninhado e a animação
fullscreen-bottom (editor de contrato). Marcar sheets aninhados/fullscreen com os data-attributes
esperados (data-clinic-nested-sheet, data-clinic-fullscreen-bottom-sheet).
```

### 5.7 Marketing público, CRM e QR Code
```
Backoffice: campaigns.api.service.ts → clinicaFetch → /v1/campaigns.
Público: /campanha/{storeId}/{slug} → BFF /api/public/clinic/campaigns/*.
Views: POST .../views somente sem cookie campaign_view_{campaignId}; janela 30min.
Submissão: API aplica duplicityRule block|update|create_new e integra SalesOpportunity
  (origin=campaign, submissionId). No sheet da oportunidade: Campanha + "Ver resposta".
URLs externas: redirectUrl e lgpdConsent.privacyPolicyUrl sem protocolo recebem https://;
  form público também normaliza para proteger campanhas antigas.
Form: radio = escolha única (pill + hint); checkbox = múltipla (card + hint).
Período: DatePicker usa parse/formatLocalDateString (sem off-by-one UTC−3); data fim deve ser **futura** (não hoje); às **00:00 BRT do dia da data fim** o backend marca `finished`.
Limite: ao atingir leadLimit, backend marca status=finished + endDate; form deixa de carregar.
QR: QrCodeModal usa qrcode.react/QRCodeCanvas com URL absoluta
  (resolve-campaign-public-url.ts), download PNG 320x320; sem endpoint e sem blob mock.
Lista: modal vive fora do <tr> e suprime click fantasma ao fechar.
```

### 5.18 Comissões — ERP integrado (jul/2026 · CLIN-062)
```
Rota: /clinic/financeiro/comissoes · Feature: features/clinic/financeiro/comissoes/
Nav: FinancialNav — Comissões imediatamente após Transações.
CASL: `financial_commission_own` → só o próprio membro (API força memberId; UI sem merge da equipe);
  `financial_commission_all` → `update` (todas; não `manage` — CASL manage implicava pagar);
  `financial_commission_pay` → `settle` (botão Pagar no modal).

API (clinicaFetch):
  - services/commissions.api.service.ts — listOpen, getOpenDetail, listHistory, getHistoryDetail, createPayment
  - hooks/use-commissions-queries.ts — React Query + keys; pay invalida open/history;
    open/history: staleTime 0 + refetchOnMount always (evita total R$ 0,00 stale vs detalhe fresco)
  - lib/commission-api-mappers.ts — summary alinhado a types/commission-financial.types.ts
    (incl. discountCents no histórico agregado)
  - Query params server-side (§8.1 / raiz): page, perPage, startDate/endDate, professionalId|memberId, search (debounce 400ms)

Motors API: receive→debit_received; approve orçamento→budget_approved (responsável); Paciente→Prontuário→Finalizar (evolução source=treatment)→treatment_completed — evolução avulsa NÃO gera.
Migration API (única): `prisma/migrations/20260715165240_add_commissions` (inclui `sourceBudgetId` / `sourcePatientTreatmentId`) — operador aplica.

Invalidação cache Comissões (Em aberto):
  - receive (accruals debit_received):
      features/clinic/financeiro/hooks/use-receive-entry.ts → commissionsKeys.all(clinicId)
      modules/patients/hooks/use-patient-financial-entries-queries.ts → commissionsKeys.all(storeId)
  - finalize tratamento (accruals treatment_completed):
      modules/patients/hooks/use-patient-treatments-queries.ts → commissionsKeys.all(storeId)

Equipe — regras:
  - modules/settings/team/services/commission-rules.service.ts — GET/PUT /v1/team/:memberId/commission-rules
  - Load no team-member-sheet (edição); save em equipe-settings-page após create/update member
  - Identidade única (`lib/commission-rule-identity.ts`):
      * chave = gatilho + tipo + plano + especialidade
      * budget_approved = no máximo 1 regra (independente do tipo)
      * nova regra idêntica → pré-preenche valores da existente e botão “Atualizar regra existente”
      * GET/PUT deduplicam (última vence)
      * **Porcentagem:** Plano/Especialidade com opção **Todos** (`COMMISSION_SCOPE_ALL` → API `null`); Plano=Todos lista especialidades de todos os planos (dedupe por nome); match API por nome quando plano wildcard
      * **Valor fixo:** sem opção Todos — exige plano + especialidade concretos (tabela de procedimentos)
  - UX alerta amarelo (AlertTriangle):
      * regras plano/especialidade: aviso de sobrescrita
      * budget_approved (só gatilho): “Já existe uma regra de Aprovação de orçamento (…).”
      * budget_approved + tipo Porcentagem: “Regra já cadastrada para esse profissional.” + resumo
  - Validação API: commissionValueCents obrigatório só em budget_approved + fixed_value;
    treatment_completed / debit_received + fixed_value usam treatments[].amountCents

UI: Tabs Em aberto / Histórico; toolbar período + busca (sugestões = useTeamMembers);
  Em aberto: union API (membros com regras) + team (sem regra → Configurar →
  `/configuracoes/equipe?memberId=&tab=commission`);
  com regras → Detalhes / Pagar.
  Histórico: **1 linha por profissional** (soma líquida dos pagamentos no período);
  detalhe `GET history/:memberId?startDate&endDate` junta accruals de todos os pagamentos.
  Detalhe (histórico): exibe Desconto (se discountCents > 0) antes de “Valor pago ao profissional”
    — desconto NÃO aparece na tabela de listagem.
  Nomes de tratamento nas **linhas** da tabela do detalhe: incluem dente/local
    (ex. “Cirurgia com Retalho 15”); cabeçalho do grupo usa só o nome-base do tratamento.
Modais: detalhes (refetch open/:memberId ou history/:memberId + período); pagar (FinancialAccountSelect);
  sucesso com DialogTitle (a11y Radix). Imprimir: build-commission-report-pdf.ts. Exportar Excel: “Em breve”.
Período: resolveCommissionPeriodDates → query API (sem filtragem client-side da listagem).
```

### 5.8 `main` é o container de scroll (fillViewport) — cuidado com `sticky`/altura
```
O shell da clínica passa fillViewport ao AppSidebar (ver §5.4): a <main> vira o container de
scroll (h-svh + overflow-y-auto + p-4). Consequências:
• Kanban/agenda: usar a cadeia flex-1 + min-h-0 + min-w-0 até o container que rola, para o
  scroll ficar SÓ no board (não na página). min-w-0 evita o board esticar a largura.
• PageNav de seção: usar breakout -mx-4 -mt-4 px-4 e NÃO `sticky top-0` — a main como scroll
  container faz o sticky "grudar" no offset do padding e criar um gap enorme no topo.
• Layout full-bleed (ex.: wizard de campanha): -m-4 cancela o padding da main; header/footer
  fixos + meio rolável exigem min-h-0 em TODA a cadeia de flex.
```

---

## 6. Padrões de Código (UI)

### 6.1 Estado de settings = React Query + mock default
```ts
// use-clinic-settings-state.ts / use-clinic-plans-state.ts
const { data } = useQuery({ queryKey: [...], queryFn: () => getClinicProfile(storeId), enabled: Boolean(storeId) });
// mocks (MOCK_CLINIC_*) preenchem defaults enquanto o backend não responde.
```

### 6.2 Form legado (a ser migrado)
```ts
// use-<x>-form.ts
const [values, setValues] = useState(initial);
const [errors, setErrors] = useState({});
const patch = (p) => { setValues(v => ({ ...v, ...p })); /* limpa erros dos campos alterados */ };
const validate = () => { /* checagens manuais */ };
```

### 6.3 Tabela + Sheet (CRUD de settings)
```
Página = DataTable (lista) + Sheet (form de criar/editar). Status toggle com clinic-compact-switch.
Confirmações com ConfirmDialog (@citybox/ui). Variantes de sheet conforme complexidade do form
(narrow p/ simples; floating/fullscreen-bottom p/ editores como plano/anamnese/contrato).
```

### 6.4 PDF — letterhead compartilhado
```
Fonte: modules/patients/lib/patient-pdf-shared.ts → drawPatientPdfClinicHeader.
Hierarquia em duas faixas, sem card cinza:
1. Linha de identidade — esquerda: logo com **altura fixa** (`PATIENT_PDF_HEADER_LOGO_HEIGHT_MM` = 14mm ≈ 53px; largura proporcional, nunca o tamanho nativo da imagem) + nome da clínica em destaque; à direita, selo compacto
   na cor da marca (`CLINIC_THEME.primaryColor` / `PATIENT_PDF_BRAND_COLOR`) com o tipo do
   documento. Segunda linha da faixa: `CNPJ: …` à esquerda; a data de emissão um pouco
   abaixo do selo (2mm a mais que o CNPJ), muted. Nada mais nessa faixa.
2. Divisor fino (`PATIENT_PDF_BORDER_COLOR`) e, abaixo, só contato: map pin Lucide + endereço e
   envelope + e-mail à esquerda; fone Lucide + telefone/celular à direita
   (`patient-pdf-header-icon-paths.ts`; ícones 2.6mm). Depois do contato, 18mm até o conteúdo
   do documento (não colar e-mail no título do paciente).
Endereço em uma linha (`Rua, número, complemento, bairro, Cidade /UF, 00000-000` — vírgulas,
sem a palavra CEP; reduz fonte se não couber). Sem nome de comunicações e sem responsável.
Documentos clínicos (anamnese, receituário, atestado, evolução, nutrição): data no letterhead;
páginas extras ainda datam o canto inferior direito (8pt, só a data — sem "Emissão:").
Entre seções tituladas (ex.: Dados do Paciente → Evoluções do Paciente / Perguntas… /
Prescrição), usar `PATIENT_PDF_GAP_BETWEEN_SECTIONS` (8mm) — definido em
`drawPatientPdfLabelValueSection` / bloco de paciente da anamnese; não somar folga
extra nos builders.
PDFs com `drawPatientPdfFooter` (orçamento, financeiro, dashboard, relatórios): sem data no canto;
separador + `Documento gerado em {data} às {hora}` fixos no limite inferior de cada página.
PDF de orçamento: badge de status (Aprovado / Em aberto / Reprovado) na mesma linha de `Paciente:`, à direita — não no letterhead.
Não redesenhar o cabeçalho em cada builder — mudar o shared vale para anamnese,
evolução, nutrição, orçamento, receituário, atestado, financeiro, relatórios,
dashboard e comissões. Builders **não** somam folga extra após o letterhead
(`HEADER_GAP_AFTER_CONTACT` é a única). Exceções: recibo de caixa (vias compactas)
e contrato ZapSign (PDF da assinatura, não o letterhead local).
```

---

## 7. Tema, Branding, Navegação e Sheets

| Item | Valor / Arquivo |
| ---- | --------------- |
| **Brand** | `Citybox Clínica` · tagline "Gestão para clínicas e consultórios" |
| **Tema** | `CLINIC_THEME` — cyan `#0891b2` / fg branco / dark `#1e6b7f` (`lib/theme.ts`) |
| **Nav** | `CLINIC_NAV_MODULES`: grupo Clínica (incl. **Loja** após Marketing) + grupo Administrativo |
| **navDefaults** | `defaultModuleId: 'clinica'`, `defaultLeafId: 'visao-geral'` |
| **Settings nav** | abas via `PageNav` `scrollMode="buttons"` — setas em `max-2xl` (1280/1366); desktop `2xl+` sem setas (`clinic-settings-nav.tsx`) |
| **Sheets** | `lib/clinic-sheet-styles.ts` (classes) + `clinic-sheets.css` (overlay aninhado + animação fullscreen-bottom 550/450ms) |

---

## 8. Telas — status (REAL vs Mock)

> 🟢 Real (CRUD na platform/clinica-api) · 🟡 serviço+UI prontos, backend scaffold · ⏳ placeholder.

| Tela | Rota | Status | Backend |
| ---- | ---- | ------ | ------- |
| Configurações · Clínica (perfil) | `/clinic/configuracoes` | 🟢 | `/v1/clinic-profile` (+ logo); CEP via `useCepAddressLookup`; CNPJ com dígitos verificadores |
| Configurações · Equipe | `/clinic/configuracoes/equipe` | 🟢 listagem sempre / CRUD gated | Sempre no sidebar; `read` Team sem checkbox; create/update/delete via `settings_team_*`; `shared/team` + soft-status + CASL editáveis + service-hours + **commission-rules** |
| Configurações · Planos | `/clinic/configuracoes/planos` | 🟢 | `/v1/clinic-plans*`; título "Editar plano"; delete 409 → `ResourceInUseDialog`; tabela scroll-x; sheet config empilhado + footer coluna no mobile; guard AlertDialog→Sheet ao trocar padrão; checkbox **Aceita faces** (`acceptsFaces`) **só odontologia** |
| Configurações · Anamneses | `/clinic/configuracoes/anamneses` | 🟢 | templates + perguntas API (seed ~15 globais); `refetch` ao abrir sheet (`staleTime: 0`); delete 409 → modal |
| Configurações · Contrato | `/clinic/configuracoes/contrato` | 🟢 | modelos API; nome do modelo com `border-border bg-input` (visível); delete 409 → modal |
| Configurações · WhatsApp | `/clinic/configuracoes/whatsapp` | 🟢 MVP | Sessão Baileys (status + QR polling 2s) + templates em **lista** (DataTable nome + Visualizar/Editar) e sheet fullscreen (variáveis à esquerda + `RichTextEditor` fluid com chips); preview celular (`WhatsappMessagePhonePreview`); body API ainda plain `{var}`; `WhatsappBrandIcon`; `whatsapp.service` / hooks |
| Configurações · Categoria de Paciente | `/clinic/configuracoes/categoria-paciente` | 🟢 | `v1/patient-categories`; cor hex livre via `CategoryColorField` (`input type="color"`) |
| Configurações · Categoria de Agendamento | `/clinic/configuracoes/categoria-agendamento` | 🟢 | `v1/appointment-categories`; mesma UI de cor; sem coluna Consultas |
| Dashboard · Indicadores | `/clinic` | 🟢 **API** | Cards via `GET /v1/dashboard/*` (+ stats financeiros); PDFs/deep-links; freshness `dashboard-query-options` + `invalidateClinicDashboardQueries`. Detalhe §8.2 |
| Dashboard · Relatórios | `/clinic/relatorios` | 🟡 **Parcial API + mock** | Catálogo Accordion + período + Exportar; **Aniversariantes**, **Procedimentos abertos**, **Orçamentos aprovados/em aberto/reprovados**, **Vendas por especialidades/planos** via `GET /v1/reports/*`; demais tabelas mock — `modules/dashboard/reports/` |
| Dashboard · Tarefas | `/clinic/tarefas` | 🟢 API | Cards **Consultas canceladas** (`missed`+`cancelled_*`) + **Pacientes**; ignore `sessionStorage`; reagendar (máscara celular) + `createAppointment`; UX mobile compacta |
| **Agenda** | `/clinic/agenda` | 🟢 **API** | `agenda/api/*` → clinica-api; compromissos bloqueiam consultas; `clinic-datetime.ts` + `local-date.ts`; modal slots (manhã/tarde); badge retorno semanal; toggle WhatsApp (Switch à esquerda; create default on; edit abre off; só envia se ligado no save); no select do card: **Confirmada** e **Confirmada por mensagem** (`confirmed` + `confirmationSource=whatsapp`); ambos verdes no card/popover; lembrete WhatsApp ~2h antes (worker API, automático) |
| **Vendas** | `/clinic/vendas` | 🟢 **API** | `sales.api.service.ts` → funnels/opportunities/labels; `sortOrder`+`reorder`; Agendada/Perdida fixas; período custom BRT; hooks `useClinicId`; cards `budgetId` bloqueiam drop terminal; origem `budget` → label **Orçamento** |
| **Estoque** | `/clinic/estoque` | 🟢 **API** | `stock.api.service.ts`; listagem `DataTable` (manualPagination, sort server-side, `erpDataTableStyleProps`); `StockPaginationBar`; entrada/retirada/fornecedores; histórico retiradas (`WithdrawalTable` + filtro data yyyy-MM-dd) |
| **Financeiro** | `/clinic/financeiro/*` | 🟢 API | Caixa + Transações + Comissões + config via `v1/financial/*` e `v1/commissions/*`; UX mobile/tablet §5.17 + §5.19 |
| **Loja** | `/loja` + `/loja/assinatura-eletronica` | 🟢 API | Pacotes azuis + card cinza de solicitações (total + modal `DataTable` Data/Assinatura/Status, paginação server-side); saldo `GET /v1/signature-credits`; Solicitar `POST /v1/signature-package-requests`; relatório `GET /v1/electronic-signatures`; status UI Pendente/Aprovado/Recusado |
| **Comissões** | `/clinic/financeiro/comissoes` | 🟢 API | Em aberto / Histórico agregado; detalhe+desconto; regras identidade Equipe; CLIN-062 |
| **Marketing** | `/marketing/campaigns*` + `/marketing/indicacoes` + `/campanha/[clinic]/[slug]` | 🟢 **API** | Leaf **Marketing**; `ComunicacaoNav`; layout `-m-4` (scroll na `main`, abas somem ao descer); Indicações: KPIs + Pacientes indicados (PDF Exportar) + Indicadores (kind sob o nome; link `N paciente(s)` → modal; Conversar verde WhatsApp); `GET /v1/indicacoes/*` (§8.1) |
| Pacientes — lista/cadastro/categorias | `/clinic/pacientes` + `/configuracoes/categoria-paciente` | 🟢 API | `v1/patients` (busca/paginação server-side), `v1/patient-categories` |
| Pacientes — aba Sobre | `/clinic/pacientes/[id]/sobre` | 🟢 API | dados pessoais/contato/convênio; `planStatus === 'inactive'` → rótulo `Nome (Inativo)` (`formatPatientPlanLabel`); card **Última evolução** via `GET /v1/patients/:id/evolutions` (notas + profissional + data; sem clique); card **Consultas** via `GET /v1/appointments?patientId=` (5 últimas + modal “Ver todas” paginado; status/horário/profissional); card **Mensagens** WhatsApp (`perPage=2` + “Mostrar mais” carrega histórico com scroll) |
| Pacientes — aba Orçamentos | `/clinic/pacientes/[id]/orcamentos` | 🟢 API | `v1/patients/:id/budgets` (+ `contractEmissionId`); PDF; approve; **reprovar/reabrir** via `PATCH …/status`; sync CRM Funil de Venda; mutações invalidam `salesQueryKeys.opportunities`; **ícone contrato** (cinza/mostarda `#C4A000`/verde) ao lado do badge; odontograma SVG no sheet Novo/Editar; novo orçamento pré-preenche **responsável** e **profissional** com `useStore().memberId`; **fisioterapia** (`budgetTreatmentSessions`): campo **Sessões** abaixo de Plano — ao Adicionar expande N linhas (valor × N; label `i/N` só se N≥2); select **região corporal** (`PatientBudgetBodyRegionSelect`) além do mapa anatômico |
| Pacientes — foto de perfil | header da ficha (`patient-detail-header`) | 🟢 API | clique no avatar → `PatientPhotoDialog` **só com** `patient_update_personal`; `POST/DELETE /v1/patients/:id/photo` via `clinicaUpload` |
| Pacientes — alertas de retorno | header da ficha (`patient-return-alerts-popover`) | 🟢 API | popover 672×301; `GET/POST/DELETE /v1/return-alerts?patientId=`; Agendar → intent + `/agenda`; `returnAlertId` remove alerta ao criar consulta |
| Pacientes — aba Prontuário | `/pacientes/[id]/tratamentos` | 🟢 API | Label **Prontuário** / copy **Procedimento**; `v1/patients/:id/treatments` + evoluções avulsas + `PATCH …/finalize`; nutrição: `POST …/nutrition-init` (tratamento `active`); PDF evolução (seção **Evoluções do Paciente**); exclusão finalizado: ConfirmDialog sem ícone + copy receitas/serviços; lista finalizados: ⋮ ghost no card verde; **assinatura ZapSign em lote**; imagens = Fase 2; form Adicionar = dente/região/sem mapa; odontograma ou mapa anatômico |
| Pacientes — aba Anamnese | `/pacientes/[id]/anamnese` | 🟢 API | `v1/patients/:id/anamneses` (busca/paginação server-side, debounce 400ms); BFF `/api/public/clinic/anamnesis/[token]`; PDF `build-patient-anamnesis-pdf.ts`; **assinatura ZapSign** (preview → e-mail opcional → modal emitido) |
| Pacientes — aba Documentos | `/pacientes/[id]/documentos` | 🟢 API | contratos/receituários/atestados via `patient-*-emissions|prescriptions|certificates.service` + `use-patient-documents-queries`; histórico paginado **sem** busca; PDF async; **1ª emissão** de receituário/atestado abre modal de conselho se o profissional ainda não tem inscrição (`ProfessionalCouncilDialog` — odonto CRM/CRO+UF; fisio CREFITO+regional `7 — BA`); contrato **assinatura eletrônica ZapSign** (2 signatários); imprimir não assinado = HTML A4 (`printPatientContractHtml`); Termo desabilitado |
| Anamnese pública | `/public/clinic/anamnese/[token]` | 🟢 API | `public-patient-anamnesis.service.ts` → BFF → `GET/PATCH /v1/public/anamnesis/:token` |
| Pacientes — aba Financeiro | `/pacientes/[id]/financeiro` | 🟢 API | `v1/patients/:id/financial-entries` (listagem server-side + `manualPagination`); débito avulso, receber, excluir; approve orçamento gera parcelas; select de caixa via `useFinancialAccounts` (`v1/financial/accounts`) |
| Ficha — Arquivos | `/pacientes/[id]/arquivos` | 🟢 API | drive via `patient-files.service` + React Query (`use-patient-files-queries`) — §8.1 |
| **Financeiro · Fluxo de caixa** | `/financeiro/fluxo-de-caixa` | 🟢 API | Tabela: Nome + link ficha; badge pagamento ao lado do valor; valor liquidado verde; sem colunas Status/Pagamento |

### 8.1 Ficha do paciente — aba Arquivos (API jul/2026)

Rota: `/pacientes/[id]/arquivos` · Orquestrador: `components/detail/tabs/patient-files-tab.tsx`.

| Área | Implementado | Pendente (fase 2) |
| ---- | ------------ | ----------------- |
| Pastas | criar, renomear, mover, excluir (recursivo), breadcrumb `Arquivos / …` via API | drag-and-drop |
| Arquivos | upload multipart (imagem/arquivo/câmera), download, renomear, mover, excluir | presigned URL |
| Grade | cards fixos (354×398px), área vazia 297px / com itens 414px, hover, checkbox por item | responsividade fluida |
| Toolbar | busca server-side (debounce 400ms), menu **Novo**, **Selecionar todas** | ações em lote na seleção |
| Upload | painel fixo inferior central (384px): resumo + lista com status | — |
| Preview imagem | fullscreen via proxy `…/files/:id/content`; PDF/abre em nova aba | viewer embutido PDF |

**Integração:** `patient-files.service.ts` (`clinicaFetch` / `clinicaUpload`) + `use-patient-files-queries.ts`. Store mock (`data/patient-files-mock-store.ts`) mantido apenas para testes unitários do store.

**Arquivos-chave:** `services/patient-files.service.ts`, `hooks/use-patient-files-queries.ts`, `lib/patient-file-api-mappers.ts`, `components/detail/files/*`, testes `lib/patient-file-api-mappers.test.ts`, `lib/patient-file-mime.test.ts`.

### 8.2 Dashboard — Indicadores e rotas (jul/2026)

Rotas: Indicadores `/` (principal), Relatórios `/relatorios` e Tarefas
`/tarefas`. O slice `modules/dashboard/` usa
`DashboardPageFrame` para o fundo cinza e `DashboardRouteNav` para as abas baseadas em links.
O cabeçalho “Visão geral”/resumo foi removido. O frame usa `shrink-0` para o fundo cinza
acompanhar todo o conteúdo dentro do `main` flexível/rolável do `AppSidebar`. `pages/dashboard-page.tsx` permanece adaptador.
As sub-rotas Relatórios e Tarefas constam em `aliases` do leaf `visao-geral`, mantendo o item correto da
sidebar ativo sem duplicar links no menu.

**Relatórios** (`ClinicReportsPage` + `modules/dashboard/reports/`): um único `Card` com título
Relatórios + filtro de período (kind por relatório: relative / budget / none; default relativo **Desse mês**) + Exportar (toast “em breve”); descrição =
nome do relatório selecionado; Accordion por grupo (Pacientes, Agendamentos, Vendas, Financeiro,
Marketing). Tabelas mock para a maioria dos itens do catálogo. **Aniversariantes** integrado à API (`GET /v1/reports/birthdays`): filtro relativo resolve `startDate`/`endDate` (`resolveReportBirthdayRange`), listagem paginada server-side; **Exportar** gera PDF com header da clínica (`drawPatientPdfClinicHeader` + perfil/logo), período em datas reais (`formatReportBirthdayPdfPeriodLabel`) e tabela Paciente / Telefone / Data do aniversário / Celular. **Procedimentos abertos sem consulta** via `GET /v1/reports/open-treatments-without-appointment` (sem filtro de período); Exportar PDF com as mesmas colunas da tabela (Paciente / Telefone / Celular / Documento). **Orçamentos aprovados** via `GET /v1/reports/approved-budgets`: filtro Anual/Mensal (`resolveReportBudgetPeriodRange` → `startDate`/`endDate` em `approvedAt`); Exportar PDF com as colunas do relatório. **Orçamentos em aberto** via `GET /v1/reports/open-budgets` (`pending` + filtro em `Budget.date`); Exportar PDF no mesmo padrão. **Orçamentos reprovados** via `GET /v1/reports/rejected-budgets` (`rejected` + filtro em `rejectedAt`); Exportar PDF no mesmo padrão. **Vendas por especialidades** via `GET /v1/reports/sales-by-specialty` (itens de orçamento aprovado + especialidade do tratamento; filtro Anual/Mensal); Exportar PDF no mesmo padrão. **Vendas por planos** via `GET /v1/reports/sales-by-plan` (`planName` do item); Exportar PDF no mesmo padrão. **Vendas por profissional** via `GET /v1/reports/sales-by-professional` (`professionalName` do item); Exportar PDF no mesmo padrão. **Vendas por tratamentos** via `GET /v1/reports/sales-by-treatment` (`treatmentName` + `planName` do item); Exportar PDF no mesmo padrão. **Despesas por categoria** via `GET /v1/reports/expenses-by-category` (despesas `paid` agregadas por categoria no `paidAt` + %); Exportar PDF no mesmo padrão. **Receitas excluídas** via `GET /v1/reports/excluded-revenues` (receitas `cancelled` filtradas por `updatedAt`; `excludedBy` = `cancelledByName` do cancel ou `"Não informado"`; filtro relative); Exportar PDF no mesmo padrão. **Pacientes indicados** via `GET /v1/reports/referred-patients` (origens `indicacao` | `indicacao_profissional` no `createdAt`; `referredBy` = paciente/profissional ou `"Não informado"`; Anual/Mensal); Exportar PDF no mesmo padrão. Em tablet, tabelas usam `ReportsDataTable` com scroll horizontal (`min-w-max` + `overflow-x-auto`) para não cortar cabeçalhos.

**Tarefas** (`ClinicTasksPage` + `modules/dashboard/tasks/`): grid com **Consultas canceladas** (`GET /v1/dashboard/tasks/cancelled-appointments`, status `missed`|`cancelled_patient`|`cancelled_pro`) e **Pacientes** (`DashboardPatientsCard`, mesmo do Indicadores sob Financeiro).

- **Consultas canceladas:** filtro **Exibindo**; empty state (“Parabéns…”); WhatsApp / Reagendar / Ignorar (`sessionStorage`); `professionalName` via `useTeamMembers`. Mobile: linha compacta lado a lado, **sem avatar**, data `dd/MM/yyyy`. Modal Reagendar: máscara de celular (`maskPatientPhone`); botão **Encontrar horário livre** à esquerda do campo Duração.
- **Pacientes (Ver):** dialogs de métrica/aniversariantes — botão **Conversar** com `WhatsappBrandIcon` (`wa.me`); mobile: abaixo das infos; desktop (`sm+`): à direita na mesma linha (Indicadores e Tarefas).

| Card | Valor | Ação “Ver” |
|------|-------|------------|
| Débitos em atraso | `GET /v1/dashboard/summary` → `overdueIncomeTotalCents` (`clinicaFetch` + `useDashboardSummaryQuery`) | navega para `/financeiro/fluxo-de-caixa?types=income&statuses=unpaid&period=custom&startDate&endDate` (até ontem); `cash-flow-page` aplica via `parseCashFlowDeepLink` e limpa a URL |
| Orçamentos em aberto/reprovados | `GET /v1/dashboard/summary` → `openRejectedBudgetsTotalCents` (soma `pending`+`rejected`) | dialog via `GET /v1/dashboard/budgets` (`useDashboardBudgetsQuery`, paginação server-side 20/pág, total do `meta.totalValueCents`); Exportar PDF busca todas as páginas |
| Aniversariantes (próx. 30 dias) | `GET /v1/dashboard/summary` → `upcomingBirthdaysCount` (KPI + card Pacientes) | `GET /v1/dashboard/birthdays` via `useDashboardBirthdaysQuery` (período, busca debounce 400ms, paginação); WhatsApp `wa.me`, Exportar PDF |

**Cards abaixo dos KPIs** (`lg:grid-cols-[11fr_9fr]`, aproximadamente 55/45): **Análise de Receitas** (`DashboardRevenueAnalysisCard`) via `GET /v1/dashboard/revenue-analysis` (`useDashboardRevenueAnalysisQuery`) — modos Recebimentos/Vendas, períodos (default **hoje**), abas Profissionais/Planos/Tratamentos/Especialidades, `includeWithoutRevenue` (Mostrar tudo); dialog `DashboardRevenueDetailsDialog` via `GET …/revenue-analysis/details` (busca debounce 400ms, paginação server-side); Exportar PDF resumo/detalhe (detalhe pagina a API; período em datas reais via `formatRevenuePdfPeriodLabel`, não o label do filtro); lib `revenue-analysis.ts` só para testes/PDF legado. A coluna direita empilha **Financeiro** (`DashboardFinancialCard` via `GET /v1/financial/entries/stats` + `useDashboardFinancialSummaryQuery`; mês/ano → `dueDate` civil; barras Receitas/Despesas/Saldo; fixture `MOCK_DASHBOARD_FINANCIAL_BY_PERIOD` só em testes) e **Pacientes** (`DashboardPatientsCard` via `GET /v1/dashboard/patients/summary` + `useDashboardPatientsSummaryQuery`; labels estáticos em `dashboard-patient-metric-definitions.ts`; aniversariantes no count do summary geral + `DashboardBirthdaysDialog`; demais métricas via `GET /v1/dashboard/patients?metric=` + `useDashboardPatientsMetricListQuery` — busca debounce 400ms, paginação server-side, Exportar PDF pagina a API; `MOCK_DASHBOARD_PATIENT_METRICS` só em testes).

**Card full-width Metas de Vendas** (`DashboardSalesGoalsCard`, abaixo do grid e **acima** de Orçamentos): **só renderiza com `update` Dashboard** (`dashboard_sales_goals` — sem a permissão o card some e a query não dispara). **meta persistente no backend, visualização 100% mensal no frontend**. Dados via `GET /v1/dashboard/sales-goals` (`useDashboardSalesGoalsQuery`) — a API devolve a meta ativa (`goalCents`, `startDate`) e `dailySales` (orçamentos aprovados por dia, de `startDate` até hoje); a meta **persiste na virada de mês** (não precisa recriar), e `PUT { goalCents }` (`useUpsertDashboardSalesGoalMutation`) cria/substitui a meta ativa e reinicia o acúmulo em `startDate`. **Seletores mês/ano** definem o mês exibido e **todas as métricas são desse mês** (client-side, não vão para a API): barra/realizado = `sumDailySalesInMonth` (**zera na troca de mês** — venda de julho não aparece na visão de agosto); percentual **sem teto** (pode passar de 100%; a barra limita a exibição); **“Meta atingida!”** (verde) substitui a linha “% da meta diária” quando o realizado do mês ≥ meta; linhas secundárias (“dias restantes” / “% da meta diária”) têm indicador `StatusDot` (círculo interno sólido dentro de círculo maior translúcido); **Necessário vender** = `(meta − realizado do mês) ÷ dias úteis restantes do mês exibido` (`calcNeededPerBusinessDay` + `countRemainingBusinessDays`, feriados nacionais fixos de `BR_NATIONAL_HOLIDAYS`); **Vendido hoje** zera fora do mês corrente. Gráfico de linhas cobre **todos os dias do mês selecionado** via `buildMonthlySalesSeries`: só vendas do próprio mês (≥ `startDate`), dias anteriores à criação em zero, dias futuros mantêm o acumulado do mês, e a **meta é rampa linear por dia útil** (meta ÷ dias úteis do mês, fechando no valor da meta no último dia); tooltip compara realizado × esperado (`calcPaceVariance`, acima/abaixo do ritmo); modal `DashboardSalesGoalDialog` (Criar Meta / Editar — subtítulo avisa que substituir reinicia). Domínio em `lib/sales-goals.ts`; feriados nacionais (constante de domínio, sem endpoint) em `lib/br-holidays.ts`.

**Card full-width Orçamentos** (`DashboardBudgetsCard`, abaixo de Metas de Vendas): **integrado à API** via `GET /v1/dashboard/budget-analysis/status` + `budget-analysis` + `budget-analysis/details` (`useDashboardBudgetAnalysisStatusQuery` / `useDashboardBudgetAnalysisQuery` / `useDashboardBudgetAnalysisDetailsQuery`). Contagem = **orçamentos** (não itens); filtro profissional = **responsável** (`professionalId` → `Budget.responsibleId`); `pending→open`; `expired` fora. Cabeçalho: filtro responsável + radios quantidade/valor + período (anual/mensal) + Exportar PDF na mesma linha; seção **Status** com summary/timeline da API (toggle qtd/valor no cliente via `mapBudgetStatusTimelineForChart`), cards 180×82 + gráfico + taxa de aprovação; **Análise** com status/período próprios + abas profissionais/planos/tratamentos (agregados na API); dialog `DashboardBudgetAnalysisDialog` com paginação/busca server-side (§8.1). Mock `mock-dashboard-budget-analysis.ts` só em testes de lib.

**Grid 50/50 abaixo de Orçamentos:** **Como o paciente chegou** (`DashboardPatientAcquisitionCard`) — **integrado à API** via `GET /v1/dashboard/patient-acquisition` + `/details` (`useDashboardPatientAcquisitionQuery` / `useDashboardPatientAcquisitionDetailsQuery`). Filtros Anual/Mensal (+ mês/ano da API `years`) pela **data de cadastro** (`createdAt` → `registeredAt`); agregados por `referralOrigin.systemKey` (`null` origem → `nao_informado`; customs → bucket `outro`; inclui `indicacao_profissional` e `indicacao_profissional_externo`); cores no FE (`REFERRAL_SOURCE_COLORS`); dialog com paginação/busca server-side (§8.1, debounce 400ms); PDFs (`build-dashboard-patient-acquisition-pdf.ts`). Mock `mock-dashboard-patient-acquisition.ts` só em testes/cores. **Pacientes por idade e sexo** (`DashboardPatientDemographicsCard`) — **integrado à API** via `GET /v1/dashboard/patient-demographics` (`useDashboardPatientDemographicsQuery`); universo = pacientes **ativos**; select Todos/Feminino/Masculino/Não informado filtra **só** a série etária; pizza `genderShares` sempre na base total; `other→uninformed`; cores no FE (`GENDER_COLORS` / `mapGenderSharesWithColors`); eixo % via `resolveAgePercentChartAxis`; barras etárias com **altura fixa** (`h-[320px]`) dentro de `DashboardChartScroll` (`overflow-y-hidden` + `scrollbar-gutter-stable`) — evita loop infinito de scroll do Recharts `ResponsiveContainer` ao redimensionar a sidebar; PDF padrão clínica (`build-dashboard-patient-demographics-pdf.ts` + `getClinicProfile`). Mock `mock-dashboard-patient-demographics.ts` só em testes/cores. Domínio UI em `lib/patient-acquisition.ts` e `lib/patient-demographics.ts`.

**Card full-width Consultas** (`DashboardAppointmentsCard`, abaixo do grid Origem/Demografia): **integrado à API** via `GET /v1/dashboard/appointments` + `/details` (`useDashboardAppointmentsQuery` / `useDashboardAppointmentsDetailsQuery`). Select de categoria (lista da API) + período Anual/Mensal (+ mês/ano via `years`); universo = status terminais; período em `startAt`; dois cards (realizadas = `finished`; faltas+cancelamentos = `missed` + `cancelled_*`) com Ver → dialog paginado server-side (§8.1, sem busca/exportar); `professionalId` → nome via `useTeamMembers`; gráfico de barras + donut taxa de comparecimento da API. Mock `mock-dashboard-appointments.ts` só em testes. Domínio UI residual em `lib/dashboard-appointments.ts`.

**Card full-width Receitas x Despesas** (`DashboardCashflowCard`, abaixo de Consultas): **integrado à API** via `GET /v1/dashboard/cashflow` (`useDashboardCashflowQuery`). Filtros Anual/Mensal → Mês → Ano (via `years` da API); paid (`paidAt≤hoje`) + forecast (`dueDate>hoje`); overdue/cancelled excluídos; totais + timeline da API (séries em reais; saldo cumulativo); **UX:** barras topo reto (`radius={0}`), `barSize` fixo (mensal 14 / anual 28); tooltip `CashflowChartTooltip` com título Dia/mês e só **Receita** + **Despesa** (soma paid+forecast); cores no FE (`CASHFLOW_SERIES_COLORS`); Exportar PDF no shell clínica (`build-dashboard-cashflow-pdf.ts` + `getClinicProfile`). Sem dialog. Mock `mock-dashboard-cashflow.ts` só em testes; labels/cores e helpers residuais em `lib/dashboard-cashflow.ts` (card não agrega coleção client-side).

**Card full-width Análise das Comissões Pagas** (`DashboardCommissionsCard`, abaixo de Receitas x Despesas): **integrado à API** via `GET /v1/dashboard/commissions` + `/details` (`useDashboardCommissionsQuery` / `useDashboardCommissionsDetailsQuery`). Filtros Anual/Mensal → Mês → Ano (via `years`); eixo `paymentDate`; total/ranking em **líquido**; breakdowns regras/tipos em **bruto**; dialog Ver com seletor fino (default `this_month`), paginação server-side (§8.1) e PDF shell clínica (`getClinicProfile` + fetch all pages). Mock `mock-dashboard-commissions.ts` só em testes; labels/group em `lib/dashboard-commissions.ts`.

**Card full-width Recebimentos por meio de pagamento** (`DashboardPaymentMethodsCard`, abaixo de Comissões): **integrado à API** via `GET /v1/dashboard/payment-methods` (`useDashboardPaymentMethodsQuery`). Período fino (hoje/semana/mês/… → `startDate`/`endDate`); income `received` por `paidAt`; total + 7 meios da API; %/cores/labels no FE (`mapPaymentMethodsApiToSummary`); **Ver** deep-link Transações (`buildPaymentMethodTransactionsHref`). Sem dialog/PDF. Mock `mock-dashboard-payment-methods.ts` só em testes.

**Card full-width Ticket médio** (`DashboardTicketMedioCard`, abaixo de Recebimentos por meio): **integrado à API** via `GET /v1/dashboard/ticket-medio` (`useDashboardTicketMedioQuery`). Filtros Anual/Mensal → Mês → Ano (via `years` da API); rendimento = receita÷pacientes (distinct por bucket); lucratividade = receita−despesa; ledger liquidado por `paidAt≤hoje`; dois LineCharts + KPI média dos pontos; legenda corrente vs anterior; eixo Y com passos “bonitos” (`resolveTicketMedioYAxis` / `NICE_Y_STEPS_CENTS`) e labels `0` / `500` / `1 mil` / `mi`. Cores/labels/Y-axis em `lib/dashboard-ticket-medio.ts`; mock `mock-dashboard-ticket-medio.ts` só em testes; card **não** agrega coleção diária client-side.

**Card full-width Inadimplência** (`DashboardInadimplenciaCard`, abaixo de Ticket médio): **integrado à API** via `GET /v1/dashboard/inadimplencia` + `/details` (`useDashboardInadimplenciaQuery` / `useDashboardInadimplenciaDetailsQuery`). Filtros Anual/Mensal → Mês → Ano (via `years`); só pacientes inadimplentes agora; taxa/totais da API; pizza Adimplência/Inadimplência sem legenda; hover fora do anel (inadimplência à esquerda, adimplência à direita); VER → dialog paginado (§8.1) + PDF shell clínica (fetch all pages); Exportar PDF do card com shell clínica (`getClinicProfile`). Slices/cores/title helpers em `lib/dashboard-inadimplencia.ts`; PDFs `build-dashboard-inadimplencia-pdf.ts`; mock só em testes; card **não** filtra coleção client-side.

**Card full-width Despesa por categoria** (`DashboardExpenseByCategoryCard`, abaixo de Inadimplência): **integrado à API** via `GET /v1/dashboard/expense-by-category` (`useDashboardExpenseByCategoryQuery`). Filtros Anual/Mensal → Mês → Ano (via `years` da API); pizza/legenda a partir de `items` + `totalCents`; só expense `paid` por `paidAt`; valor = `paidValueCents ?? valueCents`; sem `expenseCategoryId` → bucket **Sem categoria** (`categoryId: "uncategorized"` — sentinel, não UUID de `FinancialCategory`; pagamento de comissão gera despesa sem categoria). **Ver** → `/financeiro/fluxo-de-caixa?types=expense&categories={id}&period=custom&startDate&endDate` (`buildExpenseCategoryCashFlowHref`; range local via `resolveExpenseByCategoryPeriodRange`). Helpers de range em `lib/dashboard-expense-by-category.ts`; mock só em testes; card **não** agrega coleção client-side.

**Cache React Query (freshness):** todos os hooks do dashboard usam `DASHBOARD_QUERY_FRESHNESS` / `DASHBOARD_QUERY_WITH_PLACEHOLDER` em `lib/dashboard-query-options.ts` (`staleTime: 0`, `refetchOnMount: 'always'`, `refetchOnWindowFocus`). Relatórios usam o mesmo padrão em `reports/lib/report-query-options.ts`. Mutações financeiras (`pay`/`receive`/`create`/`update`/`delete`/`cancel`/recorrência + pagamento de comissão + upsert meta) **e** mudança/remoção de status de consulta (`useUpdateAppointmentStatus` / `useDeleteAppointment`) chamam `invalidateClinicDashboardQueries` (`lib/invalidate-clinic-dashboard-queries.ts`) — invalida `clinic-dashboard*` (incl. Tarefas · Consultas canceladas) **e** `clinic`/`reports` — ao voltar a `/`, Relatórios ou Tarefas os dados refetcham sem F5.

**Contratos / tipos:** tipos de resposta da API e fixtures de lib em `types/clinic-dashboard.ts` (ex.: `DashboardExpenseByCategoryResult`, `DashboardInadimplenciaResult`, `DashboardTicketMedioResult`, …). Datas `yyyy-MM-dd` locais (sem UTC shift). Listagens paginadas sempre no backend (§8.1 AGENTS raiz) — **não** filtrar coleções inteiras no cliente.


---

## 9. Decisões de Arquitetura (UI clinic)

| Decisão | Motivo |
| ------- | ------ |
| **Settings-first** | Configurar a clínica (perfil/equipe/planos/anamneses) é pré-requisito para as demais áreas |
| **UI consome API mesmo com backend scaffold** | Adiantar a camada de UI/contrato; mocks como defaults até a `clinica-api` ter domínio |
| **Shell de 1 coluna** | Navegação da clínica é mais rasa; não precisa do dual rail de food/varejo |
| **Equipe estende shared/team** | Reusa o CRUD real; adiciona permissões CASL editáveis (defaults por cargo), horários e comissões |
| **Sheets com variantes próprias** | Editores complexos (plano/anamnese/contrato) pedem fullscreen/nested além do sheet padrão |
| **Forms legados** (ainda) | Vertical anterior à migração RHF+Zod; migrar incrementalmente ao tocar |
| **Marketing público via BFF** | Mantém credenciais fora do browser e expõe somente GET/form/views/submissions públicos |
| **QR Code client-side** | `qrcode.react` gera Canvas/PNG da URL pública; dispensa endpoint e blob persistido |
| **Campanha → CRM por submissionId** | Preserva rastreabilidade da resposta e permite abrir o formulário a partir do sheet da oportunidade |
| **Campos via `@citybox/ui` + Label fixo** | Usar os componentes do DS para consistência visual (sem label flutuante) — §4.2 |
| **`fillViewport` no AppSidebar (main = scroll container)** | Necessário para conter o scroll de kanban/agenda no board e não na página inteira — §5.8 |
| **Vertentes (`clinicStrand`)** | Uma loja = uma vertente imutável; UI via features/copy. Playbook (modelo + armadilhas): [`docs/vertentes-clinic-strand-playbook.md`](../../../../docs/vertentes-clinic-strand-playbook.md) |
| **PDF letterhead em duas faixas** | `drawPatientPdfClinicHeader`: nome + selo do documento (cor da marca); CNPJ e data na 2ª linha; divisor fino; contato com map pin/envelope/fone Lucide. Sem card cinza. Páginas extras clínicas datam o canto; PDFs com rodapé não |

---

## 10. Contexto para a IA

### O que NÃO fazer
- Não chamar a clinica-api direto — sempre `clinicaFetch`/`clinicaUpload` (proxy + `X-Store-Id`).
- Não esquecer `enabled: Boolean(storeId)` nas queries.
- Não tratar a vertical como "100% mock": as settings usam React Query real; os mocks são **defaults**.
- Não criar novos `use-*-form.ts` manuais — migrar para **RHF + Zod** ao tocar (§5.3).
- Não duplicar o CRUD de equipe — estender `features/shared/team`.
- Não usar o `AppSidebarDual` aqui — o shell da clínica é de 1 coluna.
- Não hardcodar cores nem estilos de sheet — usar `CLINIC_THEME` (tokens) e `clinic-sheet-styles.ts`.

### Ao integrar uma tela de settings com a clinica-api
1. Garantir o endpoint `/v1/clinic-*` na `clinica-api` (ver `apps/verticals/clinica/api/AGENTS.md`).
2. Ajustar `services/<x>.service.ts` (DTO `*Response` + `to<Domínio>()`) e o hook React Query.
3. Remover/ajustar o `mock-clinic-<x>.ts` (deixa de ser fonte; vira só fallback de loading se preciso).
4. Migrar o formulário da tela para **RHF + Zod**.
5. Atualizar a tabela da seção 8.

### Ao criar uma nova área (pacientes, agenda, …)
1. `modules/<area>/` no padrão de slice (pages/components/services/hooks/lib/types).
2. Item de navegação em `lib/navigation.ts` (`CLINIC_NAV_MODULES`); rota em `app/(clinic)/<rota-pt>/page.tsx`.
3. `ErpPage` no container; sheets via `clinic-sheet-styles.ts`; forms em RHF+Zod.

---

## 11. Histórico de Mudanças Estruturais

> Não é changelog de features — registra mudanças que afetam o contexto da IA.

| Data | Mudança | Impacto |
| ---- | ------- | ------- |
| 2026-08-21 | **Fluxo de caixa UX:** coluna Nome; link ficha; badge pagamento ao lado do valor; Valor/✓ alinhados; despesa paga verde; sem Status | `cash-flow-table.tsx` |
| 2026-08-21 | **Ícone contrato orçamentos:** cinza / mostarda `#C4A000` / verde conforme emissão e assinaturas | `patient-budgets-table.tsx` |
| 2026-08-21 | **Excluir procedimento finalizado:** ConfirmDialog `icon={null}` + copy receitas/serviços vinculados | `patient-treatments-tab.tsx`; `@citybox/ui` ConfirmDialog |
| 2026-08-21 | **PDF evolução:** título de seção `Evoluções do Paciente` | `build-patient-evolution-pdf.ts` |
| 2026-08-21 | **PDF seções:** `PATIENT_PDF_GAP_BETWEEN_SECTIONS` (8mm) entre bloco de paciente e o próximo título (evolução, anamnese, receituário, atestado) | `patient-pdf-shared.ts` |
| 2026-08-21 | **Contrato imprimir HTML:** margem direita cortada — `box-sizing:border-box` no papel A4 + iframe dimensionado em 210×297mm | `patient-contract-paper-styles.ts`; `print-patient-contract-html.ts`; `RichTextEditor` A4 |
| 2026-08-18 | **PDF anamnese — wrap do endereço:** linhas seguintes alinhadas ao rótulo `Endereço:`, sem recuo da primeira linha | `drawWrappableLabelValueAt` |
| 2026-08-18 | **PDF anamnese — endereço do paciente:** mesmo padrão do letterhead (`Rua, número, bairro, Cidade /UF, CEP` sem rótulo) | `formatPatientAddressForPdf` → `formatClinicPdfAddressLine` |
| 2026-08-18 | **PDF anamnese — Dados do Paciente:** duas colunas (nome/telefone/nascimento à esquerda; sexo/endereço à direita) | `drawAnamnesisPatientDataSection` |
| 2026-08-18 | **PDF letterhead único:** mesma folga após contato em evolução/anamnese/dashboard; aniversariantes/métricas/comissões passam a usar o shared; sem `SECTION_GAP` extra | `drawPatientPdfClinicHeader` |
| 2026-08-18 | **PDF letterhead data:** 2mm a mais abaixo do selo do tipo de documento, sem descolar do bloco | `HEADER_ISSUED_EXTRA_GAP` |
| 2026-08-18 | **PDF letterhead contato:** ícones 2.6mm; 18mm de folga após e-mail/endereço antes do conteúdo | `HEADER_ICON_SIZE`; `HEADER_GAP_AFTER_CONTACT` |
| 2026-08-18 | **PDF letterhead ícones:** endereço = map pin Lucide (teardrop + furo); telefone = fone Lucide — não mais pirulito/caixa de linhas | `patient-pdf-header-icon-paths.ts` |
| 2026-08-18 | **PDF logo:** altura fixa no letterhead (14mm), largura proporcional — não usa o tamanho nativo (fundo colorido da imagem não infla o cabeçalho) | `fitHeaderLogoDimensions` |
| 2026-08-18 | **PDF letterhead:** nome à esquerda + selo colorido do tipo de documento à direita; CNPJ/data na 2ª linha; divisor fino; contato com ícones abaixo | `drawPatientPdfClinicHeader` |
| 2026-08-18 | **PDF relatório Aniversariantes:** período em datas reais (`08/2026` / intervalo), não "Desse mês" | `formatReportBirthdayPdfPeriodLabel` |
| 2026-08-18 | **PDF Análise de Receitas:** período em datas reais (`18/08/2026` / `08/2026` / intervalo), não "de hoje" | `formatRevenuePdfPeriodLabel` |
| 2026-08-18 | **PDF fluxo de caixa:** sem título duplicado; período em datas (`08/2026` / intervalo), não "Desse mês" | `formatCashFlowPdfPeriodLabel` |
| 2026-08-18 | **Contrato imprimir assinado:** Imprimir usa o PDF ZapSign (com as 2 assinaturas), não o HTML | `printPatientContractDocument` |
| 2026-08-18 | **PDF rodapé:** `Documento gerado em` + separador no limite inferior de cada página; remove a data do canto nesses PDFs | `drawPatientPdfFooter`; `stampCornerDate: false` |
| 2026-08-18 | **PDF orçamento:** badge de status na linha `Paciente:` à direita (sai do letterhead) | `drawPatientPdfMetaRows` (`trailingBadge`); `build-patient-budget-pdf.ts` |
| 2026-08-18 | **Assinatura sem créditos:** checa saldo antes do PDF/`fileBase64` e abre modal Loja; logo do PDF redimensionada (máx. 384px JPEG) para não estourar o body | `isSignatureCreditBalanceEmpty`; `loadClinicLogoForPdf` |
| 2026-08-18 | **Ficha header:** ` - ` entre celular e CPF só quando os dois existem | `formatPatientHeaderContactLine` + `patient-detail-header` |
| 2026-08-18 | **PDF letterhead endereço:** `Rua, número, bairro, Cidade /UF, 00000-000` (vírgulas, sem rótulo CEP); uma linha; separador cinza claro | `formatClinicPdfAddressLine` + `drawPatientPdfClinicHeader` |
| 2026-08-18 | **PDF letterhead:** cabeçalho compartilhado sem retângulo; logo+nome à esquerda; direita = endereço/e-mail/telefones/CNPJ (sem rótulos); título centralizado abaixo; data no canto inferior direito (sem "Emissão:") | `patient-pdf-shared.ts` (`drawPatientPdfClinicHeader`) |
| 2026-08-18 | **Copy Prontuário/Procedimento:** aba da ficha = Prontuário; UI restante = Procedimento(s); Equipe = Visualizar prontuário; IDs/rotas intactos | `patient-detail-tabs`, planos, orçamento, comissões |
| 2026-08-18 | **Adipometria Petróski:** ≥2 medidas/dobra; calc Petroski 1995+Siri; bloco único Distribuição de gordura (barras + pizza %; legenda à direita, %) | `nutrition-petroski.ts`, `patient-nutrition-petroski-charts.tsx` |
| 2026-08-18 | **Nutrição UX:** Inicializar mantém `active`; toggle Mostrar finalizados usa `concludedTreatmentIds`; card Última evolução = nome do procedimento; comparar + azul / − amarelo; PDF anamnese `htmlToPlainText` | `filter-patient-treatments`, Sobre, PDF |
| 2026-08-18 | **Fisio Adicionar Procedimento:** sem aviso “não exige região anatômica” em `locationUiType=none` | `patient-treatment-add-form.tsx` |
| 2026-08-13 | **Mapa anatômico L/R:** vista frontal espelhada (direita do paciente = esquerda da tela); costas inalteradas | `corpogram-data.ts` |
| 2026-08-13 | **Sessões no orçamento (fisio):** flag `budgetTreatmentSessions`; expansão N itens no Adicionar; labels `i/N` só se N≥2 | Sheet orçamento + PDF + playbook |
| 2026-08-12 | **Playbook de vertentes:** link para `docs/vertentes-clinic-strand-playbook.md` (modelo + checklist pós-fisio) | Decisões §9 |
| 2026-08-12 | **Tratamentos mapa anatômico:** anotações por região (`body-region-annotations`) + `onRegionOpen` no corpogram + popover compartilhado | `patient-treatments-corpogram-card`, `patient-location-annotations-dialog` |
| 2026-08-12 | **Mapa anatômico — geometria orgânica:** regiões deixam de ser retângulos; `corpogram-data` usa paths/elipses (padrão HOF/odontograma) sobre a silhueta IMC | `corpogram-data.ts`, `odontogram-body.tsx` |
| 2026-08-12 | **Vertentes Parte 4 — mapa anatômico:** silhueta via assets IMC (`public/clinic/imc/{male,female}_*.svg`); controles em `budgets/maps/`; regiões overlay em `corpogram/` | `odontogram-body`, aba Prontuário / Orçamentos |
| 2026-08-12 | **Vertentes Parte 6 — CREFITO:** modal de conselho na 1ª emissão (receituário/atestado) só CREFITO + regionais 1–20; label PDF `CREFITO-7 12345` | `professional-council-dialog`, `@citybox/messaging/professional-council` |
| 2026-08-12 | **Vertentes Parte 5 — IMC:** aba **Cálculo de IMC** (`calculo-imc`, após Sobre) + API body-metrics; medições **somente leitura** após registro; silhueta por faixa via `public/clinic/imc/{male,female}_{1..6}.svg` | `patient-imc-tab`, `patient-body-metric-*`, `patient-imc.ts` |
| 2026-08-12 | **Vertentes Parte 3 — `locationUiType`:** planos expõem campo por especialidade; orçamento abre HOF/`session`/`none`/corpograma por config (remove `HOF_BUDGET_SPECIALTY_NAME`); plano vazio pré-preenche defaults por vertente | `specialty-location-ui-type.ts`, `patient-budget-sheet`, `clinic-plans.service` |
| 2026-08-07 | **Débito crédito ZapSign no FE:** `invalidateSignatureCredits` após request anamnese/contrato/lote; saldo Loja refetchOnMount | Contador acompanha uso |
| 2026-08-07 | **Loja relatório API:** `GET /v1/electronic-signatures` no card Relatório de assinaturas (KPIs + tabela server-side; período/filtros) | `features/clinic/loja/` |
| 2026-08-07 | **Loja assinatura API:** saldo `GET /v1/signature-credits` + Solicitar `POST /v1/signature-package-requests` (`signature-packages.api.service` + React Query); relatório zerado (sem mock de documentos) | `features/clinic/loja/` |
| 2026-08-07 | **Loja — Solicitações no admin:** Liberar fica em `/clientes/[id]` (aba após Configurações, só Clínica); Loja da clínica só Solicitar | `admin/web` store-detail + `clinica/web` loja |
| 2026-08-06 | **WhatsApp campanha:** coluna Visualização / status `read` abandonados; lista só Paciente/Enviado/Entregue; client Prisma sem `read` | `broadcast-campaign-messages-list` + clinica-api |
| 2026-08-06 | **WhatsApp preview:** balão recebido (visão paciente), doodle SVG, horário AM/PM, ícones vídeo/ligação | `whatsapp-message-phone-preview` |
| 2026-08-06 | **WhatsApp lembretes/inbound:** comparação wall-clock clínica (`toClinicWallClockUtc`) vs `startAt` | clinica-api process-inbound + reminders |
| 2026-08-06 | **Financeiro Exportar PDF:** Fluxo de caixa + Transações (meio/lista) ao lado de Filtrar | `build-cash-flow-pdf` · `build-transactions-pdf` |
| 2026-08-06 | **Dashboard demografia:** barras etárias altura fixa `320px` + `DashboardChartScroll` (`overflow-y-hidden` / scrollbar-gutter) — evita loop de scroll ao recolher sidebar | `dashboard-patient-demographics-card` |
| 2026-08-06 | **Agenda:** `use-prefill-agenda-professional` pré-seleciona profissional do membro logado no form | `scheduling-form` |
| 2026-08-06 | **Ficha Sobre:** card WhatsApp — expand/scroll automático nas mensagens recentes | `patient-whatsapp-messages-card` |
| 2026-08-06 | **Loja — Pacotes de Comunicação:** leaf no grupo Clínica (após Marketing); ícone `ShoppingCart` (Vendas → `CircleDollarSign`); hub `/loja` + `/loja/assinatura-eletronica` (mock) | `features/clinic/loja/`, `navigation.ts`, `icons.ts` |
| 2026-08-06 | **Planos — Não copiar:** inicia com 17 especialidades do catálogo sem tratamentos | `createEmptySystemSpecialties` + `initializeEmpty` |
| 2026-08-10 | **Conselho CRM/CRO:** modal na 1ª emissão de receituário/atestado; snapshot no PDF; `TeamMember.council*` | documentos + team |
| 2026-08-10 | **Categorias — cor livre:** swatches → `CategoryColorField` (`input type="color"` + hex); paciente `colorId` enum→`VarChar(7)` hex (migration `patient_category_color_hex`) | settings categorias + clinica-api |
| 2026-08-06 | **Equipe comissão %:** opção Todos em Plano/Especialidade (`COMMISSION_SCOPE_ALL` → API null); match por nome quando plano wildcard; valor fixo inalterado | `commission-rule-fields` + identity + service map |
| 2026-08-05 | **Dashboard demografia:** eixo Y em faixas de 10 anos (0–9 … 100+) + “Idade não informado” | API math + card |
| 2026-08-05 | **Agenda status:** `scheduled`/`confirmed` → `in_progress` (pula `patient_waiting`); FE filtra no popover | `appointment-status-transitions` + clinica-api |
| 2026-08-05 | **Financeiro Emitir recibo no caixa:** menu ⋮ receita recebida reusa PDF/dialog de Transações (`useEmitIncomeReceipt`) | `cash-flow-page` + hook compartilhado |
| 2026-08-05 | **Financeiro cancel:** desfaz liquidação → `pending` (não fica `cancelled`); toast/dialog alinhados | caixa + transações + `clinica-api` cancel |
| 2026-08-07 | **Loja card solicitações:** 4º card cinza (contagem da loja) + modal `DataTable` (Data/Assinatura/Status; Pendente/Aprovado/Recusado; paginação server-side) | `assinatura-solicitacoes-*` + packages-grid + clinica-api list |
| 2026-08-07 | **Vendas × orçamento:** label origem `budget`→**Orçamento**; invalidar `salesQueryKeys.opportunities` nas mutações de orçamento | labels + `use-patient-budgets-queries` |
| 2026-08-07 | **Vendas × orçamento:** card com `budgetId` (API) não pode drop em `completed`/`lost` no kanban; fechamento via aprovar/reprovar orçamento (sync server-side) | `kanban-board` + `sales.api.service` |
| 2026-08-05 | **Marketing Indicações API + UX:** KPIs/listas server-side; PDF só em Pacientes indicados; Indicadores com kind + link `N paciente(s)` → dialog (`referrerKind`/`referrerId`); Conversar `#1FA855`; layout marketing scroll na `main` | `marketing/indicacoes/*` + `clinica-api` `/v1/indicacoes/*` |
| 2026-08-04 | **WhatsApp templates UX:** lista DataTable (só Editar) + sheet fullscreen com sidebar de variáveis e chips (sem `{}` na UI); body API `{var}` via `whatsapp-template-editor-html` | `settings/whatsapp` |
| 2026-08-04 | **Marketing Indicações FE:** leaf permanece **Marketing**; `ComunicacaoNav` (abas Comunicação \| Indicações); `/marketing/indicacoes` com KPIs/listas/PDF/WhatsApp mock | `marketing/components/comunicacao-nav` + `marketing/indicacoes/*` + layout |
| 2026-08-04 | **Indicação por profissional externo:** select secundário + popover Novo profissional; `GET/POST` catálogo; payload `referredByExternalProfessionalId`; acquisition FE inclui a key | `modules/patients` + dashboard acquisition |
| 2026-08-04 | **Dashboard permissões:** módulo Equipe (3 IDs); nav `visao-geral` = Dashboard; abas gated; card Metas só com `update` Dashboard | `@citybox/clinica-permissions` + `clinic-nav-permissions` + dashboard UI |
| 2026-08-03 | **Agenda card cor:** Agendada sempre azul no card; Confirmada verde; Cancelada vermelho; header popover Agendada = `bg-primary` (cyan clínica) | `calendar-transform` + `EventDetailsPopover` |
| 2026-08-03 | **Agenda card cor:** `colorFromCategoryColor` aceita nome (`blue` do seed Particular) e hex; deixa de mapear categoria azul → cinza | `calendar-transform` |
| 2026-08-03 | **Agenda permissões finas:** menu/`Todos`/criar/profissional/excluir via `useSchedulePermissions`; API filtra view_all | `hooks/use-schedule-permissions` + scheduling routes |
| 2026-08-04 | **Equipe UX permissões:** accordion fechado ao abrir; módulos/checkboxes ordem alfabética pt-BR | `invite-professional-permissions-panel` |
| 2026-08-04 | **Cargos Equipe:** 8 papéis + presets; horários/agenda só `aluno`/`dentista`/`dentista_admin`; labels legados no sheet | `role-catalog` + `team-role-bridge` |
| 2026-08-04 | **Marketing finalizar:** botão/menu só com `marketing_campaign_finalize` (`delete` Marketing); API `PATCH …/status` exige `delete` (antes `update`) | header/row/card + campaigns.route |
| 2026-08-04 | **Vendas funis:** checkboxes `sales_view_funnel_*` filtram seletor/kanban; `sales_access` sozinho = lista vazia | `use-sales-permissions` + `sales-board` |
| 2026-08-04 | **Vendas:** `sales_access` só abre módulo; criar/editar/mover exige `sales_manage_opportunities` (UI + API) | `use-sales-permissions` + kanban |
| 2026-08-04 | **Financeiro config:** remove `financial_treatment_cost`; 4 checkboxes contas/categorias (`FinancialAccount`/`FinancialCategory`) | `@citybox/clinica-permissions` + settings + selects |
| 2026-08-04 | **Financeiro receive:** `settleFuture`/`settleRetroactive` liberam Receber por vencimento (parcela futura / atraso); `settle` libera todos | cash-flow + assert due date |
| 2026-08-04 | **Comissões:** `financial_commission_own` força só o próprio membro (API + sem merge da equipe na UI) | `assert-commission-permission` + `commissions-page` |
| 2026-08-04 | **Financeiro:** `financial_summary` é plus (cards); sozinho não abre módulo; views abrem lista | nav + `use-financial-permissions` + API types |
| 2026-08-04 | **Financeiro:** só `financial_expense_view` → aba Fluxo de caixa + listagem `types=expense`; Transações/Config/Comissões ocultas; API restringe tipos | `use-financial-permissions`, `FinancialNav`, list/find entries |
| 2026-08-04 | **Financeiro:** gates `financial_*` (Adicionar receita/despesa, receber/pagar, comissões, nav); hook `use-financial-permissions` | caixa + comissões + clinic-nav |
| 2026-08-04 | **Anamnese:** aba ficha só com `patient_anamnesis` (`manage` PatientAnamnesis); badge de alertas gated | `patient-detail-nav` + `patient-anamnesis-page` |
| 2026-08-04 | **Documentos:** cards Receituário/Atestado só com `patient_prescription_create` / `patient_certificate_create` | `patient-documents-tab` |
| 2026-08-04 | **Financeiro (ficha):** aba só com `patient_debit` (`manage` Patient); página bloqueada sem o checkbox | `patient-detail-nav` + `patient-financial-page` |
| 2026-08-04 | **Arquivos finos:** rename/move/edit exigem `patient_file_manage` (`update`); Novo=`create`; Excluir=`delete`; aba com qualquer file_* | drive menu/toolbar/preview + API |
| 2026-08-04 | **Arquivos:** aba ficha só com algum `patient_file_*` (create/manage/delete) | `patient-detail-nav` + `patient-files-page` |
| 2026-08-04 | **Emitir evoluções:** botões Emitir/Adicionar só com `patient_evolution_create`; edit/delete gated | evolution toolbar/actions |
| 2026-08-04 | **Tratamentos:** aba ficha só com `patient_treatments`; list/history evoluções na aba usam `manage` PatientTreatment (não bloqueiam a aba) | `patient-detail-nav` + treatment-evolutions list |
| 2026-08-04 | **Orçamentos:** aba/lista só com `patient_budget_read`; EDITAR/`Novo`/excluir/aprovar gated; API fina | `patient-detail-nav` + budgets tab/table/sheet |
| 2026-08-04 | **Editar dados pessoais:** botão Editar + alterar foto na ficha só com `patient_update_personal` (`update` Patient) | `patient-detail-header` |
| 2026-08-03 | **Ficha exige visualizar dados pessoais:** `canAccessPatientFicha` = `read` Patient; nome na lista não navega sem o checkbox | `patient-list-access` + `patients-table` |
| 2026-08-03 | **Pacientes lista sempre:** sidebar + `/pacientes` sem checkbox da ficha; ficha/CRUD exigem IDs finos; API list=`access` Patient | `patient-list-access` + ability + rotas patients |
| 2026-08-03 | **Categorias:** CRUD exige `settings_categories_*` (subject Category); `settings_manage`/Agenda/Ficha não liberam mais | API + UI Can |
| 2026-08-03 | **403 permissão:** modal global (OK → reload) só em mutations; GET não abre; service-hours/commission → Team | `PermissionDeniedDialog` + `clinica-client` |
| 2026-08-03 | **Configurações sempre + Equipe read-only:** sidebar Configurações sem checkboxes; só aba Equipe; `read` Team sempre; ações UI gated | ability + nav + `team-member-card` |
| 2026-08-03 | **Configurações — tela Clínica:** `/configuracoes` só com `settings_manage`; aba/nav filtradas; sidebar aponta p/ 1ª aba liberada | `clinic-settings-access` + `clinic-nav-permissions` + `clinic-settings-nav` |
| 2026-08-03 | **Catálogo granular Equipe/nav:** ~65 IDs em 7 módulos; menu por `schedule_view_menu` / `stock_access` / `sales_access` / `marketing_campaign_*` / `patient_*` (+ aliases) | `@citybox/clinica-permissions` + `clinic-nav-permissions` |
| 2026-08-03 | **Sidebar CASL:** `createClinicNavPermissions` + `usesStorePermissionsApi` (`members/me`) — deixa de liberar todos os módulos | `manifest.ts`, `clinic-nav-permissions.ts` |
| 2026-08-03 | **Equipe permissões editáveis:** checkboxes + persistência no vínculo; guard/presenter usam JSON do banco | `settings/team` + `members` API |
| 2026-08-03 | **Equipe Configurações Gerais:** 5 checkboxes (equipe, clínica, planos, anamnese, contrato) via catálogo CASL | `@citybox/clinica-permissions` |
| 2026-08-03 | **Equipe permissões CASL:** painel usa `STORE_PERMISSIONS_MODULES` + defaults por cargo; mocks de checkbox removidos | `settings/team` + `@citybox/clinica-permissions` |
| 2026-08-03 | **Financeiro — abas:** `buttonsHideFrom="xl"` (sem setas em 1280/1366; Configurações segue `2xl`) | `financial-nav` + PageNav prop |
| 2026-08-03 | **Configurações — abas:** `PageNav scrollMode="buttons"` (setas `<` `>`, sem scroll horizontal) | `clinic-settings-nav` + `@citybox/ui` PageNav |
| 2026-08-03 | **Planos — criar especialidade:** `addSpecialty` puro + `flushSync`/focus; input sempre se nome vazio; sem blur-exit | `use-clinic-plan-configure`, `plan-specialties-sidebar` |
| 2026-07-31 | **Evolução ZapSign UX:** seleção → Emitir documento → preview → Solicitar → issued dialog (dialogs em `signatures/`) | `patient-treatments-tab` + pdf sheet mode |
| 2026-07-31 | **Anamnese assinada:** menu ⋮ só “Ver Anamnese”; preview carrega PDF assinado ZapSign | `patient-anamnesis-actions-menu` + fetch `signed-pdf` |
| 2026-07-31 | **Anamnese ZapSign status na lista:** sync `by-target` ao listar pending + poll no modal emitido + invalidate quando `signed` | Badge Assinada atualiza sem depender só do webhook |
| 2026-07-31 | **Anamnese ZapSign UX:** Emitir → preview + Solicitar assinatura; modal e-mail opcional + skip localStorage; modal Documento emitido (card 1 signer) | `patient-anamnesis-tab`, pdf/email/issued dialogs |
| 2026-07-31 | **Contrato a partir do orçamento + UX ZapSign:** ícone na tabela; `budgetId`; modal privacidade ZapSign; accordion 0/2 signatários | `patient-budgets-tab`, preview/request sheets, clinica-api |
| 2026-07-31 | **Assinatura eletrônica ZapSign:** anamnese/evolução lote/contrato — SignatureRequestSheet + request API | `electronic-signatures.service`, sheets anamnese/tratamentos/contrato |
| 2026-07-30 | **Dashboard UX:** Conversar com `WhatsappBrandIcon`; layout desktop botão à direita; cashflow barras finas + tooltip Receita/Despesa (Dia/mês) | dialogs Pacientes + `dashboard-cashflow-card` |
| 2026-07-30 | **Aniversariantes — ritmo anti-ban:** copy na view (1 msg / 5 min a partir 07:00 BRT); specs Jest (`expect`) nos use cases birthday | `broadcast-campaign-details` + clinica-api |
| 2026-07-30 | **Marketing Aniversariantes — mensagens enviadas:** tabela Paciente/Enviado/Entregue via `GET …/messages` (Visualização removida 2026-08-06) | `broadcast-campaign-messages-list` |
| 2026-07-30 | **Marketing Aniversariantes — view:** `BroadcastCampaignViewTemplate` (header/stats/detalhes público+mensagem); `toUiContent` preserva content BROADCAST | `campaigns/[id]`, `broadcast-campaign-*` |
| 2026-07-30 | **Marketing Aniversariantes:** card habilitado; wizard público (plano/especialidade/gênero) + mensagem + preview WhatsApp + ativar | `broadcast-template/aniversario/*` |
| 2026-07-30 | **Agenda profissionais:** selects/calendário só `gerente` (cargo com Horários de Atendimento); estoque retirada volta ao shared team | `agenda/api/team.ts` + `stock-withdrawal-sheet` |
| 2026-07-29 | **Agenda WhatsApp:** `Switch` à esquerda; visível no create e no edit (edit inicia off; liga → reenvia confirmação) | `appointment-section`, `scheduling-form`, update appointment API |
| 2026-07-29 | **WhatsApp lembrete 2h:** automático no worker API para consultas confirmadas (sem UI extra) | Ver clinica-api `AppointmentReminderScheduler` |
| 2026-07-29 | **WhatsApp MVP:** Configurações `/whatsapp` (QR + templates); toggle confirmação na agenda; card Mensagens chat na ficha Sobre | `settings/whatsapp`, `appointment-section`, `patient-whatsapp-messages-card` |
| 2026-07-27 | **Orçamento HOF auto-tab:** seleção de tratamento com `specialtyName === 'Harmonização Facial'` força aba HOF no odontograma | `patient-budget-sheet` + `patient-budget-odontogram` + `map-plan-to-budget-treatment-options` |
| 2026-07-27 | **Odontograma layout:** canvas coroa 24×56 + faces 24×24; `preserveAspectRatio` YMax/YMin; vão faces↔coroa igual (gap 4px) em cima/baixo; mirror no wrap | `odontogram.css`, `odontogram-tooth.tsx` |
| 2026-07-27 | **Tratamentos odontograma:** loading spinner na coroa antes do popover de anotações | `odontogram-tooth` + `patient-treatments-odontogram-card` |
| 2026-07-27 | **Tratamentos odontograma:** anotações por dente persistidas (`v1/patients/:id/tooth-annotations`) | `patient-tooth-annotations` (API) + ERP hooks/service |
| 2026-07-27 | **Tratamentos odontograma:** por dente prevalece o tratamento mais recente (finalize → verde mesmo com ativo antigo) | `partitionPatientTreatmentTeeth` |
| 2026-07-27 | **Tratamentos odontograma:** dentes de orçamento aprovado (`source=budget`) também pintam como Aberto/Finalizado | `partitionPatientTreatmentTeeth`, `patient-treatments-odontogram-card` |
| 2026-07-27 | **Planos / Orçamentos:** `acceptsFaces` na API; faces no `locationLabel`; localStorage removido; re-hidrata `toothFaces` ao editar | `clinic-plans`, `patient-budget-api-mappers`, `tooth-location-label` |
| 2026-07-27 | **Tratamentos:** odontograma SVG (Permanentes/Decíduos, `showHof={false}`) abaixo de Adicionar Procedimento; checkboxes Aberto/Finalizado; anotações via API | `patient-treatments-odontogram-card.tsx`, `patient-tooth-annotations-dialog.tsx` |
| 2026-07-24 | **Orçamentos:** odontograma SVG (Permanentes/Decíduos/HOF + faces/regiões) no accordion do sheet; substitui picker numérico; seleção → `toothNumbers`/`hofRegionIds`/`toothFaces` | `budgets/odontogram/*`, `patient-budget-sheet.tsx` |
| 2026-07-24 | **HOF Desenhar:** modos Regiões/Desenhar; Fabric.js (ponto, seta, risco, borracha, selecionar); anotações em `draft.hofAnnotations` (local, sem API) | `odontogram-hof*.tsx`, `fabric` |
| 2026-07-24 | **HOF expandir:** botão Maximize2 ao lado do sexo; Dialog ampliado com rosto + regiões/desenho (um canvas Fabric por vez) | `odontogram-hof.tsx` |
| 2026-07-23 | **Dashboard Relatórios:** Aniversariantes via `GET /v1/reports/birthdays` (filtro período + paginação); demais relatórios mock; Accordion + Exportar | `modules/dashboard/reports/`, `clinic-reports-page.tsx`, clinica-api `modules/reports` |
| 2026-07-23 | **Dashboard Relatórios:** Tratamentos abertos sem consulta via API + PDF (header clínica); sem filtro de período | `reports-open-treatments*`, clinica-api `open-treatments-without-appointment` |
| 2026-07-23 | **Dashboard Relatórios:** Orçamentos aprovados via API (`approvedAt` + Anual/Mensal) + PDF | `reports-approved-budgets*`, clinica-api `approved-budgets` |
| 2026-07-23 | **Dashboard Relatórios:** Orçamentos em aberto via API (`pending` + `Budget.date`) + PDF | `reports-open-budgets*`, clinica-api `open-budgets` |
| 2026-07-23 | **Dashboard Relatórios:** Orçamentos reprovados via API (`rejected` + `rejectedAt`) + PDF | `reports-rejected-budgets*`, clinica-api `rejected-budgets` |
| 2026-07-23 | **Dashboard Relatórios:** Vendas por especialidades via API (itens aprovados + especialidade) + PDF | `reports-sales-by-specialty*`, clinica-api `sales-by-specialty` |
| 2026-07-23 | **Dashboard Relatórios:** Vendas por planos via API (itens aprovados + planName) + PDF | `reports-sales-by-plan*`, clinica-api `sales-by-plan` |
| 2026-07-23 | **Dashboard Relatórios:** Vendas por profissional via API (itens aprovados + professionalName) + PDF | `reports-sales-by-professional*`, clinica-api `sales-by-professional` |
| 2026-07-23 | **Dashboard Relatórios:** Vendas por procedimentos via API (itens aprovados + treatmentName/planName) + PDF | `reports-sales-by-treatment*`, clinica-api `sales-by-treatment` |
| 2026-07-23 | **Dashboard Relatórios:** Despesas por categoria via API (pagas agregadas + %) + PDF | `reports-expenses-by-category*`, clinica-api `expenses-by-category` |
| 2026-07-24 | **Responsivo clinic:** financeiro (PageNav, layout, KPIs tablet, sheets max-w, filtros, categorias cor); equipe sheet; planos (layout/footer/tabela + guard modal padrão); anamneses tabela scroll-x; PageNav DS | `financeiro/*`, `settings/{team,plans,anamneses}`, `@citybox/ui` PageNav |
| 2026-07-24 | **Docs:** wiki Relatórios/Agenda/Visão Geral + AGENTS (Tarefas missed, cores cancelada/falta, reabrir status, UX mobile/reagendar) | wiki-erp-clinic · AGENTS clinic/api/erp/ui |
| 2026-07-24 | **Tarefas UX:** mobile compacto (sem avatar); Reagendar com máscara celular + ordem horário/duração; dialog Pacientes mobile | `tasks/` + `dashboard-patient-metric-dialog` |
| 2026-07-24 | **Agenda:** reabrir cancelada/falta; card vermelho + header `bg-red-400` | `appointment-state-machine` + `calendar-transform` + popover |
| 2026-07-24 | **Agenda + Tarefas:** faltas (`missed`) entram em Consultas canceladas; cards/header vermelhos para cancelada/falta | `calendar-transform`, `EventDetailsPopover`, clinica-api cancelled-appointments |
| 2026-07-24 | **Dashboard Tarefas:** card Pacientes (mesmo do Indicadores) ao lado de Consultas canceladas | `clinic-tasks-page.tsx` |
| 2026-07-24 | **Dashboard Tarefas:** card Consultas canceladas integrado à API (`GET /v1/dashboard/tasks/cancelled-appointments`); ignore em `sessionStorage` | `modules/dashboard/tasks/` + clinica-api |
| 2026-07-24 | **Dashboard Tarefas:** card Consultas canceladas (mock + Exibindo + empty state + WhatsApp/Reagendar/Ignorar) | `modules/dashboard/tasks/`, `app/(clinic)/tarefas` |
| 2026-07-24 | **Origem do paciente:** catálogo `patient-referral-origins` no form (+ Nova origem); indicação paciente/profissional com busca debounced; payload `referralOriginId`/`referredBy*`; acquisition inclui `indicacao_profissional` | `modules/patients` + dashboard acquisition |
| 2026-07-24 | **Financeiro / Relatórios:** cancel grava ator; receitas excluídas mostram `cancelledByName` | clinica-api cancel + `excluded-revenues` |
| 2026-07-24 | **Relatórios cache:** `invalidateClinicDashboardQueries` também invalida `clinic/reports`; freshness `refetchOnMount: always` nos hooks | `invalidate-clinic-dashboard-queries` + `report-query-options` |
| 2026-07-23 | **Dashboard Relatórios:** Receitas excluídas via API (cancelled + updatedAt) + PDF | `reports-excluded-revenues*`, clinica-api `excluded-revenues` |
| 2026-07-23 | **Dashboard Relatórios:** Pacientes indicados via API (indicacao + createdAt) + PDF | `reports-referred-patients*`, clinica-api `referred-patients` |
| 2026-07-22 | **Marketing:** removidas aba Indicações e `MarketingNav` (Campanhas); marketing fica só em campanhas | `app/(clinic)/marketing/layout.tsx`; removidos `indications/` e `marketing-nav.tsx` |
| 2026-07-22 | **Dashboard Recebimentos por meio:** card integrado a `GET /v1/dashboard/payment-methods`; Ver deep-link; mock removido do wiring | `payment-methods*` + `dashboard.api.service` |
| 2026-07-22 | **Dashboard Comissões:** card integrado a `GET /v1/dashboard/commissions` + `/details`; PDF shell clínica; mock removido do wiring | `commissions*` + `dashboard.api.service` |
| 2026-07-22 | **Docs:** wiki Relatórios & BI + Visão Geral atualizados (Indicadores via API; Despesa por categoria; freshness); AGENTS clinic §8.2 + clinica-api §4.7 | wiki-erp-clinic · AGENTS |
| 2026-07-22 | **Dashboard freshness:** `staleTime: 0` + `refetchOnMount: 'always'` via `dashboard-query-options.ts`; mutações financeiras invalidam `clinic-dashboard*` | `dashboard-query-options` + hooks + `invalidate-clinic-dashboard-queries` |
| 2026-07-22 | **Dashboard cache:** mutações financeiras invalidam queries `clinic-dashboard*` (`invalidateClinicDashboardQueries`) | `financeiro/hooks/*` + `invalidate-clinic-dashboard-queries.ts` |
| 2026-07-22 | **Dashboard Despesa por categoria:** card integrado a `GET /v1/dashboard/expense-by-category`; mock removido do wiring; Ver mantém deep-link fluxo de caixa | `expense-by-category*` + `dashboard.api.service` |
| 2026-07-22 | **Dashboard Inadimplência:** card + dialog integrados a `GET /v1/dashboard/inadimplencia` + `/details`; mock removido do wiring | `inadimplencia*` + `dashboard.api.service` |
| 2026-07-22 | **Dashboard Ticket médio:** card integrado a `GET /v1/dashboard/ticket-medio`; mock removido do wiring | `ticket-medio*` + `dashboard.api.service` |
| 2026-07-22 | **Dashboard Receitas x Despesas:** card integrado a `GET /v1/dashboard/cashflow`; PDF shell clínica; mock removido do wiring | `cashflow*` + `dashboard.api.service` |
| 2026-07-22 | **Dashboard Origem do paciente:** card integrado a `patient-acquisition` + `/details`; mock removido do wiring; dialog server-side | `modules/dashboard/` patient-acquisition* |
| 2026-07-21 | **Dashboard Orçamentos:** card integrado a `budget-analysis/status|aggregates|details` (count por Budget, responsável); mock removido do wiring | `modules/dashboard/` |
| 2026-07-21 | **Metas de Vendas — meta persistente + visão mensal:** backend guarda meta ativa e `dailySales` de `startDate` até hoje (substituir reinicia); frontend com seletores mês/ano onde **tudo é do mês exibido** (barra zera na troca de mês), rampa da meta por dia útil, “Necessário vender por dia útil” (feriados fixos em `lib/br-holidays.ts`) e “Meta atingida!” no lugar do % diário | `modules/dashboard/` |
| 2026-07-21 | **Dashboard card Metas de Vendas:** integrado a `GET/PUT /v1/dashboard/sales-goals`; realizado via orçamentos aprovados; mock removido do wiring | `modules/dashboard/` |
| 2026-07-21 | **Dashboard card Pacientes:** integrado a `GET /v1/dashboard/patients/summary` + `patients?metric=`; mock removido do wiring da página | `modules/dashboard/` |
| 2026-07-21 | **Dashboard card Financeiro:** integrado a `GET /v1/financial/entries/stats` (`dueDate` mês civil); mock removido do wiring | `modules/dashboard/` |
| 2026-07-21 | **Dashboard Análise de Receitas:** card/dialog integrados a `GET /v1/dashboard/revenue-analysis` + `/details`; Metas continua com `MOCK_DASHBOARD_REVENUE_SALES` | `modules/dashboard/` |
| 2026-07-21 | **Dashboard orçamentos:** dialog integrado a `GET /v1/dashboard/budgets` (paginação server-side, total via `meta.totalValueCents`, export paginado); `MOCK_DASHBOARD_BUDGETS` só em testes | `modules/dashboard/` |
| 2026-07-21 | **Dashboard aniversariantes:** dialog integrado a `GET /v1/dashboard/birthdays` (período/busca/paginação); mock removido do dialog | `modules/dashboard/` |
| 2026-07-21 | **Dashboard KPI aniversariantes:** `upcomingBirthdaysCount` no summary; dialog ainda mock | `modules/dashboard/` |
| 2026-07-21 | **Dashboard KPI orçamentos abertos/reprovados:** `openRejectedBudgetsTotalCents` no summary; dialog ainda mock | `modules/dashboard/` |
| 2026-07-21 | **Dashboard KPI Débitos em atraso:** integrado a `GET /v1/dashboard/summary` (`dashboard.api.service` + `useDashboardSummaryQuery`); demais KPIs/cards ainda mock | `modules/dashboard/` |
| 2026-07-20 | **Dashboard Despesa por categoria:** card full-width mock abaixo de Inadimplência — pizza + legenda detalhada (verde/azul/amarelo); Ver → fluxo de caixa (despesas + categoria + período) | `modules/dashboard/` expense-by-category* · cash-flow-deep-link |
| 2026-07-20 | **Dashboard Inadimplência:** card full-width mock + modal Inadimplentes (tabela, link paciente, Conversar, Exportar); tooltip fora do anel | `modules/dashboard/` inadimplencia* |
| 2026-07-22 | **Dashboard Consultas:** card integrado — `GET /v1/dashboard/appointments` + `/details`; só terminais; dialog paginado; profissional via equipe | `appointments*` + `dashboard.api.service` |
| 2026-07-22 | **Dashboard Demografia:** card idade/sexo integrado — `GET /v1/dashboard/patient-demographics`; filtro sexo só na série etária; PDF padrão clínica | `patient-demographics*` + `dashboard.api.service` |
| 2026-07-20 | **Dashboard Ticket médio:** card full-width mock abaixo de Recebimentos — 2 LineCharts; Y com passos bonitos (~4 ticks) | `modules/dashboard/` ticket-medio* |
| 2026-07-20 | **Dashboard Recebimentos por meio:** Ver → deep-link Transações (Receitas + meio); remove dialog | `transactions-deep-link.ts` + `transactions-page.tsx` |
| 2026-07-20 | **Dashboard Recebimentos por meio:** card full-width mock abaixo de Comissões — período fino, total, barra stacked, legenda + Ver | `modules/dashboard/` payment-methods* |
| 2026-07-21 | **Orçamentos — rejeitar/reabrir no ERP:** sheet com status Em aberto/Reprovado, data+motivo; `updatePatientBudgetStatus` envia meta; badge Reprovado; hidratação no editar | `patient-budget-settings-section`, `patient-budgets.service` |
| 2026-07-20 | **Dashboard Comissões:** card full-width mock abaixo de Receitas x Despesas — bruto (regras/tipos) vs líquido (total/ranking); dialog Ver + PDF/print | `modules/dashboard/` commissions* |
| 2026-07-20 | **Dashboard Receitas x Despesas:** card full-width mock abaixo de Consultas — período anual/mensal, totais, ComposedChart (barras + saldo cumulativo), PDF | `modules/dashboard/` cashflow* |
| 2026-07-20 | **Dashboard Consultas:** card full-width mock abaixo de Origem/Demografia — filtro categoria + período anual/mensal; cards realizadas/faltas; gráfico Y 0–100; taxa de comparecimento; dialog + PDF | `modules/dashboard/` appointments* |
| 2026-07-20 | **Dashboard Origem + Demografia:** grid 50/50 abaixo de Orçamentos — origem por cadastro (anual/mensal) + idade/sexo (barras + pizza) | `modules/dashboard/` patient-acquisition* · patient-demographics* |
| 2026-07-17 | **Marketing período:** sync `finished` às 00:00 BRT da data fim; wizard exige data fim futura (não hoje) | `campaign-period.utils` + step-four schema |
| 2026-07-20 | **Dashboard Metas de Vendas:** card full-width mock acima de Orçamentos — meta mensal editável, progresso, ritmo por dia útil (amanhã→fim do mês), gráfico acumulado × objetivo; só `approved_budget` | `modules/dashboard/` sales-goals* |
| 2026-07-17 | **Dashboard Orçamentos:** card full-width mock — status (gráfico + % aprovação) + análise (abas/profissional/plano/tratamento) + dialog + PDF; filtro profissional compartilhado; períodos independentes | `modules/dashboard/` budget-analysis* |
| 2026-07-17 | **Dashboard Financeiro + Pacientes:** coluna lateral mock; mês/ano e barras financeiras; seis métricas com dialog pesquisável em cards, e-mail/CPF, WhatsApp, links para ficha e PDF; layout 55/45 | `modules/dashboard/` side cards |
| 2026-07-17 | **Dashboard Análise de Receitas:** card mock 2/3 abaixo dos KPIs — Recebimentos/Vendas, períodos, abas dimensão, dialog + PDF | `modules/dashboard/` revenue-analysis* |
| 2026-07-17 | **Dashboard inicial (`/`):** mock frontend — 3 KPI cards, deep-link fluxo de caixa, dialogs orçamentos/aniversariantes + PDF + WhatsApp; slice `modules/dashboard/` | `modules/dashboard/`, `financeiro/pages/cash-flow-page.tsx` |
| 2026-07-17 | **Dashboard em abas de rota:** Indicadores (principal), Relatórios e Tarefas; Ortodontia removida; fundo cinza; removido cabeçalho “Visão geral” | `modules/dashboard/components/dashboard-{page-frame,route-nav}`, `app/(clinic)/{relatorios,tarefas}` |
| 2026-07-16 | **Marketing ponta a ponta:** formulário público + views (cookie 30min) + submissões/duplicidade + oportunidade CRM/submission detail; URLs externas normalizadas; limite finaliza campanha; data local sem off-by-one; QR PNG `qrcode.react`; ações do header expostas | `features/clinic/marketing/campaigns`, `features/clinic/vendas` |
| 2026-07-16 | **Marketing QR Code:** `qrcode.react` no client (`QrCodeModal` 320px + `resolve-campaign-public-url`); mock blob removido; modal fora do `<tr>` evita abrir campanha ao fechar | `features/clinic/marketing/campaigns` |
| 2026-07-16 | **Marketing backoffice integrado:** `campaigns.api.service.ts` + hooks `useClinicId`; lista/create/detalhe/status via API | `features/clinic/marketing/campaigns` |
| 2026-07-15 | **Comissões:** migration única `20260715165240_add_commissions` (source refs inclusas); finalize invalida `commissionsKeys` | clinica-api + ERP treatments |
| 2026-07-15 | **Comissões:** motors approve/finalize (`budget_approved` / `treatment_completed` só via Tratamentos→Finalizar) | clinica-api accruals |
| 2026-07-15 | **Comissões:** alerta orçamento (longo → “já cadastrada” com %); card amarelo + ícone | `commission-rule-fields.tsx` |
| 2026-07-15 | **Comissões:** cache receive + staleTime 0; desconto só no detalhe; dente nas linhas; DialogTitle sucesso | `use-receive-entry`, details, enrich names |
| 2026-07-15 | **Comissões:** regras Equipe — identidade única + prefill/sobrescrita (sem duplicar) | `team/lib/commission-rule-identity.ts` + panel |
| 2026-07-15 | **Comissões:** histórico agregado por profissional (1 linha; detalhe une pagamentos do período) | `comissoes/` + clinica-api history |
| 2026-07-15 | **Comissões CLIN-062:** ERP integrado — `commissions.api.service` + React Query; regras `commission-rules.service` na Equipe; mock removido; union team em Em aberto | `financeiro/comissoes/`, `settings/team` |
| 2026-07-15 | **Comissões:** Em aberto lista todos os membros; sem regra → Configurar → deep-link Equipe `?memberId=&tab=commission` | `comissoes/` + `equipe-settings-page` |
| 2026-07-15 | **Comissões (financeiro):** frontend mock — Em aberto/Histórico, período, busca profissional, modais detalhes/pagar/sucesso; filtro `filter-commissions-by-period` | `financeiro/comissoes/`; `FinancialNav`; CLIN-062 backend pendente |
| 2026-07-14 | **Transações (financeiro):** integração API (list + by-payment-method; paginação server-side; cancel desfaz liquidação; delete liquidados) | `transactions-page`, `financial.api.service`, `use-transactions-query`; mock removido |
| 2026-07-14 | **Transações (financeiro):** UI mock espelhando fluxo de caixa; vistas Meio de pagamento / Transações; VER → filtro por meio | `transactions-page`, `transactions.service`, `transactions-*-table`, filters/aggregate lib |
| 2026-07-13 | **Vendas CRM — polish:** colunas Agendada/Perdida fixas no fim; save funil 2 fases (UNIQUE order); filtro período custom (yyyy-MM-dd / dia civil BRT); layout datas na mesma linha; cor etapa no modal; `onCardDrop` + `sortOrder` | `features/clinic/vendas`, `@citybox/ui` Kanban, wiki `25-crm-funil-vendas` |
| 2026-07-13 | **Vendas — ordem dos cards:** `sortOrder` + `useReorderOpportunities` / `PATCH /v1/opportunities/reorder`; drop no kanban persiste ordem (mesmo estágio e ao mover) | `features/clinic/vendas`, `@citybox/ui` `KanbanProvider.onCardDrop` |
| 2026-07-13 | **Vendas (CRM) integrado:** `sales.api.service.ts` + hooks com `useClinicId`/`storeId`; mock removido; marketing (`getFunnel`/`useFunnels`) passa a exigir store | `features/clinic/vendas`, campanhas step-two/review/details |
| 2026-07-09 | **Estoque integrado end-to-end:** `stock.api.service.ts` + hooks com `useStore()`; listagem/histórico com paginação, busca (debounce 400ms) e ordenação server-side; `erpDataTableStyleProps` + `StockSortableHeader`; filtro de data no histórico via `formatLocalDateString`; fix create fornecedor (`repository.create`) | `features/clinic/estoque`, `clinica-api` módulo `stock` |
| 2026-07-09 | **Agenda — compromissos bloqueiam consultas** (timed + all-day); `clinic-datetime.ts` (fuso wall-clock); alertas retorno ficha+agenda integrados; `returnAlertId`; tooltip observação vazia; checkbox Dia inteiro alinhado | `internal-event-blocking`, `clinic-datetime`, `patient-return-alerts-popover`, `commitment-section` |
| 2026-07-10 | Configurações: CEP/CNPJ; equipe soft-status; deletes 409+modal (planos/anamneses/contratos); seed anamnese API; categorias em rotas separadas (fim do sync); plano inativo na Sobre; refetch biblioteca anamnese; UX contrato/categorias | `resource-in-use-dialog`, `categoria-paciente`/`categoria-agendamento`, `shared/team`, `formatPatientPlanLabel` |
| 2026-07-08 | **Agenda UX:** `local-date.ts` (datas locais); modal slots manhã/tarde + almoço oculto; step `durationMin` no backend; categorias appointment espelhadas de pacientes; sheet compromisso sem card; campos h-11 | *(espelhamento removido 2026-07-10)* |
| 2026-07-07 | **Agenda integrada** (CLIN-021): `agenda/api/*` via `clinicaFetch`; mock `mock-data.ts` removido; equipe/pacientes/perfil reutilizam módulos existentes | hooks com `useStore()`; testes `agenda-api.test.ts` |
| 2026-07-13 | UX financeiro + ficha: receive/pay sheets padrão clinic; category select = agenda; config TabsList cinza full-width; header ficha (seta ← ao lado da foto); caixa ficha via `useFinancialAccounts` | `financeiro/*`, `patient-detail-header`, `patient-financial-receive-*` |
| 2026-07-13 | Receive da ficha: select de caixa via `useFinancialAccounts` (remove `MOCK_FINANCIAL_CASH_REGISTERS`) | `patient-financial-receive-sheet.tsx` |
| 2026-07-13 | **Financeiro global (fluxo de caixa)** integrado: `financial.api.service.ts` + mappers BRL↔cents; hooks com `useClinicId`; contas/categorias via API | `features/clinic/financeiro`; CLIN-061 (Transações integradas em 2026-07-14) |
| 2026-07-07 | Correção **paginação server-side** nas tabelas da ficha: `manualPagination` em orçamentos, anamnese e financeiro | `patient-budgets-table`, `patient-anamneses-table`, `patient-financial-table`; ver §5.11 |
| 2026-07-07 | Aba **Financeiro** sem badge "Em breve" | `patient-detail-tabs.ts` (`PATIENT_DETAIL_IMPLEMENTED_TABS`) |
| 2026-07-07 | Integração aba **Arquivos** end-to-end: `patient-files.service` + `use-patient-files-queries`; busca server-side (debounce 400ms); upload multipart MinIO; preview/download via proxy; badge "Em breve" removido | `patient-files-tab`, `patient-file-api-mappers`, `patient-detail-tabs.ts`; wiki `24-arquivos-paciente` |
| 2026-07-06 | Integração aba **Documentos**: contratos/receituários/atestados via clinica-api; removido `patient-documents-mock-store.ts`; PDFs com `patient-pdf-shared` | `patient-documents-tab`, `use-patient-documents-queries`, `build-patient-prescription-pdf.ts`, `build-patient-certificate-pdf.ts` |
| 2026-07-06 | **Finalizar procedimento** integrado: `finalizePatientTreatment` + `patient-treatment-finalize-sheet`; aba Prontuário sem "Em breve" | `patient-treatments.service`, `use-patient-treatments-queries`, `patient-detail-tabs.ts` |
| 2026-07-06 | Tabelas de Configurações: cabeçalhos alinhados ao conteúdo via `erpDataTableStyleProps` (planos, anamneses, contrato, categorias) | `features/shared/lib/data-table-styles.ts`, `clinic-patient-categories-table.tsx` |
| 2026-07-06 | Integração aba **Anamnese** + rota pública: `patient-anamnesis.service`, `public-patient-anamnesis.service`, BFF `/api/public/clinic/anamnesis/[token]`; mock store removido | `patient-anamnesis-tab`, `use-patient-anamnesis-queries`, listagem server-side §5.11 |
| 2026-07-06 | PDF anamnese alinhado ao orçamento/evolução (cabeçalho clínica, dados do paciente, respostas em cards, assinatura; async + perfil da clínica) | `build-patient-anamnesis-pdf.ts`, `patient-anamnesis-tab`, `patient-anamnesis-page`, `patient-pdf-shared.ts` |
| 2026-07-06 | PDF de histórico de evoluções: seção "Dados do Paciente", assinatura e título atualizado | `build-patient-evolution-pdf.ts`, `patient-treatments-page`, `patient-treatments-tab` |
| 2026-07-06 | PDF evolução/tratamentos alinhado ao orçamento (logo, CNPJ, telefone, cabeçalho compartilhado) | `patient-pdf-shared.ts`, `build-patient-evolution-pdf.ts`, `patient-treatments-tab` |
| 2026-07-06 | PDF orçamento: logo da clínica (proxy), CNPJ e telefones em linhas dedicadas no cabeçalho | `build-patient-budget-pdf.ts` (async + `loadClinicLogoForPdf`) |
| 2026-06-29 | Arquivo `AGENTS.md` (UI feature clinic) criado | — |
| 2026-07-01 | Adicionadas features **Vendas**, **Estoque**, **Financeiro** e **Marketing** 100% mockadas (incl. form público em `/campanha/[clinic]/[slug]`); **Agenda** iniciou mock e foi integrada em 2026-07-07 (CLIN-021) | §4.2, §5.7, §5.8, §5.14 |
| 2026-07-03 | Integração completa Pacientes (`feat/clinic/create-backend-patient`): API `v1/patients` + `v1/patient-categories`, foto MinIO, paginação server-side, RHF+Zod, validação com toast | `patient-photo-dialog`, `patients-pagination-bar`, `patient-form-validation`, `patient-api-mappers` |
| 2026-07-03 | CLIN-041 ERP: listagem orçamentos server-side, PDF impressão (`build-patient-budget-pdf`), debounce 400ms, approve invalida tratamentos; removidos helpers client-side mortos | `patient-budgets-tab`, `use-debounced-search.ts`, §5.11, §8 |
| 2026-07-03 | Integração ERP **Pacientes** (lista, cadastro, categorias, aba Sobre) via `v1/patients` + `v1/patient-categories`; RHF+Zod; abas sem API com badge "Em breve" | `modules/patients/services/*`, hooks React Query, §5.9, §8 |
