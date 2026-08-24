# AGENTS.md — Vertical Clínica (`api`)

> **Para agentes de IA:** Este arquivo é a fonte de verdade sobre o subapp
> **`apps/verticals/clinica/api`**. Leia-o integralmente antes de qualquer ação.
> Ao modificar código, atualize as seções relevantes deste arquivo na mesma
> operação. Nunca remova seções — apenas atualize ou adicione.

---

## 1. Identidade do Módulo

| Campo            | Valor                                                  |
| ---------------- | ------------------------------------------------------ |
| **Nome**         | `apps/verticals/clinica/api` · pacote `@citybox/clinica-api` |
| **Tipo**         | API NestJS · Vertical **Clínica** (backend da vertical) |
| **Responsável**  | Bruno Lopes — Aplopes Tecnologia                       |
| **Status**       | 🟡 Em desenvolvimento — config + **pacientes** + **agenda (CLIN-020/021)** + orçamentos/tratamentos/evoluções + **estoque** + **financeiro global (`v1/financial/*`, incl. Transações)** + **comissões (CLIN-062)** + **vendas/CRM** + **marketing `form_lead` + `aniversario` WhatsApp + Indicações (`/v1/indicacoes/*`)** + **dashboard** (`GET /v1/dashboard/*`) + **reports** + **store-setup** (worker RabbitMQ first-contact) + **WhatsApp (Baileys MVP)** + **pacotes de assinatura (`signature-packages`)** |
| **Porta**                         | `3172`                                                 |
| **Última atualização deste arquivo** | 2026-08-21 — create member: 409 claro + reativa soft-delete (sem 500 P2002) |

**Propósito em uma linha:**
Backend da vertical **Clínica** do CityBox — gestão de clínica (operações do
segmento, não duplicar catálogo/pedidos do marketplace-api, ADR C-03). Estrutura
clonada da vertical piloto `food`; o módulo **`contract-models`** (modelos de
contrato em Configurações) é o primeiro domínio implementado.

> **Onde fica a UI?** Desde 2026-07-29 a vertical Clínica tem `web/` própria:
> [`apps/verticals/clinica/web`](../web/AGENTS.md) (`@citybox/clinica-web`,
> :3113), que consome esta API via proxy próprio (`/api/proxy/clinica`). O
> antigo módulo `clinic` do shell multi-vertical legado (`apps/erp`) foi
> removido em 2026-07-31 — a lista abaixo (§2, §11) ainda descreve esse app
> como consumidor por herança do texto original; considere-a obsoleta.

---

## 2. Posição no Monorepo

```
citybox/                          ← raiz (Turborepo + pnpm)
├── apps/
│   ├── verticals/
│   │   ├── clinica/
│   │   │   ├── api/              ← VOCÊ ESTÁ AQUI · @citybox/clinica-api (:3172)
│   │   │   └── web/              ← FRONTEND da vertical — consumidor · @citybox/clinica-web (:3113)
│   │   └── food/                 ← vertical piloto (referência de arquitetura)
│   │       └── api/              ← @citybox/food-api (:3171)
│   ├── platform/{api,admin}      ← operação da plataforma (onboarding de lojas/clientes)
│   └── marketplace/ · workers/ · …
├── infra/
│   ├── keycloak/                 ← realm citybox-dev (auth)
│   └── minio/                    ← object storage (branding/imagens)
└── AGENTS.md                     ← contexto raiz (modelo deste arquivo)
```

**Depende de (infra externa):**
- **PostgreSQL** — banco `citybox_platform`, **schema `clinica`** (via `DATABASE_URL`). Schema provisionado lazily no tenant único (ADR C-15).
- **Keycloak** — verificação de JWT (realm `citybox-dev`, via JWKS).
- **MinIO** — object storage (bucket `citybox-clinica`); fotos de pacientes e logo da clínica.

**Consumido por:**
- `apps/verticals/clinica/web` — frontend dedicado da clínica (:3113); envia `X-Store-Id` por requisição via proxy próprio.

> **Arquitetura idêntica à `apps/verticals/food/api` e à `apps/admin/api`**
> (Clean Architecture, Prisma 7, guards Keycloak). Esta API foi **clonada da
> `food`**; ver `apps/verticals/food/AGENTS.md` como referência viva do padrão.

---

## 3. Stack e Versões

> Versões reais lidas de `package.json` (idênticas à `food-api`, salvo onde marcado).

| Tecnologia       | Versão    | Observação                                            |
| ---------------- | --------- | ----------------------------------------------------- |
| Node.js          | ≥ 20      | `@types/node` 22                                      |
| pnpm             | workspace | **Package manager do monorepo** — nunca npm/yarn      |
| TypeScript       | 5.7.x     |                                                       |
| NestJS           | 11.x (`catalog:`) | versões fixadas via `pnpm catalog`            |
| Prisma           | 7.8.0     | generator `prisma-client` → `generated/prisma/`; adapter `@prisma/adapter-pg` + `pg` Pool |
| PostgreSQL       | —         | **schema `clinica`** (banco `citybox_platform`)        |
| Zod              | v4 (4.4.x) | validação de domínio (`error.issues`, nunca `error.errors`) |
| class-validator / class-transformer | 0.14 / 0.5 | DTOs HTTP + `ValidationPipe` global  |
| jose             | 5.x       | verificação de JWT do Keycloak (JWKS)                 |
| minio            | 8.x       | object storage (infra pronta, sem uso de negócio)     |
| Swagger          | `catalog:` | UI em `/api/v1/docs`                                  |
| Jest + ts-jest   | 30.x / 29.x | testes `*.spec.ts` (config inline no `package.json`) |

---

## 4. Estrutura de Pastas

**Clean Architecture / Hexagonal por módulo** (domain / application /
infrastructure), igual à `food/api`.

```
apps/verticals/clinica/api/
├── src/
│   ├── main.ts                   ← bootstrap: body JSON/urlencoded 25mb (PDF ZapSign base64), ValidationPipe global, prefixo "api", Swagger /api/v1/docs, porta 3172
│   ├── main-worker.ts            ← Nest application context: consumer RabbitMQ `clinic.store-setup`
│   ├── worker.module.ts          ← Prisma + StoreSetupModule + StorePlatformConsumer
│   ├── app.module.ts             ← Prisma + Storage + guards globais + módulos de negócio (+ StoreSetupModule)
│   ├── modules/                  ← … + **store-setup** (espelho loja + seed first-contact), contract-models, clinic-profile, clinic-plans, anamnesis, …
│   └── shared/                   ← NÚCLEO + INFRA TRANSVERSAL
│       ├── core/                 ← entity, use-case.interface, errors/*, types/optional, utils/ (zod-utils, brazilian-document)
│       ├── domain/
│       │   ├── storage/object-storage.interface.ts + storage-unavailable.error.ts
│       │   └── validators/validator.interface.ts
│       └── infra/
│           ├── prisma/           ← PrismaModule (global) + PrismaService (adapter-pg)
│           ├── keycloak/         ← keycloak-jwt (verifyKeycloakJwt via JWKS)
│           ├── storage/          ← StorageModule: minio/minio-object-storage + in-memory (fallback/testes)
│           └── http/
│               ├── guards/        ← auth.guard (JWT/dev-bypass) + permission.guard
│               ├── decorators/    ← @Public, @RequirePermission, @CurrentUser, @StoreId
│               ├── filters/app-exception.filter.ts  (AppError → HTTP status pelo nome)
│               ├── auth/authenticated-user.ts
│               └── health.controller.ts            ← GET /api/health (público)
├── prisma/
│   ├── schema.prisma             ← datasource (schema "clinica") + models de negócio
│   ├── migrations/               ← inclui add_patients (jul/2026)
│   └── seed.ts                   ← perguntas globais anamnese (~15) + "Particular" se SEED_STORE_ID
├── generated/prisma/             ← CLIENTE PRISMA GERADO (não editar à mão)
├── package.json · prisma.config.ts · nest-cli.json · tsconfig*.json · eslint.config.mjs
├── Dockerfile · .env.example · README.md
└── (este AGENTS.md)
```

### 4.1 Anatomia de um módulo (padrão a seguir ao implementar — igual `food/api`)
```
modules/<modulo>/
├── <modulo>.module.ts            ← liga controllers (rotas), use cases e repositórios (DI por TOKEN abstrato → impl Prisma)
├── domain/        entities/ · repositories/<x>.repository.interface.ts (token) · validators (Zod) · errors/
├── application/   use-cases/<acao>/<acao>.use-case.ts (implements IUseCase) · dtos/ · mappers/
├── infrastructure/database/prisma-<x>.repository.ts · http/routes/<acao>/{route,dto,presenter}.ts
└── tests/         in-memory-<x>.repository.ts (fakes p/ unit)
```

### 4.2 Módulo `patients` (submódulos aninhados)

`patient-categories`, `patient-referral-origins`, `patient-external-professionals`, `patient-budgets`, `patient-treatments`, `treatment-evolutions`, `patient-anamneses`, `patient-contract-emissions`, `patient-prescriptions`, `patient-certificates`, `patient-tooth-annotations`, `patient-body-region-annotations`, `patient-body-metrics`, `patient-financial-entries` e `patient-files` vivem **dentro** de `modules/patients/`.
`PatientsModule` importa os submódulos; rotas HTTP permanecem sob `/api/v1/patients/...` (categorias em `/api/v1/patient-categories`; origens em `/api/v1/patient-referral-origins`; profissionais externos em `/api/v1/patient-external-professionals`).

```
modules/patients/
├── patients.module.ts
├── patient-categories/           ← PatientCategoriesModule (CRUD categorias)
├── patient-referral-origins/     ← PatientReferralOriginsModule (GET ensure+list; POST custom — sem Configurações)
├── patient-external-professionals/ ← PatientExternalProfessionalsModule (GET list; POST catálogo — sem Configurações)
├── patient-budgets/              ← PatientBudgetsModule (CLIN-041 Fase 1)
├── patient-treatments/           ← PatientTreatmentsModule (CLIN-041 Fase 1)
├── treatment-evolutions/         ← TreatmentEvolutionsModule (CLIN-041 Fase 1; base CLIN-011)
├── patient-anamneses/            ← PatientAnamnesesModule (anamnese preenchida por paciente)
├── patient-contract-emissions/   ← PatientContractEmissionsModule (contratos emitidos na ficha)
├── patient-prescriptions/        ← PatientPrescriptionsModule (receituários emitidos)
├── patient-certificates/         ← PatientCertificatesModule (atestados emitidos)
├── patient-tooth-annotations/    ← PatientToothAnnotationsModule (anotações por dente no odontograma)
├── patient-body-region-annotations/ ← PatientBodyRegionAnnotationsModule (anotações por região no mapa anatômico)
├── patient-body-metrics/         ← PatientBodyMetricsModule (peso/altura/IMC na ficha)
├── patient-financial-entries/    ← PatientFinancialEntriesModule (financeiro da ficha — CLIN-060 parcial)
├── patient-files/                ← PatientFilesModule (drive de arquivos do paciente)
├── domain/ · application/ · infrastructure/ · tests/
└── …
```

### 4.3 Módulo `scheduling` (CLIN-020 — agenda)

Submódulos em `modules/scheduling/`; `SchedulingModule` registrado no `app.module.ts`.

```
modules/scheduling/
├── scheduling.module.ts
├── shared/domain/               ← state machine, recurrence expander, available-slots calculator
├── appointment-categories/      ← GET/POST/PUT/DELETE /api/v1/appointment-categories
├── appointments/                ← CRUD + calendar + PATCH status /api/v1/appointments*
├── internal-events/             ← CRUD /api/v1/internal-events (recorrência por regra, não materializada)
├── fit-ins/                     ← CRUD + check-patient /api/v1/fit-ins*
├── return-alerts/               ← GET/POST/DELETE /api/v1/return-alerts
└── available-slots/             ← GET /api/v1/available-slots
```

Permissão: `@RequirePermission('manage', 'Schedule')` + `X-Store-Id` em todas as rotas.

### 4.4 Módulo `financial` (CLIN-060 — fluxo de caixa / ledger unificado)

Submódulos em `modules/financial/`; `FinancialModule` registrado no `app.module.ts`.

```
modules/financial/
├── financial.module.ts
├── accounts/          ← CRUD /api/v1/financial/accounts
├── categories/        ← CRUD /api/v1/financial/categories (kind income|expense)
└── entries/           ← list/stats/by-payment-method/CRUD/receive/pay/cancel/recurrence /api/v1/financial/entries*
```

Permissão: `@RequirePermission('manage', 'Financial')` + `X-Store-Id`.
A ficha (`patient-financial-entries`) persiste na mesma tabela `financial_entries` (adapter Prisma).
Exporta `FinancialEntryRepository` + `FinancialAccountRepository` (usados por `CommissionsModule`).

### 4.5 Módulo `commissions` (CLIN-062 — comissões)

Submódulos em `modules/commissions/`; `CommissionsModule` importa `FinancialModule` e registra no `app.module.ts`.

```
modules/commissions/
├── commissions.module.ts
├── shared/domain/     ← enums, trigger labels, date/member utils
├── rules/             ← GET/PUT /api/v1/team/:memberId/commission-rules
├── accruals/          ← POST accruals; GET open*; motores debit/budget/treatment + enrich names
└── payments/          ← POST payments; GET history* (agregado por memberId + período)
```

Permissões: regras → `@RequirePermission('manage', 'Settings')`; accruals/open/payments/history → `@RequirePermission('manage', 'Financial')`.
Migration **única** (consolida schema de comissões + source refs): `prisma/migrations/20260715165240_add_commissions` (**operador aplica** — não rodar `db:migrate:*` na entrega). Tabelas `commission_*` + enums + colunas `source_financial_entry_id` / `source_budget_id` / `source_patient_treatment_id`. Não há migration separada de source refs.

### 4.6 Módulo `marketing` (tipos + campanhas `form_lead` + `aniversario` + Indicações)

`MarketingModule` em `modules/marketing/`; registrado no `app.module.ts`. Taxonomia,
CRUD backoffice e fluxo público de campanhas **PAGE / `form_lead`**, além de campanhas
**BROADCAST / `aniversario`** (WhatsApp). Submódulo **`indicacoes/`** — KPIs e listagens
server-side da tela Indicações. ERP/`clinica-web` via `clinicaFetch`; formulário
público usa BFF sem autenticação.

```
modules/marketing/
├── marketing.module.ts
├── campaigns/                   ← form_lead + aniversario (ver abaixo)
└── indicacoes/
    ├── indicacoes.module.ts
    ├── domain/                  ← types, mapFirstAppointmentStatus, resolve period
    ├── application/use-cases/   ← get-kpis / list-referred-patients / list-referrers
    └── infrastructure/
        ├── database/prisma-indicacoes.repository.ts
        └── http/routes/indicacoes.route.ts
```

**Indicações** (`@RequirePermission('read', 'Marketing')` + `X-Store-Id`):

- Universo: pacientes com `referralOrigin.systemKey` ∈ `indicacao` | `indicacao_profissional` | `indicacao_profissional_externo`, filtro por `Patient.createdAt` no período.
- Período: `periodMode=annual|monthly`, `year`, `month?` (obrigatório se monthly).
- `GET /api/v1/indicacoes/kpis` — `totalReferrals`, `approvedBudgetsValueCents` (SUM orçamentos aprovados lifetime dos pacientes do período), `withoutScheduledAppointment` (1ª consulta `nao_realizada`), `years`.
- `GET /api/v1/indicacoes/referred-patients` — paginação/sort `referralDate`; item com `referredBy`, 1ª consulta (`agendada`|`nao_realizada`|`realizada`); filtro opcional `referrerKind`+`referrerId` (modal do indicador).
- `GET /api/v1/indicacoes/referrers` — agregação por paciente/equipe/externo; sort `totalReferrals`|`approvedBudgetsCount`.

```
modules/marketing/campaigns/
├── campaigns.module.ts          ← importa SalesFunnelsModule (validação funnel/stage)
├── domain/
│   ├── campaign.types.ts
│   ├── campaign-type-catalog.ts ← 6 tipos + resolveStrategy / assertTypeImplemented
│   ├── content/form-lead.content.ts  ← Zod FormLeadContent + normalize wizard
│   ├── content/aniversario.content.ts ← Zod público (planIds/specialtyIds/genders) + messageBody
│   ├── entities/campaign.entity.ts
│   ├── entities/campaign-submission.entity.ts
│   ├── repositories/campaign.repository.ts | campaign-submission.repository.ts
│   └── errors/
├── application/use-cases/
│   ├── list-campaign-types/
│   ├── create/list/get/update-status  ← create dispara birthday dispatch se aniversario+active
│   ├── get-public/track-public-view/submit-public
│   └── list-submissions/get-campaign-submission
└── infrastructure/
    ├── database/prisma-campaign.repository.ts
    └── http/routes/campaign-types.route.ts | campaigns.route.ts
```

- `GET /api/v1/campaign-types` — catálogo em memória (6 itens).
- `GET /api/v1/campaigns/:id/messages` — mensagens WhatsApp disparadas (broadcast/aniversário; paginado).
- `POST /api/v1/campaigns` — cria `form_lead` **ou** `aniversario` (demais → 422); content canônico **ou** wizard.
- `GET /api/v1/campaigns` — listagem paginada (`page`/`perPage`/`search`/`status`/`segment`); envelope `{ data, meta }`.
- `GET /api/v1/campaigns/:id` — detalhe store-scoped (content sempre canônico).
- `GET /api/v1/campaigns/:id/submissions` — respostas do formulário (backoffice).
- `GET /api/v1/campaigns/submissions/:submissionId` — detalhe store-scoped da resposta + campanha (usado pelo CRM).
- `GET /api/v1/public/campaigns/:storeId/:slug` — campanha pública (`@Public()`); **não** incrementa views.
- `POST /api/v1/public/campaigns/:storeId/:slug/views` — registra 1 visualização; dedupe de **30 minutos** via cookie `campaign_view_{campaignId}` no ERP (client só chama se o cookie não existir).
- `POST /api/v1/public/campaigns/:storeId/:slug/submissions` — envio do lead; incrementa `submissions`; regra `duplicityRule`:
  - `block` → sempre cria submission; se telefone já existe marca `isDuplicate=true` e **não** cria card no CRM
  - `update` → nova submission `isDuplicate=true` com payload atualizado + atualiza card do kanban (`title`/`phone`) da primeira resposta
  - `create_new` → sempre nova submission + novo card; duplicados com `isDuplicate=true`
  - com `funnelId`+`stageId` → oportunidade CRM (`origin=campaign`, histórico system) quando não for duplicata bloqueada
- `statusType=limit`: a submissão que atinge `leadLimit` persiste `status=finished` + `endDate`; próximos GET/POST públicos deixam de aceitar a campanha. Campanhas legadas no limite são sincronizadas para `finished` ao carregar.
- `statusType=period`: GET/POST público rejeita data expirada; ERP envia data civil local (`yyyy-MM-dd`) sem conversão UTC. **A partir de 00:00 BRT do dia da data fim**, `syncDerivedStatus` persiste `status=finished` (list/get/público).
- `redirectUrl` e `lgpdConsent.privacyPolicyUrl` são normalizadas para URL externa absoluta (`https://`) quando não têm protocolo; paths internos `/...` são preservados.
- Permissão backoffice: `@RequirePermission('manage', 'Patient')` + `X-Store-Id`.
- Prisma: enums + model `Campaign` + model `CampaignSubmission` (`campaign_submissions`, incl. `is_duplicate`) — **migration manual pelo operador** (não gerar na entrega; `db:generate` ok).
- ERP: BFF `/api/public/clinic/campaigns/...`; lista/create/detalhe/status/submissões via `clinicaFetch`.

### 4.7 Módulo `dashboard` (resumo KPIs + análise de receitas + orçamentos + origem/demografia + consultas + cashflow + comissões + meios de pagamento + ticket médio + inadimplência + despesa por categoria + métricas de pacientes + metas de vendas)

`DashboardModule` em `modules/dashboard/`; importa `PrismaModule` + `FinancialModule` + `PatientBudgetsModule` + `PatientsModule` + `PatientTreatmentsModule` + `AppointmentsModule` + `AppointmentCategoriesModule` + `CommissionsModule`; registrado no `app.module.ts`.

```
modules/dashboard/
├── dashboard.module.ts
├── application/use-cases/get-dashboard-summary/
├── application/use-cases/list-dashboard-birthdays/
├── application/use-cases/list-dashboard-budgets/
├── application/use-cases/get-dashboard-revenue-analysis/
├── application/use-cases/list-dashboard-revenue-details/
├── application/use-cases/get-dashboard-budget-analysis-status/
├── application/use-cases/get-dashboard-budget-analysis/
├── application/use-cases/list-dashboard-budget-analysis-details/
├── application/use-cases/get-dashboard-patient-acquisition/
├── application/use-cases/list-dashboard-patient-acquisition-details/
├── application/use-cases/get-dashboard-patient-demographics/
├── application/use-cases/get-dashboard-appointments/
├── application/use-cases/list-dashboard-appointments-details/
├── application/use-cases/list-dashboard-cancelled-appointment-tasks/
├── application/use-cases/get-dashboard-cashflow/
├── application/use-cases/get-dashboard-commissions/
├── application/use-cases/get-dashboard-commissions-details/
├── application/use-cases/get-dashboard-payment-methods/
├── application/use-cases/get-dashboard-ticket-medio/
├── application/use-cases/get-dashboard-inadimplencia/
├── application/use-cases/list-dashboard-inadimplencia-details/
├── application/use-cases/get-dashboard-expense-by-category/
├── application/use-cases/get-dashboard-patients-summary/
├── application/use-cases/list-dashboard-patients-by-metric/
├── application/use-cases/get-dashboard-sales-goals/
├── application/use-cases/upsert-dashboard-sales-goal/
├── application/utils/dashboard-revenue.{types,math,builder}.ts
├── application/utils/dashboard-budget-analysis.{types,math}.ts
├── application/utils/dashboard-patient-acquisition.{types,math}.ts
├── application/utils/dashboard-patient-demographics.{types,math}.ts
├── application/utils/dashboard-appointments.{types,math}.ts
├── application/utils/dashboard-cashflow.{types,math}.ts
├── application/utils/dashboard-commissions.{types,math}.ts
├── application/utils/dashboard-payment-methods.{types,math}.ts
├── application/utils/dashboard-ticket-medio.{types,math}.ts
├── application/utils/dashboard-inadimplencia.{types,math}.ts
├── application/utils/dashboard-expense-by-category.{types,math}.ts
├── application/utils/dashboard-patients.{types,dates}.ts
├── application/utils/dashboard-patient-search.ts
├── application/utils/dashboard-sales-goals.math.ts
├── domain/repositories/dashboard-sales-goal.repository.interface.ts
├── infrastructure/database/prisma-dashboard-patients.query.ts
├── infrastructure/database/prisma-dashboard-sales-goal.repository.ts
├── tests/in-memory-dashboard-patients.query.ts
├── tests/in-memory-dashboard-sales-goal.repository.ts
└── infrastructure/http/routes/
    ├── get-dashboard-summary/
    ├── list-dashboard-birthdays/
    ├── list-dashboard-budgets/
    ├── get-dashboard-revenue-analysis/
    ├── list-dashboard-revenue-details/
    ├── get-dashboard-budget-analysis-status/
    ├── get-dashboard-budget-analysis/
    ├── list-dashboard-budget-analysis-details/
    ├── get-dashboard-patient-acquisition/
    ├── list-dashboard-patient-acquisition-details/
    ├── get-dashboard-patient-demographics/
    ├── get-dashboard-appointments/
    ├── list-dashboard-appointments-details/
    ├── get-dashboard-cashflow/
    ├── get-dashboard-commissions/
    ├── get-dashboard-commissions-details/
    ├── get-dashboard-payment-methods/
    ├── get-dashboard-ticket-medio/
    ├── get-dashboard-inadimplencia/
    ├── list-dashboard-inadimplencia-details/
    ├── get-dashboard-expense-by-category/
    ├── get-dashboard-patients-summary/
    ├── list-dashboard-patients/
    ├── get-dashboard-sales-goals/
    └── upsert-dashboard-sales-goal/
```

