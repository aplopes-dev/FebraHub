# AGENTS.md — Beautiful · web

> **Para agentes de IA:** Fonte de verdade deste módulo. Leia antes de qualquer ação.
> Ao modificar código, atualize as seções relevantes na mesma operação. Nunca remova
> seções — apenas atualize ou adicione.

---

## 1. Identidade do Módulo

| Campo | Valor |
| ----- | ----- |
| **Nome** | `apps/verticals/beautiful/web` · `@citybox/beautiful-web` |
| **Tipo** | App Next.js · backoffice vertical Beautiful |
| **Responsável** | Bruno Lopes — Aplopes Tecnologia |
| **Status** | 🟢 Shell + Agenda + Settings + Catálogo + Clientes + Equipe + Financeiro (API) + ⌘K |
| **Porta** | `3115` |
| **Última atualização deste arquivo** | 2026-08-20 modo escuro: ícones com contraste + Painel do dia sem gradiente |

**Propósito em uma linha:**
Frontend da vertical **Beautiful** sobre `@citybox/mui` (AppSidebar 1 coluna + header), pronto para gestão de agenda, comandas, catálogo de serviços/produtos de consumo, caixa e equipe de profissionais.

---

## 2. Posição no Monorepo

```
citybox/
└── apps/verticals/beautiful/
    ├── web/   ← VOCÊ ESTÁ AQUI (:3115)
    └── api/   ← @citybox/beautiful-api (:3173)
```

**Depende de:** `@citybox/mui` (`workspace:*`, source + `transpilePackages`), API NestJS (`@citybox/beautiful-api` na porta 3173).

**Não usa:** `@citybox/ui` / Tailwind/shadcn neste app.

---

## 3. Stack e Versões

| Tecnologia | Versão | Observação |
| ---------- | ------ | ---------- |
| pnpm | workspace | Nunca npm/yarn |
| Next.js | 16.2.7 | App Router |
| React | 19.2.7 | |
| `@citybox/mui` | workspace | AppSidebar, PageHeader, NavUser, theme, MultiSelect, DataTable |
| `@tanstack/react-query` | ^5.101.0 | Gerenciamento de estado assíncrono e cache reativo |
| MUI Material | 9.x | peers + `@mui/icons-material` |
| next-themes | ^0.4 | claro/escuro |
| sonner | ^2 | runtime do Toaster MUI |
| nextjs-toploader | ^3.9 | barra de progresso nas navegações |

---

## 4. Estrutura de Pastas