- `GET /api/v1/dashboard/summary` — `{ data: { overdueIncomeTotalCents, openRejectedBudgetsTotalCents, upcomingBirthdaysCount } }`
- `GET /api/v1/dashboard/birthdays` — listagem paginada `{ data, meta }` com `period` (`today`|`this_week`|`this_month`|`next_30_days`|`last_30_days`|`custom`), `startDate`/`endDate` (custom), `page`, `perPage`, `search`
- `GET /api/v1/dashboard/budgets` — listagem paginada `{ data, meta }` de orçamentos `pending`/`rejected` da loja (mais recentes primeiro, com `patientName`); `page`, `perPage`; `meta` inclui `totalValueCents` do conjunto completo (status mapeado para `open`/`rejected` na resposta) — **só dialog KPI**
- `GET /api/v1/dashboard/revenue-analysis` — agregados `{ data: [{ key, name, count, totalCents }] }` com `mode` (`receipts`|`sales`), `dimension` (`professionals`|`plans`|`treatments`|`specialties`), `period` (mesmos tokens de birthdays), `includeWithoutRevenue?` (só receipts + treatments/specialties)
- `GET /api/v1/dashboard/revenue-analysis/details` — detalhe paginado `{ data, meta }` com `dimensionKey` obrigatório + `page`/`perPage`/`search` (paciente); `meta` inclui `totalValueCents`
- `GET /api/v1/dashboard/budget-analysis/status` — card Orçamentos (seção Status): `{ data: { summary, timeline, professionals, years } }` com `periodMode` (`annual`|`monthly`), `year`, `month?`, `professionalId?` (**responsável** `Budget.responsibleId`); quantidade = nº de **orçamentos** (não itens); `pending→open`; `expired` excluído; valor = `finalValueCents`; data = `Budget.date`; timeline traz `{ count, totalCents }` por status (toggle qtd/valor no ERP)
- `GET /api/v1/dashboard/budget-analysis` — agregados `{ data: [{ key, name, count, totalCents }] }` com `status`, `dimension` (`professionals`|`plans`|`treatments`), mesmos filtros de período/responsável; professionals = group by responsável; plans/treatments = group por item com **count = budgets distintos** e `totalCents` = soma de `item.valueCents`
- `GET /api/v1/dashboard/budget-analysis/details` — detalhe paginado `{ data, meta }` (`page`/`perPage`/`search` paciente); `dimension`+`dimensionKey` opcionais (omitidos = “Ver” do Status); repo `listBudgetsForAnalysisInRange` + `listBudgetAnalysisMeta`
- `GET /api/v1/dashboard/patient-acquisition` — card **Como o paciente chegou**: `{ data: { totalCount, aggregates, years } }` com `periodMode` (`annual`|`monthly`), `year`, `month?`; período = `Patient.createdAt` (civil UTC); origem via `Patient.referralOrigin` (`systemKey`; **sem origem → `nao_informado`**; **customs sem `systemKey` → bucket `outro`**); inclui active+inactive; percent 1 casa; ordem facebook→instagram→google→indicacao→indicacao_profissional→indicacao_profissional_externo→outro→nao_informado (só count>0); repo `listPatientsForAcquisitionInRange` + `listAcquisitionYears`
- `GET /api/v1/dashboard/patient-acquisition/details` — detalhe paginado `{ data, meta }` por `source` + mesmos filtros de período + `page`/`perPage`/`search` (nome/telefone/e-mail/CPF); item `{ id, name, phone, email, cpf, registeredAt, referralSource }` (chave de UI acima)
- `GET /api/v1/dashboard/patient-demographics` — card **Pacientes por idade e sexo**: `{ data: { filteredTotalCount, totalCount, ageSeries, genderShares } }` com `gender?` (`all`|`female`|`male`|`uninformed`, default `all`); universo = `Patient.status=active`; `other→uninformed`; `birthDate` null → bucket `unknown` (“Idade não informado”); faixas de 10 anos (`0-9`…`90-99`) + `100+` (“100 anos ou mais”); série sempre com as 12 faixas (count 0 incluído); filtro de sexo só na série etária; pizza sempre na base total; repo `listPatientsForDemographics`
- `GET /api/v1/dashboard/appointments` — card **Consultas**: `{ data: { summary, timeline, categories, years } }` com `periodMode` (`annual`|`monthly`), `year`, `month?`, `categoryId?` (`all`|UUID); universo = status terminais (`finished`|`missed`|`cancelled_patient`|`cancelled_pro`); período em `Appointment.startAt` (civil UTC); `attendanceRate = realized/total*100`; repo `listAppointmentsForDashboardInRange` + `listAppointmentDashboardYears`
- `GET /api/v1/dashboard/appointments/details` — detalhe paginado `{ data, meta }` por `group` (`realized`|`missed_cancelled`) + mesmos filtros; sem busca; `professionalId` (nome no FE)
- `GET /api/v1/dashboard/tasks/cancelled-appointments` — Tarefas · Consultas canceladas: `{ data, meta }` com `startDate`/`endDate` (`yyyy-MM-dd` obrigatórios), `page`/`perPage` (default 50, max 100); `status IN (missed, cancelled_patient, cancelled_pro)` por `Appointment.startAt` (civil UTC); item `{ id, patientId, patientName, patientPhone, professionalId, appointmentAt, durationMin, categoryId, observations, status }`; repo `listCancelledAppointmentTasksInRange`
- `GET /api/v1/dashboard/cashflow` — card **Receitas x Despesas**: `{ data: { totals, timeline, years } }` com `periodMode`/`year`/`month?`; paid (`paidAt≤hoje`) + forecast (`dueDate>hoje`); overdue/cancelled excluídos; valor paid = `paidValueCents ?? valueCents`; repo `listEntriesForCashflowInRange` + `listCashflowYears`
- `GET /api/v1/dashboard/commissions` — card **Comissões pagas**: `{ data: { netTotalCents, byTrigger, byType, ranking, years } }` com `periodMode`/`year`/`month?`; eixo `paymentDate`; breakdowns em bruto; total/ranking em líquido; rateio de desconto do payment; `commissionType` via rule (fallback `percentage`); repo `listPaymentsForDashboardInRange` + `listCommissionPaymentYears`
- `GET /api/v1/dashboard/commissions/details` — dialog Ver: `{ data: rows[], meta: { total, page, perPage, totalPages, totalNetCents } }` com `startDate`/`endDate`/`professionalId?`/`page`/`perPage`
- `GET /api/v1/dashboard/payment-methods` — card **Recebimentos por meio**: `{ data: { totalCents, items[{ method, amountCents }] } }` com `startDate`/`endDate`; income `received` + `paymentMethod` + `paidAt`; valor = `paidValueCents ?? valueCents`; sempre 7 meios canônicos; reusa `listReceivedIncomeInPaidAtRange`
- `GET /api/v1/dashboard/ticket-medio` — card **Ticket médio**: `{ data: { rendimento, lucratividade, years } }` com `periodMode`/`year`/`month?`; rendimento = receita÷pacientes (distinct por bucket); lucratividade = receita−despesa; income `received` + expense `paid` por `paidAt≤hoje`; valor = `paidValueCents ?? valueCents`; repo `listTicketMedioDayMetricsInRange` + `listTicketMedioYears`
- `GET /api/v1/dashboard/inadimplencia` — card **Inadimplência**: `{ data: { totalDebtsCents, unpaidCents, receivedCents, ratePercent, years } }` com `periodMode`/`year`/`month?`; só pacientes com overdue agora; income `pending|received` por `dueDate`; unpaid = valueCents se pending; repo `listInadimplenciaDebtsInRange` + `listInadimplenciaYears`
- `GET /api/v1/dashboard/inadimplencia/details` — dialog Ver: `{ data, meta }` paginado; só unpaid; `daysOverdue`; ordenação `dueDate` asc
- `GET /api/v1/dashboard/expense-by-category` — card **Despesa por categoria**: `{ data: { totalCents, items[{ categoryId, label, color, amountCents, percent }], years } }` com `periodMode`/`year`/`month?`; expense `paid` por `paidAt`; valor = `paidValueCents ?? valueCents`; `expenseCategoryId` null → bucket `Sem categoria` (`categoryId: "uncategorized"`, cor `#94a3b8`); % 1 casa (último fecha 100); ordem `amountCents` desc; repo `listExpenseByCategoryInRange` + `listExpenseByCategoryYears`. Nota: pagamento de comissão cria expense `paid` sem categoria (aparece no bucket uncategorized).
- `GET /api/v1/dashboard/patients/summary` — `{ data: { totalRegisteredCount, seenLast6MonthsCount, overdueDebtsPatientsCount, newSeenThisMonthCount, openTreatmentWithoutAppointmentCount } }` (aniversariantes continuam em `/summary`)
- `GET /api/v1/dashboard/patients` — listagem paginada `{ data, meta }` por `metric` (`total_registered`|`seen_last_6_months`|`overdue_debts`|`new_seen_this_month`|`open_treatment_without_appointment`) + `page`/`perPage`/`search` (nome/e-mail/CPF); `valueCents` só em `overdue_debts` (`SUM` por paciente)
- `GET /api/v1/dashboard/sales-goals` — **meta contínua** (sem `year`/`month`): `{ data: { goalCents, startDate, realizedCents, soldTodayCents, reached, dailySales } }`; realizado = soma de itens de orçamentos `approved` de `startDate` (dia civil de criação da meta, inclusive) até hoje (`approvedAt` civil, fallback `date`); **não reseta na virada de mês** e continua acumulando após `reached`; sem meta ativa → tudo vazio/`null`
- `PUT /api/v1/dashboard/sales-goals` — body `{ goalCents }` (centavos > 0); cria/substitui a meta ativa (**substituir reinicia o acúmulo** em novo `startDate = hoje`); `DashboardSalesGoal` é **append-only** (meta ativa = linha mais recente por `createdAt`); migration `20260721175602_add_dashboard_sales_goals` (**manual pelo operador**)
- Débitos em atraso: soma `valueCents` de `type=income` + `status=pending` + `dueDate < hoje` (ISO `yyyy-MM-dd`, alinhado a `FinancialEntry.isOverdue`) via `sumOverdueIncomeCents`
- Orçamentos em aberto/reprovados: soma `finalValueCents` com `status IN ('pending', 'rejected')` via `sumOpenRejectedBudgetsCents`; listagem via `BudgetRepository.listOpenRejectedBudgets` (paginação no banco + join do nome do paciente)
- Aniversariantes (próx. 30 dias no summary): `PatientRepository.countUpcomingBirthdays` — `status=active`, `birthDate` não nulo, dias até o próximo aniversário ∈ [0, 30] (helper `patients/domain/utils/birthday-window.utils.ts`)
- Listagem de aniversariantes: `findActiveWithBirthDate` + filtro de janela civil (mês/dia, virada de ano) + labels relativas; busca nome/telefone/CPF; paginação server-side
- Métricas de pacientes (`DashboardPatientsQuery` / Prisma + in-memory): `total_registered` = `Patient.status=active`; `seen_last_6_months` = distinct `patientId` com `Appointment.status=finished` nos últimos 6 meses civis; `overdue_debts` = distinct paciente com income pending vencida; `new_seen_this_month` = pacientes cuja **primeira** consulta `finished` cai no mês civil atual; `open_treatment_without_appointment` = `PatientTreatment.status=active` sem appointment aberto futuro (`scheduled`|`confirmed`|`patient_waiting`|`in_progress`, `startAt >= agora`)
- Análise de receitas (`DashboardRevenueBuilder`): receipts = `FinancialEntry` income `received` por `paidAt` (rateio `budget_approve`, expand `avulso_debit`); sales = items de budget `approved` + `PatientTreatment` active/standalone + avulso por `dueDate`; specialty via `ClinicPlanTreatment` → `ClinicPlanSpecialty`. Linhas **sem** o atributo da dimensão (ex.: receita `manual` do caixa) são **omitidas** da aba — o bucket “Não informado” não é agregado (evita o mesmo valor repetido em todas as abas)
- Permissão: `@RequirePermission('read', 'Dashboard')` (+ `update` metas / `access` tasks) + `X-Store-Id`

### 4.8 Módulo `reports` (relatórios da Dashboard)

`ReportsModule` em `modules/reports/`; registrado no `app.module.ts`. Relatórios:

1. **Aniversariantes** — período (mês/dia de `Patient.birthDate`).
2. **Procedimentos abertos sem consulta** — pacientes com `PatientTreatment` active e sem appointment “vivo”.
3. **Orçamentos aprovados** — `Budget.status = approved` filtrados por `approvedAt` no intervalo civil.
4. **Orçamentos em aberto** — `Budget.status = pending` filtrados por `Budget.date` no intervalo civil.
5. **Orçamentos reprovados** — `Budget.status = rejected` filtrados por `rejectedAt` no intervalo civil.
6. **Vendas por especialidade** — 1 linha por `BudgetItem` de orçamentos `approved` no período (`approvedAt`, fallback `Budget.date`); especialidade via `ClinicPlanTreatment → ClinicPlanSpecialty`.
7. **Vendas por plano** — mesma regra de itens aprovados; `planName` ← snapshot `BudgetItem.planName`.
8. **Vendas por profissional** — mesma regra de itens aprovados; `professionalName` ← snapshot `BudgetItem.professionalName`.
9. **Vendas por tratamento** — mesma regra de itens aprovados; `treatmentName` ← snapshot `BudgetItem.treatmentName`; `planName` do item.
10. **Despesas por categoria** — `FinancialEntry` `expense` + `paid` agregadas por categoria no `paidAt`; `%` do total (reusa `buildExpenseByCategorySummary`).
11. **Receitas excluídas** — `FinancialEntry` `income` + `cancelled`; período por civil de `updatedAt`; `excludedBy` = `cancelledByName` ou `"Não informado"` (legado).
12. **Pacientes indicados** — origem de sistema `indicacao` **ou** `indicacao_profissional` **ou** `indicacao_profissional_externo` no `createdAt`; `referredBy` = nome do paciente indicador **ou** `referredByMemberName` **ou** nome do profissional externo, senão `"Não informado"`; 1ª consulta + count de orçamentos aprovados.

```
modules/reports/
├── reports.module.ts
├── domain/
│   ├── report-birthday.types.ts
│   ├── report-open-treatments.types.ts
│   ├── report-approved-budgets.types.ts
│   ├── report-open-budgets.types.ts
│   ├── report-rejected-budgets.types.ts
│   ├── report-sales-by-specialty.types.ts
│   ├── report-sales-by-plan.types.ts
│   ├── report-sales-by-professional.types.ts
│   ├── report-sales-by-treatment.types.ts
│   ├── report-expenses-by-category.types.ts
│   ├── report-excluded-revenues.types.ts
│   ├── report-referred-patients.types.ts
│   ├── repositories/report-*.repository.ts
│   └── utils/birthday-civil-range.ts
├── application/use-cases/
│   ├── list-report-birthdays/
│   ├── list-report-open-treatments-without-appointment/
│   ├── list-report-approved-budgets/
│   ├── list-report-open-budgets/
│   ├── list-report-rejected-budgets/
│   ├── list-report-sales-by-specialty/
│   ├── list-report-sales-by-plan/
│   ├── list-report-sales-by-professional/
│   ├── list-report-sales-by-treatment/
│   ├── list-report-expenses-by-category/
│   ├── list-report-excluded-revenues/
│   └── list-report-referred-patients/
├── infrastructure/
│   ├── database/prisma-report-*.repository.ts
│   └── http/routes/… | sales-by-*/ | expenses-by-category/ | excluded-revenues/ | referred-patients/
└── tests/in-memory-report-*.repository.ts
```

- `GET /api/v1/reports/birthdays` — `startDate`/`endDate` (`yyyy-MM-dd` obrigatórios), `page`/`perPage`, `status` (default `active`); envelope `{ data, meta }`.
- Filtro aniversariantes (SQL `generate_series` + `EXTRACT` mês/dia; cobre virada de ano); ordenação pela ocorrência no intervalo.
- `GET /api/v1/reports/open-treatments-without-appointment` — `page`/`perPage`, `status` (default `active`); **sem** filtro de período. Critério: paciente `status` + ≥1 tratamento `active` + **não** existe appointment com `status IN (scheduled, confirmed, patient_waiting, in_progress)` **e** (`startAt >= now` **ou** `status = in_progress`). Ordenação `name ASC`. 1 linha por paciente.
- `GET /api/v1/reports/approved-budgets` — `startDate`/`endDate` obrigatórios; `page`/`perPage`. Critério: `status = approved` + `approvedAt` em `[start 00:00Z, end 23:59:59.999Z]`. Coluna `budgetDate` ← `Budget.date`; `valueCents` ← `finalValueCents`; `responsibleMobile` ← `Patient.guardianPhone`; `mobile` ← `Patient.phone`. Ordenação `date DESC`, `id DESC`.
- `GET /api/v1/reports/open-budgets` — igual aos aprovados, mas `status = pending` e filtro temporal em `Budget.date` (não `approvedAt`). Status na row: `pending`.
- `GET /api/v1/reports/rejected-budgets` — `status = rejected` + filtro temporal em `rejectedAt` (`@db.Date`); se `rejectedAt` for nulo, fallback para `Budget.date` no intervalo; coluna `budgetDate` ← `Budget.date`; status na row: `rejected`.
- `GET /api/v1/reports/sales-by-specialty` — itens de orçamento `approved` no período (`approvedAt` com fallback `Budget.date`); `specialtyName` ← especialidade do tratamento (ou `"Não informado"`); `saleDate` ← `approvedAt ?? date`; `valueCents` ← item; paginação; ordenação aproximada por aprovação/data DESC + especialidade ASC.
- `GET /api/v1/reports/sales-by-plan` — igual ao sales-by-specialty, mas `planName` ← `BudgetItem.planName` (snapshot; `"Não informado"` se vazio); ordenação por aprovação/data DESC + plano ASC.
- `GET /api/v1/reports/sales-by-professional` — igual ao sales-by-plan, mas `professionalName` ← `BudgetItem.professionalName` (snapshot; `"Não informado"` se vazio); ordenação por aprovação/data DESC + profissional ASC.
- `GET /api/v1/reports/sales-by-treatment` — igual ao sales-by-plan, mas dimensão `treatmentName` ← `BudgetItem.treatmentName` (snapshot; `"Não informado"` se vazio); coluna `planName` do item; ordenação por aprovação/data DESC + tratamento ASC.
- `GET /api/v1/reports/expenses-by-category` — despesas `paid` agregadas por categoria no `paidAt` (`paidValueCents ?? valueCents`); sem categoria → `uncategorized` / `"Sem categoria"`; `%` fecha 100; paginação após agregação; ordenação valor DESC + nome ASC.
- `GET /api/v1/reports/excluded-revenues` — receitas `income` + `cancelled` filtradas por civil de `updatedAt`; `patientName` ou `"—"`; `valueCents` = `paidValueCents ?? valueCents`; `excludedBy` = `cancelledByName` ou `"Não informado"`; ordenação exclusão DESC.
- `GET /api/v1/reports/referred-patients` — pacientes com origem `systemKey` ∈ (`indicacao`, `indicacao_profissional`, `indicacao_profissional_externo`) no `createdAt`; `referredBy` = paciente indicador / `referredByMemberName` / nome do profissional externo / `"Não informado"`; 1ª consulta (excl. cancelados) + count lifetime de orçamentos `approved`; ordenação cadastro DESC.
- Mapeamento comum: `phone`/`mobile`/`document` conforme cada relatório; open-treatments e budgets reports expõem `document` ← `cpf`.
- Permissão: `@RequirePermission('read', 'Dashboard')` + `X-Store-Id`. Sem migration nova.

### 4.9 Módulo `signature-packages` (créditos / solicitação de pacotes ZapSign)

`SignaturePackagesModule` em `modules/signature-packages/`; registrado no `app.module.ts`.
Complementa o módulo `signatures` (emissão ZapSign) com saldo e compra de créditos.

```
modules/signature-packages/
├── signature-packages.module.ts
├── domain/
│   ├── signature-package-catalog.ts   ← pkg-250/600/1000 + seed balance 0
│   ├── entities/                      ← SignatureCreditBalance · SignaturePackageRequest
│   ├── repositories/                  ← interfaces (tokens DI)
│   └── errors/                        ← NotFound · InvalidPackage · AlreadyLiberated · CreditsInsufficient
├── application/
│   ├── services/consume-signature-credit.service.ts  ← debit/refund (usado por `signatures`)
│   └── use-cases/
│       ├── get-signature-credits/
│       ├── list-signature-package-requests/
│       ├── create-signature-package-request/
│       └── liberate-signature-package-request/
├── infrastructure/
│   ├── database/prisma-*.repository.ts
│   └── http/routes/…
└── tests/in-memory-*.repository.ts
```

- `GET /api/v1/signature-credits` — `{ data: { storeId, balance, createdAt, updatedAt } }`; cria saldo com **0** se ausente. Permissão: `manage` Settings **ou** `manage` Patient (para o FE checar saldo antes do PDF).
- `GET /api/v1/signature-package-requests` — lista da loja paginada (`page`/`perPage`/`status?`), `createdAt desc`, envelope `{ data, meta }`.
- `POST /api/v1/signature-package-requests` — body `{ packageId }`; resolve catálogo; status `pending`.
- `PATCH /api/v1/signature-package-requests/:id/liberar` — `@RequirePlatformAdmin()`; idempotente se já `liberado`; senão marca `liberado` + `balance += quantity` (transação Prisma).
- `PATCH /api/v1/signature-package-requests/:id/cancelar` — `@RequirePlatformAdmin()`; idempotente se já `cancelado`; só pendente; **não** altera saldo.
- **Débito no uso:** `ConsumeSignatureCreditService` (exportado) — os 3 `request-*-signature` debitam **1** crédito antes de `createDocument`; saldo insuficiente → `SignatureCreditsInsufficientError`; falha ZapSign/MinIO após debit → `refund(+1)`. Cancel **não** reembolsa.
- Catálogo: `pkg-250` → 250 / 9990¢; `pkg-600` → 600 / 19990¢; `pkg-1000` → 1000 / 29990¢.
- Uma solicitação `pending` por `packageId` (segunda → `AlreadyPending`); Loja mostra botão **Solicitado** desabilitado até liberar/cancelar.
- Permissão loja (compra): `@RequirePermission('manage', 'Settings')` + `X-Store-Id`. `GET /v1/signature-credits` também aceita `manage` Patient (checagem na ficha).
- Models: `SignatureCreditBalance`, `SignaturePackageRequest` + enum `SignaturePackageRequestStatus` (`pending`|`liberado`|`cancelado`); migration **manual** `20260807120000_add_signature_packages` (**operador aplica** — não rodar `migrate deploy` na entrega).

### 4.10 Módulo `search` (busca global FTS — Cmd+K)

`SearchModule` em `modules/search/`; importa `PrismaModule` + `SalesFunnelsModule`; registrado no `app.module.ts`.
Espelha o padrão de [`apps/imoveis/api/src/modules/search/`](../../../../imoveis/api/src/modules/search/).

```
modules/search/
├── search.module.ts
├── application/
│   ├── policies/build-tsquery.ts
│   └── use-cases/global-search/
├── infrastructure/
│   ├── database/
│   │   ├── search.repository.ts
│   │   ├── prisma-search.repository.ts
│   │   └── in-memory-search.repository.ts
│   └── http/routes/global-search/
```

- `GET /api/v1/search?q=&perType=` — resposta flat `{ groups: [{ heading, hits: [{ id, type, title, subtitle?, href }] }] }` (sem envelope `{ data }`).
- `q` obrigatório (máx. 200 chars); `perType` opcional (default 15, máx. 30).
- **FTS:** colunas `search_vector` (`tsvector` + GIN) em `patients`, `appointments`, `sales_opportunities`, `stock_products`; wrapper `clinica.unaccent`; triggers `BEFORE INSERT OR UPDATE`; migration `20260819120000_add_fts_search_vectors`.
- **Escopo por permissão:** omite grupos inteiros quando o caller não tem gate na entidade; `@RequireAnyPermission` exige ao menos um escopo pesquisável (Patient, Schedule, Sales, Stock).
  - Pacientes/Estoque: `store_id`.
  - Agenda: `professional_id = ANY(...)` quando usuário não tem `read Schedule` (`resolveScheduleProfessionalFilter`).
  - Oportunidades: `funnel_id = ANY(visibleFunnelIds)` via `filterVisibleSalesFunnels(permissions)`; lista vazia → grupo omitido.
- Tipos: `patient` | `appointment` | `opportunity` | `stock_product`; IDs `{type}-{uuid}`; hrefs alinhados ao `clinica-web` (`/pacientes/:id/sobre`, `/agenda?date=&appointmentId=`, `/vendas?opportunityId=`, `/estoque`).

---

## 5. Restrições Críticas

> ⚠️ Estas restrições causam erros em build/runtime ou quebram a arquitetura se ignoradas.

### 5.1 Package Manager
```
SEMPRE: pnpm --filter @citybox/clinica-api <script>
NUNCA:  npm install / yarn add
```

### 5.2 Toda rota de negócio é **store-scoped** (`X-Store-Id`)
```ts
// Multi-loja no mesmo schema. Cada requisição traz a loja no header.
async handle(@StoreId() storeId: string, @Body() dto: …) { … }
// Sem o header → 400 "Header X-Store-Id obrigatório" (decorator @StoreId).
// O ERP injeta esse header no proxy /api/proxy/clinica.
```

### 5.3 Prisma 7 — cliente gerado em `generated/prisma/`, schema `clinica`
```ts
import { PrismaClient } from '...generated/prisma/client';   // NÃO de "@prisma/client"
// Models DEVEM usar @@schema("clinica") + @@map("snake_case"). Banco: citybox_platform.
// PKs de entidade: String @id @default(uuid()) — default no Prisma Client (TEXT no Postgres, sem gen_random_uuid() no banco).
// Exceção: ClinicStoreProfile.storeId é PK externa (loja da plataforma), sem @default(uuid()).
// Após mudar schema:  pnpm --filter @citybox/clinica-api db:generate
```

**`generated/` NUNCA vai para o git** (`.gitignore` da app). Em 2026-07-29 foram
removidos 5 arquivos de `generated/prisma/models/` que tinham sido commitados em
`63f271f7` — antes de o `.gitignore` existir. Esse resíduo parcial fazia o
`prisma generate` abortar com *"exists and is not empty but doesn't look like a
generated Prisma Client"*, e sem cliente gerado a app não compilava (424 erros
`Property '<model>' does not exist on type 'PrismaService'`). Se voltar a
acontecer: `rm -rf generated && pnpm --filter @citybox/clinica-api db:generate`.

### 5.3.1 `deleteOutDir: false` no `nest-cli.json` (não reverter)

`dev` roda um único `nest start --watch` + um `node --watch dist/src/main-worker.js`
separado (ver `scripts/dev-with-worker.sh`). Com `deleteOutDir: true` o nest
apagava `dist/` a cada recompilação e o watcher do worker quebrava com
`MODULE_NOT_FOUND: dist/src/main-worker.js` em todo save. A limpeza do build de
produção passou para o script: `"build": "rm -rf dist && nest build"`.

### 5.4 Guards GLOBAIS (Keycloak)
```ts
// AuthGuard (JWT Keycloak via JWKS) + PermissionGuard (CASL) rodam em TODA rota.
@Public()                                    // libera (ex.: health)
@RequirePermission('manage', 'Settings')     // Perfil, WhatsApp, horários
@RequirePermission('manage', 'Stock')        // Estoque
// Subjects: Settings | Team | ClinicPlan | AnamnesisTemplate | ContractModel |
//           Patient | Financial | Schedule | Vertical — ver §5.8
```

### 5.5 Camadas só "para dentro" + controllers finos
```
infrastructure → application → domain     (nunca o inverso)
```
- `domain`/`application` não importam NestJS/Prisma/Express.
- Use cases dependem da **interface** do repositório (token), nunca da impl Prisma.
- `*.route.ts` só faz: ler `@StoreId`/DTO → chamar use case → presenter.

### 5.6 Object storage atrás de porta (`ObjectStorage`)
```ts
// Usar a interface ObjectStorage (domain/storage), não o SDK do MinIO direto.
// Impl: MinioObjectStorage (prod/dev) ou InMemoryObjectStorage (testes). Bucket: citybox-clinica.
```

### 5.7 Erros: hierarquia AppError + filtro por nome
```ts
// Lançar subclasses de AppError (Domain/Application/Infrastructure/ValidatorDomain) com
// { internalMessage, externalMessage, context }. O AppExceptionFilter mapeia o HTTP status
// pelo SUFIXO do nome: *NotFound→404 · *Taken→409 · *Unavailable→503 · ValidatorDomainError→422 …
```

### 5.8 Permissões da vertical clínica (CASL)

> Fonte de verdade: [`@citybox/clinica-permissions`](../permissions/AGENTS.md).
> **Proibido** reintroduzir strings `store.clinic.*` / `store.scheduling.*` como autorização.

```ts
@RequirePermission('read', 'Team')                 // Listar equipe
@RequirePermission('create', 'Team')               // Adicionar membro
@RequirePermission('update', 'Team')               // Editar / reset senha
@RequirePermission('delete', 'Team')               // Inativar / remover
@RequirePermission('manage', 'Settings')           // Perfil / WhatsApp / horários / regras comissão
@RequirePermission('manage', 'ClinicPlan')         // Planos de tratamento
@RequirePermission('manage', 'AnamnesisTemplate')  // Modelos de anamnese
@RequirePermission('manage', 'ContractModel')      // Modelos de contrato
@RequirePermission('manage', 'Stock')              // Estoque
@RequirePermission('manage', 'Patient')            // CRUD paciente / débitos
@RequirePermission('read'|'update'|'access', 'Dashboard')  // Indicadores/relatórios / metas / tarefas
@RequirePermission('read'|'create'|'update'|'delete'|'approve', 'PatientBudget')  // Orçamentos (fino)
@RequirePermission('create'|'update'|'delete', 'PatientEvolution')  // Evoluções (fino; list/history = PatientTreatment)
@RequirePermission('create'|'read'|'update'|'delete', 'PatientFile')  // Arquivos (fino)
@RequirePermission('create', 'PatientPrescription')  // Receituários
@RequirePermission('create', 'PatientCertificate')   // Atestados
@RequirePermission('read', 'Financial')              // Resumo financeiro / stats
@RequireAnyPermission(… FinancialIncome|Expense …) // Caixa list/CRUD tipado
@RequirePermission(create|delete, FinancialAccount|FinancialCategory) // accounts/categories mutate
@RequirePermission('settle', 'FinancialIncome|Expense') // Receber / pagar
@RequirePermission('read'|'manage'|'create', 'FinancialCommission')
@RequirePermission('manage', 'PatientDocument')    // Contratos emitidos (ainda bridge)
@RequirePermission('manage', 'PatientAnamnesis')   // Anamnese preenchida
@RequirePermission('manage', 'PatientTreatment')   // Tratamentos + GET list/history evoluções
@RequirePermission('manage', 'Schedule')           // Agenda
@RequirePermission('manage', 'Sales')              // CRM mutações (oportunidades/funis/rótulos)
@RequireAnyPermission(access|read|manage, Sales)   // CRM listagens
@RequirePermission('read'|'create'|'update', 'Marketing')  // Campanhas
@RequirePlatformAdmin()                            // Retry store-setup / M2M
```

Papéis em `@citybox/clinica-permissions` (`role-catalog.ts`; API reexporta em
`clinic-role.catalog.ts`) devolvem IDs finos feature-backed (`patient_create`,
`schedule_view_menu`, …). Aliases grossos (`patients_manage`, …) ainda válidos
no JSON antigo via `expandPermissionIds`.
`ClinicScopeGuard` injeta perms derivadas do papel + `isOrganizationOwner`.
`PermissionGuard` chama `defineAbilityFor` do package.

### 5.9 Dockerfile: workspace deps de build/runtime (`nest-common` + `clinica-permissions`)

O `Dockerfile` da clinica-api **deve** incluir os packages workspace usados em compile/runtime:

| Package | Stage `deps` | Build | Stage `runner` |
| ------- | ------------ | ----- | -------------- |
| `@citybox/messaging` | `packages/messaging/package.json` | `pnpm --filter @citybox/messaging build` | copiar pacote |
| `@citybox/nest-common` | `packages/nest-common/package.json` | `pnpm --filter @citybox/nest-common build` | copiar pacote |
| `@citybox/clinica-permissions` | `apps/verticals/clinica/permissions/package.json` | `pnpm --filter @citybox/clinica-permissions build` | copiar pacote |

**Ordem de build obrigatória:** `messaging` → `clinica-permissions` → (`nest-common`) →
`nest build`. O package de permissões importa `@citybox/messaging/clinic-strand`
(exports → `dist/`); buildar permissions antes de messaging falha com
`Cannot find module '@citybox/messaging/clinic-strand'`.

Sem `nest-common` → `TS2307` (members + store-setup usam `KeycloakProvisioningService`).
Sem `clinica-permissions` → `TS2307` nos guards/rotas CASL (`PermissionGuard`, sales, scheduling, …).
O `main`/`types` do package apontam para `dist/` — **build obrigatório** antes do `nest build`.