```
apps/verticals/beautiful/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx          ← Toaster + AppProviders
│   │   ├── providers.tsx       ← Session → QueryClient → Theme → CityboxMuiProvider
│   │   ├── globals.css
│   │   ├── login/              ← OAuth start (fora do shell)
│   │   ├── auth/callback/      ← troca code → cookies httpOnly
│   │   ├── api/
│   │   │   ├── auth/{token,session,refresh,logout}/
│   │   │   └── proxy/beautiful/[...path]/  ← cookies → Bearer + X-Store-Id
│   │   └── (app)/
│   │       ├── layout.tsx      ← useRequireAuth + AuthLogoutGate + BeautifulErpLayout
│   │       ├── page.tsx        ← Início (resumo do shell)
│   │       ├── agenda/
│   │       ├── clientes/       ← page.tsx (reexporta @/features/clients)
│   │       ├── catalogo/
│   │       │   ├── page.tsx    ← Rota de Serviços (/catalogo)
│   │       │   └── estoque/
│   │       │       ├── page.tsx ← Rota de Estoque de Produtos (/catalogo/estoque)
│   │       ├── financeiro/     ← layout Clínica (Fluxo / Transações / Comissões / Config)
│   │       │   ├── layout.tsx  ← FinanceiroSectionNav + CASL Financial
│   │       │   ├── page.tsx    ← redirect → /financeiro/fluxo-de-caixa
│   │       │   ├── fluxo-de-caixa/ · transacoes/ · configuracoes/
│   │       ├── equipe/         ← roster + convite (GET/POST/PATCH /v1/members)
│   │       ├── meu-plano/
│   │       └── configuracoes/
│   │           ├── page.tsx                       ← Configuração geral
│   │           ├── horario-de-funcionamento/      ← aba horizontal (grade semanal da unidade)
│   │           ├── aparencia/                     ← aba de temas visuais da loja
│   │           └── categoria-de-clientes/         ← aba horizontal
│   ├── theme/beautiful-mui-theme.ts
│   ├── theme/theme-presets.ts          ← 8 paletas Light/Dark
│   ├── theme/theme-store-context.tsx   ← tema da loja (localStorage + API)
│   ├── components/
│   │   ├── placeholder-page.tsx
│   │   └── auth/               ← shell login, gate, status (MUI)
│   ├── shell/
│   │   ├── beautiful-erp-layout.tsx  ← AppDashboardLayout + AppSidebar
│   │   ├── beautiful-header.tsx      ← unidade + busca + ajuda + notif + user (sessão)
│   │   ├── unit-switcher.tsx
│   │   ├── command-search.tsx
│   │   ├── notifications-menu.tsx
│   │   └── theme-mode-switch.tsx
│   ├── lib/
│   │   ├── navigation.ts       ← menu, BEAUTIFUL_*_TABS (catálogo, settings, financeiro)
│   │   ├── work-schedule.ts    ← WeekSchedule / WeekdayId / helpers (settings + members + agenda)
│   │   ├── field-masks.ts      ← máscaras BR (formatPhoneBR, digitsOnly)
│   │   ├── beautiful-api.ts    ← beautifulFetch → /api/proxy/beautiful
│   │   ├── auth*.ts / oauth-pkce / session-*  ← BFF auth (padrão clínica)
│   │   └── query-client.ts     ← fábrica do QueryClient (@tanstack/react-query)
│   ├── features/
│   │   ├── dashboard/          ← Tela inicial: ticket do dia + agenda + atalhos + financeiro + estoque
│   │   ├── catalog/            ← Módulo de Catálogo & Estoque (Serviços e Insumos para Consumo)
│   │   │   ├── components/     ← CatalogShell, CatalogSectionNav, ServiceFormDialog, ProductFormDialog, Drawer
│   │   │   ├── data/           ← PREDEFINED_CATEGORIES, COMMON_UNITS_OF_MEASURE
│   │   │   ├── hooks/          ← use-catalog-queries.ts (React Query)
│   │   │   ├── pages/          ← services-page.tsx, stock-page.tsx
│   │   │   ├── services/       ← catalog-service.ts
│   │   │   └── types/          ← catalog.types.ts
│   │   ├── agenda/             ← Agenda (mês/semana/dia + form → API appointments; colunas = members `role=profissional`)
│   │   ├── clients/            ← Módulo de Clientes (lean: nome + telefone + categoria; paginação server-side + KPIs + FormDrawer 800px + DetailsDrawer 800px)
│   │   ├── members/            ← Equipe: grade de cards (filtro de status + convite/edição)
│   │   ├── financeiro/         ← Fluxo/Transações/Config via `financial-service` + React Query → `/v1/financial/*`
│   │   ├── settings/           ← shell + nav horizontal + pages (`SettingsGeneralForm` layout Clínica)
│   │   └── permissions/        ← Can / useCan / ability (CASL)
├── next.config.ts              ← `output: 'standalone'`; transpilePackages: `@citybox/mui`, `@citybox/beautiful-permissions`
└── AGENTS.md
```

### 4.1 Shell (AppSidebar)

- Sidebar **1 coluna**: grupos **MENU** (Início, Agenda, Clientes, Catálogo) e **ADMINISTRATIVO** (Financeiro, Equipe, Configurações); rodapé sem grupo: Meu plano.
- **Configurações:** nav horizontal full-width (`SettingsSectionNav`) — Configuração geral · Horário · **Aparência e Tema** · Categoria de Clientes · Categoria de Agendamento.
- **Catálogo:** nav horizontal full-width (`CatalogSectionNav`) — Serviços (`/catalogo`) · Estoque de Produtos (`/catalogo/estoque`).
- **Financeiro:** nav horizontal full-width (`FinanceiroSectionNav`) — Fluxo de caixa · Transações · Configurações (**sem** Comissões nesta vertical).
- Colapsável para só ícones (`collapsible="icon"`).
- Header: `UnitSwitcher` (lojas de `GET /v1/members/me` via `useStore`), `CommandSearch` (⌘K), `ThemeModeSwitch`, ajuda, `NotificationsMenu`, `NavUser`.
- Nav: `lib/navigation.ts` — atualizar ao adicionar rotas.

### 4.2 Features

Domínio em inglês sob `src/features/<feature>/` (`pages`, `components`, `hooks`, `services`, …).
Rotas em `app/(app)/` só reexportam a page da feature.

---

## 5. Restrições Críticas

### 5.1 Package Manager
```
SEMPRE: pnpm --filter @citybox/beautiful-web <script>
```

### 5.2 Só `@citybox/mui`
```
Proibido: @citybox/ui · lucide-react · toast de sonner direto
Ícones de domínio: @citybox/mui/icons
Chrome MUI: @mui/icons-material/...
```

### 5.3 Tema no app
`createAppTheme(beautifulMuiThemeOptions)` + `CityboxMuiProvider` com `withCssBaseline`.
Não hardcodar cores de marca nos componentes — use o theme.

### 5.4 Auth BFF + StoreProvider
Tokens **nunca** no JavaScript. Fluxo:
1. `/login` → PKCE → Keycloak (`citybox-beautiful`, client `beautiful-web`)
2. `/auth/callback` → `POST /api/auth/token` → cookies `citybox_bo_*` (exige `vertical.beautiful.view`)
3. `StoreProvider` → `GET /api/proxy/beautiful/v1/members/me` (scopeless) → loja ativa
4. `beautifulFetch` → `/api/proxy/beautiful` (BFF injeta Bearer + `X-Store-Id` do store ativo)
5. `(app)/layout` → `useRequireAuth` + `AuthLogoutGate` + `ActiveStoreSync` (0 lojas = bloqueio)

Gate de role: `lib/vertical-permissions.ts` (`hasBackofficeAccess` passa por `resolveBackofficePermissions` para expandir `platform_admin` / `store_staff` e `vertical.beautiful.view` em `vertical_access`). Logout limpa `citybox-beautiful-active-store`.
`X-Store-Id` vem só do store ativo (`StoreProvider` ← `members/me`); sem fallback de UUID.
**Proibido:** `fetch` direto a `:3173` no browser (CORS off na API).

---

## 6. Padrões de Código

- Server Component por padrão; `'use client'` só com estado/evento.
- UI: atoms/molecules/organisms/templates de `@citybox/mui`.
- Dados assíncronos: `@tanstack/react-query` via hooks em `features/<feature>/hooks/`.
- Comunicação API: `beautifulFetch` em `lib/beautiful-api.ts`.
- Mensagens de erro: linguagem não-técnica focada no usuário final.

---

## 7. Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
| -------- | ----------- | --------- |
| `PORT` | ➖ (3115) | Dev via script fixa `-p 3115` |
| `NEXT_PUBLIC_BACKOFFICE_ORIGIN` | ➖ | Origem OAuth/logout (dev: `http://127.0.0.1:3115`) |
| `NEXT_PUBLIC_KEYCLOAK_ISSUER` | ➖ | Issuer público do Keycloak |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT` | ✅ | `beautiful-web` |
| `KEYCLOAK_CLIENT_SECRET` | ✅ prod | Secret do client `beautiful-web` (server-only) |
| `KEYCLOAK_INTERNAL_ISSUER` | ➖ | Issuer server-side (evita hairpin) |
| `BEAUTIFUL_API_URL` | ➖ | Upstream do proxy (default `http://127.0.0.1:3173/api`) |

---

## 8. Scripts

```bash
pnpm --filter @citybox/beautiful-web dev
pnpm --filter @citybox/beautiful-web build
pnpm --filter @citybox/beautiful-web start
pnpm --filter @citybox/beautiful-web typecheck
pnpm --filter @citybox/beautiful-web lint
```

---

## 9. Módulos Implementados

| Área | Status | Notas |
| ---- | ------ | ----- |
| Scaffold Next | 🟢 | App Router + providers MUI |
| Shell AppSidebar | 🟢 | AppDashboardLayout + AppSidebar (1 coluna) |
| Header | 🟢 | Unidade + **busca ⌘K real** + tema + notif + NavUser (sessão SSO) |
| Configurações | 🟢 | Geral (identidade/contatos/endereço + **logo**): formulário único sempre editável no layout da Clínica (`SettingsGeneralForm`) + CRUD categorias clientes (hex/`isProtected`) + **categorias de agendamento** (hex) + **Aparência e Tema** (`/configuracoes/aparencia`, 8 presets por loja) |
| **Catálogo & Estoque** | 🟢 | Serviços + produtos em `/catalogo` e `/catalogo/estoque`; **sem** rota de detalhes de produto; Serviços com `ServicesHeaderCard` + paginação server-side; movimentação via `StockMovementDialog` na listagem |
| **Agenda** | 🟢 | Calendário integrado: create + **edit/remarcar** + **cancelar**; colunas via `useAgendaProfessionalsQuery` (`GET /v1/members?role=profissional&status=active`); grades `GET /v1/members/work-schedules?memberIds=…`; `professionalId` no appointment = `member.id` |
| **Equipe** | 🟢 | `features/members`: grade de cards; `MemberDrawer` unificado em `member-drawer.tsx` (largura 800px); aba de Permissões estilo Clínica; cargo operacional (`profissional`/`recepcao`/`gerente`); badge **Responsável** via `organizationRole=OWNER`; OWNER sem botão desativar e com permissões somente leitura |
| **Clientes** | 🟢 | CRUD lean + **categoria opcional**; paginação **server-side** (`page`/`perPage`) + KPIs stats (`totalClients`/`withCategoryCount`/`withoutCategoryCount`); `ClientFormDrawer` (800px, `FormField`+`CategoryColorBadge`+footer fixo); `ClientDetailsDrawer` redesenhado (800px, avatar iniciais, grid `Paper`, WhatsApp+Editar no footer, `CategoryColorBadge`); busca debounce 400ms |
| **Início** | 🟢 | Ticket “Resumo de hoje” + timeline de agendamentos + atalhos + financeiro + estoque (layout do mock `dashboard-redesign.html`, tokens do tema MUI) |
| **Financeiro** | 🟢 API | Abas Fluxo / Transações / Config (sem Comissões); MUI + **`DataTable`** (`@citybox/mui`); `financial-service` + React Query → `/v1/financial/*`; CASL `access` Financial; dialogs CRUD conta/categoria/lançamento + receive/pay |
| Meu plano | 🟡 | Placeholder (Etapa 3.2) |
| Auth | 🟢 | BFF/PKCE + role `vertical.beautiful.view` + StoreProvider |
| Proxy API | 🟢 | `/api/proxy/beautiful` (scopeless `members/me`\|`roles`) |

---

## 10. Decisões de Arquitetura

| Decisão | Motivo |
| -------- | ------ |
| 100% MUI sem `@citybox/ui` | Evita misturar DS; alinhado a imóveis |
| AppSidebar 1 coluna | Navegação rasa; grupos no mesmo rail (como clínica no `@citybox/ui`) |
| Sem auth nesta fase | _(obsoleto — ver Auth BFF abaixo)_ |
| Auth BFF + Membership | Role `vertical.beautiful.view`; loja via `members/me` + StoreProvider |
| Máscara BR `formatPhoneBR` em `lib/field-masks.ts` | Formatação dinâmica de telefone/WhatsApp (limite 11 dígitos, apenas números) |
| Gerenciamento de Estado com `@tanstack/react-query` | Cache reativo, invalidação automática de mutações e controle de loading/error |
| Layout por Abas `CatalogShell` / `CatalogSectionNav` | Segue 100% o padrão de `SettingsShell` com faixa full-bleed no topo |
| Múltiplas Categorias em Array (`categories: string[]`) | Permite a associação de serviços e produtos a mais de uma categoria com o componente `MultiSelect` de `@citybox/mui/molecules` |
| Produtos exclusivamente para consumo interno | Produtos não têm preço de venda ou margem de lucro; utilizam `costPrice` e `unitOfMeasure` (`un`, `ml`, `g`, `L`, `kg`, `frasco`, etc.) |
| Renderização de `Select` via `<FormControl>` + `<Select>` | Substitui o wrapper folha `FormField` para renderizar seletores MUI com label flutuante e opções nativas |
| **Agenda integrada à API** | `appointment-service` + hooks React Query; listagem por `from`/`to` conforme a vista; create mapeia form → `clientId` **ou** `newClient` + `services[{ professionalId, serviceId }]`; toggle no form (`AppointmentClientFields`); invalida cache de clientes ao cadastrar inline; mock `mock-agenda.ts` removido; cor de coluna via `colorForProfessionalId` |
| **Detalhes do agendamento (Drawer)** | Clique no `AppointmentCard` abre `AppointmentDetailsDrawer` (`@citybox/mui` Drawer, padrão clientes/profissionais); exibe cliente/serviço/profissional/horário/valor/obs.; troca de status via `useUpdateAppointmentStatusMutation` (`PATCH …/status`); atalho WhatsApp (`wa.me`) — espelha o popover da clínica sem `@citybox/ui` |
| **Vista dia × horário de trabalho** | Uma requisição `GET /v1/members/work-schedules?memberIds=…` (filtro = colunas da vista); slots fora dos intervalos ficam cinza e sem clique; coluna de horário centralizada. **Linha “agora”** (`AgendaNowIndicator`) na vista dia quando a data é hoje (mesmo padrão da Clínica `CalendarTimeline`) |
| **Clientes lean (MVP)** | Nome + telefone + **categoria opcional**; sem `active`/e-mail/CPF; telefone formatado com `formatPhoneBR`; selecionável na Agenda |
| **Clientes paginação + KPIs** | `listClients` retorna envelope `{ data, meta, stats }` (`page`/`perPage`); `clients-page` com 3 KPIs (Total / Com Categoria / Sem Categoria) + paginação server-side via `DataTable`; Agenda consome `useClientsQuery({ perPage: 100 })` |
| **ClientFormDrawer (substituiu ClientFormDialog)** | Drawer 800px com `FormField`+`CategoryColorBadge`+footer fixo via `onRenderFooter`; `isSubmitting` bloqueia form e exibe `CircularProgress`; validação inline (nome ≥2 / telefone ≥10 dígitos) |
| **ClientDetailsDrawer redesenhado** | Largura 800px (era 420px); props `title`/`subtitle`/`footer` do `Drawer` DS; avatar com iniciais (2 letras); grid `Paper` por dado; `CategoryColorBadge`; botão WhatsApp + Editar (CASL `Can`) no footer |
| **ServiceFormDrawer com layout sheet** | Header customizado (ícone+título+subtítulo); corpo com `ServiceSheetSection`; `FormField` em vez de `TextField`; prop `loading` → `isSubmitting`; footer fixo com Cancelar/Salvar |
| **Settings + estoque mov. + ⌘K (Etapa 2)** | Forms reais em `/configuracoes*`; `adjustStock`/`listStockMovements` no catálogo; `CommandSearch` controlado com busca remota |
| **Estoque só na listagem** | Sem rota `/catalogo/estoque/[id]`. Clique na linha não navega; ações na tabela (movimentar/editar/ativar/excluir). Coluna **Situação**: Em estoque (verde) / Estoque baixo (laranja, no mínimo ou abaixo, com quantidade > 0) / Sem estoque (vermelho, quantidade 0). Paginação **server-side** via `DataTable` (`page`/`perPage`) em `GET /v1/products`. Dialog de movimentação registra IN/OUT |
| **Professional unificado em Member** | Sem `/v1/professionals` no web; roster em `/equipe`; papéis agendáveis `profissional`; `PATCH /v1/members/:id` com phone/role/permissions/serviceIds/week; tipos de grade em `lib/work-schedule.ts` |
| **CASL Fase G** | `@citybox/beautiful-permissions`; `features/permissions`; nav filtrada; Equipe checkboxes; **ações de mutação** (edit/delete/toggle/stock/agenda/status/settings) gated por página |
| **Financeiro (layout Clínica, API)** | `BEAUTIFUL_FINANCEIRO_TABS` + `FinanceiroSectionNav`; rotas `/financeiro/{fluxo-de-caixa,transacoes,configuracoes}`; UI MUI; dados via `services/financial-service.ts` + hooks; **sem** aba Comissões. **Ver** na tabela por meio de pagamento navega para `/financeiro/fluxo-de-caixa?paymentMethods=…` (`cash-flow-deep-link.ts`) para a aba acompanhar a página |
| **Horário de funcionamento da unidade = grade semanal** | Aba `/configuracoes/horario-de-funcionamento` com `StoreWorkScheduleEditor` no mesmo card da Configuração geral (dias + intervalos; presets Seg–Sex / sábado); tipos em `lib/work-schedule.ts`; `GET/PUT /v1/settings/store/work-schedule`. A configuração geral **não** tem abertura/fechamento (`openTime`/`closeTime` saíram da API) |
| **Tema visual por loja** | Catálogo curado em `theme-presets.ts`; persistido em `StoreSettings.themeId`; `StoreThemeProvider` aplica via `createAppTheme` + `next-themes`; tela `/configuracoes/aparencia` (`manage` Settings) |
| **Cor de categoria = hex livre** | Agendamento e clientes usam `CategoryColorField` (`input type="color"`), igual à Clínica; API persiste `#rrggbb`. `normalizeCategoryHex` cobre ids nomeados legados. |
| **Equipe em grade de cards** | Espelha a aba Equipe da Clínica: filtro de status + grid. `MemberCard` usa átomos `Card`/`CardHeader`/`CardContent`/`CardActions` de `@citybox/mui`. Status `active`/`disabled`. Ativar/desativar via `PATCH /v1/members/:id` (`delete` Team). Reset de senha via `POST /v1/members/:id/reset-password` (`update` Team) + dialog de credenciais. |
| **MemberDrawer Unificado** | Abstração em um único componente (`member-drawer.tsx`, largura 620px) que centraliza a lógica de formulário, validações, abas e Drawer para criação e edição de membros, eliminando a duplicação entre dialogs/drawers antigos. |
| **Aba de Permissões (Padrão Clínica)** | `MemberPermissionsPanel` redesenhado com sanfona expansível simples (`Accordion` MUI sem bordas), ícones semânticos do `@citybox/mui` por módulo, ordenação alfabética em pt-BR e botão "Marcar/Desmarcar todos" alinhado no rodapé com separador. |
| **Filtro de Equipe na API** | O filtro por status (`all` / `active` / `disabled`) repassa `status` como query parameter na requisição HTTP (`GET /v1/members?status=…`), executando o filtro diretamente no banco via API NestJS. |
| **EntryFormDrawer no Financeiro** | Lançamentos de receita/despesa (criação/edição) no Fluxo de Caixa migrados de Dialog para o componente `Drawer` (`entry-form-drawer.tsx`, largura 620px) de `@citybox/mui/molecules`. |
| **SettleEntryDrawer (Receber/Pagar) no Financeiro** | Liquidação de receita/despesa migrada de Dialog para `SettleEntryDrawer` (`settle-entry-drawer.tsx`, largura 620px), baseada no `receive-payment-sheet.tsx` da Clínica (resumo do lançamento, seletor de meios de pagamento com ícones exceto cheque, conta destino, valor, data e observação). |
| **AppointmentFormDrawer (Agenda)** | Formulário de criação/edição de agendamento em `Drawer` (`appointment-form-drawer.tsx`, largura 800px) seguindo o padrão do estoque (`StockEntryDrawer`). Ao selecionar uma opção de cliente (existente/novo), renderiza todos os campos de agendamento na mesma visualização sem etapas intermediárias. |
| **Cor do Card na Agenda (Status)** | A cor de fundo dos cards de agendamento (`AppointmentCard`) é determinada exclusivamente pelo status do agendamento (`APPOINTMENT_STATUS_VISUAL[status].softBg`: azul para Agendado, roxo para Confirmado, amarelo para Em atendimento, verde para Concluído, cinza para Cancelado, vermelho para Falta). |
| **Módulo Dashboard da Tela Inicial (`features/dashboard`)** | Thin page (`app/(app)/page.tsx` → `BeautifulDashboardPage`). Layout alinhado ao mock `apps/verticals/beautiful/dashboard-redesign.html`: ticket do dia (`dashboard-day-ticket`) com recorte em scallop, timeline de agendamentos, tiles de atalho, ledger financeiro e resumo de estoque (`DashboardPanel`). **Modo claro:** wash `linear-gradient` no ticket + radial na página. **Modo escuro:** superfícies sólidas (`backgroundImage: none`, sem sombra tingida de `primary`) — o scallop (perfurado) permanece. Tipografia e cores só via tema; números com `fontVariantNumeric: tabular-nums`. |

---

## 11. Contexto para a IA

- Nova tela: entrada em `navigation.ts` → rota fina → `features/<name>/`.
- Para dados assíncronos: criar `services/<feature>-service.ts` e `hooks/use-<feature>-queries.ts`.
- Não reinventar Button/PageHeader/DataTable — usar `@citybox/mui` (ou wrappers locais depois).
- Atualizar este AGENTS ao mudar shell, porta ou auth.

---

## 12. Histórico de Mudanças Estruturais

| Data | Mudança | Impacto |
| ---- | ------- | ------- |
| 2026-08-20 | **Dark mode do tema da loja:** ícones herdam `text.primary` (DS MUI); Painel do dia sem gradiente/sombra de marca no escuro | `@citybox/mui` + `dashboard-day-ticket` + `theme-presets` action |
| 2026-08-20 | **Temas dinâmicos por loja:** 8 presets Light/Dark (`theme-presets.ts`); `StoreThemeProvider` (localStorage + GET/PATCH settings); aba `/configuracoes/aparencia` | `providers.tsx` + settings appearance + `BEAUTIFUL_SETTINGS_TABS` |
| 2026-08-20 | **Equipe: OWNER vs cargo operacional:** badge Responsável via `organizationRole`; drawer oculta alteração de permissões do OWNER; card sem botão desativar para OWNER | `member-card.tsx` + `member-drawer.tsx` + `members-page.tsx` + `member-service.ts` |
| 2026-08-17 | **Agenda — horário atual no calendário:** linha primária + HH:mm na vista dia (`AgendaNowIndicator`, atualiza a cada minuto, só se a data for hoje); rótulo “Agora HH:mm” na coluna de hoje da vista semana | `agenda-now-indicator.tsx` + `day-agenda-grid` + `week-agenda-grid` |
| 2026-08-17 | **Redesign da tela inicial:** ticket "Resumo de hoje", timeline da agenda, atalhos em tiles e laterais financeiro/estoque; KPIs em cards soltos removidos; tokens do tema (sem cores/fontes hardcoded do mock) | `features/dashboard/*` |
| 2026-08-17 | **Clientes paginação server-side + KPIs stats:** `listClients` retorna `PaginatedClientsResult` (`{ data, meta, stats }`); `clients-page` com 3 KPIs (Total / Com Categoria / Sem Categoria) + paginação `DataTable` (`page`/`perPage`); busca reseta page; Agenda consome `useClientsQuery({ perPage: 100 })` | `features/clients/*` + `features/agenda/pages/agenda-page.tsx` |
| 2026-08-17 | **`ClientFormDialog` → `ClientFormDrawer`:** novo `client-form-drawer.tsx` (800px) com `FormField`/`CategoryColorBadge`/footer fixo (`onRenderFooter`); `ClientFormDialog` removida do barrel `index.ts` | `features/clients/components/client-form-drawer.tsx` + `clients-page.tsx` + `index.ts` |
| 2026-08-17 | **`ClientDetailsDrawer` redesenhado:** largura 420→800px; props `title`/`subtitle`/`footer` do `Drawer` DS; avatar iniciais 2 letras; `CategoryColorBadge`; grid `Paper` por campo; botão WhatsApp + Editar (CASL `Can`) no footer | `features/clients/components/client-details-drawer.tsx` |
| 2026-08-17 | **`ServiceFormDrawer` layout sheet:** header customizado (ícone+título+subtítulo) + `ServiceSheetSection` + `FormField` (substitui `TextField`); prop `loading` → `isSubmitting`; footer fixo Cancelar/Salvar | `features/catalog/components/service-form-drawer.tsx` + `services-page.tsx` |
| 2026-08-17 | **Fix hooks order no `MemberDrawer`:** blocos `showLoading`/`showLoadError` (early returns) movidos para depois do `useEffect` de `onRenderFooter`, corrigindo violação das regras de hooks do React | `features/members/components/member-drawer.tsx` |
| 2026-08-14 | **Remoção do PageHeader na Tela Inicial:** remoção do componente `PageHeader` (título "Início", descrição com data e botão de ação "Novo agendamento") do `BeautifulDashboardPage` (`beautiful-dashboard-page.tsx`), iniciando a tela diretamente no bloco de cartões KPI. | `beautiful-dashboard-page.tsx` |
| 2026-08-14 | **Remoção de Hover nos Cards KPI do Dashboard:** remoção dos efeitos visuais de hover (`translateY` e alteração da cor da borda) no `KpiCardItem` (`dashboard-kpi-cards.tsx`). | `dashboard-kpi-cards.tsx` |
| 2026-08-14 | **Ajustes de UI no Dashboard da Tela Inicial:** remoção do box de alerta ("Atenção aos insumos") no `DashboardStockSummaryCard` e padronização da cor e formatação suave nos textos secundários em todos os cartões do dashboard. | `src/features/dashboard/components/*` |
| 2026-08-14 | **Módulo Dashboard e Thin Page na Tela Inicial:** criação do módulo `src/features/dashboard/` com sub-componentes modularizados (`dashboard-kpi-cards`, `dashboard-appointments-card`, `dashboard-shortcuts-card`, `dashboard-financial-card`, `dashboard-stock-summary-card`), hook `useDashboardData` e página `BeautifulDashboardPage`. Rota `app/(app)/page.tsx` convertida para *thin page*. | `src/features/dashboard/*` + `src/app/(app)/page.tsx` |
| 2026-08-14 | **Cor dos Cards da Agenda Baseada no Status:** atualização no `AppointmentCard` (`appointment-card.tsx`) para utilizar estritamente a cor do status do agendamento (`APPOINTMENT_STATUS_VISUAL[status].softBg`) no fundo do card em todas as visualizações (mês, semana e dia). | `appointment-card.tsx` |
| 2026-08-14 | **Formulário de Agendamento em Drawer Único (`AppointmentFormDrawer`):** atualização no `AppointmentFormDrawer` (`appointment-form-drawer.tsx`, largura 800px) para renderizar todos os campos de agendamento na mesma visualização imediatamente ao selecionar o tipo de cliente (existente/novo), sem necessidade de etapas ou botão "Continuar". | `appointment-form-drawer.tsx` |
| 2026-08-14 | **Layout de Serviços alinhado ao Estoque:** `ServicesHeaderCard` (preço médio + barra Ativos/Inativos); título da seção removido; CTA Novo Serviço na barra de busca; filtros Todos/Ativos/Inativos removidos; paginação server-side via `DataTable` | `services-page.tsx` + `services-header-card.tsx` + `list-services` API |
| 2026-08-14 | **Paginação server-side no estoque:** a tabela de produtos usa `pagination` do `DataTable` (`@citybox/mui`); `GET /v1/products` passa a envelope `{ data, meta, stats }` (`page`, `perPage`) | `stock-page.tsx` + `catalog-service.ts` + `list-products` API |
| 2026-08-14 | **Coluna Situação no estoque:** a listagem de produtos ganha a coluna Situação (`Em estoque` / `Estoque baixo` / `Sem estoque`) com chips verde/laranja/vermelho; Estoque Atual mostra só quantidade + unidade. Classificação em `getStockSituation` (mesma regra do `StockHeaderCard`) | `catalog.types.ts` + `stock-page.tsx` + `stock-header-card.tsx` |
| 2026-08-14 | **Formulário de Serviços em Drawer (`ServiceFormDrawer`):** migração do cadastro/edição de serviços de Dialog para `ServiceFormDrawer` (`service-form-drawer.tsx`, largura 800px) utilizando `@citybox/mui/molecules` | `service-form-drawer.tsx` + `services-page.tsx` |
| 2026-08-14 | **Alinhamento dos Botões com o Campo de Pesquisa:** os botões de ação ("Histórico de Movimentações" e "Registrar Estoque") passam a ser posicionados alinhados à direita do campo de busca `SearchInput` no mesmo container visual `Paper`. Removidos os botões de filtro por status ("Todos", "Ativos", "Inativos") | `stock-page.tsx` |
| 2026-08-14 | **Remoção do Título "Estoque de Produtos":** prop `sectionTitle?: string` tornada opcional no `CatalogShell` (`catalog-shell.tsx`) com renderização condicional do cabeçalho, e omitida na página de estoque (`stock-page.tsx`) | `catalog-shell.tsx` + `stock-page.tsx` |
| 2026-08-14 | **Indicadores do Estoque (`StockHeaderCard`):** implementação do componente de estatísticas de estoque espelhado no modelo da Clínica (`header-stock.tsx`), exibindo o **Total do valor Ativo** (soma R$ de estoque em custo unitário, com fundo suave `#E8F4F8` no container do ícone e tom primário), **Produtos Cadastrados**, **Barra de Progresso Multicor** proporcional (Em estoque, Estoque baixo, Sem estoque) e legenda contadora com indicadores visuais coloridos | `stock-header-card.tsx` + `stock-page.tsx` |
| 2026-08-14 | **Entrada de Estoque em Lote em 1 Única Requisição HTTP:** adição de `adjustStockBatch` em `catalog-service.ts` e `useAdjustStockBatchMutation` em `use-catalog-queries.ts`, enviando a lista de produtos com suas quantidades para a rota de lote da API (`POST /v1/products/stock-movements/batch`) em **uma única requisição HTTP atômica** | `catalog-service.ts` + `use-catalog-queries.ts` + `stock-page.tsx` |
| 2026-08-14 | **Histórico de Movimentações Server-Side Paginado (`StockWithdrawalHistoryDrawer`):** atualização do `StockWithdrawalHistoryDrawer` (`stock-withdrawal-history-drawer.tsx`, largura 780px) para consumir a API paginada (`GET /v1/products/stock-movements`), trazendo entradas (`IN`) e saídas (`OUT`), com filtros por tipo e produto (sem campo SearchInput), além de barra de paginação server-side | `stock-withdrawal-history-drawer.tsx` + `catalog-service.ts` + `use-catalog-queries.ts` |
| 2026-08-14 | **Subtítulo/Texto secundário em Drawers com cor mais clara:** atualização do componente `Drawer` de `@citybox/mui/molecules` adicionando o prop `subtitle` com estilização suave (`color: text.secondary`, `opacity: 0.75`), padronizando o cabeçalho em todos os drawers do sistema | `drawer.tsx` + `stock-withdrawal-drawer.tsx` + `stock-entry-drawer.tsx` |
| 2026-08-14 | **Retirada de Estoque (`StockWithdrawalDrawer`):** refatoração da ação de movimentação para `StockWithdrawalDrawer` (`stock-withdrawal-drawer.tsx`, largura 520px) em `@citybox/mui/molecules`, focada exclusivamente na **saída/retirada de estoque** (`OUT`), com exibição de saldo disponível em tempo real, validação de quantidade, registro de motivo e modal de confirmação (`ConfirmationDialog`) exibindo o resumo e o estoque resultante antes de efetivar | `stock-withdrawal-drawer.tsx` + `stock-movement-dialog.tsx` + `stock-page.tsx` |
| 2026-08-14 | **Removida página de detalhes do produto:** sem rota `/catalogo/estoque/[id]`; listagem não navega nem tem botão Ver; cadastro permanece em `/catalogo/estoque` | `product-detail-page.tsx` + `estoque/[id]/page.tsx` + `stock-page.tsx` |
| 2026-08-14 | **Entrada no Estoque (`StockEntryDrawer`):** migração da criação/entrada de produtos de Dialog para `StockEntryDrawer` (`stock-entry-drawer.tsx`, largura expandida de 680px) utilizando `@citybox/mui` e espelhando a referência da Clínica (`stock-entry-sheet`): seletor de opções com cards visuais, cadastro de novo produto (SKU opcional sem preenchimento/geração automática; sem switch de produto ativo) e entrada de quantidade em lote com confirmação em modal (`ConfirmationDialog`) | `stock-entry-drawer.tsx` + `stock-page.tsx` |
| 2026-08-14 | **Ver em Transações → Fluxo de caixa:** o botão Ver deixa de trocar só o `viewMode` na mesma rota (`/financeiro/transacoes`); navega para `/financeiro/fluxo-de-caixa` com query de período/meio de pagamento para a aba horizontal atualizar | `transactions-page.tsx` + `cash-flow-page.tsx` + `cash-flow-deep-link.ts` |
| 2026-08-14 | **Botões de ação fixos no rodapé dos Drawers:** os componentes `EntryFormDrawer`, `SettleEntryDrawer` e `MemberDrawer` passam os botões de ação na prop `footer` de `Drawer` (`@citybox/mui/molecules`), garantindo que fiquem 100% fixos no rodapé com separador | `entry-form-drawer.tsx` + `settle-entry-drawer.tsx` + `member-drawer.tsx` |
| 2026-08-14 | **Ver Pagamento → `SettleEntryDrawer`:** ação "Ver pagamento" da tabela de fluxo de caixa passa a abrir o `SettleEntryDrawer` em modo somente leitura (`viewMode=true`), desabilitando formulários e exibindo apenas o botão "Fechar" no rodapé | `cash-flow-page.tsx` + `settle-entry-drawer.tsx` |
| 2026-08-14 | **Receber/Pagar → `SettleEntryDrawer`:** componente de liquidação migrado para `Drawer` de `@citybox/mui/molecules` com o layout da Clínica (`receive-payment-sheet.tsx`), resumo do lançamento, picker visual de meios de pagamento (sem cheque) e observações | `settle-entry-drawer.tsx` + `cash-flow-page.tsx` |
| 2026-08-14 | **Fluxo de caixa → `EntryFormDrawer`:** formulário de criação/edição de receita e despesa migrado para `Drawer` de `@citybox/mui/molecules` (removido `entry-form-dialog.tsx`) | `entry-form-drawer.tsx` + `cash-flow-page.tsx` |
| 2026-08-14 | **Filtro de equipe na API:** `useMembersQuery({ status })` repassa o filtro de status para a query string HTTP (`GET /v1/members?status=…`) | `members-page.tsx` |
| 2026-08-14 | **Tooltips nos cards de equipe:** botões de ação Editar, Gerar nova senha e Ativar/Desativar em `MemberCard` envolvidos por `Tooltip` do `@citybox/mui/atoms` | `member-card.tsx` |
| 2026-08-14 | **Timeout de 1.5s pós-cadastro de membro:** adicionada espera intencional de 1.5s durante o estado `isSubmitting` para manter a animação de carregamento antes de exibir a notificação e o modal de credenciais | `members-page.tsx` |
| 2026-08-14 | **Auto-sugestão de Username:** `suggestUsernameFromName` e `normalizeUsernamePart` em `member-ui.ts`; preenche automaticamente o username enquanto digita nome e sobrenome (com flag `usernameManuallyEdited` para respeitar edições manuais) | `member-ui.ts` + `member-drawer.tsx` |
| 2026-08-14 | **Permissões estilo Clínica:** `MemberPermissionsPanel` atualizado com sanfona sem borda, ícones semânticos por módulo, ordenação alfabética e botão "Marcar/Desmarcar todos" no rodapé | `member-permissions-panel.tsx` |
| 2026-08-14 | **Unificação de Drawer de Membro (`MemberDrawer`):** substitui componentes duplicados `member-create-drawer` e `member-edit-drawer` por um componente central `member-drawer.tsx` com largura expandida (620px) e abas de formulário | `member-drawer.tsx` + `members-page.tsx` + `index.ts` |
| 2026-08-14 | **Reset senha da equipe:** botão no `MemberCard` → confirmação → `POST /v1/members/:id/reset-password` → dialog de credenciais | `member-card.tsx` + `members-page.tsx` + `member-service.ts` |
| 2026-08-14 | **`MemberCard` → átomos Card do DS:** `Card` + `CardHeader` + `CardContent` + `CardActions` de `@citybox/mui/atoms` | `member-card.tsx` + `member-grid-skeleton.tsx` |
| 2026-08-14 | **Equipe → grade de cards (layout Clínica):** remove KPIs/DataTable; filtro Exibir + `MemberCard`; ativar/desativar com confirmação | `features/members/pages/members-page.tsx` + `member-card.tsx` |
| 2026-08-14 | **Tipografia secundária nas settings:** labels/placeholders/descrições/loading usam `settings-muted.ts` (muted-foreground); valores e títulos em `text.primary` | `features/settings/lib/settings-muted.ts` + páginas/componentes de `/configuracoes*` |
| 2026-08-14 | **`SettingsShell.description`:** subtítulo abaixo do título da aba; categorias de agendamento e clientes usam o texto da Clínica | `settings-shell.tsx` + páginas de categorias |
| 2026-08-13 | **Categorias settings → seletor de saturação:** `CategoryColorField` (`input type="color"`) nas abas de agendamento e clientes; cores hex via API | `category-color-field.tsx` + páginas de categorias |
| 2026-08-13 | **Horário de funcionamento → layout clean:** mesmo card da Configuração geral (sem hero, heatmap, cartões por dia nem barra flutuante); grade por dia + intervalos + presets + Salvar no rodapé | `settings-work-schedule-page.tsx` + `store-work-schedule-editor.tsx` |
| 2026-08-13 | **Configuração geral sem `sectionTitle`:** `SettingsShell` omite o H6 quando o título não é passado; a aba geral fica só com a nav horizontal | `settings-shell.tsx` + `settings-general-page.tsx` |
| 2026-08-13 | **Configuração geral → layout Clínica:** remove hero/modo visualização/barra flutuante; um card com seções (dados + logo à direita, contatos, localização) e Salvar no rodapé; logo compacta (upload no clique) | `settings-general-form.tsx` + `store-logo-upload.tsx` |
| 2026-08-12 | **Máscara de moeda BRL:** `maskCurrencyInput`, `parseCurrencyInput`, `formatCurrencyInput` em `lib/field-masks.ts` | Aplicada nos campos de valor em `ServiceFormDialog`, `SettleEntryDialog` e `EntryFormDialog` (Nova Receita / Nova Despesa) |
| 2026-08-12 | **Fix Auth Gate:** `hasBackofficeAccess` em `lib/vertical-permissions.ts` agora executa `resolveBackofficePermissions(permissions)` | Resolve 403 `no_backoffice_access` no `POST /api/auth/token` para usuários com `platform_admin` ou `store_staff` |
| 2026-08-12 | **Financeiro tabelas → `DataTable`:** Fluxo/Transações/Config alinhados ao padrão clients/settings (IconButtons, empty/loading, paginação do organismo) | Remove MUI Table cru do módulo |
| 2026-08-12 | **Financeiro → API:** `financial-service` + React Query; remove `mock-financeiro.ts`; mappers cents↔BRL; dialogs CRUD + settle; **sem Comissões** | Fluxo/Transações/Config leem `v1/financial/*` |
| 2026-08-12 | **Financeiro UI mock (layout Clínica):** abas Fluxo/Transações/Config; KPIs + tabelas MUI; `BEAUTIFUL_FINANCEIRO_TABS`; sem API | Substitui placeholder `/financeiro` |
| 2026-08-11 | **Equipe layout padrão:** remove padding duplo; KPIs (total/ativos/profissionais/desativados); filtros e tabela em Papers separados; rota thin como Clientes | Paridade visual com listagens do Beautiful |
| 2026-08-11 | **1ª aba autorizada:** `firstAllowedSettingsPath`/`CatalogPath`; sidebar/⌘K/home/header resolvem path; section-nav `replace` se rota negada | Configurações/Catálogo abrem na aba permitida |
| 2026-08-11 | **CASL nas ações da UI:** create/edit/delete/toggle/stock/agenda/status/settings gated com `useCan`/`Can`; nav settings sem `read` Category solto; home atalhos filtrados | Front não oferece mutações sem permissão |
| 2026-08-11 | **`UnitSwitcher` real:** lojas de `useStore` / `members/me`; troca chama `setStore` + `setActiveStoreId` + `invalidateQueries` | Remove mock Centro/Shopping/Orla |
| 2026-08-11 | **Equipe dialogs em 2 passos:** criar/editar usam `ProgressMobileStepper` (info+horário → permissões); edit com campos de identidade; create aplica `week`/`serviceIds` via PATCH pós-convite | UX alinhada a profissional |
| 2026-08-11 | **Equipe única:** remove nav/página Profissionais; filtro Select de papel em `/equipe` | Um item de menu; sem aba paralela |
| 2026-08-11 | **Fase G CASL (web):** package permissions; nav/`Can`; Equipe checkboxes; presets por papel | Authz alinhada à API |
| 2026-08-11 | **Professional→Member unification (web):** remove `features/professionals`; roster em `features/members` (`/v1/members`); agenda filtra `role=profissional` + `work-schedules?memberIds`; tipos de grade em `lib/work-schedule.ts` | Um mental model de equipe; sem CRUD paralelo |
| 2026-08-11 | **Equipe (acessos):** `/equipe` + `features/members` — convite `POST /v1/members` na loja ativa; dialog com senha provisória | UI Equipe lean (sem listagem ainda) |
| 2026-08-10 | **Remove `NEXT_PUBLIC_DEFAULT_STORE_ID`:** `X-Store-Id` só do StoreProvider | Alinhado ao storeId do admin |
| 2026-08-10 | **Etapa 4 Fase E:** StoreProvider + `members/me` + gate `vertical.beautiful.view` + proxy scopeless | Loja ativa; 0 lojas bloqueia shell |
| 2026-08-10 | **Etapa 4 Fase D:** compose web com `BEAUTIFUL_API_URL` + Keycloak; sem URL Nest pública | Alinhado ao padrão clínica |
| 2026-08-10 | **Etapa 4 Fase C:** BFF/PKCE + `/api/proxy/beautiful` + login/gate; remove `NEXT_PUBLIC_AUTH_DEV_BYPASS` | Tokens httpOnly; `beautifulFetch` same-origin |
| 2026-08-10 | **Etapa 4 Fase A:** `NEXT_PUBLIC_AUTH_DEV_BYPASS` em `beautifulFetch` (Bearer dev-admin) | Mantém web funcional com AuthGuard até BFF |
| 2026-08-07 | **Componente dedicado `StoreWorkScheduleEditor` + Tooltips em todos os botões** | Remoção do botão redundante `Seg-Sex (09h-18h)` e inclusão de `Tooltip` explicativos em todos os botões e ícones de ação da página de horário de funcionamento e editor. |
| 2026-08-07 | **Componente dedicado `StoreWorkScheduleEditor` para Configurações** | Criado componente do zero para gestão full-page de horário de funcionamento: lista ampla de 7 cartões diários, barra de atalhos e preenchimento rápido (comercial/sábado), mapa de calor semanal de horas de atendimento e cálculo automático de duração por turno. |
| 2026-08-07 | **Melhoria visual na página de Horário de Funcionamento** | Redesign da página de grade semanal em `SettingsWorkSchedulePage` com Banner Hero de estatísticas da semana (dias ativos/folga) e barra de ação flutuante (`Paper` com feedback e CTAs de salvar/descartar). |
| 2026-08-07 | **Horário de funcionamento vira grade semanal** | Nova aba `/configuracoes/horario-de-funcionamento` com `WorkScheduleEditor` + hooks `useStoreWorkScheduleQuery`/`useReplaceStoreWorkScheduleMutation`; `openTime`/`closeTime` removidos do form geral e do `settings-service` |
| 2026-08-08 | **Detalhe de produto + histórico de estoque** | Rota `/catalogo/estoque/[id]`; listagem abre detalhes; dialog só registra IN/OUT |
| 2026-08-07 | **Melhoria visual no layout da página de Settings Geral** | Redesign completo com Hero Profile Card da marca, visual cards por seção (`Grid` + ícones semânticos), uploader de logotipo com preview/hover e barra de ação inferior flutuante (`Paper` com feedback e CTAs de salvar/descartar). |
| 2026-08-07 | **Etapa 2 P1:** settings enriquecido + logo upload; categorias clientes (cor/proteção); aba categorias de agendamento; agenda `categoryId` | §4 `Configurações.md` |
| 2026-08-07 | **Etapa 2:** settings real + categorias + estoque mov. + ⌘K | Placeholders de config fechados; busca remota no header |
| 2026-08-07 | **Etapa 1 (sem seed):** editar/remarcar/cancelar + Início lean | Form edit; drawer CTAs; home com stats do dia |
| 2026-08-06 | **Agenda: drawer de detalhes do agendamento** | Clique no card → `AppointmentDetailsDrawer`; status PATCH + WhatsApp; grids passam `onSelectAppointment` |
| 2026-08-06 | **Agenda: cadastro de cliente no form** | Toggle cadastrado/novo; POST com `newClient`; invalida `CLIENTS_QUERY_KEY` |
| 2026-08-06 | **Agenda → API real** | Removido `mock-agenda.ts`; `appointment-service` + React Query; opções de form via clients/professionals/services |
| 2026-08-06 | Agenda usa atom **`Card`** do `@citybox/mui` | `AppointmentCard` + containers da `AgendaPage`; export `AppointmentCard` no barrel |
| 2026-08-06 | **Agenda mock (mês/semana/dia)** | Feature `src/features/agenda`: toolbar, filtro profissionais, grids + form de criação; rota `/agenda` deixa o placeholder |
| 2026-08-06 | **Edit carrega GET by id (dados + horários)** | `useProfessionalByIdQuery` no form; `professionalId` em vez de objeto da lista; API `GET :id` com `week` |
| 2026-08-06 | **Horário no formulário de profissional** | `ProfessionalFormDialog` embute `WorkScheduleEditor`; create/update enviam `week` no POST/PATCH; edição carrega grade via GET by id |
| 2026-08-06 | **`WorkScheduleEditor` — layout estável sem scroll** | Editor de horários extraído do dialog: Tabs Seg–Dom, slots de intervalo reservados (altura fixa), alerta com reserva de espaço; dialog só carrega/salva |
| 2026-08-06 | **Horários de trabalho do profissional** | `ProfessionalWorkScheduleDialog` + hooks GET/PUT `work-schedule`; CTA na tabela (ícone clock) e no drawer; grade semanal com intervalos e atalhos |
| 2026-08-06 | **Feature Clientes (`src/features/clients`)** | Página `/clientes` integrada a `/v1/clients`; form dialog (nome+telefone), drawer, DataTable, busca server-side com debounce 400ms; placeholder removido |
| 2026-08-05 | **Listagem de profissionais usa `services[].name` da API** | Removido `useServicesQuery` da página/drawer para resolver nomes; MultiSelect do form ainda lista o catálogo |
| 2026-08-05 | **Remoção de specialties na UI de profissionais** | Form/tabela/drawer só com `serviceIds`; busca por nome/telefone/e-mail |
| 2026-08-05 | **Vínculo Profissional ↔ Serviços do catálogo na UI** | Form/tabela/drawer de profissionais com `serviceIds`; MultiSelect alimentado por `useServicesQuery`; create/update enviam `serviceIds` à API; invalidação cruzada do cache de serviços |
| 2026-08-05 | **Padronização de Layout da Página de Profissionais (`ProfessionalsPage`)** | Alinhamento da estrutura do container de página de [`professionals-page.tsx`](file:///home/arouca/Aplopes/citybox/apps/verticals/beautiful/web/src/features/professionals/pages/professionals-page.tsx) com o padrão adotado em `CatalogShell` e `SettingsShell` (removendo `maxWidth: 1400` desnecessário e duplo espaçamento `p: 2/3`, ajustando `DataTable` com `minHeight: 350`). |
| 2026-08-05 | **Remoção Total de Dados Mocados no Catálogo (`mock-catalog.ts`)** | Eliminação completa dos arrays mocados `INITIAL_SERVICES` e `INITIAL_PRODUCTS`. As listagens e mutações de Serviços e Produtos agora dependem 100% dos dados persistidos no PostgreSQL através da API NestJS (`@citybox/beautiful-api`). |
| 2026-08-05 | **Integração Real HTTP com API NestJS (`/v1/services` e `/v1/products`)** | Conexão do módulo de Catálogo e Estoque (`catalog-service.ts`) diretamente às rotas REST da API backend (`@citybox/beautiful-api`) via `beautifulFetch` e `@tanstack/react-query`, com suporte a filtros backend de busca textual, categorias e status ativo/inativo. |
| 2026-08-05 | **Remoção do Campo de Categorias em Produtos de Consumo Interno** | O campo de categorias (`categories`) passa a pertencer exclusivamente à entidade de Serviços (`ServiceItem`). Ele foi completamente removido dos tipos de produto (`ProductItem`, `ProductFormData`), do formulário ([`product-form-dialog.tsx`](file:///home/arouca/Aplopes/citybox/apps/verticals/beautiful/web/src/features/catalog/components/product-form-dialog.tsx)), do drawer de detalhes e da listagem de estoque ([`stock-page.tsx`](file:///home/arouca/Aplopes/citybox/apps/verticals/beautiful/web/src/features/catalog/pages/stock-page.tsx)). |
| 2026-08-05 | **Filtros no Backend + Debounce de Busca** | Filtro de busca (`searchTerm` com debounce de 400ms via `useDebouncedValue`) e status (`statusFilter`) integrados diretamente via query params na API backend (`GET /v1/professionals`), removendo a filtragem client-side no React. |
| 2026-08-05 | **Conexão com API NestJS + React Query + Remoção de Mocks + Mensagens Amigáveis + Layout de Altura Constante** | Integração via `beautifulFetch` e `professional-service.ts`; adoção do `@tanstack/react-query` (`QueryClientProvider`, `useProfessionalsQuery`, `useMutation`); remoção total de mocks em `mock-professionals.ts`; mensagens sem jargão técnico; layout flexbox que impede o encolhimento da página quando vazia |
| 2026-08-04 | Implementação da UI completa da feature **Profissionais** (`src/features/professionals`) + Máscara BR de telefone (`lib/field-masks.ts`) e validação de e-mail | Tela de listagem, formulário de cadastro/edição (key-reset), filtro por status, drawer de detalhes, alinhamento ao MVP Lean sem clientes/comissões |
| 2026-08-03 | Menu flat + Configurações com nav horizontal | Catálogo/Profissionais; abas geral/categorias |
| 2026-08-03 | Migra shell Dual → **AppSidebar** 1 coluna | Usa novo organism do `@citybox/mui` |
| 2026-08-03 | Scaffold Next + MUI + home | App nasce no monorepo |