### 5.10 `start:prod` = `node dist/src/main`
```
O build emite em dist/src/ (não dist/). Em produção rodar: node dist/src/main.
`tsconfig.build.json` fixa `rootDir: "."` + `outDir: "./dist"` e **exclui**
`**/__mocks__/**` (o mock reexporta `packages/messaging/src` e, se entrar no
programa TS, o emit cai em `dist/apps/...` e a rota nova some do processo em
`dist/src/main`). Depois de adicionar módulo Nest, confirme
`dist/src/modules/...` e reinicie o `nest --watch` se a rota responder
`Cannot GET/POST`.
```

### 5.10 Listagens — busca, paginação e ordenação **no repositório** (nunca no cliente)

> Política global: `AGENTS.md` raiz §8.1. O ERP **não** deve filtrar/paginar no browser.

**Todo `GET` de coleção deve:**
- Aceitar `page`, `perPage`, `search` (quando aplicável), `sortBy`, `sortOrder` via query DTO (`class-validator`).
- Implementar `findMany` + `count` no repositório Prisma com `skip`/`take` e `WHERE` de busca.
- Responder `{ data, meta: { total, page, perPage, totalPages } }`.

**Proibido:** retornar array completo sem `meta` para o frontend paginar; **proibido** carregar relações pesadas na listagem (usar `_count` quando só o total de filhos importa — ex. `itemsCount` em orçamentos).

**Implementado:** `ListPatientsUseCase`, `ListBudgetsUseCase` (`patient-budgets`), `ListPatientAnamnesesUseCase` (`patient-anamneses`), `ListAppointmentCategoriesUseCase`, `ListAppointmentsUseCase`, `ListFitInsUseCase`, `ListReturnAlertsUseCase`, `ListReportBirthdaysUseCase`, `ListReportOpenTreatmentsWithoutAppointmentUseCase`, `ListReportApprovedBudgetsUseCase`, `ListReportOpenBudgetsUseCase`, `ListReportRejectedBudgetsUseCase`, `ListReportSalesBySpecialtyUseCase`, `ListReportSalesByPlanUseCase`, `ListReportSalesByProfessionalUseCase`, `ListReportSalesByTreatmentUseCase`, `ListReportExpensesByCategoryUseCase`, `ListReportExcludedRevenuesUseCase`, `ListReportReferredPatientsUseCase` (`reports`).
**Implementado:** `ListPatientsUseCase`, `ListBudgetsUseCase` (`patient-budgets`), `ListPatientAnamnesesUseCase` (`patient-anamneses`), `ListPatientContractEmissionsUseCase`, `ListPatientPrescriptionsUseCase`, `ListPatientCertificatesUseCase`, `ListPatientFinancialEntriesUseCase` (`patient-financial-entries`), `ListFinancialEntriesUseCase` / `StatsFinancialEntriesUseCase` / `EntriesByPaymentMethodUseCase` (`financial/entries`).

**Exceção (navegação por pasta, não tabela):** `ListPatientDriveUseCase` (`patient-files`) — lista itens da pasta corrente (`folderId` + `search` opcional), sem `meta` de paginação; ordenação `name asc` (`pt-BR`).

### 5.12 Worker store-setup exige `RABBITMQ_URL` no `.env`
```
Sem RABBITMQ_URL o processo main-worker sobe, mas NÃO declara a fila clinic.store-setup
nem consome citybox.store.# — seeds first-contact nunca rodam.
Copiar RABBITMQ_* do .env.example para .env e reiniciar o clinica-api.
Sinal de saúde: rabbitmqctl list_queues → clinic.store-setup com consumers=1
e log "[rabbit] bound clinic.store-setup".
```

---

### 5.12 Tenancy própria: Organization → Clinic (PLAT-001 / Fase 3)

A clínica deixou de depender do `platform-api` para saber "de quem é este dado":

```
Store (platform-api, verdade comercial)
  └─ 1:1 ──► Organization  (clinica; storeId = referência LÓGICA, sem FK cross-schema)
              └─ 1..N ────► Clinic  (unidade operacional; limite vem do plano)
```

**A clínica raiz tem `id` IGUAL ao `store_id` legado.** Não é coincidência: é o que
mantém válidas as 49 tabelas que já carregam `store_id`, sem reescrever um único valor.
O rename cosmético `store_id → clinic_id` fica para depois — ou nunca.

- `Organization.clinicStrand` (`odontologia` | `fisioterapia` | `nutricao`) é a vertente da loja —
  uma por organização, imutável depois do create. Vem do evento `citybox.store.created.v1`
  (`clinicStrand?`); ausente → `odontologia`. `GET /v1/members/me` e `GET /v1/clinics`
  devolvem `clinicStrand` + `features` + `copy` do catálogo em `@citybox/messaging`.
  Seed first-contact escolhe o pack por strand (`packs/<strand>/`); mismatch de especialidades
  no Particular → `ensurePlanMatchesPack` / `scripts/repair-plan-strand.ts`.
  **Playbook da próxima vertente** (modelo + armadilhas da branch):
  [`docs/vertentes-clinic-strand-playbook.md`](../docs/vertentes-clinic-strand-playbook.md).
- `Organization.plan*` é **snapshot** do plano, atualizado por evento. A quota de clínica
  é validada **localmente** (`Organization.canCreateClinic`), sem round-trip ao platform —
  é o que permite operar com o platform-api fora do ar.
- `maxClinics = null` (plano ainda não sincronizado) **libera** a criação. Bloquear por
  falta de dado nosso puniria o cliente por um evento atrasado.
- Downgrade abaixo do uso marca `overQuota`, que bloqueia **criação de novos** recursos.
  Nunca apagar dado operacional por causa de billing.
- Backfill: `scripts/backfill-organization-and-clinic.ts` — idempotente (2ª execução = 0).

Rotas: `GET /v1/clinics` (lista + quota) · `POST /v1/clinics`.

---

### 5.13 Equipe própria: Member → ClinicMember (PLAT-001 / Fase 4)

A clínica passou a ser dona das pessoas. Antes não havia tabela de equipe: o domínio
guardava `platform.store_members.id` como String solta em ~15 colunas
(`appointments.professional_id`, `commission_rules.member_id`,
`professional_service_hours.member_id`, `budgets.responsible_id`, …), sem FK, com o nome
denormalizado ao lado, e o ERP resolvia tudo pelo platform-api.

**`Member.id` reaproveita o `store_members.id` legado no backfill.** É o que mantém o
histórico clínico (agendamentos, orçamentos, comissões) apontando para a pessoa certa.
Se algum dia esse passo for refeito com uuid novo, todo o histórico de profissional fica
órfão — **em silêncio**, porque não há FK para reclamar.
Script: `scripts/backfill-members.ts` (idempotente; valida a invariante de que todo
`appointments.professional_id` resolve para um `Member`).

Dois acoplamentos ao platform foram **removidos** nesta fase:
- o `$queryRaw` cross-schema em `platform.store_members` (resolução do profissional demo);
- o `POST platform-api/v1/stores/:id/seed-clinic-demo-team` — era a única chamada HTTP
  saindo desta API. O seed agora provisiona no Keycloak direto, via `@citybox/nest-common`.

Catálogo de papéis (`aluno`, `contador`, `dentista_admin`, `dentista`, `gerente`,
`radiologia`, `secretario`, `vendedor`) vive
em `@citybox/clinica-permissions` (`role-catalog.ts`); a API reexporta em
`members/domain/clinic-role.catalog.ts` (`clinicRoleLabel` para legados).

Rotas (`v1/members`):

| Rota | Observação |
| ---- | ---------- |
| `GET /me` | contrato compartilhado de descoberta de acesso; 200 com `member: null` quando o usuário não é daqui. `@SkipClinicScope` — a pergunta é "onde ESTE usuário tem acesso". **Se `hasPassword: false` e status ativo, chama `markPasswordSet`** (JWT válido = primeiro acesso concluído; Keycloak já forçou `UPDATE_PASSWORD`) |
| `GET /roles` | catálogo de papéis da vertical. `@SkipClinicScope` |
| `GET /` · `POST /` | equipe da organização da loja do header; create grava `hasPassword: false` + `provisionalExpiresAt` (+7d); colisão de `username`/`email`/`keycloak_sub` → **409** (`MemberUsernameTaken` / `MemberEmailTaken` / `MemberIdentityTaken`); soft-delete na **mesma** org com o mesmo sub/username → **reativa** em vez de 500 Prisma |
| `PUT /:memberId` | **reescreve** o conjunto de clínicas/papéis (não aplica delta) |
| `PATCH /:memberId/status` | `active` \| `disabled`; reflete no Keycloak — desabilitar só localmente deixaria o token válido até expirar |
| `POST /:memberId/reset-password` | nova senha provisória (`temporary: true`); volta o membro a `hasPassword: false` + `provisionalExpiresAt` = +7 dias, porque ele ainda não definiu a dele |
| `DELETE /:memberId` | **soft delete** + `setUserEnabled(false)` + `deprovisionMember`. Apagar de verdade orfanaria o histórico clínico (o id é referenciado sem FK) |

`ManageMemberUseCase` resolve o membro **sempre** pela organização da loja do header. O
`ClinicScopeGuard` valida o acesso de quem chama, mas não que o `memberId` do path é
daquela organização — sem essa checagem um gerente editaria membro alheio.

`MembersPresenter` expõe `hasPassword`/`provisionalExpiresAt`/`disabledAt`, o `roleLabel`
resolvido pelo catálogo (para o frontend não hardcodar papéis de novo), o
`organizationRole`/`isOrganizationOwner` (ver 5.13.1) e a inscrição no conselho
(`councilType`/`councilNumber`/`councilUf` — null até a 1ª emissão de receituário/atestado).

---

#### 5.13.1 Responsável pela organização (`Member.organizationRole`)

Existem **dois eixos de papel**, e confundi-los é o erro fácil aqui:

| eixo | onde vive | valores | escopo |
| ---- | --------- | ------- | ------ |
| **organização** | `Member.organizationRole` | `OWNER` \| `COLLABORATOR` | um por organização |
| **clínico** | `ClinicMember.role` | `aluno`, `contador`, `dentista_admin`, `dentista`, `gerente`, `radiologia`, `secretario`, `vendedor` | um por clínica |

Ser responsável é **ortogonal** a ser dentista: o dono pode ser qualquer coisa (ou nada)
na clínica. Vocabulário espelha `MembershipRole` do `erp-comercio`
(`OWNER`/`ADMIN`/`MEMBER`); aqui só há dois valores porque não existe nível intermediário.

**Invariante: no máximo um `OWNER` vivo por organização.** Garantida em dois lugares:
- banco — índice único **parcial** `members_one_owner_per_organization`
  (`WHERE organization_role = 'OWNER' AND deleted_at IS NULL`), escrito **à mão** na
  migration `20260730120000_add_organization_member_role` porque o Prisma não modela
  unique parcial. O `WHERE` sobre `deleted_at` importa: o soft delete mantém a linha, e um
  responsável removido não pode impedir a entrada de um novo;
- use case — `ProvisionOrganizationOwnerUseCase` checa antes e traduz a recusa do banco em
  `OrganizationAlreadyHasOwnerError`.

**Provisionamento.** O responsável nasce no seed da loja
(`ClinicStoreSeeder.ensureOrganizationOwner` → `ProvisionOrganizationOwnerUseCase`), a
partir do que o evento `citybox.store.created.v1` já carregava: `owner.responsibleName` e
`owner.billingEmail`. Antes disso o seed criava um **membro fictício**
(`gerente.{storeId}`, "Gerente Demonstração", sem e-mail): um placeholder que não
correspondia a ninguém, então o cliente terminava o cadastro sem acesso real.

- nome: `splitResponsibleName` divide em primeiro/resto. Nome único ⇒ `lastName: ''` —
  **não** inventamos sobrenome, que viraria dado errado no Keycloak para sempre;
- username (`members/domain/owner-identity.ts`): parte antes do `@` do e-mail, senão o
  nome, normalizado (minúsculas, sem acento, só `[a-z0-9._-]`). Colisão resolve com
  **sufixo numérico sequencial** (`maria.silva`, `maria.silva2`, …), sequencial e não
  aleatório para o reprocessamento chegar no mesmo nome. O probe olha os **dois** lados da
  unicidade: `Member.username` (`@unique` global) **e** o username do Keycloak;
- se o `billingEmail` (ou o `keycloak_sub` reaproveitado) já pertence a um `Member` de
  **outra** organização, cria identidade Keycloak dedicada com
  `buildDedicatedOwnerKeycloakEmail` (`local+clinic{8charsStore}@domínio`) — o
  `Member.email` local continua com o e-mail real de cobrança; `keycloak_sub` é `@unique`
  global e não permite a mesma pessoa Keycloak em duas orgs;
- vínculo: `ClinicMember` com a clínica raiz no papel clínico `gerente` (único do catálogo
  com o pacote completo de permissões);
- `hasPassword: false` — sem senha. Ver 5.13.2.

Casos de borda:
- `owner.responsibleName` vazio ⇒ `logger.warn` e segue. Bloquear a loja inteira por um
  campo opcional do contrato seria pior que ficar sem responsável;
- reprocessar o evento (entrega at-least-once) ou rodar `POST /v1/store-setup/:id/retry`
  não cria um segundo responsável nem estoura o `@unique`.

**Proteção.** `ManageMemberUseCase` recusa `remove()` e `setStatus('disabled')` no OWNER
com `OrganizationOwnerProtectedError`. Sem isso um gerente remove o dono e a organização
fica sem ninguém com acesso total. Editar dados e gerar nova senha continuam liberados;
reativar também — o que é proibido é **tirar** o acesso dele.

#### 5.13.2 Credenciais do responsável: por que "sem senha"

O Keycloak de desenvolvimento **não tem SMTP** (não há `smtpServer` em
`infra/keycloak/import/citybox-dev-realm.json`), então convite por e-mail não sai. Decisão
de produto: **o admin da plataforma exibe a senha uma única vez**. O responsável nasce com
`hasPassword: false` e a senha é gerada sob demanda pelo
`POST /v1/stores/:storeId/vertical-team/owner/reset-password` do `platform-api`, que
encaminha para o `POST /v1/members/:memberId/reset-password` daqui.

A senha **nunca** aparece em log, em corpo de evento, nem é persistida em claro.

> ⚠️ Keycloak e `Member` são dois dados em dois lugares. Criar um sem o outro produz
> acesso "fantasma" (role sem Member) ou "invisível" (Member sem role). Sempre usar
> `KeycloakProvisioningService.provisionMember`, que concede a role de vertical na mesma
> operação — nunca chamar a Admin API do Keycloak direto.

---

### 5.14 Worker: ciclo de vida da loja e callback (PLAT-001 / Fase 5)

O consumer `clinic.store-setup` deixou de só espelhar cadastro e passou a manter a
tenancy em dia, sem nenhuma chamada síncrona de volta ao platform:

| evento | efeito local |
|---|---|
| `store.created` | **Ignorado** (provision só via `POST /api/v1/platform/stores/:id/provision`) |
| `store.updated` | Se a clínica **já existe** → atualiza espelho/organização; sem clínica → no-op |
| `store.plan_changed` | atualiza `planSnapshot`; marca `overQuota` se estourou |
| `store.suspended` | `Organization.status = suspended` (+ motivo) |
| `store.reactivated` | `Organization.status = active` |

**Idempotência é obrigatória.** Desde a Fase 1 o platform publica por outbox com entrega
*at-least-once*: um crash entre publish e marcação republica a linha quando o lease
expira. Todo evento passa pelo `EventDedupeService` (`clinica.processed_events`, PK =
`event_id` do CloudEvent) **antes** de ser processado, e o registro é **liberado** se o
handler falhar — senão uma falha transitória ficaria marcada como concluída para sempre.

**Provision HTTP (admin).** `POST /api/v1/platform/stores/:id/provision` cria Organization + Clinic + seed + OWNER **com** senha provisória e devolve `{ username, provisionalPassword }`. O admin marca `ACTIVE`/`FAILED` a partir dessa resposta.

**Callbacks `citybox.provisioning.*`** ainda podem ser usados por fluxos legados do consumer; o path on-demand do admin **não** depende do callback para devolver a senha. Falha ao publicar o callback é logada mas **não** relançada: não pode
transformar provisionamento bem-sucedido em falha.

Verificado ponta a ponta no path legado (RabbitMQ); o path atual do admin é HTTP síncrono (`PENDING` → Provisionar → `ACTIVE`). Reentrega do mesmo evento não duplica nada.
Bloqueio no admin suspende a organização com o motivo.

---

### 5.15 🔒 ClinicScopeGuard — isolamento multi-tenant (PLAT-001 / Fase 6)

**Falha corrigida.** Até a Fase 6 nada correlacionava o `sub` do JWT com o header
`X-Store-Id`. Qualquer token com `store_staff` chamando a API direto na `:3172` lia e
escrevia prontuário de **qualquer** clínica. O `assertUserCanAccessStore` existia só no
proxy do ERP/web — quem batesse na API sem passar pelo proxy não era checado. Dado de
saúde, exposição LGPD.

O `ClinicScopeGuard` é global (roda entre `AuthGuard` e `PermissionGuard`) e faz tudo
**localmente**, sem round-trip ao platform-api:

1. resolve `X-Clinic-Id`/`X-Store-Id` → `Clinic` → `Organization`;
2. exige que o `keycloakSub` seja `Member` **daquela** organização com vínculo
   (`ClinicMember`) **àquela** clínica;
3. nega se a `Organization` estiver suspensa (enforcement de billing local, alimentado
   pelo evento `store.suspended`);
4. injeta `role`/`permissions` **reais** do membro no request — antes todo `store_staff`
   recebia o pacote inteiro de permissões pelo mapa de roles genérico.

**Bypass de operação / M2M:** quem resolve `platform.admin` (realm role `platform_admin`,
permission `platform.admin`, **ou** JWT com `azp` = `KEYCLOAK_ADMIN_CLIENT_ID` /
`citybox-core-admin`) passa sem ser membro. Sem isto o `platform-api` (client_credentials)
recebia 403 ao consultar `GET /v1/members` para o card "Responsável pelo acesso" no admin.

Regras ao escrever rota nova:
- **Toda** rota de domínio passa pelo guard. Só use `@SkipClinicScope()` em rota que
  legitimamente não opera sobre uma clínica (`/v1/members/me`, catálogos, plataforma).
- Prefira `@CurrentClinicScope()` a `@StoreId()`: o `StoreId` só lê o header, sem provar
  acesso. O `StoreId` segue existindo por compatibilidade com as ~50 rotas legadas.
- Mensagem de negação é genérica de propósito ("Acesso negado a esta clínica") — não
  confirmar a existência de clínica alheia.

---

## 6. Padrões de Código

(Idênticos à `food/api` e `platform/api` — ver `apps/verticals/food/AGENTS.md` §6. Resumo:)

- **Use case**: `@Injectable() class XUseCase implements IUseCase<In, Out>`; injeta repositório por token; orquestra domínio.
- **Entidade**: `extends Entity<Props>`, `static create()/with()`, getters, `validate()` (Zod via factory).
- **Repositório**: interface abstrata (token) em `domain/repositories` + impl Prisma em `infrastructure/database`; DI no `<modulo>.module.ts`.
- **Rota**: `@Controller('v1/...')`, controller fino, `@StoreId()` + `@Body() DTO` (class-validator) → use case → presenter.
- **Validação dupla**: class-validator (HTTP) + Zod v4 (domínio).
- **Testes**: Jest `*.spec.ts` com repositórios in-memory e storage in-memory.
  `@citybox/messaging` é ESM e o Jest não parseia: o `moduleNameMapper` do `package.json` aponta para
  `src/shared/infra/messaging/__mocks__/citybox-messaging.ts` (mesmo padrão da `platform-api`).
  O mock reexporta `contracts/clinic-strand` e `contracts/store-events` do pacote real.

---

## 7. Variáveis de Ambiente

> Reais, lidas de `.env.example`.

| Variável            | Obrigatória | Descrição                                              |
| ------------------- | ----------- | ------------------------------------------------------ |
| `PORT`              | ➖ (3172)   | Porta HTTP                                              |
| `DATABASE_URL`      | ✅          | Postgres `citybox_platform` (schema `clinica`)         |
| `KEYCLOAK_ISSUER`   | ✅          | Issuer do realm (JWKS p/ validar JWT)                  |
| `CORS_ORIGINS`      | ➖          | Origens permitidas (`clinica.aplopes.com`, admin, ERP) |
| `STORAGE_PROVIDER`  | ➖          | `minio` (ou in-memory)                                 |
| `MINIO_ENDPOINT` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` / `MINIO_BUCKET` / `MINIO_USE_SSL` | ➖ | Object storage (bucket `citybox-clinica`) |
| `AUTH_DEV_BYPASS`   | ➖          | `true` libera `Bearer dev-admin` fora de produção      |
| `RABBITMQ_URL` / `RABBITMQ_EXCHANGE` / `RABBITMQ_DLX` | ✅ p/ seeds | **Obrigatório no `.env` local** para o worker first-contact (fila `clinic.store-setup`). Sem `RABBITMQ_URL` o worker sobe e **não consome** (log de erro). Copiar do `.env.example`. |
| `CLINIC_WORKER_ENABLED` | ➖     | `false` desliga o consumer no worker |
| `CLINIC_WHATSAPP_ENABLED` | ➖ | `false` desliga o processo Baileys / consumer WhatsApp |
| `WHATSAPP_AUTH_DIR` | ➖ | Diretório de auth multi-loja (default `data/whatsapp`); volume Docker `clinica_whatsapp_auth`. Contém milhares de `.json` do Baileys (`creds.json`, `pre-key-*`, `lid-mapping-*`, `session-*`) — **não são código/commit**; pasta no `.gitignore` |
| `PLATFORM_API_URL` | ➖ (recomendado local) | Base URL da admin-api (ex. `http://localhost:3103`). Usado no **retry** de store-setup para rebuscar `owner` do evento quando o espelho cadastral não tem. Equipe demo **não** é mais seedada — só OWNER. |
| `PLATFORM_API_BEARER` | ➖ | Bearer para o seed HTTP; se omitido e `AUTH_DEV_BYPASS=true`, usa `dev-admin`. |
| `CLINIC_SEED_DEMO_PROFESSIONAL_ID` | ➖ | Override do `professionalId` do agendamento demo — deve ser um **`store_members.id`** (não `members.id`). Default: primeiro vínculo ativo da loja (o OWNER). |
| `ZAPSIGN_API_TOKEN` | ✅ p/ assinatura | Token único de plataforma (sandbox ou produção). Sem token, request de assinatura falha. |
| `ZAPSIGN_BASE_URL` | ➖ | Default `https://api.zapsign.com.br` (sandbox: `https://sandbox.api.zapsign.com.br`). |
| `ZAPSIGN_WEBHOOK_SECRET` | ✅ em produção | Header `Authorization: Bearer …` ou `X-ZapSign-Secret` / `X-Webhook-Secret`. Sem secret em produção o webhook responde 401. |

Referência: `.env.example` (copiar para `.env`, gitignored).

---

## 8. Scripts

```bash
pnpm --filter @citybox/clinica-api dev          # HTTP + worker store-setup + worker WhatsApp (workers supervisionados no dist)
pnpm --filter @citybox/clinica-api dev:http     # só HTTP nest --watch
pnpm --filter @citybox/clinica-api dev:worker   # só worker nest --watch (debug)
pnpm --filter @citybox/clinica-api start:worker # node dist/src/main-worker (prod/local pós-build)
pnpm --filter @citybox/clinica-api dev:whatsapp # Baileys + filas WhatsApp (nest --watch)
pnpm --filter @citybox/clinica-api start:whatsapp # node dist/src/main-whatsapp
pnpm --filter @citybox/clinica-api build        # nest build → dist/
pnpm --filter @citybox/clinica-api build        # rm -rf dist && nest build → dist/ (clean explícito; ver §5.3.1)
pnpm --filter @citybox/clinica-api start:prod   # node dist/src/main
pnpm --filter @citybox/clinica-api lint         # eslint --fix
pnpm --filter @citybox/clinica-api typecheck    # tsc --noEmit
pnpm --filter @citybox/clinica-api test         # jest (unit *.spec.ts)
pnpm --filter @citybox/clinica-api test:cov     # jest --coverage
pnpm --filter @citybox/clinica-api db:generate  # prisma generate → generated/prisma
pnpm --filter @citybox/clinica-api db:migrate:dev   # prisma migrate dev
pnpm --filter @citybox/clinica-api openapi:export   # → packages/docs/api/clinica-openapi.json

# Swagger: http://localhost:3172/api/v1/docs   ·   Health: http://localhost:3172/api/health

# Produção aplopes: `apps/verticals/clinica/infra/docker-compose.yml`
#   - `api` → `node dist/src/main.js` (HTTP :3172)
#   - `worker` → `node dist/src/main-worker.js` (consumer `clinic.store-setup`)
#   - `web` → Next.js `@citybox/clinica-web` (:3113 → clinica.aplopes.com)
#   - `whatsapp` → `node dist/src/main-whatsapp.js` (Baileys + `clinic.whatsapp-send` / `clinic.whatsapp-session`)
# Deploy full: `pnpm deploy:prod` (inclui clinica via `deploy_clinica_api` = api+worker+web).
# Deploy parcial: `pnpm deploy:prod:clinic`
#   -- --api-only | -- --web-only | -- --erp-only | -- --skip-migrations | -- --skip-build | -- --no-cache
# Sem worker = seed first-contact não roda.
# Sem o processo `whatsapp` = QR nunca é gerado (evento `session.start` fica na fila).
# `CLINIC_WHATSAPP_ENABLED=false` no `.env` desliga o processo WhatsApp no `pnpm dev`.
```

Prefixo global de rotas: **`/api`**.

---

## 9. Módulos Implementados

> Atualize esta seção quando um módulo/endpoint for adicionado ou alterado.

**Estado atual: 🟡 config + pacientes + agenda + estoque + financeiro + comissões + vendas/CRM + marketing + dashboard + reports + store-setup (worker) + WhatsApp Baileys MVP + signature-packages; ERP integrado via `clinicaFetch`.**

| Módulo / Recurso | Status          | Rota                | Notas                                      |
| ---------------- | --------------- | ------------------- | ------------------------------------------ |
| Store setup      | ✅ Disponível   | `POST /api/v1/store-setup/:storeId/retry` | Worker `clinic.store-setup`; seed `vertical === 'Clínica'`; template **v4** por **`clinicStrand`** (`odontologia` \| `fisioterapia` \| `nutricao`): plano Particular com especialidades do pack da vertente (`ensurePlanMatchesPack` no retry repara mismatch — ex. fisio com Cirurgia/Dentística), anamneses, contrato, financeiro (categorias despesa/receita com **hex** distintos; backfill se `color` vazia), categorias paciente/agendamento com cor, **só OWNER** do cadastro (`ensureOwner` — **sem** equipe demo), paciente+agenda amanhã **09:00 wall-clock** (profissional = OWNER). Pack `nutricao`: 4 especialidades + linha comercial canônica; `locationUiType=none`; anamnese `global-plus-extra`. |
| WhatsApp session | ✅ MVP          | `GET/POST/DELETE /api/v1/whatsapp/session` (+ `POST …/qr`) | Status + QR (`qrBase64`); `settings.manage`; processo `main-whatsapp` (Baileys) |
| WhatsApp envio | ✅ MVP | — (fila `clinic.whatsapp-send`) | **JID resolvido por `sock.onWhatsApp()`** testando o número e a variante sem/com o nono dígito (contas BR antigas). `sendMessage` para JID inexistente **não** dá erro — a mensagem some. Sem match ⇒ `status='failed'` com `Número sem WhatsApp ativo: …` |
| WhatsApp lembrete 2h | ✅ MVP | — (scheduler no `main-whatsapp`) | A cada 60s: (1) `confirmed` em `(now, now+2h]` → `appointment-reminder:{id}`; (2) `scheduled` sem reply 1/2 mas com pedido de confirmação em `(now, now+5min]` → `appointment-pending-reminder:{id}` (texto “já está confirmada”, **status continua scheduled**); `templateKey=null` |
| WhatsApp aniversário | ✅ MVP | — (scheduler a partir 07:00 BRT no `main-whatsapp`) | Campanhas `aniversario`+`active`: create dispara 1º envio; cron a cada ~60s libera **1 paciente a cada 5 min**; `correlationId=birthday:{campaignId}:{patientId}:{yyyy-MM-dd}`; filtros plan/specialty/gender; `templateKey=birthday` |
| WhatsApp templates | ✅ MVP        | `GET/PUT /api/v1/whatsapp/templates` | 6 keys; ensure defaults; dispara no MVP: `appointment_confirmation` (agenda) + lembrete 2h (constante, não editável na UI) |
| WhatsApp patient msgs | ✅ MVP     | `GET /api/v1/patients/:id/whatsapp-messages` | Histórico paginado (`createdAt desc` — página 1 = mais recentes); `patients.manage` |
| Health           | ✅ Disponível   | `GET /api/health`   | `@Public()` (em `shared/infra/http`)       |
| Dashboard | ✅ Disponível  | `GET /api/v1/dashboard/summary` + `birthdays` + `budgets` + `revenue-analysis` + `revenue-analysis/details` + `budget-analysis/status` + `budget-analysis` + `budget-analysis/details` + `patient-acquisition` + `patient-acquisition/details` + `patient-demographics` + `appointments` + `appointments/details` + `tasks/cancelled-appointments` + `cashflow` + `commissions` + `commissions/details` + `payment-methods` + `ticket-medio` + `inadimplencia` + `inadimplencia/details` + `expense-by-category` + `patients/summary` + `patients` + `sales-goals` (GET/PUT) | KPIs + listagens + análise de receitas/orçamentos/origem/demografia/consultas/tarefas canceladas/cashflow/comissões/meios/ticket médio/inadimplência/despesa por categoria + métricas de pacientes + metas; `read`/`update`/`access` Dashboard + `X-Store-Id` |
| Contract models  | ✅ Disponível   | `GET/POST /api/v1/contract-models` | Listar e criar modelos de contrato |
| Contract models  | ✅ Disponível   | `PUT/DELETE /api/v1/contract-models/:id` | Atualizar e excluir (204 no delete) |
| Patient categories | ✅ Disponível | `GET/POST /api/v1/patient-categories` | CRUD de categorias de paciente |
| Patient categories | ✅ Disponível | `PUT/DELETE /api/v1/patient-categories/:id` | Categoria protegida não pode ser excluída |
| Patient referral origins | ✅ Disponível | `GET/POST /api/v1/patient-referral-origins` | Catálogo por loja; GET faz ensure das origens de sistema; POST só custom (`{ name }`); **sem** PUT/DELETE / Configurações |
| Patient external professionals | ✅ Disponível | `GET/POST/PUT/DELETE /api/v1/patient-external-professionals` | Catálogo store-scoped (Nome/Celular/CRO); POST/PUT `{ name, phone?, cro? }`; nome único por loja; DELETE com `onDelete: SetNull` nos pacientes |
| Patients         | ✅ Disponível   | `GET/POST /api/v1/patients` | Listagem paginada + criar; `referralOriginId` + `referredBy*`; resposta inclui origem + `planName`/`planStatus` |
| Patients         | ✅ Disponível   | `GET/PUT /api/v1/patients/:id` | Detalhe + atualização; mesmo `planStatus` do plano associado |
| Patients         | ✅ Disponível   | `PATCH /api/v1/patients/:id/status` | Inativar/reativar (sem DELETE físico) |
| Patients (foto)  | ✅ Disponível   | `POST/GET/DELETE /api/v1/patients/:id/photo` | Upload multipart `file` via MinIO |
| Patient budgets  | ✅ Fase 1       | `GET/POST /api/v1/patients/:patientId/budgets` | Listagem paginada (`page`, `perPage`, `search`, `sortBy`, `sortOrder`) + criar |
| Patient budgets  | ✅ Fase 1       | `GET/PUT/DELETE /api/v1/patients/:patientId/budgets/:id` | 409 se `approved` (congelado) |
| Patient budgets  | ✅ Fase 1       | `PATCH /api/v1/patients/:patientId/budgets/:id/status` | `pending→approved\|rejected\|expired`; `rejected→pending` (reabrir); body `rejectedAt`+`rejectionReason` obrigatórios ao rejeitar |
| Patient treatments | ✅ Fase 1     | `GET/POST /api/v1/patients/:patientId/treatments` | Avulsos; reorder via PATCH `.../treatments/reorder` |
| Patient treatments | ✅ Fase 1     | `PUT/DELETE /api/v1/patients/:patientId/treatments/:id` | 409 se `completed` |
| Patient treatments | ✅ Fase 1     | `PATCH /api/v1/patients/:patientId/treatments/:id/finalize` | Cria evolução `source=treatment` + marca `completed` |
| Patient treatments | ✅ Disponível | `PATCH /api/v1/patients/:patientId/treatments/finalize` | Lote: `treatmentIds[]` → N `completed` + **uma** evolução compartilhada; comissão por item |
| Patient treatments (nutrição) | ✅ Disponível | `POST /api/v1/patients/:patientId/treatments/:id/nutrition-init` | Flag `showNutritionInitializeFlow`: cria evolução `source=nutrition_init` + pacote JSON (anamnesis/body/treatmentPlan); **não** marca tratamento `completed` |
| Patient treatments (nutrição) | ✅ Disponível | `GET /api/v1/patients/:patientId/nutrition-inits` | Metadados do card da evolução: `filledSections` (sem o conteúdo das seções) |
| Patient treatments (nutrição) | ✅ Disponível | `GET /api/v1/patients/:patientId/nutrition-inits/:evolutionId` | Reabre pacote Inicializar pelo card de evolução |
| Patient treatments (nutrição) | ✅ Disponível | `GET/POST /api/v1/patients/:patientId/nutrition-inits/:evolutionId/notes` | Notas do atendimento (HTML + 1 anexo opcional); POST/PATCH em **multipart** (campo `file`) |
| Patient treatments (nutrição) | ✅ Disponível | `PATCH …/nutrition-inits/:evolutionId/notes/:noteId` | Edita a nota; **não há DELETE** (registro clínico) |
| Patient treatments (nutrição) | ✅ Disponível | `GET /api/v1/patients/:patientId/nutrition-notes/:noteId/content` | Baixa o anexo da nota (buffer MinIO autenticado) |
| Treatment evolutions | ✅ Fase 1   | `GET/POST /api/v1/patients/:patientId/evolutions` | Avulsas; histórico em `GET .../evolutions/:id/history`; `signatureStatus` + `signatureRequestId` |
| Treatment evolutions | ✅ Fase 1   | `PUT/DELETE /api/v1/patients/:patientId/evolutions/:id` | 409 se confirmada (`confirmedAt` — base CLIN-011) |
| Electronic signatures | ✅ Disponível | `POST …/anamneses/:id/request-signature` | PDF base64 no body; 1 signatário (paciente/responsável se menor); 1 crédito ZapSign |
| Electronic signatures | ✅ Disponível | `POST …/contracts/:id/request-signature` | 2 signatários (ordem paciente→clínica); body `responsible` + `fileBase64`; **`send_automatic_email: true`** quando e-mail preenchido |
| Electronic signatures | ✅ Disponível | `POST …/evolutions/request-signature` | Lote `evolutionIds[]` + 1 PDF = 1 crédito |
| Electronic signatures | ✅ Disponível | `GET …/signatures/:id` + `GET …/signatures/by-target/:kind/:targetId` | Detalhe + reabrir links; `evolution_batch` resolve por id em `targetIds`; query `sync=true` consulta ZapSign (poll); sem `sync` devolve só o banco (UI rápida) |
| Electronic signatures | ✅ Disponível | `GET …/patients/:patientId/signatures` | Lista patient-scoped (ficha Sobre); default `status=pending`; `page`/`perPage`; envelope `{ data, meta }`; `manage` Patient |
| Electronic signatures | ✅ Disponível | `GET /api/v1/electronic-signatures` | Relatório Loja: listagem store-scoped + KPIs (`meta.stats`); `manage` Settings; filtros `startDate`/`endDate`/`kind`/`status`/`page`/`perPage` |
| Electronic signatures | ✅ Disponível | `POST …/signatures/:id/cancel` | Cancela na ZapSign; **não** reembolsa crédito; libera reenvio |
| Electronic signatures | ✅ Disponível | `GET …/patients/:id/signatures/:id/signed-pdf` | Stream MinIO do PDF assinado |
| Electronic signatures | ✅ Disponível | `POST /api/v1/webhooks/zapsign` | `@Public()`; `doc_signed` / `doc_refused` / `doc_expired` / `doc_deleted` |
| Signature packages | ✅ Disponível | `GET /api/v1/signature-credits` | Saldo de créditos; seed 0 se ausente; `manage` Settings **ou** `manage` Patient + `X-Store-Id` |
| Signature packages | ✅ Disponível | `GET/POST /api/v1/signature-package-requests` | Listar paginado (`page`/`perPage`/`status?` + `meta`) / solicitar `{ packageId }`; catálogo `pkg-250`/`pkg-600`/`pkg-1000` |
| Signature packages | ✅ Disponível | `PATCH /api/v1/signature-package-requests/:id/liberar` | `@RequirePlatformAdmin()` + `X-Store-Id`; idempotente; credita `quantity` no saldo |
| Patient anamneses  | ✅ Disponível   | `GET/POST /api/v1/patients/:patientId/anamneses` | Listagem paginada (`page`, `perPage`, `search`, `sortBy`, `sortOrder`) + criar |
| Patient anamneses  | ✅ Disponível   | `GET/DELETE /api/v1/patients/:patientId/anamneses/:id` | 204 no delete; detalhe completo no GET |
| Patient contract emissions | ✅ Disponível | `GET/POST /api/v1/patients/:patientId/contracts` | Listagem paginada (`search` em `templateName`; sort `issuedAt` \| `templateName`) + emitir; body opcional `budgetId` (orçamento **approved**, 1 contrato/orçamento → 409 Duplicate) |
| Patient contract emissions | ✅ Disponível | `GET/PUT/DELETE /api/v1/patients/:patientId/contracts/:id` | 204 no delete; `issuedAt` imutável no PUT; valida `templateId` via `ContractModel` |
| Patient prescriptions | ✅ Disponível | `GET/POST /api/v1/patients/:patientId/prescriptions` | Listagem paginada (`search` em `professionalName`; sort `issuedDate` \| `professionalName`) |
| Patient prescriptions | ✅ Disponível | `GET/PUT/DELETE /api/v1/patients/:patientId/prescriptions/:id` | 204 no delete; `items` JSON validado (Zod); `issuedAt` imutável no PUT |
| Patient certificates | ✅ Disponível | `GET/POST /api/v1/patients/:patientId/certificates` | Listagem paginada (`search` em `professionalName`; sort `issuedDate` \| `type`) |
| Patient certificates | ✅ Disponível | `GET/DELETE /api/v1/patients/:patientId/certificates/:id` | 204 no delete; sem PUT (UI não edita) |
| Patient tooth annotations | ✅ Disponível | `GET/POST /api/v1/patients/:patientId/tooth-annotations` | Lista todas (sem paginação — odontograma precisa do conjunto); filtro opcional `toothNumber`; FDI 11–85 |
| Patient tooth annotations | ✅ Disponível | `DELETE /api/v1/patients/:patientId/tooth-annotations/:annotationId` | 204 no delete; `content` máx. 255 |
| Patient body region annotations | ✅ Disponível | `GET/POST /api/v1/patients/:patientId/body-region-annotations` | Lista todas (mapa anatômico); filtro opcional `bodyRegionId` (catálogo `BODY_REGION_IDS`); `content` máx. 255 |
| Patient body region annotations | ✅ Disponível | `DELETE /api/v1/patients/:patientId/body-region-annotations/:annotationId` | 204 no delete |
| Patient body metrics | ✅ Disponível | `GET/POST /api/v1/patients/:patientId/body-metrics` | Listagem paginada (`page`, `perPage`, `sortBy=measuredAt`, `sortOrder` default `desc`); BMI calculado no create; **sem PUT/DELETE** — registro imutável após envio; classificação obesidade/risco só no cliente |
| Patient files (drive) | ✅ Disponível | `GET /api/v1/patients/:patientId/drive` | Listagem por pasta (`folderId`, `search`); `{ data: { folders, files } }` |
| Patient files (drive) | ✅ Disponível | `GET /api/v1/patients/:patientId/drive/breadcrumb` | Breadcrumb `Arquivos / …` |
| Patient files (drive) | ✅ Disponível | `GET /api/v1/patients/:patientId/drive/move-destinations` | Destinos para mover (`excludeFolderIds` csv ou `excludeFolderSubtreeId` uuid) |
| Patient files (folders) | ✅ Disponível | `POST /api/v1/patients/:patientId/folders` | Criar pasta (`parentId`, `name`) |
| Patient files (folders) | ✅ Disponível | `PATCH /api/v1/patients/:patientId/folders/:folderId` | Renomear |
| Patient files (folders) | ✅ Disponível | `PATCH /api/v1/patients/:patientId/folders/:folderId/move` | Mover (`parentId`) |
| Patient files (folders) | ✅ Disponível | `DELETE /api/v1/patients/:patientId/folders/:folderId` | 204; exclusão recursiva + MinIO |
| Patient files (files) | ✅ Disponível | `POST /api/v1/patients/:patientId/files` | Upload multipart `file` + `folderId` (máx 20 MB) |
| Patient files (files) | ✅ Disponível | `GET /api/v1/patients/:patientId/files/:fileId/content` | Stream do binário (preview/download) |
| Patient files (files) | ✅ Disponível | `PATCH /api/v1/patients/:patientId/files/:fileId` | Renomear |
| Patient files (files) | ✅ Disponível | `PATCH /api/v1/patients/:patientId/files/:fileId/move` | Mover (`folderId`) |
| Patient files (files) | ✅ Disponível | `DELETE /api/v1/patients/:patientId/files/:fileId` | 204 + remove objeto MinIO |
| Public anamnesis   | ✅ Disponível   | `GET/PATCH /api/v1/public/anamnesis/:token` | `@Public()` — preenchimento pelo paciente via link; GET devolve `clinicDisplayName` da loja do token |
| Appointment categories | ✅ CLIN-020 | `GET/POST /api/v1/appointment-categories` | Listagem paginada + `appointmentCount` |
| Appointment categories | ✅ CLIN-020 | `PUT/DELETE /api/v1/appointment-categories/:id` | 409 se consultas vinculadas |
| Appointments       | ✅ CLIN-020     | `GET/POST /api/v1/appointments` | Listagem paginada + criar (anti-overlap) |
| Appointments       | ✅ CLIN-020     | `GET /api/v1/appointments/calendar` | Intervalo `startDate`/`endDate` + `professionalIds?` |
| Appointments       | ✅ CLIN-020     | `GET/PUT/DELETE /api/v1/appointments/:id` | 409 estados terminais / overlap; PUT aceita `sendWhatsAppConfirmation` (reenvia WhatsApp) |
| Appointments       | ✅ CLIN-020     | `PATCH /api/v1/appointments/:id/status` | Máquina de estados (8 status); `finished` sincroniza ReturnAlert |
| Internal events    | ✅ CLIN-020     | `GET/POST /api/v1/internal-events` | Recorrência por regra (expansão no calendário) |
| Internal events    | ✅ CLIN-020     | `GET/PUT/DELETE /api/v1/internal-events/:id` | PUT afeta série inteira (sem edição de ocorrência única) |
| Fit-ins            | ✅ CLIN-020     | `GET/POST /api/v1/fit-ins` | Listagem paginada; urgente primeiro |
| Fit-ins            | ✅ CLIN-020     | `GET/PUT/DELETE /api/v1/fit-ins/:id` | `GET …/check-patient/:patientId` encaixe pendente |
| Return alerts      | ✅ CLIN-020     | `GET/POST /api/v1/return-alerts` | `source=manual`; auto via finalize appointment |
| Return alerts      | ✅ CLIN-020     | `DELETE /api/v1/return-alerts/:id` | 204 no delete |
| Available slots    | ✅ CLIN-020     | `GET /api/v1/available-slots` | Clínica ∩ profissional − almoço − ocupados − **já passados** (wall-clock `America/Sao_Paulo`); step padrão = `durationMin` (mín. 15) |
| Patient financial entries | ✅ Fase 1 (CLIN-060 parcial) | `GET/POST /api/v1/patients/:patientId/financial-entries` | Listagem paginada (`page`, `perPage`, `search`, `status`, `periodFrom`, `periodTo`, `budgetItemId?`, `sortBy`, `sortOrder`) + criar débito avulso; list/get hidratam `debitDetail` legado a partir de `BudgetItem` |
| Patient financial entries | ✅ Fase 1 (CLIN-060 parcial) | `GET/PUT/DELETE /api/v1/patients/:patientId/financial-entries/:id` | PUT parcial em pendentes (`avulso_debit` \| `budget_approve`): `observations` + `valueCents`/`treatments[{id,valueCents,professionalId}]`; DELETE livre |
| Patient financial entries | ✅ Fase 1 (CLIN-060 parcial) | `POST/GET/DELETE /api/v1/patients/:patientId/financial-entries/:entryId/attachments[/:attachmentId]` | Anexos MinIO no `debitDetail.attachments`; 1º anexo espelhado em `receiptObjectKey` |
| Patient financial entries | ✅ Fase 1 (CLIN-060 parcial) | `PATCH /api/v1/patients/:patientId/financial-entries/:id/receive` | Persiste `receiveDetail` + `receivedAt`; 409 se já `received` |
| Estoque (stock) | ✅ Disponível | `GET/POST/PUT/DELETE /api/v1/stock-suppliers` | CRUD fornecedor |
| Estoque (stock) | ✅ Disponível | `GET/POST/PUT/DELETE /api/v1/stock-products` | Listagem paginada (`page`, `perPage`, `search`, `sortBy`, `sortOrder`) + CRUD produto |
| Estoque (stock) | ✅ Disponível | `POST/GET/DELETE /api/v1/stock-products/:id/photo` | Upload/servir/deletar foto via MinIO |
| Estoque (stock) | ✅ Disponível | `POST /api/v1/stock-entries` e `POST /api/v1/stock-entries/bulk` | Entradas (incrementa quantidade) |
| Estoque (stock) | ✅ Disponível | `POST /api/v1/stock-withdrawals` | Retiradas (decrementa quantidade) |
| Estoque (stock) | ✅ Disponível | `GET /api/v1/stock-movements` | Listagem paginada e filtrada (`type`, `productId`, `startDate`, `endDate`, `sortBy`, `sortOrder`) |
| Estoque (stock) | ✅ Disponível | `GET /api/v1/stock-stats` | Estatísticas agregadas (valores e status in/low/out) |
| Search (FTS) | ✅ Disponível | `GET /api/v1/search` | Busca global Cmd+K: pacientes, agenda, oportunidades, estoque; `q` + `perType?`; escopo CASL + funis visíveis + agenda por profissional |
| Financial accounts | ✅ Disponível | `GET/POST /api/v1/financial/accounts` | Contas (caixa); `includeInactive` no GET |
| Financial accounts | ✅ Disponível | `PUT/DELETE /api/v1/financial/accounts/:id` | 204 no delete |
| Financial categories | ✅ Disponível | `GET/POST /api/v1/financial/categories` | `kind=income\|expense`; cor opcional |
| Financial categories | ✅ Disponível | `PUT/DELETE /api/v1/financial/categories/:id` | 204 no delete |
| Financial entries | ✅ Disponível | `GET/POST /api/v1/financial/entries` | Listagem server-side (`dateField` dueDate\|paidAt; `paidAtFrom`/`paidAtTo`) + criar (recorrência) |
| Financial entries | ✅ Disponível | `GET /api/v1/financial/entries/stats` | Totais income/expense/balance em centavos |
| Financial entries | ✅ Disponível | `GET /api/v1/financial/entries/by-payment-method` | Agrega liquidados (`paid`/`received`) por meio; income/expense/balance em centavos |
| Financial entries | ✅ Disponível | `GET/PUT/DELETE /api/v1/financial/entries/:id` | PUT só `manual`+`pending`; DELETE permitido também para paid/received |
| Financial entries | ✅ Disponível | `PATCH …/entries/:id/receive\|pay\|cancel` | Receber receita / pagar despesa / cancelar |
| Financial entries | ✅ Disponível | `PATCH …/entries/recurrence/:groupId` | Escopo `this`\|`this_and_future`\|`all` |
| Commission rules | ✅ CLIN-062 | `GET/PUT /api/v1/team/:memberId/commission-rules` | Replace atômico; `settings.manage` |
| Commission accruals | ✅ CLIN-062 | `POST /api/v1/commissions/accruals` | Criar lançamento em aberto (manual); **motor `debit_received` no receive** |
| Commissions open | ✅ CLIN-062 | `GET /api/v1/commissions/open` | `{ data, meta }`; agrega por membro (`hasCommissionConfigured`, `totalCents`, `ruleGroups`); filtros `page`/`perPage`/`startDate`/`endDate`/`professionalId`\|`memberId`/`search` |
| Commissions open | ✅ CLIN-062 | `GET /api/v1/commissions/open/:memberId` | Detalhe do profissional |
| Commission payments | ✅ CLIN-062 | `POST /api/v1/commissions/payments` | Marca accruals `paid` + `CommissionPayment`/items + `FinancialEntry` expense (`source=manual`, `status=paid`) |
| Commission history | ✅ CLIN-062 | `GET /api/v1/commissions/history` | Listagem paginada **agregada por profissional** (soma líquida dos pagamentos no período) |
| Commission history | ✅ CLIN-062 | `GET /api/v1/commissions/history/:memberId` | Detalhe agregado do membro no período (`startDate`/`endDate`) |
| Sales funnels | ✅ Disponível | `GET/POST /api/v1/funnels` | Listagem paginada + criar; `POST …/ensure-defaults` |
| Sales funnels | ✅ Disponível | `GET/PATCH/DELETE /api/v1/funnels/:id` | 409 se default ou com oportunidades; PATCH stages: save em 2 fases de `order` (evita UNIQUE funnel_id+order) |
| Sales opportunities | ✅ Disponível | `GET/POST /api/v1/opportunities` | Listagem filtrada/paginada (`orderBy sortOrder`); filtro `period` + `startDate`/`endDate` (custom → dia civil BRT) |
| Sales opportunities | ✅ Disponível | `GET/PATCH/DELETE /api/v1/opportunities/:id` | 409 se etapa won/lost |
| Sales opportunities | ✅ Disponível | `PATCH /api/v1/opportunities/reorder` | Persiste ordem dos cards (`items: { id, stageId, sortOrder }[]`) |
| Sales opportunities | ✅ Disponível | `PATCH /api/v1/opportunities/:id/move` | Move estágio + `sortOrder` opcional + histórico |
| Sales opportunities | ✅ Disponível | `GET/POST /api/v1/opportunities/:id/history|comments` | Histórico + comentário |
| Sales labels | ✅ Disponível | `GET/POST/PATCH/DELETE /api/v1/labels` | Rótulos do CRM |
| Campaign types (marketing) | ✅ Taxonomia | `GET /api/v1/campaign-types` | Catálogo fixo segmento→tipo→estratégia (6 tipos); `form_lead` + `aniversario` com `implemented: true` |
| Campaigns (marketing) | ✅ form_lead + aniversario | `POST/GET /api/v1/campaigns` | Criar/listar; content canônico ou wizard; rejeita tipos não implementados |
| Campaigns (marketing) | ✅ form_lead | `GET /api/v1/campaigns/:id` | Detalhe store-scoped |
| Campaigns (marketing) | ✅ form_lead | `PATCH /api/v1/campaigns/:id/status` | Finalizar (`delete` Marketing / `marketing_campaign_finalize`) |
| Indicações (marketing) | ✅ Disponível | `GET /api/v1/indicacoes/kpis` | KPIs + `years`; período annual/monthly; `read` Marketing |
| Indicações (marketing) | ✅ Disponível | `GET /api/v1/indicacoes/referred-patients` | Pacientes indicados; 1ª consulta; paginação/sort; filtro `referrerKind`+`referrerId`; `read` Marketing |
| Indicações (marketing) | ✅ Disponível | `GET /api/v1/indicacoes/referrers` | Indicadores (`kind` patient/team/external); paginação/sort; `read` Marketing |
| Reports (birthdays) | ✅ Disponível | `GET /api/v1/reports/birthdays` | Aniversariantes por período (`startDate`/`endDate`); paginação server-side; `read` Dashboard |
| Reports (open treatments) | ✅ Disponível | `GET /api/v1/reports/open-treatments-without-appointment` | Pacientes com tratamento active sem consulta viva; paginação; `read` Dashboard |
| Reports (approved budgets) | ✅ Disponível | `GET /api/v1/reports/approved-budgets` | Orçamentos `approved` por `approvedAt` (`startDate`/`endDate`); paginação; `read` Dashboard |
| Reports (open budgets) | ✅ Disponível | `GET /api/v1/reports/open-budgets` | Orçamentos `pending` por `Budget.date` (`startDate`/`endDate`); paginação; `read` Dashboard |
| Reports (rejected budgets) | ✅ Disponível | `GET /api/v1/reports/rejected-budgets` | Orçamentos `rejected` por `rejectedAt` (fallback `Budget.date` se nulo); paginação; `read` Dashboard |
| Reports (sales by specialty) | ✅ Disponível | `GET /api/v1/reports/sales-by-specialty` | Itens de orçamento `approved` por `approvedAt` (fallback `date`); especialidade do tratamento; paginação; `read` Dashboard |
| Reports (sales by plan) | ✅ Disponível | `GET /api/v1/reports/sales-by-plan` | Itens de orçamento `approved` por `approvedAt` (fallback `date`); `planName` do item; paginação; `read` Dashboard |
| Reports (sales by professional) | ✅ Disponível | `GET /api/v1/reports/sales-by-professional` | Itens de orçamento `approved` por `approvedAt` (fallback `date`); `professionalName` do item; paginação; `read` Dashboard |
| Reports (sales by treatment) | ✅ Disponível | `GET /api/v1/reports/sales-by-treatment` | Itens de orçamento `approved` por `approvedAt` (fallback `date`); `treatmentName` + `planName` do item; paginação; `read` Dashboard |
| Reports (expenses by category) | ✅ Disponível | `GET /api/v1/reports/expenses-by-category` | Despesas `paid` por `paidAt` agregadas por categoria + %; paginação; `read` Dashboard |
| Reports (excluded revenues) | ✅ Disponível | `GET /api/v1/reports/excluded-revenues` | Receitas `cancelled` por `updatedAt` civil; `excludedBy` = `cancelledByName` ou fallback; paginação; `read` Dashboard |
| Reports (referred patients) | ✅ Disponível | `GET /api/v1/reports/referred-patients` | Pacientes `indicacao` por `createdAt`; 1ª consulta + orçamentos aprovados; paginação; `read` Dashboard |
| Permissão config (perfil/WhatsApp) | — | — | `@RequirePermission('manage', 'Settings')` + `X-Store-Id` |
| Permissão estoque | — | — | `@RequirePermission('manage', 'Stock')` + `X-Store-Id` |
| Permissão planos | —               | —                   | `@RequirePermission('manage', 'ClinicPlan')` + `X-Store-Id` |
| Permissão anamneses (templates) | — | — | `@RequirePermission('manage', 'AnamnesisTemplate')` + `X-Store-Id` |
| Permissão contratos (modelos) | — | — | `@RequirePermission('manage', 'ContractModel')` + `X-Store-Id` |
| Permissão equipe | —               | —                   | `@RequirePermission('read'|'create'|'update'|'delete', 'Team')` + `X-Store-Id` |
| Permissão pacientes | —            | —                   | `@RequirePermission('manage', 'Patient')` (+ subjects finos de ficha) + `X-Store-Id` |
| Permissão financeiro | —          | —                   | `@RequirePermission('manage', 'Financial')` + `X-Store-Id` |
| Permissão agenda | —              | —                   | `@RequirePermission('manage', 'Schedule')` + `X-Store-Id` |
| Permissão vendas (CRM) | —          | —                   | `@RequirePermission('manage', 'Sales')` + `X-Store-Id` |
| Permissão marketing | —              | —                   | `@RequirePermission('read'\|'create'\|'update', 'Marketing')` + `X-Store-Id` |

**Regras de negócio (`contract-models`):**
- Nome único por loja (case-insensitive)
- Apenas um `isDefault: true` por loja
- Modelo padrão não pode ser excluído (409)
- Modelo com emissões em pacientes (`PatientContractEmission`) → `ContractModelHasPatientsError` (409); ERP mostra modal informativo

**Regras de negócio (`clinic-plans`):**
- Plano vinculado a paciente(s) ou itens de orçamento → `ClinicPlanHasPatientsError` (409); sugerir inativar em vez de excluir
- Update (`replaceTree`): **upsert** de especialidades/tratamentos (preserva IDs); não faz delete-all. Remover tratamento ainda referenciado em `budget_items` → `ClinicPlanTreatmentsInUseError` (409)
- Especialidade: `locationUiType` (`location_ui_type`, enum `tooth`|`face_region`|`body_region`|`session`|`none`, default `tooth`) — define o seletor de local no orçamento (HOF, corpograma, sessão sem mapa, etc.). Tratamento pode ter override nullable `locationUiType`. Seed first-contact preenche via `specialty-location-ui-type.ts` por `clinicStrand` (ex.: Harmonização Facial → `face_region`; Pilates/Hidro → `session`)
- Tratamento: `acceptsFaces` (`accepts_faces`, default `false`) — quando true, orçamento/tratamento avulso podem gravar faces no `locationLabel` (`15 · M,O/I`); se faces presentes e `acceptsFaces=false` → `ToothFacesNotAcceptedError` (422)

**Regras de negócio (`anamnesis` — templates):**
- Template com anamneses preenchidas (`PatientAnamnesis`) → `AnamnesisTemplateHasPatientsError` (409)
- Biblioteca global: seed idempotente em `prisma/global-anamnesis-questions.ts` (~15 perguntas, `storeId` null); `pnpm --filter @citybox/clinica-api db:seed`. ERP revalida `GET /v1/anamnesis-questions` ao abrir o sheet (evita cache vazio pós-seed).

**Regras de negócio (`clinic-profile`):**
- CNPJ validado com dígitos verificadores (`isValidCnpj` em `brazilian-document.utils.ts`)
- Fixtures/specs: CNPJ de exemplo deve passar no checksum (ex.: `04.252.011/0001-10`; não usar `12.345.678/0001-90`)

**Regras de negócio (`patient-categories`):**
- Nome único por loja (case-insensitive)
- Categoria `isProtected: true` não pode ser excluída (409) — seed `"Particular"`
- Categoria protegida **pode** ser editada (nome/cor)
- Exclusão bloqueada se há pacientes vinculados (409)
- `colorId` é hex livre `#rrggbb` (`VarChar(7)`); UI usa seletor nativo de saturação (`input type="color"`)

**Regras de negócio (`patient-referral-origins`):**
- Catálogo store-scoped (`PatientReferralOrigin`); **sem** tela em Configurações — só `GET` + `POST` usados no form de paciente
- `GET`: ensure idempotente das origens de sistema da loja (`indicacao`, `indicacao_profissional`, `indicacao_profissional_externo`, `google`, `instagram`, `facebook`, `outro`) + lista sistema+custom
- `POST { name }`: custom (`systemKey` null); rejeita nome duplicado / colisão com sistema; **sem** PUT/DELETE
- Seed de sistema é **via API** (ensure no GET), não via SQL de migration

**Regras de negócio (`patient-external-professionals`):**
- Catálogo store-scoped (`ExternalReferralProfessional`); usado no select secundário do cadastro quando origem = `indicacao_profissional_externo`
- `GET`: lista ordenada por nome; `POST/PUT { name, phone?, cro? }` — nome obrigatório (máx 120), phone só dígitos, cro máx 32; `@@unique([storeId, name])` (case-insensitive na app)
- `DELETE /:id`: remove do catálogo; FK no paciente é `onDelete: SetNull`
- Sem página em Configurações (tela comparativa futura fora de escopo)

**Regras de negócio (`patients`):**
- CPF validado (dígito verificador) e único por loja (`@@unique([storeId, cpf])`)
- Mesmo CPF permitido em lojas diferentes
- Anti-IDOR: `findById` filtra `storeId` → 404 se paciente de outra loja
- Listagem: busca parcial por **nome** (`contains`, case-insensitive); CPF e telefone com match exato em dígitos (aceita formatação `. - / ( )` na query)
- Paginação food-style: `{ data, meta: { total, page, perPage, totalPages } }`
- Origem: FK `referralOriginId` (loja); `indicacao` exige `referredByPatientId` (mesmo store, ≠ self) e limpa member/externo; `indicacao_profissional` exige `referredByMemberId` + snapshot `referredByMemberName` e limpa paciente/externo; `indicacao_profissional_externo` exige `referredByExternalProfessionalId` existente na loja e limpa patient/member; demais origens limpam os três indicadores
- Convênio embutido no `Patient` (`planId`, `planNumber`, `planHolderName`, `planHolderCpf`) — evolução 1:N futura
- Resposta de listagem/detalhe inclui `referralOrigin*` + `referredBy*` (incl. `referredByExternalProfessionalId` + snapshot `name`) + `planName` + `planStatus` (`active`|`inactive`|null); ERP exibe "(Inativo)" na aba Sobre
- Responsável legal simplificado: campos `guardian*` no `Patient` (sem entidade formal)
- `aboutSummary` retorna `null` nos três campos até módulos de agenda/prontuário existirem
- Foto: chave MinIO `{storeId}/patients/{patientId}.{ext}` via `PatientObjectKeyPolicy`
- Migration origens: `20260724123000_add_patient_referral_origins` — cria catálogo + FKs/`referredBy*` + seed de sistema por loja + backfill `referral_source`→`referral_origin_id` + drop do enum antigo. Cancel financeiro já está em `20260724114525_add_financial_entry_cancelled_by`. Migration profissionais externos: `20260804180000_add_external_referral_professionals` (enum + tabela + FK no patient). **Operador aplica** com `prisma migrate deploy` (ou `migrate dev`).

**Regras de negócio (`patient-budgets` — CLIN-041 Fase 1):**
- Listagem: busca parcial por **descrição** ou **responsável** (`contains`, case-insensitive); paginação `{ data, meta: { total, page, perPage, totalPages } }`; ordenação `date` | `description` | `finalValueCents` | `status` (padrão: `date desc`)
- Status: `pending` | `approved` | `rejected` | `expired` (ERP mapeia `draft` ↔ `pending`; `rejected` ↔ `rejected`)
- Desconto toggle: `fixed` (centavos) XOR `percent` em **centésimos** (ex. `1050` = 10,5%; `2000` = 20%). O cálculo de `finalValueCents` usa `value / 10_000` — **não** `/ 100` (isso tratava 20% como 2000% e zerava o total)
- Parcelamento: `downPaymentCents + N parcelas === finalValueCents` (última parcela absorve centavos)
- Orçamento `approved`: imutável — PUT/DELETE → 409 (`BudgetFrozenError`)
- `PATCH status`: `approved` | `rejected` | `expired` a partir de `pending`; `pending` a partir de `rejected` (reabrir). Ao **rejeitar**, exige `rejectedAt` (yyyy-MM-dd) + `rejectionReason` (1–255); campos `rejected_at` / `rejection_reason` no model; ao **reabrir**, limpa data/motivo. Ao **aprovar**, materializa itens em `patient_treatments` (`source=budget`, idempotente por `budgetItemId`) **e** gera lançamentos via `GenerateBudgetFinancialEntriesService`: **sem parcelamento** → 1 linha por `BudgetItem` com nome = `treatmentName` (sem sufixo `i/n`), valor unitário/rateio, `budgetItemId`, `installmentIndex` 1..N; **com parcelamento** → `Entrada — {desc}` (se entrada > 0) + `{k}/{N} — {desc}` sem `budgetItemId`; body opcional `dueDate` (`yyyy-MM-dd`) = vencimento base / entrada; body opcional `installments: [{ dueDate, valueCents }]` sobrescreve o rateio automático das parcelas (soma deve = `finalValueCents − downPaymentCents`); sem `installments`, vencimentos = base + k meses e rateio igual; idempotente por `@@unique([storeId, budgetId, installmentIndex])`
- **Sync CRM (`SyncBudgetSalesOpportunityService`):** ao **criar** orçamento (`pending`), cria card no **Funil de Venda** (etapa Em aberto) com `origin=budget`, `budgetId`, título = nome do paciente; falha de sync **aborta** o create (rollback do orçamento). Status → etapa: `approved`→won (Ganha), `rejected`/`expired`→lost (Perdida), reabrir `pending`→Em aberto. **DELETE** orçamento não aprovado remove a oportunidade ligada (`onDelete: Cascade` no FK + `onDeleted` defensivo)
- Item: `locationType` (`tooth`|`body_region`|`session`|`none`) + `locationLabel` generalizado; opcional `sessionIndex`/`sessionTotal` (nullable) — só persistidos quando `sessionTotal ≥ 2` (`normalizeBudgetItemSessions`); 1 sessão ou odonto → ambos `null`. Migration `20260813120000_budget_item_session_index` (+ `CHECK` `chk_budget_item_sessions` / `chk_patient_treatment_sessions`). Approve continua 1:1 (`MaterializeBudgetTreatmentsService` copia os dois campos para `PatientTreatment`)
- `supersedesBudgetId` para vínculo entre orçamento substituto e original
- Migration reprovação: `20260721131741_add_budget_rejection` (**operador aplica**); reconciliação `20260721101500_add_campaign_submission_duplicate` versiona a coluna `is_duplicate` aplicada manualmente (SQL com `IF NOT EXISTS`); vínculo CRM: `20260807140000_add_sales_opportunity_budget_id` (**operador aplica**)

**Regras de negócio (`patient-treatments` — CLIN-041 Fase 1):**
- Criação avulsa (`source=standalone`) via POST; tratamentos de orçamento criados automaticamente no approve (`source=budget`, vínculo `budgetId` + `budgetItemId`)
- `locationLabel` só é exigido (`MinLength(1)`, via `@ValidateIf` no DTO) quando `locationType` é `tooth` ou `body_region`. Em `session` e `none` a string vazia é o valor correto — é o que a materialização de orçamento e a inicialização nutricional já gravam; exigir label nesses casos quebrava o "Adicionar Procedimento" da vertente nutrição com 400
- Campos opcionais `sessionIndex`/`sessionTotal` (mesmo contrato do `BudgetItem`; label `i/N` só no FE quando total ≥ 2)
- Status `active` | `completed` (ERP: `finalized` ↔ `completed`)
- PUT/DELETE bloqueados quando `completed` → 409
- Reorder via `PATCH .../treatments/reorder` com `orderedIds`
- `PATCH .../treatments/:id/finalize`: profissional + data + notas → evolução vinculada (`source=treatment`) + `status=completed` (transação atômica)
- `PATCH .../treatments/finalize`: body com `treatmentIds[]` (min 1) + mesmos campos; finaliza todos na mesma transação e cria **uma** evolução (`treatmentId` = primeiro do lote; `description`/`valueCents` agregados); accrual `treatment_completed` por procedimento
- `POST .../treatments/:id/nutrition-init` (vertente nutrição / `showNutritionInitializeFlow`): profissional + data + seções JSON (`anamnesis`/`body`/`treatmentPlan`) → evolução `source=nutrition_init` + linha em `patient_nutrition_initiations` (unique por `evolutionId`); `evolutionNotes`/`description` = **nome do procedimento** (não concatena Observações das seções); tratamento permanece `active` (não dispara comissão `treatment_completed`). Copy de produto: **procedimento**; IDs/rotas Prisma `patient_treatments` inalterados. Migration `20260814120000_nutrition_init_and_crn`
- **Anamnese opcional por modelo (2026-08-17):** `anamnesis` tipado como `{ templateId?, consultationReason?, answers? }` (sem `fillingMode` do cliente). Sem `templateId` → só Corporal/Plano e `patientAnamnesisId=null`. Com modelo ativo → valida via `BuildTemplateQuestionsSnapshotService` + `ValidatePatientAnamnesisAnswersService`, cria `PatientAnamnesis` (`fillingMode=professional`, `status=issued`, `issuedAt` derivado de `initiatedAt`) **na mesma `$transaction`** que evolução/histórico/iniciação. JSON da seção guarda snapshot completo (`templateId`, `templateName`, motivo, perguntas+opções, respostas) para PDF/read-only mesmo se a anamnese da ficha for removida. FK opcional `patient_anamnesis_id` (`onDelete: SetNull`, unique 1:1). Migrations `20260817180000_nutrition_anamnesis_template_enum` + `20260817180001_nutrition_anamnesis_template_ddl`
- Tipos de pergunta amplificados: `rich_text` e `single_choice` (+ coluna `options` JSON em `anamnesis_questions`); seed nutrição inclui modelo **Anamnese de acompanhamento nutricional resumida** (idempotente em store-setup e `prisma/seed` para lojas `clinicStrand=nutricao` já provisionadas)
- `GET .../nutrition-inits/:evolutionId`: reabre o pacote para o sheet de Inicializar no FE
- `GET .../nutrition-inits`: lista os metadados do paciente numa query só (evita N+1 no card da evolução). `filledSections` sai de `filledNutritionSections` (application/lib), que marca a seção como preenchida quando há qualquer valor não vazio no JSON
- **Notas do atendimento** (`patient_nutrition_notes`, migration `20260814180000_nutrition_notes`): 1 nota = HTML do editor + no máximo 1 anexo, presa à inicialização pelo `evolutionId` (FK no campo unique). `SavePatientNutritionNoteUseCase` atende criar e editar: sem arquivo novo no PATCH, o anexo anterior é mantido. Anexo valida mime/tamanho com `PatientFileMimeValidator` (20 MB) e vai para o MinIO em `{storeId}/patients/{patientId}/nutrition-notes/{noteId}.{ext}`. **Sem rota de exclusão por design** — nota é registro clínico, só pode ser editada

**Regras de negócio (`treatment-evolutions` — CLIN-041 Fase 1 / base CLIN-011):**
- Model `TreatmentEvolution` compartilhado com CLIN-011 (SOAP/CID-10/confirmação serão campos nullable preenchidos depois); `source` ∈ `treatment` \| `standalone` \| `nutrition_init`
- `EvolutionHistory` append-only em create/edit (`created`|`edited`|`confirmed`)
- Evolução com `confirmedAt != null` → imutável (409) — mecanismo pronto; confirmação formal = CLIN-011
- `signatureStatus` / `signatureRequestId`: lote ZapSign marca `pending`/`signed` juntos; no signed final preenche `confirmedAt`/`confirmedBy` (parcial CLIN-011)
- Upload de imagens (`TreatmentEvolutionImage`) — schema pronto; endpoints Fase 2 + CLIN-051

**Regras de negócio (`patient-anamneses`):**
- Emissão a partir de template de anamnese **ativo** da loja; `templateName` denormalizado no momento da criação
- `questionsSnapshot` (JSON) imutável na emissão — snapshot das perguntas ativas do template + biblioteca global (inclui `options` quando `single_choice`)
- Tipos: `yes_no_unknown` | `yes_no_unknown_text` | `text` | `left_right_unknown` | **`rich_text`** | **`single_choice`** (`choiceValue` + `allowsOther` → `auxiliaryText` obrigatório)
- Modo `professional`: `status=issued`, respostas validadas por tipo de pergunta, `consultationReason` obrigatório (injetado em `questionId=consultation-reason`; HTML via `isHtmlFilled` quando rico), sem `publicToken`; em `yes_no_unknown_text`, texto auxiliar obrigatório **somente** quando a resposta é `yes` (Não/Não sei dispensam descrição)
- Também criada pelo fluxo `nutrition-init` quando o profissional escolhe um modelo (mesma entidade; aparece na aba Anamnese da ficha)
- Modo `patient`: `status=awaiting_response`, `answers=null`, gera `publicToken` (UUID v4) + `linkExpiresAt` (+30 dias)
- Listagem: busca parcial por **nome do modelo** (`templateName`, case-insensitive); ordenação `issuedAt` | `templateName` (padrão: `issuedAt desc`); summary sem `questionsSnapshot`/`answers`
- `signatureStatus`: `unsigned` | `pending` | `signed` — escrito pelo módulo `signatures` (ZapSign)
- Rotas públicas (`GET/PATCH /api/v1/public/anamnesis/:token`): token inexistente → 404; link expirado → 410; já emitida/respondida → 409; sucesso no PATCH → `status=issued` + persiste `answers` + extrai `consultationReason` de `consultation-reason`; **GET** inclui `clinicDisplayName` (`communicationsName` → `clinicName` → `ClinicStore.tradeName` → `Clinic.name` → `"Clínica"`) — o form público **não** hardcoda nome de loja
- PII: erros/logs só com `anamnesisId`/`patientId`/`storeId` — nunca CPF/nome em `AppError.context`
- PDF da ficha: motivo da consulta passa por `htmlToPlainText` (TipTap) — não persistir/renderizar tags HTML na 1ª linha

**Regras de negócio (`signatures` — ZapSign):**
- Token de plataforma (`ZAPSIGN_API_TOKEN`); auth do signatário `assinaturaTela`; contrato: `send_automatic_email: true` se e-mail presente (anamnese/evolução permanecem `false` — FE copia link/WhatsApp)
- 1 documento ZapSign = 1 crédito (**debitado** em `ConsumeSignatureCreditService` nos 3 request); cancelar **não** reembolsa; só criar após confirmação explícita na UI
- PDF gerado no FE (`fileBase64`); API valida `%PDF`, debita crédito, grava original no MinIO, cria doc na ZapSign (refund se falhar após debit)- Limite de corpo JSON/urlencoded no `main.ts`: **25mb** (default Express ~100kb → `request entity too large`)
- Anamnese: 1 signatário; contrato: 2 (ordem paciente → contratada); evolução: N evoluções → 1 PDF → 1 crédito
- `by-target` com `kind=evolution_batch`: busca o id em `targetIds` (não só coluna `targetId`)
- `by-target?sync=true`: sincroniza com ZapSign (pode demorar); sem `sync` (default) devolve estado do banco imediatamente — accordion/preview do FE não bloqueia na API externa
- Assinatura já `signed`: reconcile local em background (não chama ZapSign)
- Menor de 18: usa `guardianName`/`guardianPhone` quando preenchidos
- Webhook: exige `ZAPSIGN_WEBHOOK_SECRET` em produção; download de `signed_file` só de hosts `*.zapsign.com.br` (anti-SSRF); baixar → MinIO → status `signed`; logs sem PII (só ids/tokens)
- `targetId` polimórfico (anamnese/contrato) **sem FK** — ao excluir anamnese/contrato, assinaturas órfãs podem permanecer (follow-up: `signatureRequestId` no contrato ou nullify no delete)
- **Fora de escopo:** termos de consentimento; espelho ERP
- Model `ElectronicSignature` (`kind`: `anamnesis` | `contract` | `evolution_batch`); migration manual `20260731120000_add_electronic_signatures`
- Relatório Loja (`GET /v1/electronic-signatures`): `requestedAt` no período civil; listagem default `pending`+`signed`; KPIs em `meta.stats` (`enviados`/`pendentes`/`assinados`) no mesmo período+kind (ignoram filtro de status)
- Lista ficha (`GET /v1/patients/:patientId/signatures`): default `status=pending`; ordenação `requestedAt desc`; isolamento store+patient; presenter = mesmo mapper de detalhe

**Regras de negócio (`signature-packages`):**
- Catálogo fixo em código (`signature-package-catalog.ts`); `packageId` inválido → `InvalidSignaturePackageError` (422)
- Saldo por loja (`SignatureCreditBalance.storeId` = PK); 1ª leitura cria com `balance=0`
- Solicitação nasce `pending`; liberação (admin plataforma) é **idempotente** — 2ª chamada não credita de novo
- Liberação + crédito no mesmo `$transaction` Prisma (`liberateAndCredit`)
- Débito atômico via `debitOrFail` (`UPDATE … WHERE balance >= n`); `SignaturesModule` importa `SignaturePackagesModule`
- Listagem `GET /v1/signature-package-requests`: `page`/`perPage` (default 10) + `status?`; envelope `{ data, meta: { total, page, perPage, totalPages } }`
- Migration manual: `20260807120000_add_signature_packages`

**Regras de negócio (`scheduling` — CLIN-020):**

**Máquina de estados (`AppointmentStatus`):** transições válidas apenas:
- `scheduled` → `confirmed` | `patient_waiting` | `in_progress` | `missed` | `cancelled_patient` | `cancelled_pro`
- `confirmed` → `patient_waiting` | `in_progress` | `missed` | `cancelled_patient` | `cancelled_pro`
- `patient_waiting` → `in_progress` | `cancelled_patient` | `cancelled_pro`
- `in_progress` → `finished`
- Entre cancelamentos: `cancelled_patient` ↔ `cancelled_pro` (correção do motivo)
- Reabrir cancelada/falta: `cancelled_*` | `missed` → `scheduled` | `confirmed` | `patient_waiting` (valida slot livre ao reabrir)
- `finished` permanece terminal (PUT bloqueado com 409 `AppointmentFrozenError`); demais reversões inválidas rejeitadas (422)

**Anti-dupla-marcação:** pré-validação no use case (`AssertAppointmentSlotAvailableService` → `AppointmentSlotTakenError` → 409). ADR CLIN-020 descreve constraint Postgres `EXCLUDE USING gist` (ainda **não** aplicada nas migrations versionadas — teste de integração cobre overlap **sequencial** em `tests/integration/appointment-overlap.integration.spec.ts`).

**`appointment-categories`:** nome único por loja; delete 409 se `_count.appointments > 0`. **Sem espelhamento** de categorias de paciente — CRUD independente de `patient-categories`.

**`return-alerts`:** listagem com `fromDate`/`toDate` em `dueDate` (gte **e** lte aplicados juntos no repositório Prisma).

**`appointments`:** `procedureId` FK opcional → `ClinicPlanTreatment`; `roomId` nullable sem FK (CLIN-003); create com `fitInId` atualiza encaixe para `scheduled` (transação); create com `returnAlertId` remove o alerta de retorno do mesmo paciente após persistir a consulta; ao `PATCH status=finished` com `returnOption != none`, `ReturnAlertSyncService` cria/atualiza alerta `source=auto`; ao reabrir cancelada/falta para status bloqueante, `UpdateAppointmentStatusUseCase` chama `AssertAppointmentSlotAvailableService`.

**`internal-events`:** recorrência armazenada (`daily`|`weekly`|`biweekly`|`monthly`|`yearly`); ocorrências calculadas sob demanda via `RecurrenceExpander` — **não materializadas**; edição afeta série inteira. **Todo compromisso** (independente de `availability`) bloqueia consultas no intervalo sobreposto; `allDay` normaliza para 00:00–23:59:59.999 UTC; compromisso com horário sem duração válida assume 1h (create/update + `available-slots` + assert em create/update appointment). **Assimetria deliberada:** create/update de consulta **bloqueia** se há compromisso; create/update de compromisso **desloca** consultas `scheduled`/`confirmed`/`patient_waiting` sobrepostas → FitIn `pending` + status `cancelled_pro` (`DisplaceAppointmentsForCommitmentService`); consulta `in_progress` no intervalo → **409** (`CommitmentOverlapsInProgressAppointmentError`). Resposta de POST/PUT inclui `displacedAppointments[]`.

**`available-slots`:** `intersect(clinic.opening/closing, professional.weekSchedule[weekday]) − almoço − appointments bloqueantes − **todos** os internal_events (compromissos)`; no dia civil atual (`America/Sao_Paulo`), slots com início ≤ agora ficam `available=false`; datas anteriores ficam todas indisponíveis; slots a cada `slotStepMin` (se fornecido) ou, por padrão, `durationMin` (mínimo 15). Sem folgas pontuais nesta entrega.

**Fuso da agenda:** horários wall-clock da clínica (Ilhéus) persistidos como UTC (`parseClinicDateTime` no backend; ERP usa `lib/clinic-datetime.ts` para exibir e posicionar eventos sem shift de fuso local). Payloads com `.000Z`.

**Regras de negócio (`patient-financial-entries` — ficha do paciente / ledger unificado):**
- Persistência: tabela `financial_entries` (`type=income`, `patientId` obrigatório). Contrato HTTP da ficha **inalterado** (`name`, `date`, `receivedAt`, `pending`|`received`); campos opcionais `budgetId` / `budgetItemId` na resposta.
- Fontes: `budget_approve` (gerado na aprovação de orçamento) | `avulso_debit` (CRUD manual)
- Status na API da ficha: `pending` | `received` (mapeados de `FinancialEntryStatus`; listagem ignora `cancelled`)
- Listagem: busca parcial em **description** (exposta como `name`); filtros `status`, `periodFrom`/`periodTo` em `dueDate`, **`budgetItemId`** (débito de um item do orçamento); ordenação `date` | `name` | `valueCents` | `status` (padrão: `date desc`); resposta `{ data, meta: { total, page, perPage, totalPages, totals: { receivedCents, pendingCents } } }` — `meta.totals` no período **ignorando** filtro `status`; summary inclui `paymentMethod` quando `received` (badge na ficha)
- Create: débitos avulsos (`source=avulso_debit`); `name` derivado do primeiro tratamento + nome do paciente; `valueCents` = soma dos tratamentos; snapshot em `debitDetail`
- Update (PUT parcial): qualquer pendente (`avulso_debit` \| `budget_approve`); **não** altera vencimento/plano/tratamento/dente; aceita `observations` + `treatments[{id,valueCents,professionalId}]` (quando há linhas) ou `valueCents` (parcela sem item); anexos via rotas dedicadas
- PUT/anexo bloqueado quando `received` → 409 (`PatientFinancialEntryFrozenError`)
- Receive bloqueado quando já `received` → 409; persiste `receiveDetail` + `paidAt` (exposto como `receivedAt`); `cashRegisterId` → `accountId` quando a conta existir
- Geração na approve: **sem parcelamento** → 1 entry/`BudgetItem` (nome = `treatmentName` puro; valor = item ou rateio para `finalValueCents`; `budgetItemId`; `installmentIndex` 1..N; **`debitDetail` snapshot** do item). **Com parcelamento** → linhas `Entrada —` / `k/N —` (sem `budgetItemId`, sem card de procedimento). Vencimento base = `dueDate` do PATCH ou `Budget.date`. Body opcional `installments[{dueDate,valueCents}]` define vencimento/valor de cada parcela (soma = saldo); senão rateio automático + mês a mês. Idempotente por `@@unique([storeId, budgetId, installmentIndex])`. Migration `20260820160000_financial_entry_budget_item_id`. List/get hidratam `debitDetail` ausente a partir do `BudgetItem` quando `budgetItemId` está set.
- Integração ERP da aba Financeiro da ficha = **concluída**; caixa global ERP (`/clinic/financeiro`) = **API** (`v1/financial/*`, CLIN-061 — Transações via list + by-payment-method)

**Regras de negócio (`patient-contract-emissions`):**
- Emissão a partir de modelo de contrato existente na loja (`templateId` → FK `ContractModel`); `templateName` e `patientName` denormalizados na criação
- `budgetId` opcional: vincula a um orçamento **approved** do mesmo paciente; **um contrato por orçamento** (`@@unique([storeId, budgetId])` → 409 Duplicate); migration manual `20260731150000_contract_emission_budget_id`
- Listagem de orçamentos inclui `contractEmissionId` (join) para o CTA Emitir/Ver na UI
- `content` (HTML interpolado) + `formValues` (snapshot sem `content`) persistidos; listagem **sem** `content`/`formValues` (detalhe no GET por id)
- `issuedAt` definido na criação e **não alterado** no PUT
- Assinaturas (`responsibleSignatureStatus`, `patientSignatureStatus`): `unsigned` | `pending` | `signed` — escritas pelo módulo `signatures` (ZapSign; “Com assinatura” só quando ambos `signed`)
- Listagem: busca parcial por **nome do modelo** (`templateName`); ordenação `issuedAt` \| `templateName` (padrão: `issuedAt desc`)

**Regras de negócio (`patient-prescriptions`):**
- `professionalId`/`professionalName` do body (membro da equipe local); `patientName` denormalizado do `Patient`
- **Conselho (CRM/CRO/CREFITO/CRN):** na 1ª emissão, body pode trazer `councilType`/`councilNumber`/`councilUf`; se o `Member` já tem os 3 campos, o snapshot vem do Member (body ignorado). Se o Member ainda não tem, body é obrigatório e grava no Member (`ResolveProfessionalCouncilService`). Tipos permitidos vêm de `Organization.clinicStrand` (`councilTypes` no catálogo `@citybox/messaging/clinic-strand`): odonto `CRM|CRO` + UF; fisio **só `CREFITO`** + regional `01`–`20` em `councilUf` (Ilhéus = `07`); nutrição **só `CRN`** + UF. Labels PDF: `CREFITO-7 12345`, `CRN-BA 12345`. Catálogo compartilhado: `@citybox/messaging/professional-council`. Snapshot denormalizado no documento.
- `items` (JSON): `{ id, name, quantity, measure, posology, notes }` — `measure` ∈ `Unidade`|`Caixa`|`Frasco`|`Ampola`|`Comprimido`; validação Zod (array não vazio)
- `issuedAt` na criação; **preservado** no PUT; `issuedDate` editável
- Listagem: busca em `professionalName`; ordenação `issuedDate` \| `professionalName` (padrão: `issuedDate desc`); summary sem `items` (inclui `itemCount`)

**Regras de negócio (`patient-certificates`):**
- Tipos: `days` (exige `daysCount`) \| `attendance` (exige `startTime` + `endTime`); `cid` opcional
- Mesma regra de **conselho** da 1ª emissão que receituários (snapshot + persistência no Member se vazio)
- Sem PUT — atestados são imutáveis após emissão (alinhado à UI)
- Listagem: busca em `professionalName`; ordenação `issuedDate` \| `type`

**Regras de negócio (`patient-files` — drive clínico):**
- Pastas: árvore via `parentId` (raiz = `null`); nome trim, não vazio, sem `/`
- Listagem por pasta: busca parcial por **nome** (`contains`, case-insensitive); ordenação alfabética `pt-BR`
- Upload: multipart via API (padrão foto do paciente); MIME imagens + PDF/Word/Excel/texto; máx **20 MB**
- Chave MinIO imutável: `{storeId}/patients/{patientId}/files/{fileId}.{ext}` — rename/move só metadados
- `previewUrl` em imagens: path relativo `GET …/files/:id/content` (ERP mapeia para proxy depois)
- Mover pasta: bloqueado se destino é a própria pasta ou descendente → 409 (`InvalidPatientFolderMoveError`); destinos excluem subárvore via `excludeFolderSubtreeId`
- Excluir pasta: recursivo — remove arquivos no MinIO + cascade no banco
- Anti-IDOR: `storeId` + `patientId` em toda operação; PII só `patientId`/`folderId`/`fileId` em erros
- CASL fino (fora do manage-bridge): upload/criar pasta → `create`; list/breadcrumb/content → `read`; rename/move/destinos → `update`; delete → `delete`. `patient_file_manage` mapeia para `update`; qualquer `patient_file_*` também concede `read`

**Regras de negócio (`sales` — CRM / funis):**
- Etapas: exatamente 1 `won` + 1 `lost` por funil; `order` fixo 998/999; demais etapas `others` com order 0..n antes das terminais
- Funil `isDefault` não pode ser excluído; etapa com oportunidades → 409 ao deletar
- `SalesOpportunity.sortOrder` (0-based) por `(storeId, stageId)`; listagem `orderBy sortOrder asc, createdAt asc`
- `PATCH /v1/opportunities/reorder` atualiza `stageId` + `sortOrder` em lote; create usa `nextSortOrder`; move aceita `sortOrder` opcional
- Persistência de etapas no funil: update de `order` em **duas fases** (temporário negativo → final) para não violar UNIQUE `(funnel_id, order)`
- Filtro `period=custom`: `startDate`/`endDate` como `yyyy-MM-dd` ou ISO; expandido para **dia civil inteiro em America/Sao_Paulo (UTC−3)**; intervalo invertido é normalizado
- Cores de etapa persistidas em UPPERCASE; ERP normaliza para o Select no modal de edição
- Origem `budget` + `budgetId` (unique nullable, FK `Budget` cascade): card criado/sincronizado pelo módulo `patient-budgets`. Com `budgetId` preenchido, **move/update/reorder** para etapa `won`/`lost` → `SalesOpportunityBudgetTerminalMoveError` (422); entre etapas `others` permanece permitido. Fechamento terminal só via approve/reject/expire do orçamento (sync)
- Permissão: `@RequirePermission('manage', 'Patient')` + `X-Store-Id`
- Migrations: `20260713130319_add_sales_clinic` (tabelas sales + `sort_order`); `20260807140000_add_sales_opportunity_budget_id` (enum `budget` + coluna `budget_id` — **operador aplica**)

**Regras de negócio (`marketing` — tipos + campanhas form_lead / aniversario):**
- Catálogo de produto em código (`campaign-type-catalog.ts`): 3 segmentos × 6 tipos; **não** é CRUD por loja
- `(segment, type)` deve existir no catálogo; `strategy` é **sempre** derivada do tipo (`resolveStrategy`) — nunca escolhida no request
- Matriz: `form_lead`→PAGE; `mgm`/`debito_atraso`/`retorno_tratamento`/`aniversario`→BROADCAST; `nps`→AUTOMATION
- Flag `implemented`: `form_lead` + `aniversario` = true; create de outros tipos → `CampaignTypeNotImplementedError` (422)
- Create `form_lead`: channel default `web`; valida `funnelId`/`stageId` no CRM se informados; `statusType=period` → `endDate` dia civil **estritamente futuro** (não aceita hoje — 00:00 BRT do dia fim já finaliza); `limit` → `leadLimit > 0`
- Create `aniversario`: channel `whatsapp`; content `{ planIds, specialtyIds, genders, messageBody }`; filtros vazios = todos; ao criar `active` dispara 1º envio (`DispatchDueBirthdayCampaignsUseCase`); job no `main-whatsapp` a partir das 07:00 BRT libera **1 paciente a cada 5 minutos** (anti-ban)
- `statusType=limit`: ao atingir `leadLimit` submissões, status → `finished` + `endDate` (form público deixa de carregar); envio extra rejeitado
- `statusType=period`: a partir de **00:00 BRT do dia da `endDate`**, `syncDerivedStatus` marca `finished` (get/list/público/submit); form deixa de carregar
- Content canônico `FormLeadContent` (Zod): questions ≥2 com `field-name` + `field-phone` required; HTTP aceita também wizard `stepTwo`/`stepThree`/`stepFour` (normalize na entrada); GET devolve canônico
- URLs externas do content: `redirectUrl` e `lgpdConsent.privacyPolicyUrl` recebem `https://` quando vierem sem protocolo
- Slug: slugify(name) + sufixo único por store; `publicUrl=/campanha/{storeId}/{slug}`
- `CampaignSubmission`: payload/metadata/phoneKey/isDuplicate; detalhe por `submissionId`; oportunidade carrega `origin=campaign` + `submissionId`
- Duplicidade: `block` grava resposta duplicada sem card; `update` grava resposta e atualiza card aberto; `create_new` cria nova resposta + card
- Enums + models `Campaign`/`CampaignSubmission` no `schema.prisma` — migration versionada; operador aplica
- Permissão atual: `@RequirePermission('manage', 'Patient')` + `X-Store-Id`
- **ERP:** backoffice integrado (`campaigns.api.service.ts`); formulário/views/submissões via BFF público; QR Code gerado no client; wizard Aniversariantes (BROADCAST)

**Regras de negócio (`stock` — módulo estoque):**
- Foto do produto via MinIO (object key `{storeId}/stock-products/{productId}.{ext}`) e endpoints `POST/GET/DELETE /api/v1/stock-products/:id/photo`.
- Status do produto calculado por quantidade atual e `minQuantity`:
  - `quantity <= 0` → `out_of_stock`
  - `quantity <= minQuantity` → `low_stock`
  - senão → `in_stock`
- Retirada valida `quantity <= available` e decrementar atomizada (erro `StockInsufficientQuantityError`).
- Retirada: `requestedById` + `requestedByName` (nome do profissional selecionado no ERP); sem id → `requestedBy` null. Fallback de exibição no histórico só se o nome não foi persistido.
- Entradas em lote são transacionais (Prisma `$transaction` / repo atômico): falha em qualquer item → rollback completo.
- Fornecedor: nome único por loja (`StockSupplierNameTakenError`); **criar** usa `repository.create()` (não `save()`).
- Listagem produtos (`GET /api/v1/stock-products`): busca parcial em nome, categoria, SKU e nome do fornecedor; ordenação `name` | `category` | `sku` | `supplier` | `quantity` | `status` | `activeValue` (padrão: `createdAt desc`).
- Movimentações (`GET /api/v1/stock-movements`): paginação + filtros (`type`, `productId`, `startDate`, `endDate`) no repositório; datas `yyyy-MM-dd` interpretadas como dia civil inteiro (`T00:00:00.000Z` … `T23:59:59.999Z`); ordenação `product` | `quantity` | `withdrawnBy` | `authorizedBy` | `date` (padrão: `createdAt desc`).
- Permissão nas rotas de estoque: `@RequirePermission('manage', 'Stock')` + `X-Store-Id`.

**Regras de negócio (`financial` — módulo financeiro global CLIN-060):**
- Contas (`FinancialAccount`): `type` default `checking`; listagem omite inativas salvo `includeInactive=true`
- Categorias (`FinancialCategory`): `kind` `income`|`expense`; cor default `""`
- Lançamentos (`FinancialEntry`): `source` `manual`|`budget_approve`|`avulso_debit`; status `pending`|`paid`|`received`|`cancelled`
- Create manual: `source=manual`; `isPaid` + expense → `paid`; `isPaid` + income → `received`; recorrência gera N entries com `recurrenceGroupId` e dueDate deslocada (`daily`|`weekly`|`monthly`|`quarterly`|`yearly`)
- Stats: ignora `cancelled`; `balance.current = received − paid`; `projected = income.total − expense.total` (centavos)
- Receive só `income`+`pending`; Pay só `expense`+`pending`; PUT só `manual`+`pending` (`FinancialEntryNotEditableError`); DELETE permitido em qualquer status (incl. `paid`/`received`)
- Listagem: `dateField=dueDate|paidAt` (default `dueDate`) aplica `startDate`/`endDate`; `paidAtFrom`/`paidAtTo` filtram `paidAt` adicionalmente (ex.: agendadas)
- `GET …/entries/by-payment-method`: sempre `status in (paid,received)` e `paymentMethod IS NOT NULL`; mesmos filtros de período/tipo/conta/meio
- Cancel (pagamento/recebimento): desfaz liquidação → `pending` (`withUnsettled`; limpa paidAt/meio/conta/`receiveDetail`); “vencido” = `pending` + dueDate &lt; hoje; 409 se já `cancelled`/`pending` ou ligado a comissão; `withCancelled` permanece na entidade para exclusão/relatório `excluded-revenues`
- Presenter: `isOverdue` (pending && dueDate < hoje ISO); joins de account/category/patient; inclui `cancelledById`/`cancelledByName`
- Ledger unificado: ficha (`patient-financial-entries`) e caixa (`v1/financial/entries`) leem/escrevem a mesma tabela `financial_entries`
- Permissão: `@RequirePermission('manage', 'Financial')` + `X-Store-Id`
- Schema Prisma declarado (`FinancialAccount`, `FinancialCategory`, `FinancialEntry` + enums); **migration pelo operador** (substituir `patient_financial_entries`)
- Lançamento ligado a comissão (`sourceFinancialEntryId` em accrual **ou** `expenseEntryId` de pagamento): DELETE / PUT / cancel → `FinancialEntryLinkedToCommissionError` (409): *"Este recebimento não pode ser alterado pois ele está relacionado a um pagamento de comissão"*

**Regras de negócio (`commissions` — CLIN-062):**
- Regras por membro (`CommissionRule`): `PUT` replace atômico; no máximo uma regra `budget_approved` por membro (409 `CommissionBudgetApprovedDuplicateError`); identidade `paymentTrigger|commissionType|planId|specialtyId` — payload com duplicatas é **colapsado** (última vence); `fixed_value` com `amountCents > treatmentValueCents` exige `allowValueExceedsTreatment` (422 `CommissionFixedValueExceedsTreatmentError`); `budget_approved` limpa `planId`/`specialtyId`/treatments; `commissionValueCents` obrigatório só em `budget_approved` + `fixed_value` (demais usam `treatments[].amountCents`)
- Labels denorm de trigger: `treatment_completed` → "Procedimento finalizado"; `debit_received` → "Débito recebido do paciente"; `budget_approved` → "Aprovação de orçamento"
- Accruals: motor automático em **três** gatilhos — `debit_received` no receive (`AccrueCommissionsOnDebitReceivedService`, ficha + caixa); `budget_approved` no approve do orçamento (`AccrueCommissionsOnBudgetApprovedService`, responsável + `finalValueCents`, idempotente `sourceBudgetId`); `treatment_completed` **somente** em Paciente → Prontuário → Finalizar (cria evolução `source=treatment` via `FinalizePatientTreatmentUseCase` / `AccrueCommissionsOnTreatmentCompletedService`; evolução avulsa NÃO gera; profissional do tratamento + `valueCents`; idempotente `sourcePatientTreatmentId`); também via `POST /v1/commissions/accruals` manual; `sourceFinancialEntryId` liga bloqueio do caixa; meio de pagamento **não** filtra a geração; novos accruals gravam `treatmentName` com dente/local (`formatCommissionTreatmentName`); leituras enriquecem nomes legados via `EnrichCommissionTreatmentNamesService`
- Em aberto: agrega accruals `open` por `memberId` + membros com regras configuradas (`hasCommissionConfigured`); paginação de **membros**; `ruleGroups` por trigger/plano/especialidade; `treatmentSummary` do grupo usa **nome-base** (sem dente); linhas usam nome completo
- Histórico: listagem **1 linha por profissional** (`aggregateHistoryByMember` — soma `netCents`/`grossCents`/`discountCents`); detalhe `GET /history/:memberId?startDate&endDate` agrega pagamentos do período; `discountCents` no summary (UI detalhe; não na tabela)
- Pagamento: valida conta financeira; marca accruals `paid`; cria `CommissionPayment` + items; cria despesa no ledger (`FinancialEntry` expense, `source=manual`, `status=paid`); desconto opcional no pagamento → `discountCents`
- Permissões: regras `@RequirePermission('manage', 'Settings')`; open/accruals/payments/history `@RequirePermission('manage', 'Financial')` + `X-Store-Id`
- Schema: `CommissionRule`, `CommissionRuleTreatment`, `CommissionAccrual`, `CommissionPayment`, `CommissionPaymentItem` + enums; **migration única** `20260715165240_add_commissions` (inclui `sourceBudgetId` / `sourcePatientTreatmentId` — sem migration `*_source_refs` separada) (**operador aplica**)

**Infra transversal pronta (`shared/`):**
- **Prisma** — `PrismaModule` (global) + `PrismaService` com `@prisma/adapter-pg`.
- **Keycloak** — `keycloak-jwt` (verificação JWKS); guards globais `AuthGuard` + `PermissionGuard`.
- **Storage** — `ObjectStorage` (MinIO / in-memory), bucket `citybox-clinica` (logo clínica + fotos pacientes).
- **Erros** — hierarquia `AppError` + `AppExceptionFilter` (status pelo sufixo do nome).
- **Decorators** — `@Public`, `@RequirePermission`, `@CurrentUser`, `@StoreId`.
- **CPF** — `shared/core/utils/brazilian-document.utils.ts` (`isValidCpf`, `normalizeCpf`, `onlyDigits`).

**Prisma (schema `clinica`):** models de pacientes + orçamentos/tratamentos/evoluções (CLIN-041) + anamnese preenchida (`PatientAnamnesis`) + documentos emitidos + **financeiro unificado** (`FinancialAccount`, `FinancialCategory`, `FinancialEntry`) + drive de arquivos (`PatientFolder`, `PatientFile`) + agenda CLIN-020.
Migration pacientes: `20260703120000_add_patients`. **Migration orçamentos / anamneses / documentos / arquivos / agenda:** operador aplica conforme migrations existentes. **Migration financeiro unificado:** operador cria a partir do schema (substitui `patient_financial_entries` → `financial_entries` + contas/categorias) — models já em `schema.prisma`.

Models CLIN-041: `Budget`, `BudgetItem`, `PatientTreatment`, `TreatmentEvolution`, `EvolutionHistory`, `TreatmentEvolutionImage` + enums `BudgetStatus`, `BudgetDiscountType`, `BudgetItemLocationType`, `PatientTreatmentSource`, `PatientTreatmentStatus`, `TreatmentEvolutionSource`, `EvolutionHistoryAction`.

Model anamnese preenchida: `PatientAnamnesis` + enums `PatientAnamnesisStatus` (`issued`|`awaiting_response`), `PatientAnamnesisSignatureStatus` (`unsigned`|`pending`|`signed`), `PatientAnamnesisFillingMode` (`professional`|`patient`).

Models documentos do paciente: `PatientContractEmission`, `PatientPrescription`, `PatientCertificate` + enums `PatientContractIssuedVia`, `ContractSignatureStatus`, `PatientCertificateType`.

Models financeiro unificado: `FinancialAccount`, `FinancialCategory`, `FinancialEntry` + enums `FinancialEntryType`, `FinancialEntryStatus`, `FinancialEntrySource`, `FinancialCategoryKind`. (Model legado `PatientFinancialEntry` removido do schema.)

Model drive de arquivos: `PatientFolder` + `PatientFile` + enum `PatientFileKind` (`image`|`file`).

Enums + model marketing: `CampaignSegment`, `CampaignType`, `CampaignStrategy`, `CampaignStatus`, `CampaignChannel`, `CampaignStatusType` + model `Campaign` (`campaigns`) — no `schema.prisma`; **migration manual pelo operador** (não gerar na entrega). Content JSON canônico `FormLeadContent` para `form_lead`.

---

## 10. Decisões de Arquitetura

| Decisão                                                       | Motivo                                                       |
| ------------------------------------------------------------ | ----------------------------------------------------------- |
| Clonar a estrutura da vertical piloto `food`                  | Padrão único entre verticais; arranca com infra testada     |
| Clean Architecture por módulo (igual food/platform)           | Padrão único entre serviços; testável com repos in-memory   |
| **Store-scoping por header `X-Store-Id`** (não path)          | Multi-loja no mesmo schema; ERP injeta a loja no proxy      |
| Schema Prisma `clinica` no banco `citybox_platform`           | Vertical lazily provisionada no tenant único (ADR C-15)     |
| Object storage atrás de `ObjectStorage` (MinIO/in-memory)     | Troca de provider sem tocar use cases; testes sem MinIO     |
| UI no ERP (sem `web/` própria)                                | Backoffice do lojista é multi-vertical e centralizado no ERP |
| Não duplicar catálogo/pedidos do marketplace-api              | ADR C-03 — capabilities da clínica são específicas do segmento |
| Convênio embutido no `Patient` (MVP)                          | Alinha ao mock ERP; `PatientInsurance` 1:N documentado como evolução futura |
| Responsável legal via campos `guardian*` (sem entidade)         | Simplificação MVP; entidade formal de responsável legal fica para evolução |
| Sem log de auditoria de acesso a prontuário nesta entrega     | **Risco assumido (LGPD)** — registrar acesso a dados sensíveis é follow-up |
| **Worker RabbitMQ `clinic.store-setup`** (first-contact) | Espelha food: cria `ClinicStore`/`ClinicStoreSetup` + seed idempotente ao `citybox.store.#` se vertical Clínica; equipe Keycloak no platform (`SeedClinicDemoTeam`) antes do publish |
| Sem outbox/eventos de domínio (`patient.created`) nesta entrega | Integração assíncrona de domínio clínico ainda futura; store-setup é consumer, não publisher |
| PII nunca em logs/erros — apenas `patientId`/`storeId`        | LGPD: contexto de `AppError` sem CPF, nome, telefone ou RG |
| **`TreatmentEvolution` compartilhado CLIN-041 → CLIN-011**    | CLIN-041 cria model base; CLIN-011 estende SOAP/CID-10/confirmação — nunca tabelas paralelas |
| **Ledger unificado `FinancialEntry`** (ficha + caixa) | CLIN-060 — uma tabela; rotas da ficha adaptadas; `v1/financial/*` para fluxo de caixa; ERP caixa = CLIN-061 |
| Upload de imagens em evoluções fora da Fase 1                 | CLIN-051 — schema `TreatmentEvolutionImage` pronto; endpoints de upload pendentes |
| **Anti-overlap agenda (CLIN-020)** | Pré-check no use case + ADR `EXCLUDE` (constraint DB pendente); teste integração sequencial |
| **Recorrência InternalEvent não materializada (CLIN-020)**     | Regra persistida; expansão no intervalo do calendário; edição de ocorrência única fora de escopo |
| **`procedureId` → `ClinicPlanTreatment`; `roomId` adiado**    | CLIN-003 pendente; `roomId` string nullable sem FK |
| **Marketing: Tipo antes de Configuração** | Taxonomia (segment/type/strategy) estável em catálogo + enums; configs por tipo pluggam sem redesenhar o tipo |
| **Catálogo de tipos em código (não tabela)** | Oferta fixa da plataforma; `strategy` derivada do tipo |
| **Content canônico `FormLeadContent`** | Wizard ERP (`stepTwo`…) normalizado na entrada; persistência/GET sempre canônicos |
| **Sem FK Prisma a SalesFunnel** | `funnelId`/`stageId` string; validação no use case via `SalesFunnelRepository` |
| **Lembrete WhatsApp ~2h (poll no worker)** | `AppointmentReminderScheduler` no `main-whatsapp` (60s); `confirmed` T-2h + `scheduled` sem reply T-5min (texto “confirmada”, status inalterado); janelas comparam `toClinicWallClockUtc(now)` com `startAt` wall-clock-as-UTC; idempotência por `correlationId`; template fixo |
| **Inbound WhatsApp após o horário** | `toClinicWallClockUtc(now) >= startAt` → não confirma/cancela automaticamente (`action=late`); status só manual na agenda. Comparar UTC real com `startAt` wall-clock fazia `late` ~3h cedo (ex.: 10:24 BRT vs consulta 11:30) |
| **Papel de organização (`OWNER`) separado do papel clínico** | Ser responsável é ortogonal a ser dentista: `Member.organizationRole` é por organização, `ClinicMember.role` é por clínica. Vocabulário espelha `MembershipRole` do `erp-comercio` |
| **OWNER único garantido por índice único PARCIAL (SQL à mão)** | Prisma não modela unique parcial; entrega at-least-once faria duas checagens em memória passarem juntas. `WHERE ... = 'OWNER' AND deleted_at IS NULL` para o soft delete não bloquear um novo responsável |
| **Responsável real substitui o membro de demonstração no seed** | O evento já carregava `owner.responsibleName`/`billingEmail`; o placeholder `gerente.{storeId}` deixava o cliente sem acesso real |
| **`responsibleName` ausente ⇒ warn, não falha** | Campo opcional no contrato; derrubar o provisionamento inteiro da loja seria pior do que ficar sem responsável |
| **OWNER não pode ser removido nem desativado** | Sem isso um gerente remove o dono e a organização fica sem ninguém com acesso total |
| **Senha do responsável sob demanda pelo admin (sem convite por e-mail)** | Keycloak de dev não tem SMTP (`smtpServer` ausente no realm importado); admin exibe usuário+senha uma única vez |

---

## 11. Contexto para a IA

### Estado de maturidade (leia primeiro)
A infra transversal está pronta. Módulos de **Configurações**, **Pacientes**, **Agenda**,
**Estoque**, **Financeiro global**, **Vendas/CRM**, **Marketing**, **Dashboard/Reports** e
**store-setup** (worker RabbitMQ first-contact) estão na API. Marketing `form_lead` está
ponta a ponta. **Ledger unificado:** approve/débito/receive da ficha e lançamentos do caixa
compartilham `financial_entries`. **First-contact:** criar loja Clínica no admin →
`deploymentStatus=PENDING` → operador **Provisionar** → M2M
`POST …/platform/stores/:id/provision` (seed template v4 por `clinicStrand` + OWNER com senha;
sem seed de Secretário/Gerente/Dentista/Fisioterapeuta). O consumer
`clinic.store-setup` **não** cria org a partir de `store.created`. Pendências: upload de imagens em evoluções (CLIN-051), payments-api/caixa de
recepção, assinatura digital e configurações dos demais tipos de campanha (mgm/operacional/nps).

### O que NÃO fazer
- Não importar de `@prisma/client` — usar `generated/prisma/`.
- Não esquecer o **`@StoreId()`** nas rotas de negócio (tudo é store-scoped).
- Não usar o SDK do MinIO direto — usar a interface `ObjectStorage`.
- Não colocar regra de negócio em `*.route.ts` nem em repositórios.
- Não fazer `domain`/`application` importarem NestJS/Prisma/Express.
- Não injetar a impl Prisma no use case — depender da interface (token).
- Não lançar `HttpException` solta — usar subclasse de `AppError` com sufixo de nome correto.
- Não usar `error.errors` do Zod — é `error.issues` (v4).
- A UI da clínica é `apps/verticals/clinica/web` (`@citybox/clinica-web`, :3113) — não confundir com `apps/erp` (backoffice de Comércio, sem módulo de clínica desde 2026-07-31).
- Não criar models sem `@@schema("clinica")`.
- ⚠️ Não reaproveitar permissões da food — usar IDs/CASL de `@citybox/clinica-permissions` (`vertical_access`, `patient_*`, `schedule_*`, aliases legados, …).
- Não instalar pacotes com npm/yarn — usar pnpm.
- ⚠️ Não omitir `RABBITMQ_URL` no `.env` local — worker “sobe” sem consumir `clinic.store-setup`.
- ⚠️ Não usar `node --watch` para os workers: se o processo quebra ao carregar módulos (ex.: build com erro),
  o watcher fica vivo e **nunca** respawna o filho — a fila fica com 0 consumers sem nenhum erro visível.
  O `dev-with-worker.sh` supervisiona os workers e reinicia por crash e por recompilação do `dist`.
- ⚠️ Nunca validar build/typecheck com `| tail` — o exit code passa a ser do `tail` e erros de compilação
  ficam invisíveis (foi assim que 6 erros TS2307 no módulo `whatsapp` seguiram servindo `dist` velho).
- ⚠️ Imports em `modules/<m>/application/use-cases/<acao>/` são **5 níveis** até `shared/`
  (`../../../../../shared/...`) e **3** até o domínio do módulo (`../../../domain/...`).
- ⚠️ Em appointments, `professionalId` = **`store_members.id`** (não `members.id`); horários = wall-clock UTC literal.
- Não alterar `dev-with-worker` / store-setup de **food** ou **varejo** ao mexer na clínica.

### Ao criar o primeiro módulo de negócio
1. Definir models no `prisma/schema.prisma` (`@@schema("clinica")` + `@@map`) → `db:generate` → `db:migrate:dev`.
2. `modules/<modulo>/domain` (entidade + interface de repositório/token + validators Zod + errors).
3. `application/use-cases/<acao>/<acao>.use-case.ts` (`implements IUseCase`) + `.spec.ts` (repo in-memory).
4. `infrastructure/database/prisma-<x>.repository.ts` + `infrastructure/http/routes/<acao>/{route,dto,presenter}.ts` com `@StoreId()`.
5. `<modulo>.module.ts` (DI por token → impl Prisma) e registrar no `app.module.ts`.
6. Atualizar as seções 4, 9 e 10 deste arquivo.

### Fluxo ao mexer ponta-a-ponta
1. **clinica-api**: domínio + use case (TDD com repo in-memory) → repositório Prisma + rota store-scoped → migration.
2. **Web** (`apps/verticals/clinica/web/src/features/clinic/...`): consumir via React Query no proxy `/api/proxy/clinica` (header `X-Store-Id`).
3. Gate (`lint`/`typecheck`/`test`) na clinica-api; typecheck/lint no ERP.
4. Atualizar este `AGENTS.md`.

---

## 12. Histórico de Mudanças Estruturais

> Não é changelog de features — registra mudanças que afetam o contexto da IA.

| Data       | Mudança                                             | Impacto                          |
| ---------- | --------------------------------------------------- | -------------------------------- |
| 2026-08-19 | **Search FTS global:** módulo `search` + `GET /v1/search`; `search_vector`/GIN/triggers em `patients`, `appointments`, `sales_opportunities`, `stock_products`; migration `20260819120000_add_fts_search_vectors`; escopo CASL (agenda por profissional, funis visíveis) | `clinica-web` Cmd+K deixa fan-out por chamada única FTS |
| 2026-08-13 | **Orçamento desconto %:** `calculateDiscountCents` usa escala centesimal (`2000` = 20% → `/10_000`); antes `/100` zerava `finalValueCents` ao salvar/aprovar com % | `budget-pricing.utils` + specs |
| 2026-08-13 | **Sessões no orçamento:** `BudgetItem`/`PatientTreatment.sessionIndex`+`sessionTotal` (nullable; só ≥2); `normalizeBudgetItemSessions`; materialize copia; flag `budgetTreatmentSessions` no catálogo messaging | Orçamento fisio |
| 2026-08-12 | **Provision on demand:** `POST /api/v1/platform/stores/:id/provision` (OWNER+senha); consumer `store.created` ignorado; `store.updated` só atualiza se a clínica já existir | Senha volta no HTTP do admin |
| 2026-08-12 | **Anotações mapa anatômico:** `PatientBodyRegionAnnotation` + `GET/POST/DELETE …/body-region-annotations`; clique na região abre popover (mesmo UX do odontograma) | Migration `20260812180000_…`; módulo `patient-body-region-annotations` |
| 2026-08-12 | **First-contact sem equipe demo:** removido `ensureDemoClinicTeam` (Secretário/Gerente/Dentista/Fisioterapeuta); nova clínica nasce só com o OWNER do cadastro; catálogo `DEMO_CLINIC_TEAM` fica só para detectar membros legado na UI | `clinic-store-seeder` + setup retry |
| 2026-08-14 | **Notas do atendimento nutricional:** migration `20260814180000_nutrition_notes` (`patient_nutrition_notes`); `GET/POST …/nutrition-inits/:evolutionId/notes`, `PATCH …/notes/:noteId` (multipart, anexo opcional no MinIO) e `GET …/nutrition-notes/:noteId/content` | Sem DELETE: nota só é editada |
| 2026-08-14 | **Card evolução nutricional:** `GET …/nutrition-inits` com `filledSections` (sem colunas de janela de horário) | Card mostra data + horário de `initiatedAt` e abre o atendimento em leitura |
| 2026-08-18 | **Body JSON 25mb** + `GET /v1/signature-credits` com `manage` Patient (além de Settings) | Evita 413 no `fileBase64`; FE checa saldo antes de enviar o PDF |
| 2026-08-18 | **Copy procedimento:** mensagens/Swagger da API usam “procedimento”; IDs/rotas `treatments` intactos; `evolutionNotes` no nutrition-init = nome do item | FE Prontuário / Procedimento |
| 2026-08-17 | **Anamnese nutricional por modelo:** `rich_text`/`single_choice` + `options`; FK `patientAnamnesisId` em `patient_nutrition_initiations`; seed idempotente **Anamnese de acompanhamento nutricional resumida**; `POST …/nutrition-init` cria `PatientAnamnesis` na mesma transação quando há template | Migrations `20260817180000_nutrition_anamnesis_template_enum` + `20260817180001_nutrition_anamnesis_template_ddl` |
| 2026-08-14 | **Nutrição Inicializar + CRN (Partes 5–6):** migration `20260814120000_nutrition_init_and_crn` (`nutrition_init`, `patient_nutrition_initiations`, enum `CRN`); `POST …/nutrition-init` + `GET …/nutrition-inits/:evolutionId`; FE sheet 3 abas + botão Inicializar via `showNutritionInitializeFlow`; dialog conselho fixo CRN+UF | Vertentes nutrição |
| 2026-08-14 | **Pack seed nutrição (Partes 2–3):** `packs/nutricao` (4 especialidades + linha canônica, anamnese união, contrato); seeder/`plan-strand-repair` usam `ClinicStrand`; `locationUiType=none` + coerção; admin abre select Nutrição | Vertentes nutrição |
| 2026-08-12 | **CREFITO (Parte 6):** enum `ProfessionalCouncilType` + migration `20260812150000_professional_council_crefito`; `ResolveProfessionalCouncilService` filtra tipos por `clinicStrand`; regional `01`–`20` em `councilUf` | `@citybox/messaging/professional-council` |
| 2026-08-12 | **`PatientBodyMetric` (Parte 5):** peso/altura/IMC store-scoped; `GET/POST /v1/patients/:id/body-metrics` — **imutável** (sem PUT/DELETE) | Aba Cálculo de IMC no web |
| 2026-08-20 | **Financeiro ficha:** approve sem parcela → 1 entry/`BudgetItem` (nome puro + `budgetItemId`); com parcela → `Entrada`/`k/N`; listagem `?budgetItemId=`; migration `20260820160000_financial_entry_budget_item_id` | Sem parcela deixa de ser 1 linha “Plano…”; `i/n` só em parcelas |
| 2026-08-20 | **Lista assinaturas do paciente:** `GET /v1/patients/:patientId/signatures` (`status` default `pending`, paginação §8.1); `findManyByPatient` no repo | Card Sobre no clinica-web |
| 2026-08-12 | **`locationUiType` (Parte 3):** enum em `ClinicPlanSpecialty` (+ override nullable no tratamento); migration `20260812120000_clinic_plan_location_ui_type` backfill Harmonização/`none`/`session`/`body_region`; seed + planos HTTP; orçamento usa campo em vez de `specialtyName === 'Harmonização Facial'` | Vertentes Parte 3 |
| 2026-08-12 | **Pack seed fisioterapia (Parte 2):** `packs/odontologia` (v4) + `packs/fisioterapia` (v1); `ClinicStoreSeeder` escolhe pack por `Organization.clinicStrand`; anamnese fisio = 15 globais + extras; demo agenda categoria `Avaliação`; `GET /v1/members/roles` e `clinicRoleLabel(role, strand)` com labels da vertente | Vertentes Parte 2 |
| 2026-08-11 | **Vertente da clínica (`clinicStrand`)** em `Organization` (migration `20260811170000_add_organization_clinic_strand`); evento aditivo; `members/me` + `GET /v1/clinics` devolvem strand + features + copy | Parte 1 das vertentes |
| 2026-08-10 | **Compromisso desloca consultas sobrepostas** para Gestão de Encaixe: `DisplaceAppointmentsForCommitmentService` no create/update de `internal-events` (`scheduled`/`confirmed`/`patient_waiting` → FitIn pending + `cancelled_pro`; `in_progress` → 409); resposta com `displacedAppointments[]` | Assimetria vs assert de consulta; FE invalida fit-ins + toast |
| 2026-08-10 | **patient-categories colorId:** enum nomeado → hex `#rrggbb` (`VarChar(7)`); migration `20260810180000_patient_category_color_hex`; validação Zod/`Matches` | UI seletor de saturação livre |
| 2026-08-10 | **Dockerfile:** inclui `@citybox/clinica-permissions` (deps + build + runner), espelho do padrão `nest-common` | Corrige TS2307 no `docker build` da clinica-api |
| 2026-08-07 | **Débito de crédito ZapSign:** `ConsumeSignatureCreditService` + `debitOrFail`; request anamnese/contrato/lote débita 1 (refund se ZapSign falhar); saldo 0 bloqueia envio | Contador Loja sobe na liberação e desce no uso |
| 2026-08-07 | **Signature package requests paginado:** `GET …/signature-package-requests` com `page`/`perPage`/`status?` + `meta` | Loja modal histórico DataTable |
| 2026-08-07 | **Relatório de assinaturas:** `GET /v1/electronic-signatures` (listagem + `meta.stats`) no módulo `signatures` | Loja deixa de usar mock vazio |
| 2026-08-06 | **WhatsApp campanha:** status `read`/coluna Visualização **abandonados** (pasta de migration vazia removida; client regenerado sem `read`). Lista só Enviado/Entregue | `BroadcastCampaignMessagesList` |
| 2026-08-06 | **WhatsApp fuso wall-clock:** inbound `late` e lembretes T-2h/T-5min usam `toClinicWallClockUtc(now)` vs `startAt` wall-clock-as-UTC (antes UTC real fazia late/lembrete ~3h cedo) | Re-prompt “Resposta inválida… 1/2” volta a funcionar antes do horário |
| 2026-08-10 | **Conselho CRM/CRO:** campos em `Member` + snapshot em `PatientPrescription`/`PatientCertificate`; `ResolveProfessionalCouncilService` na 1ª emissão; migration `20260810190000_member_professional_council` | Documentos + equipe |
| 2026-08-06 | **Comissões % wildcard:** Plano/Especialidade `null` (= Todos); match de regra por **nome** da especialidade quando plano é wildcard | motors + FE `COMMISSION_SCOPE_ALL` |
| 2026-08-05 | **Agenda status:** `scheduled`/`confirmed` → `in_progress` permitido (pula `patient_waiting`); FE filtra opções no popover | `appointment-state-machine` + EventDetailsPopover |
| 2026-08-05 | **Dashboard demografia:** idade em faixas de década (12 buckets fixos no eixo Y) | `dashboard-patient-demographics.math` |
| 2026-08-05 | **Financial cancel:** `PATCH …/cancel` desfaz liquidação (`withUnsettled` → `pending`); “vencido” = UI se dueDate passou; 409 se já `pending`/`cancelled` | `cancel-financial-entry` + entity |
| 2026-08-05 | **Marketing Indicações:** `GET /v1/indicacoes/{kpis,referred-patients,referrers}` (período; paginação/sort; filtro `referrerKind`+`referrerId`; `read` Marketing); módulo `marketing/indicacoes` | FE `/marketing/indicacoes` |
| 2026-08-04 | **Indicação por profissional externo:** origem de sistema `indicacao_profissional_externo` + catálogo `ExternalReferralProfessional` (`GET/POST /v1/patient-external-professionals`); FK `Patient.referredByExternalProfessionalId`; acquisition/report incluem a key; migration `20260804180000_add_external_referral_professionals` | `patients` + `dashboard` + `reports` |
| 2026-08-04 | **Dashboard CASL:** subject `Dashboard` (read/update/access); rotas dashboard/reports fora de Financial/Patient | Ver `../permissions/AGENTS.md` §6 |
| 2026-08-12 | **store-setup plano por vertente:** `ensurePlanMatchesPack` + `plan-strand-repair` reseed idempotente do plano Particular quando especialidades não batem com `clinicStrand` (retry corrige lojas fisio com seed odonto) | `clinic-store-seeder.ts` + retry |
| 2026-08-04 | **store-setup equipe demo CASL:** `ensureDemoClinicTeam` seeda dentista+gerente+secretário (`permissionsForRole`); OWNER clínico = `dentista_admin`; admin `SeedClinicDemoTeam` no-op | `demo-clinic-team.ts` + seeder + retry |
| 2026-08-04 | **store-setup v4:** categorias financeiras (despesa/receita) seedadas com hex distintos; backfill se `color` vazia | `clinic-seed-template` + `ClinicStoreSeeder.seedFinancial` |
| 2026-08-03 | **Agenda CASL fino:** Schedule fora do bridge; `access`/`delete` + assert self/others; FE `useSchedulePermissions` | Ver `../permissions/AGENTS.md` |
| 2026-08-03 | **Marketing campanhas CASL fino:** `read`/`create`/`update` nas rotas; catálogo `marketing_campaign_*` | Ver `../permissions/AGENTS.md` §6 |
| 2026-08-03 | **Settings fino:** subjects `ClinicPlan` / `AnamnesisTemplate` / `ContractModel`; rotas planos/anamnese/contratos; labels Equipe | Catálogo + API |
| 2026-08-04 | **Comissões CASL:** own (`read`) força `memberId` do escopo; all (`manage`) lista todos | `assert-commission-permission` + list/detail routes |
| 2026-08-04 | **Cargos clínicos:** 8 papéis + presets CASL; `clinicRoleLabel` para auxiliar/recepcionista/financeiro legados | `role-catalog` + MembersPresenter |
| 2026-08-04 | **Marketing finalizar:** `PATCH /v1/campaigns/:id/status` exige `delete` Marketing (`marketing_campaign_finalize`), não `update` | campaigns.route |
| 2026-08-04 | **Vendas funis:** `GET /v1/funnels` e oportunidades filtrados por `sales_view_funnel_*` / manage; 403 se funil não visível | `assert-sales-funnel-visibility` + routes |
| 2026-08-07 | **Orçamento → Funil de Venda:** `SalesOpportunity.budgetId` + origin `budget`; sync create/status/delete; move para won/lost bloqueado se `budgetId`; migration manual `20260807140000_add_sales_opportunity_budget_id` | `patient-budgets` + `sales` |
| 2026-08-04 | **Vendas CASL:** Sales fora do manage-bridge; GET access\|read\|manage; POST/PATCH/DELETE exigem manage (`sales_manage_opportunities`) | opportunities + funnels + labels |
| 2026-08-04 | **Financeiro accounts/categories CASL:** create|delete FinancialAccount/FinancialCategory; list aceita read desses subjects | accounts + categories routes |
| 2026-08-04 | **Financeiro CASL:** list/find/by-payment-method restringem `types` ao legível (expense_view → só expense) | `constrainFinancialEntryTypesCsv` |
| 2026-08-04 | **Financeiro CASL fino:** subjects Income/Expense/Commission; rotas tipadas + settle; dashboard=`read` Financial; RequireAnyPermission | financial + commissions + dashboard |
| 2026-08-04 | **Receituário/Atestado:** rotas `create` Subject próprio (não mais manage PatientDocument) | patient-prescriptions + patient-certificates |
| 2026-08-04 | **Arquivos CASL fino:** fora do manage-bridge; create/read/update/delete por rota; `patient_file_manage`→update + read auto | `patient-files` routes + permissions |
| 2026-08-04 | **Evoluções finas:** fora do manage-bridge; create/update/delete; UI Emitir/Adicionar só com `patient_evolution_create` | treatment-evolutions + toolbar |
| 2026-08-04 | **List evoluções na ficha:** GET list/history exigem `manage` PatientTreatment (alinhar a Visualizar prontuário) | `treatment-evolutions` list + history routes |
| 2026-08-04 | **Orçamentos CASL fino:** list/get=`read`, create, update, delete, status=`approve`; saiu do manage-bridge | `patient-budgets` routes + `@citybox/clinica-permissions` |
| 2026-08-03 | **Catálogo granular:** subjects Stock/Sales/Marketing + ficha; rotas estoque/CRM/marketing/orçamentos/… migradas | Ver `../permissions/AGENTS.md` §6 |
| 2026-08-03 | **Permissões editáveis:** create/update aceitam `clinics[].permissions`; guard/presenter/`me` usam JSON do vínculo | `resolve-clinic-permissions.ts` |
| 2026-08-03 | **Papéis CASL:** `CLINIC_ROLES` + `permissionsForRole` movidos para `@citybox/clinica-permissions`; `clinic-role.catalog.ts` só reexporta | Fonte única API+Web |
| 2026-08-03 | **Primeiro acesso:** `markPasswordSet` em `GET /v1/members/me` + `ClinicScopeGuard`; create member grava `hasPassword: false` + prazo provisório | Badge "Aguardando primeiro acesso" / filtro Pendentes deixa de ficar preso após o usuário autenticar |
| 2026-07-31 | **Dockerfile:** inclui `@citybox/nest-common` (deps + build + runner) | Corrige TS2307 no `docker build` da clinica-api |
| 2026-07-31 | **by-target evolution_batch:** `findLatestByTarget`/`findPendingByTarget` resolvem id em `targetIds` | FE pode sync por evolution id |
| 2026-07-31 | **Body JSON 15mb** no `main.ts` (PDF ZapSign `fileBase64`); proxy clinica-web timeout 60s | Evita `request entity too large` na anamnese/contrato |
| 2026-07-31 | **Contrato ↔ orçamento + e-mail ZapSign:** `PatientContractEmission.budgetId`; list budgets com `contractEmissionId`; request-contrato com `send_automatic_email` se e-mail; migration manual `20260731150000_contract_emission_budget_id` | CTA Emitir na tabela de orçamentos (clinica-web) |
| 2026-07-31 | **Assinatura eletrônica ZapSign:** módulo `signatures` + model `ElectronicSignature`; request anamnese/contrato/lote evolução; webhook `@Public`; PDF original/assinado no MinIO; envs `ZAPSIGN_*`; migration manual `20260731120000_add_electronic_signatures` | clinica-web Solicitar → link/WhatsApp; crédito = 1 doc; sem termos |
| 2026-08-03 | **Permissões CASL:** package `@citybox/clinica-permissions`; removidas strings `store.clinic.*`; `@RequirePermission(action, subject)`; papéis → IDs do package | Ver `../permissions/AGENTS.md` |
| 2026-07-30 | **Campanha aniversário — respostas:** inbound grava reply de felicitações; `GET …/messages?withReplies=true` | Toggle ERP “Mensagens com respostas” |
| 2026-07-30 | **Campanha aniversário — lista de envios:** `GET /v1/campaigns/:id/messages` + sync `views` + ack Baileys `delivered` | ERP `BroadcastCampaignMessagesList` |
| 2026-07-30 | **Marketing Aniversariantes WhatsApp:** `aniversario` implemented; content Zod; dispatch 1º no create + cron a partir 07:00 BRT com **1 envio / 5 min** (`BirthdayCampaignScheduler`) | Wizard ERP + filas WhatsApp |
| 2026-07-30 | **available-slots:** marca horários já passados (wall-clock `America/Sao_Paulo`) como `available=false` no dia atual; dias anteriores ficam todos indisponíveis | Modal “Buscar horário livre” / reagendar em Tarefas não oferece manhã após o horário atual |
| 2026-07-29 | **Lembrete WhatsApp 2h:** `DispatchDueAppointmentRemindersUseCase` + `AppointmentReminderScheduler` (poll 60s no `main-whatsapp`); consultas `confirmed` na janela `(now, now+2h]`; `correlationId=appointment-reminder:{id}` | Paciente recebe “Não se esqueça!…” ~2h antes |
| 2026-07-29 | **Inbound WhatsApp conversa:** só `1`/`2` confirmam/cancelam; demais (texto/emoji/mídia) com consulta `scheduled` → `INVALID_CONFIRMATION_REPLY_TEMPLATE`; após resolvida → `UNKNOWN_REPLY_TEMPLATE`; Baileys processa figurinha/áudio/imagem via `extractInboundMessageBody` | Fluxo de confirmação sem chat livre |
| 2026-07-29 | **Inbound WhatsApp:** remetente resolvido de `remoteJid`/`remoteJidAlt` e, se vier só LID (`…@lid`, padrão Baileys 7), via `signalRepository.lidMapping.getPNForLID`; `findActiveConfirmationByPhone` casa as duas variantes do nono dígito (resposta vinha `+557381990809` vs envio `+5573981990809`); log `inbound … action=` | Resposta `1`/`2` volta a confirmar/cancelar e disparar o ack |
| 2026-07-29 | **Envio WhatsApp espera `connection=open` + retry** em `Connection Closed`/timeout (3 tentativas); auth Baileys em `data/whatsapp/` (gitignore) — milhares de `lid-mapping`/`pre-key` JSON são normais, não são código | Evita `sent`/`failed` fantasma quando a fila processa no meio de um restart 515 |
| 2026-07-29 | **Envio WhatsApp resolve JID via `onWhatsApp`** (número + variante do nono dígito) antes do `sendMessage`; sem match a mensagem vira `failed` em vez de `sent` fantasma | Confirmação de consulta passa a chegar em contas BR antigas |
| 2026-07-29 | **dev-with-worker:** sobe `main-whatsapp` junto e **supervisiona** os workers (reinicia por crash e por recompilação; `node --watch` não voltava após crash de carregamento); `WhatsappWorkerModule` liga repositórios Prisma direto (importar `ClinicProfileModule` quebrava DI por falta de `ObjectStorage`); `session.start` força restart do socket Baileys; imports de `disconnect-session`/`update-templates` corrigidos (TS2307 barrava o build inteiro); mock Jest de `@citybox/messaging` via `moduleNameMapper` | Fluxo de QR funciona no `pnpm dev` |
| 2026-07-29 | **WhatsApp Baileys MVP:** models `Whatsapp*` + `Appointment.confirmationSource`; módulo `whatsapp` (session/templates/enqueue/inbound); processo `main-whatsapp` + filas `clinic.whatsapp-send`/`clinic.whatsapp-session`; **migration schema-only** (operador aplica) | ERP settings/QR + toggle agenda + histórico Sobre |
| 2026-08-03 | **clinica-web em produção:** serviço `web` no compose (`clinica_web` :3113), nginx `clinica.aplopes.com`, `CLINICA_ORIGIN` no env/sync-realm; `deploy:prod` / `deploy:prod:clinic` sobem o front | Substitui o CRM Odonto legado no mesmo subdomínio |
| 2026-07-28 | **Deploy parcial:** `pnpm deploy:prod:clinic` (clinica-api+worker + ERP/backoffice; `--api-only`/`--erp-only`) | Iteração rápida sem rebuild full |
| 2026-07-28 | **Deploy:** serviço Docker `worker` (`clinica_api_worker`) + health check + bind `clinic.store-setup` em `sync-bindings.sh` | Sem worker, eventos `citybox.store.*` não seedavam o schema `clinica` em produção |
| 2026-07-27 | **store-setup v3:** equipe demo gerente+atendente (platform `SeedClinicDemoTeam` no create + HTTP); appointment usa `store_members.id` + 09:00 wall-clock | Agenda invisível + plano Equipe |
| 2026-07-27 | **store-setup v2:** plano seed `sortOrder=1` (Zod ≥1); consulta demo amarra no 1º `platform.store_members` (sem UUID fake — agenda ERP escondia); amanhã 09:00 BRT | Lista planos 422 + consulta invisível |
| 2026-07-27 | **store-setup:** `.env` local precisa de `RABBITMQ_*` (antes só no `.env.example`); consumer loga erro se ausente; seed manual Sorriso Branco | Sem URL o worker “sobe” sem fila/consumer |
| 2026-07-27 | **dev-with-worker:** um `nest --watch` + `node --watch dist/.../main-worker` (evita race de dois nest com `deleteOutDir`) | Worker store-setup sobe de fato no `pnpm dev` |
| 2026-07-27 | **store-setup:** worker RabbitMQ `clinic.store-setup` + `ClinicStore`/`ClinicStoreSetup` + seed first-contact (Particular, 7 anamneses, contrato, financeiro, categorias, demo paciente/agenda); `POST /v1/store-setup/:storeId/retry`; dep `@citybox/messaging` | Espelha food ao criar loja Clínica no admin |
| 2026-07-27 | **patient-tooth-annotations** + **acceptsFaces** + odontograma ERP (pintura, loading coroa, canvas 24×56); migrations manuais `20260727123000_…accepts_faces` e `20260727170000_…tooth_annotations` | Anotações FDI; planos/orçamentos faces; UI tratamentos |
| 2026-07-24 | **clinic-plans `replaceTree`:** upsert especialidades/tratamentos (preserva IDs); delete só órfãos sem vínculo; tratamento em `budget_items` → `ClinicPlanTreatmentsInUseError` 409 (evita 500 ao marcar plano padrão) | `prisma-clinic-plan.repository` + filter |
| 2026-07-24 | **Agenda status:** reabrir `cancelled_*`/`missed` → `scheduled`|`confirmed`|`patient_waiting` (com assert de slot); `finished` segue terminal | `appointment-state-machine` + `UpdateAppointmentStatusUseCase` |
| 2026-07-24 | **Dashboard Tarefas:** `GET /v1/dashboard/tasks/cancelled-appointments` inclui `missed` + `cancelled_patient` + `cancelled_pro` (período `startAt`, paginação); repo `listCancelledAppointmentTasksInRange` | `dashboard` + `scheduling/appointments` |
| 2026-07-24 | **Financial:** cancel persiste `cancelledById`/`cancelledByName` (JWT); relatório `excluded-revenues` lê o nome (fallback `"Não informado"`); migration `20260724114525_add_financial_entry_cancelled_by` | `financial/entries` + `reports` |
| 2026-07-24 | **Origem do paciente:** `PatientReferralOrigin` + FK/`referredBy*`; `GET/POST /v1/patient-referral-origins` (ensure sistema); remove enum `referralSource`; acquisition/report usam `systemKey`; migration `20260724123000_add_patient_referral_origins` (backfill) | `patients` + `dashboard` + `reports` |
| 2026-07-23 | **Reports:** módulo `reports` + `GET /v1/reports/birthdays` (filtro mês/dia, paginação); ERP Relatórios Aniversariantes integrado | `modules/reports` + ERP dashboard/reports |
| 2026-07-23 | **Reports:** `GET /v1/reports/open-treatments-without-appointment` (tratamento active + sem consulta viva); ERP tabela + PDF | `modules/reports` + ERP dashboard/reports |
| 2026-07-23 | **Reports:** `GET /v1/reports/approved-budgets` (filtro `approvedAt` + paginação); ERP tabela + PDF | `modules/reports` + ERP dashboard/reports |
| 2026-07-23 | **Reports:** `GET /v1/reports/open-budgets` (`pending` + filtro `Budget.date`); ERP tabela + PDF | `modules/reports` + ERP dashboard/reports |
| 2026-07-23 | **Reports:** `GET /v1/reports/rejected-budgets` (`rejected` + filtro `rejectedAt`); ERP tabela + PDF | `modules/reports` + ERP dashboard/reports |
| 2026-07-23 | **Reports:** `GET /v1/reports/sales-by-specialty` (itens aprovados + especialidade); ERP tabela + PDF | `modules/reports` + ERP dashboard/reports |
| 2026-07-23 | **Reports:** `GET /v1/reports/sales-by-plan` (itens aprovados + planName); ERP tabela + PDF | `modules/reports` + ERP dashboard/reports |
| 2026-07-23 | **Reports:** `GET /v1/reports/sales-by-professional` (itens aprovados + professionalName); ERP tabela + PDF | `modules/reports` + ERP dashboard/reports |
| 2026-07-23 | **Reports:** `GET /v1/reports/sales-by-treatment` (itens aprovados + treatmentName/planName); ERP tabela + PDF | `modules/reports` + ERP dashboard/reports |
| 2026-07-23 | **Reports:** `GET /v1/reports/expenses-by-category` (despesas pagas agregadas + %); ERP tabela + PDF | `modules/reports` + ERP dashboard/reports |
| 2026-07-23 | **Reports:** `GET /v1/reports/excluded-revenues` (receitas cancelled + updatedAt); ERP tabela + PDF | `modules/reports` + ERP dashboard/reports |
| 2026-07-23 | **Reports:** `GET /v1/reports/referred-patients` (indicacao + createdAt + KPIs); ERP tabela + PDF | `modules/reports` + ERP dashboard/reports |
| 2026-07-23 | **Estoque:** `authorizedByName` usa nome do JWT (`name`/`given_name`+`family_name`); `requestedByName` do profissional na retirada | `authenticated-user` + stock entries/withdrawals |
| 2026-07-23 | **Estoque:** retirada passa `requestedByName` (nome do profissional); removido hardcode `"Profissional"` na rota | `stock-withdrawals.route` + ERP withdrawal sheet |
| 2026-07-22 | **Dashboard expense-by-category:** `GET /v1/dashboard/expense-by-category`; expense paid por `paidAt`; sentinel `uncategorized`; repo `listExpenseByCategoryInRange` + `listExpenseByCategoryYears`; ERP card + freshness (`dashboard-query-options` + `invalidateClinicDashboardQueries`) | `dashboard` + `financial/entries` + ERP clinic §8.2 |
| 2026-07-22 | **Dashboard inadimplencia:** `GET /v1/dashboard/inadimplencia` + `/details`; só pacientes overdue agora; unpaid all-or-nothing; repo `listInadimplenciaDebtsInRange` + `listInadimplenciaYears` | `dashboard` + `financial/entries` |
| 2026-07-22 | **Dashboard ticket-medio:** `GET /v1/dashboard/ticket-medio`; rendimento/lucratividade; paid ledger; repo `listTicketMedioDayMetricsInRange` + `listTicketMedioYears` | `dashboard` + `financial/entries` |
| 2026-07-22 | **Dashboard payment-methods:** `GET /v1/dashboard/payment-methods`; income received por `paidAt`; 7 meios; reusa `listReceivedIncomeInPaidAtRange` | `dashboard` + `financial/entries` |
| 2026-07-22 | **Dashboard comissões:** `GET /v1/dashboard/commissions` + `/details`; paymentDate; rateio desconto; export `CommissionPaymentRepository` | `dashboard` + `commissions/payments` |
| 2026-07-22 | **Dashboard cashflow:** `GET /v1/dashboard/cashflow`; paid/forecast; overdue excluído; repo `listEntriesForCashflowInRange` + `listCashflowYears` | `dashboard` + `financial/entries` |
| 2026-07-22 | **Dashboard Consultas:** `GET /v1/dashboard/appointments` + `/details`; só status terminais; período em `startAt`; categoria + timeline + taxa comparecimento; repo `listAppointmentsForDashboardInRange` + `listAppointmentDashboardYears` | `dashboard` + `scheduling/appointments` |
| 2026-07-22 | **Dashboard demografia:** `GET /v1/dashboard/patient-demographics`; active only; `other→uninformed`; série etária + pizza; repo `listPatientsForDemographics` | `dashboard` + `patients` |
| 2026-07-22 | **Dashboard origem do paciente:** `GET /v1/dashboard/patient-acquisition` + `/details`; `referralSource` com `null→nao_informado`; período em `createdAt`; repo `listPatientsForAcquisitionInRange` + `listAcquisitionYears` | `dashboard` + `patients` |
| 2026-07-21 | **Dashboard metas de vendas — meta contínua:** GET/PUT sem `year`/`month`; `DashboardSalesGoal` append-only (`startDate`, sem `periodKey`); acúmulo de `startDate` até hoje, sem reset mensal; substituir reinicia | `dashboard` + patient-budgets |
| 2026-07-21 | **Dashboard metas de vendas:** `GET/PUT /v1/dashboard/sales-goals` + model `DashboardSalesGoal` (migration manual); realizado = orçamentos aprovados | `dashboard` + patient-budgets |
| 2026-07-21 | **Dashboard métricas de pacientes:** `GET /v1/dashboard/patients/summary` + `GET /v1/dashboard/patients?metric=` (5 métricas; birthdays permanece no summary/listagem dedicada) | `dashboard` + patients/appointments/financial/treatments |
| 2026-07-21 | **Dashboard análise de receitas:** `GET /v1/dashboard/revenue-analysis` + `/details` (modos receipts/sales, 4 dimensões, rateio, specialty lookup) | `dashboard` + budgets/treatments/financial |
| 2026-07-21 | **Dashboard orçamentos listagem:** `GET /v1/dashboard/budgets` (paginação, `totalValueCents`, `listOpenRejectedBudgets`) | `dashboard` + `patient-budgets` |
| 2026-07-21 | **Dashboard aniversariantes listagem:** `GET /v1/dashboard/birthdays` (período, busca, paginação) | `dashboard` + `patients` |
| 2026-07-21 | **Dashboard KPI aniversariantes:** `upcomingBirthdaysCount` (active, birthDate, janela 0–30d) no summary | `dashboard` + `patients` |
| 2026-07-21 | **Dashboard KPI orçamentos abertos/reprovados:** `sumOpenRejectedBudgetsCents` (`pending`+`rejected`) no summary | `dashboard` + `patient-budgets` |
| 2026-07-21 | **Orçamentos — rejeitar/reabrir:** campos `rejectedAt`/`rejectionReason`; `PATCH status` aceita `pending` a partir de `rejected`; migration `20260721131741_add_budget_rejection` (operador) | `patient-budgets` + ERP sheet |
| 2026-07-21 | **Dashboard summary:** `GET /v1/dashboard/summary` + `sumOverdueIncomeCents` (receitas pending vencidas) | KPI Débitos em atraso no ERP |
| 2026-07-17 | **Marketing — período:** sync `status=finished` a partir de 00:00 BRT do dia da `endDate` (get/list/público); create exige data fim futura (não hoje) | `campaign-period.utils` + entity `syncDerivedStatus` |
| 2026-07-16 | **Marketing — form público + submissões:** `CampaignSubmission` + `GET/POST /v1/public/campaigns/...` + `GET …/submissions`; ERP BFF + Respostas do Formulário | `modules/marketing` + ERP |
| 2026-07-16 | **Marketing — ERP backoffice integrado** (`campaigns.api.service` + hooks) | ERP + `modules/marketing` |
| 2026-07-16 | **Marketing — Formulário de Leads (`form_lead`):** model `Campaign` + Zod content + `POST/GET/PATCH status` `/v1/campaigns`; migration manual; ERP ainda mock | `modules/marketing/campaigns` |
| 2026-07-16 | **Marketing — Tipo da campanha:** enums Prisma + catálogo de domínio + `GET /v1/campaign-types`; migration manual; configs por tipo = fases futuras | `modules/marketing` |
| 2026-07-15 | **Comissões:** histórico agregado por profissional (lista 1 linha; detalhe `history/:memberId` + período une accruals) | `aggregate-history-by-member`; ERP detalhe |
| 2026-07-15 | **Comissões CLIN-062:** motor `debit_received` no receive (ficha + caixa); %/fixo por item do orçamento; qualquer meio de pagamento; idempotente por `sourceFinancialEntryId` | `AccrueCommissionsOnDebitReceivedService` |
| 2026-07-15 | **Comissões:** migration única `20260715165240_add_commissions` (source refs inclusas; sem migration `*_source_refs` separada) | prisma/migrations |
| 2026-07-15 | **Comissões:** motors `budget_approved` (approve) + `treatment_completed` (só FinalizePatientTreatment / evolução source=treatment) | accruals services |
| 2026-07-15 | **Comissões:** enrich dente/local no treatmentName; history discountCents; validação fixed_value por trigger | enrich + math + validator |
| 2026-07-15 | **Comissões:** replace de regras deduplica por identidade (última vence) | `ReplaceCommissionRulesUseCase` |
| 2026-07-15 | **Comissões CLIN-062:** ERP integrado (`commissions.api.service` + Equipe `commission-rules`); `accrualIds` com `@IsUUID()` (aceita v7) | Backend + ERP |
| 2026-07-15 | **Comissões CLIN-062:** módulo `commissions` (rules/accruals/payments); `GET/PUT team/:memberId/commission-rules`; open/history/payments/accruals; proteção caixa `FinancialEntryLinkedToCommissionError`; migration `20260715165240_add_commissions` (operador) | Backend comissões; ERP integração = fase seguinte |
| 2026-07-14 | Financial entries: `by-payment-method`; listagem com `dateField`/`paidAtFrom`/`paidAtTo`; DELETE de liquidados permitido | ERP Transações via API (CLIN-061) |
| 2026-07-13 | ERP CLIN-061: fluxo de caixa + config via `v1/financial/*` (ERP integrado); ficha receive usa `accountId` das contas API | CLIN-061 (Transações completadas 2026-07-14) |
| 2026-07-13 | **Ledger unificado:** models `FinancialAccount`/`FinancialCategory`/`FinancialEntry` (remove `PatientFinancialEntry`); módulo `financial` (`v1/financial/*`); ficha reapontada para `financial_entries`; permissão `store.clinic.financial.manage` | CLIN-060 fluxo de caixa BE; migration pelo operador; ERP `/clinic/financeiro` integrado (CLIN-061) |
| 2026-07-13 | **Vendas CRM refinamentos:** `sortOrder`+`reorder`; etapas Agendada/Perdida fixas; save funil 2 fases (UNIQUE order); filtro período custom dia civil BRT; cor etapa no modal (hex case) | `modules/sales`, ERP `vendas`, wiki `25-crm-funil-vendas` |
| 2026-07-13 | `SalesOpportunity.sortOrder` + `PATCH /v1/opportunities/reorder`; listagem `orderBy sortOrder`; move aceita `sortOrder`; coluna/índice na migration `20260713130319_add_sales_clinic` | Kanban CRM persiste ordem dos cards |
| 2026-07-13 | Módulo `sales` (funnels/opportunities/labels) + ERP integrado (`sales.api.service.ts`); migration `20260713130319_add_sales_clinic` | CRM kanban `/clinic/vendas` via API |
| 2026-07-09 | **Stock ERP:** ordenação server-side em produtos e movimentos (`sortBy`/`sortOrder`); filtro de data no histórico com dia civil inteiro; fix `CreateStockSupplierUseCase` → `repository.create()` + `abstract create()` em `StockSupplierRepository` | `modules/stock`, ERP `features/clinic/estoque` |
| 2026-07-10 | Config settings: CNPJ com dígitos verificadores; deletes 409 (`ClinicPlan`/`AnamnesisTemplate`/`ContractModel` *HasPatients*); seed anamnese ~15 perguntas; **removido** sync patient→appointment categories; `planStatus` na resposta de pacientes; overlap integration test sequencial (sem migration EXCLUDE) | ERP modais informativos; categorias de agendamento isoladas; ficha Sobre "(Inativo)" |
| 2026-07-09 | **Scheduling — compromissos bloqueiam consultas** (todo `InternalEvent`, timed + all-day); `parseClinicDateTime` (wall-clock UTC); `returnAlertId` no create remove alerta; fix `fromDate`/`toDate` em list return-alerts | `internal-event-blocking.utils`, `clinic-datetime.utils`, `available-slots-calculator`, `create-appointment.use-case` |
| 2026-07-08 | Módulo `stock` (fornecedores/produtos/entradas/retiradas/movimentos/stats) + foto produto via MinIO; models Prisma e rotas `/api/v1/stock-*` | Backend estoque disponível (store-scoped) |
| 2026-07-08 | **CLIN-020:** `SyncAppointmentCategoriesFromPatientsUseCase` no `GET` de appointment-categories (espelha categorias de paciente ausentes) | *(superseded 2026-07-10 — sync removido)* |
| 2026-07-08 | **CLIN-020:** `available-slots` usa `durationMin` como step padrão (mín. 15) — evita start-times intermediários sobrepostos na lista | UX do modal “Buscar horário livre” sem opções que se sobrepõem entre si |
| 2026-07-07 | **CLIN-020:** módulo `scheduling` (appointments, categories, internal-events, fit-ins, return-alerts, available-slots); migration `add_scheduling` + EXCLUDE gist; ADR overlap | Backend agenda disponível; ERP integração = CLIN-021 |
| 2026-07-07 | Submódulo `patient-files`: drive store-scoped (pastas + arquivos, upload MinIO multipart, listagem por pasta); migration `20260707144451_add_patient_files`; query `excludeFolderSubtreeId` em move-destinations | Backend aba Arquivos |
| 2026-07-07 | ERP integrado: `patient-files.service` + `use-patient-files-queries`; busca server-side; preview/download via proxy; aba sem badge "Em breve" | Ficha `/arquivos` end-to-end |
| 2026-07-07 | ERP: `manualPagination` nas tabelas server-side da ficha (orçamentos, anamnese, financeiro) | Corrige bug perPage 20 exibindo 10 linhas; ver §8.1 raiz |
| 2026-07-07 | ERP: integração aba Financeiro da ficha (`patient-financial-entries.service`, listagem server-side §8.1, invalidate no approve) | CLIN-061; mock store removido no ERP |
| 2026-07-07 | Submódulo `patient-financial-entries`: CRUD store-scoped + `PATCH …/receive` + geração idempotente na approve de orçamento (`GenerateBudgetFinancialEntriesService`); model `PatientFinancialEntry` no Prisma (migration manual pelo operador) | Backend financeiro da ficha disponível |
| 2026-07-06 | Submódulos `patient-contract-emissions`, `patient-prescriptions`, `patient-certificates`: CRUD store-scoped na aba Documentos; models Prisma + migration `20260706190108_add_documents_patient`; ERP integrado (mock removido) | Backend + ERP: contratos/receituários/atestados; listagem com `itemCount` no summary de receituários |
| 2026-07-06 | ERP: integração aba Anamnese + rota pública (`patient-anamnesis.service`, BFF `/api/public/clinic/anamnesis/[token]`) | Mock store removido; listagem server-side conforme §8.1 |
| 2026-07-06 | Submódulo `patient-anamneses`: CRUD store-scoped + rotas públicas `@Public()` (`GET/PATCH /api/v1/public/anamnesis/:token`); model `PatientAnamnesis` no Prisma (migration manual pelo operador) | Backend anamnese preenchida disponível |
| 2026-07-06 | `PATCH …/treatments/:id/finalize`: finalização atômica (evolução `source=treatment` + `status=completed`) | ERP sheet Finalizar tratamento integrado |
| 2026-07-03 | Padronização de PKs Prisma: `@id @default(uuid())` em todos os models (incl. `ClinicPlan*`); `professional_service_hours` migrou de UUID/`gen_random_uuid()` para TEXT | Reset local + `migrate dev` para aplicar histórico limpo |
| 2026-07-03 | CLIN-041: `ListBudgetsUseCase` com busca/paginação/ordenação server-side; approve via `MaterializeBudgetTreatmentsService` (idempotente) | `GET …/budgets` retorna `{ data, meta }`; ERP `patient-budgets-tab` conforme §8.1 |
| 2026-07-03 | CLIN-041 Fase 1: submódulos `patient-budgets`, `patient-treatments`, `treatment-evolutions` + models Prisma (migration manual pelo operador) | ERP abas Orçamentos/Tratamentos via API; financeiro na approve = Fase 2 (CLIN-060) |
| 2026-07-03 | Integração ERP Pacientes (`feat/clinic/create-backend-patient`): lista/cadastro/categorias/aba Sobre/foto via proxy | `clinicaFetch` + React Query no ERP; permissão `store.clinic.patients.manage` |
| 2026-07-03 | `patient-categories` movido para `modules/patients/patient-categories/` | Submódulo do `PatientsModule`; `app.module` importa só `PatientsModule` |
| 2026-07-03 | Spec dedicado por use case em `patients`; busca unificada em `domain/utils/patient-search.utils.ts` (nome parcial + CPF/telefone com normalização de formatação) | `list-patients.use-case.spec.ts`, `patient-search.where.ts` |
| 2026-07-03 | Módulos `patient-categories` + `patients` + migration `add_patients` | CRUD pacientes store-scoped; permissão `store.clinic.patients.manage` |
| 2026-06-26 | Módulo `contract-models` + migration `contract_models` | Primeiro CRUD store-scoped da vertical |
| 2026-06-26 | Arquivo `AGENTS.md` (clinica/api) criado            | —                                |
| 2026-07-01 | ERP: módulo Pacientes mock (`feat/clinic/create-screen-patient`) | UI ficha multi-aba; backend + integração ERP em 2026-07-03 |
| 2026-07-30 | PLAT-001 Fase 10 — `usesClientDocument` deixou de vir no evento de plataforma | O `Client` foi eliminado no `platform-api`, então o documento é sempre o da própria loja. O campo virou `@deprecated`+opcional em `@citybox/messaging` (pode haver evento antigo na fila) e o `store-platform-event.mapper.ts` grava `false`. A coluna segue no `ClinicStore` porque esse model ainda não foi aposentado — ver a dívida registrada no item 3 da Fase 10 em `.claude/plans/_platform/clinica-independencia-tenancy.plan.md` |
| 2026-07-30 | PLAT-001 Fase 10 — `MemberRecord` passou a expor `hasPassword`/`provisionalExpiresAt`/`disabledAt`, e `resetPassword` marca senha **provisória** | Os três campos já existiam no schema mas não saíam do repositório, então a tela de equipe não conseguia derivar `pending`/`expired`/`inactive`. E `resetPassword` chamava `markPasswordSet` (`hasPassword: true`): como a senha do Keycloak é `temporary: true`, a conta aparecia "ativa" sem ninguém ter acessado. Agora é `markProvisionalPassword(id, +7 dias)` |
| 2026-07-30 | **Responsável da organização** — enum `OrganizationMemberRole` (`OWNER`/`COLLABORATOR`) + `Member.organizationRole`, migration `20260730120000_add_organization_member_role` com índice único **parcial** `members_one_owner_per_organization` escrito à mão | O seed criava um membro fictício (`gerente.{storeId}`, "Gerente Demonstração", sem e-mail): o cliente terminava o cadastro sem nenhum acesso real, embora o evento `store.created` já carregasse `owner.responsibleName`/`owner.billingEmail`. Agora `ProvisionOrganizationOwnerUseCase` cria a pessoa de verdade (username derivado do e-mail/nome com desempate numérico determinístico, `hasPassword: false`), `ManageMemberUseCase` recusa remover/desativar o OWNER, e `MembersPresenter` expõe `organizationRole`. Ver 5.13.1/5.13.2 |
