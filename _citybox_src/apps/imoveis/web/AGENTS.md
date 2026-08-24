<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — Imóveis Web (@citybox/imoveis-web)

> **Para agentes de IA:** Este arquivo é a fonte de verdade do app `apps/imoveis/web`.
> Leia-o antes de qualquer ação neste escopo e atualize-o na mesma operação em que
> mudar stack, configuração, rotas ou padrões. Nunca remova seções — apenas atualize
> ou adicione. Contexto global: [`AGENTS.md`](../../../AGENTS.md) raiz.

---

## 1. Identidade do Módulo

| Campo | Valor |
| ----- | ----- |
| **Nome** | `apps/imoveis/web` · pacote `@citybox/imoveis-web` |
| **Tipo** | Frontend Next.js 16 (App Router) |
| **Porta dev** | **3111** (`pnpm --filter @citybox/imoveis-web dev`) |
| **Status** | 🟢 Dashboard, leads + imóveis + agenda + negócios/financeiro + busca FTS + lembretes + settings + **ajuda (`/help`)** + catálogo público; **auth Keycloak (BFF PKCE)** + **CASL multi-loja** (`PermissionsProvider` → `StoreProvider`, `/entrada`, `/selecionar-loja`); mock RBAC só sem SSO |
| **Última atualização deste arquivo** | 2026-08-21 — capa do catálogo público segue a 1ª foto do imóvel |

**Propósito em uma linha:** frontend da vertical de imóveis — painel de gestão do
corretor (leads, imóveis, negócios) mais o site público, sobre **`@citybox/mui`**
(tema em `src/theme/` com paridade visual ao look anterior).

**Header:** `DashboardHeader` alinhado ao topbar Figma Listify — logo + nav em pill
cinza (ativo laranja), ações circulares (**busca** `CommandPalette` ⌘K /
**notificações** = lembretes reais) + `UserMenu` (item **Ajuda & Suporte** acima de Configurações → `/help`).
Ajuda **não** entra no pill nem nos ícones do header. Desktop (`lg+`): pill 56px + avatar 48px.
Mobile/tablet: hamburger + drawer (`DashboardMobileNav`);
botões e avatar compactos; safe-area no `DashboardShell`. Configurações: chips horizontais no telefone (fade + seta quando há mais itens), lateral no desktop.

---

## 2. Stack

| Item | Versão | Observação |
| ---- | ------ | ---------- |
| Next.js | 16.2.7 | App Router + Turbopack; alinhado com erp/admin-web |
| React | 19.2.7 | **mesma versão do erp/admin** — divergir duplica o React no bundle |
| Tailwind | 4.3.0 | utilitários residuais no app (`globals.css` + `theme.css`); sem `tailwind.config.ts` |
| `@citybox/mui` | `workspace:*` | **único design system** (atoms/molecules/organisms + `createAppTheme`) |
| `@mui/material` | 9.x | peers do MUI (Emotion); gaps ok importar path-a-path |
| `@mui/icons-material` | 9.x | ícones — import path-a-path (`@mui/icons-material/Add`) |
| `@emotion/react` / `styled` / `cache` | 11.x | runtime de estilo do MUI |
| Color mode | `src/lib/color-mode.tsx` — cookie SSR (`imoveis.theme`) + bootstrap no início do `<body>` (`BootstrapScripts` RSC); MUI usa o mesmo modo no 1º paint (sem FOUC light→dark) |
| @tanstack/react-query | 5.x | estado assíncrono (transações/financeiro) |
| zod | 4.x | schemas de formulário (transações / split) |
| sonner | 2.x | peer do Toaster MUI — **não** importar `toast` de `sonner` (usar `@citybox/mui`) |
| recharts | 3.x | gráfico de desempenho do dashboard |
| `@dnd-kit/*` | — | kanban de leads (board local em `src/components/kanban/`) |
| `browser-image-compression` | 2.x | fotos do imóvel → WebP no cliente (Web Worker); script em `public/vendor/` para o worker não ir ao CDN |
| `heic2any` | 0.0.x | HEIC/HEIF do iPhone → JPEG no cliente **antes** do WebP; a API **não** aceita HEIC |
| `leaflet` + `react-leaflet` | 1.9 / 5.x | Mesmo mapa no form (dynamic `ssr: false`, pin **travado** até Editar/Salvar) e no **catálogo público** (só leitura, sem GPS) |

> **DS:** só `@citybox/mui` + MUI oficial. **Proibido:** `@citybox/ui` / `packages/ui` /
> `lucide-react`. Gaps: MUI → criar compondo MUI (`src/components/`). Plano histórico:
> [`.claude/plans/imoveis/mui-migration.plan.md`](../../../.claude/plans/imoveis/mui-migration.plan.md).

---

## 3. Integração com o design system

1. **`next.config.ts`** → `transpilePackages: ['@citybox/mui', 'react-leaflet', '@react-leaflet/core']` (source, sem build); `serverExternalPackages: ['browser-image-compression', 'heic2any']`.
2. **`tsconfig.json`** → `paths` de `@citybox/mui` e `@citybox/mui/*` → `packages/mui/src`.
3. **`src/theme/`** → tema Imóveis a partir do **Design Guide Listify** (Figma):
   - `tokens/` — cores (Primary/Greyscale/Alert/Sky), tipografia Manrope, spacing 4px, radii, shadows
   - `presets/imoveis-theme.ts` — `createAppTheme` com tokens + dark overrides
   - `accent-color.ts` — 7 accents; default orange = Primary/300 `#ff8415`
   - `accent-styles.ts` — gradientes/superfícies do accent (`primarySoftSurface` usa
     `background.paper` no dark)
   - `listify-field-styles.ts` — inputs de página + paper de modal (theme-aware; neutraliza autofill azul Chromium via `listifyAutofillSurfaceStyles`)
   - `semantic-palette.ts` — success/warning/error/info do guide
   - `imoveis-mui-theme.ts` — entry (reexporta tokens + options)
4. **`AppProviders`** (`src/app/providers.tsx`):
   `AuthSessionProvider` → `PermissionsProvider` → `StoreProvider` → `QueryClientProvider` →
   `AppRouterCacheProvider` → `ColorModeProvider` → `ImoveisMuiThemeProvider`
   → `AccentThemeSync` + `NextTopLoader`.
5. **`globals.css`** → Tailwind local + `styles/theme.css` (tokens/utilitários residuais);
   **sem** `@citybox/ui/styles`.
6. **Toaster / toast** → `@citybox/mui` only.

```tsx
import { Button, Stack } from '@citybox/mui/atoms';
import { SearchInput, FormField, toast } from '@citybox/mui/molecules';
import { PageHeader, DataTable } from '@citybox/mui/organisms';
import AddIcon from '@mui/icons-material/Add';
```

**Proibido:** `@citybox/ui` / `packages/ui` / `lucide-react` / `toast` de `sonner` direto.

O `<html>` usa `suppressHydrationWarning`, `data-accent` do cookie `imoveis.accent` e classe
`.dark` do cookie `imoveis.theme` (ou `imoveis.catalog.theme.cookie` em `/agents/*`, via
`proxy.ts` → header `x-pathname`). Isso alimenta o tema MUI **no SSR** — sem flash light→dark nem
flash do accent laranja. Bootstrap no **início do `<body>`** (`components/bootstrap-scripts.tsx`,
RSC — **proibido** Client Component ou `<head>` manual: disputa o MetadataWrapper do Next 16
e gera hydration mismatch). Os IIFEs sincronizam localStorage → cookie/`class` quando o cookie
ainda não existe (primeiro load após toggle antigo só com localStorage: uma visita grava o
cookie; a seguinte já é SSR dark). Accent e tema atualizam CSS (`theme.css`) e MUI. Escolher
a cor ou o tema **persiste na hora** (localStorage + cookie).

---

## 4. Estrutura e organização (regra do projeto)

O código é organizado **por feature**, não por tipo de arquivo.

```
src/
├── app/                      ← só roteamento: cada page.tsx importa o componente da feature
│   ├── layout.tsx            ← html pt-BR, fonte, AppProviders, Toaster (@citybox/mui), globals.css
│   ├── providers.tsx         ← AuthSession + Permissions + Store + Query + MUI theme
│   ├── entrada/page.tsx      ← pós-login: auto-select loja ou picker
│   ├── selecionar-loja/page.tsx ← picker multi-loja (MUI)
│   ├── globals.css           ← Tailwind local + styles/theme.css (sem packages/ui)
│   ├── (dashboard)/          ← painel do corretor (layout com DashboardShell)
│   │   ├── page.tsx          ← DASHBOARD = rota raiz `/` (não há landing page)
│   │   └── leads | properties | transactions | calendar | settings | help
│   └── (public)/             ← página pública do corretor (cada uma monta seu próprio
│       └── agents/[slug]/       header/footer com os dados do corretor)
│           ├── page.tsx          ← catálogo (recomendados + ListifyPagination)
│           ├── listings/page.tsx ← listagem completa (estilo módulo Imóveis)
│           └── listings/[listingId]/page.tsx  ← detalhe do imóvel
│
├── theme/                    ← Design Guide Listify → MUI (`tokens/` + preset)
│   ├── tokens/               ← colors, typography (Manrope), spacing, shadows
│   ├── imoveis-mui-theme.ts  ← entry: options / tema estático + reexports
│   ├── accent-color.ts       ← 7 AccentColorId → palette.primary (default #ff8415)
│   ├── accent-styles.ts      ← sombras/gradientes do accent (botões, IA)
│   ├── semantic-palette.ts   ← Alert Success/Error/Warning + Sky
│   └── presets/imoveis-theme.ts ← ThemeOptions light + dark
│
├── components/               ← componentes de UI CUSTOMIZADOS do Imóveis (sem regra de negócio)
│   ├── brand/                ← Logo Citybox (`logotipo.svg` via @citybox/mui; contraste claro/escuro)
│   ├── layout/               ← DashboardShell (§4.2 scroll na borda + `PAGE_SCROLL_CLASS`),
│   │                           DashboardHeader, HeaderRemindersPopover, UserMenu, PermissionGate (**MUI**)
│   ├── lead-contact-*.tsx    ← popover/botão de contato (**MUI** Popover + IconButton)
│   └── ui/                   ← Panel, Modal (Listify), **ListifyPagination** (TablePagination Leads/Imóveis), TrendBadge, PropertyStatusBadge,
│                                AvatarGroup, MiniCalendar, PropertyImage, PagePlaceholder…
│       └── modal/            ← shell Dialog Listify — usar em TODO modal do app
│
├── features/                 ← um diretório por módulo do sistema
│   ├── shared/               ← o que é usado por 2+ features
│   │   ├── components/       ← RemindersPanel, DocumentViewerDialog (Modal Listify)
│   │   ├── constants/        ← TEAM_AGENTS
│   │   ├── data/             ← navegação, listas estáticas
│   │   ├── hooks/            ← useRotatingFeaturedProperty, use-client-list-pagination
│   │   ├── types/            ← Property, Lead, Person, Trend…
│   │   └── utils/            ← format, calendar (incl. `todayIsoBahia`), reminder-routes, build-per-page-options, paginate-items
│   ├── search/               ← busca global do header (`GET /v1/search` FTS + catálogo páginas)
│   │   ├── components/       ← GlobalSearchDialog (`CommandPalette` async)
│   │   ├── data/             ← searchable-pages.ts (rotas, settings ?section=, ajuda ?q=, sinônimos)
│   │   ├── services/         ← global-search-service.ts
│   │   ├── hooks/            ← use-global-search (debounce 400ms + React Query + RBAC)
│   ├── help/                 ← Central de Ajuda (`/help`) — conteúdo estático PT-BR + ticket mock
│   │   ├── components/       ← HelpPage, hero/busca, module grid, SAC, FAQ (chips + accordion + feedback), SupportTicketDialog
│   │   ├── data/             ← help-content.ts (módulos/canais), faq-data.ts (FAQ + categorias), help-search.ts, faq-answer.ts, faq-feedback.ts
│   │   ├── schemas/          ← support-ticket-schema.ts (Zod)
│   │   └── services/         ← submitSupportTicket (protocolo local; pronto para API)
│   ├── reminders/            ← `GET /v1/reminders` (header + sidebar leads)
│   │   ├── components/       ← NotificationsPopoverHeader (fechar popover)
│   │   ├── data/             ← read-reminders-store (lido no localStorage)
│   │   ├── hooks/            ← use-reminders-query, use-reminder-read-state
│   │   ├── utils/            ← map-hits
│   │   └── types/
│   ├── dashboard/
│   │   ├── components/       ← composição da tela + cards (com regra/dados da feature)
│   │   ├── data/             ← mock-data.ts (legado; path feliz usa API)
│   │   ├── services/         ← dashboard-service.ts → `imoveisFetch` (`/v1/dashboard/overview`)
│   │   ├── hooks/            ← use-dashboard-queries (TanStack Query)
│   │   └── types/            ← tipos da feature
│   ├── leads/                ← listagem Listify (lista Figma + kanban) + form API
│   │   ├── components/       ← page, table/kanban Listify, form (sidebar+timeline), abas
│   │   ├── data/             ← mock-data.ts (seed legado forms; listagem usa API)
│   │   ├── services/         ← leads-service.ts → `imoveisFetch` (`/v1/leads`)
│   │   ├── hooks/            ← useDebouncedValue, use-leads-queries, use-leads-reminders (TanStack Query)
│   │   └── types/            ← ContactLeadDetail, LeadStatus, …
│   ├── document-templates/   ← código legado de modelos (tabela dropada; UI de gerar **não** está ligada)
│   │   ├── components/       ← SettingsTemplatesPanel, TemplateHtmlEditor, GenerateDocumentDialog
│   │   ├── hooks/            ← use-document-templates-queries
│   │   ├── services/         ← document-templates-service → `imoveisFetch` (`/v1/document-templates`, `/v1/documents`)
│   │   ├── utils/            ← filter-templates-by-surface
│   │   └── types/
│   ├── properties/           ← listagem (grid/lista) + formulário add/edit (**API** imoveis-api)
│   │   ├── components/       ← PropertiesPage, PropertyCard, PropertiesTable, PropertyFormPage (+ sidebar/styles Listify)
│   │   ├── data/             ← mock-data.ts (seed legado) + properties-store.ts (não usado no fluxo principal)
│   │   ├── services/         ← properties-service.ts → `imoveisFetch` / `imoveisUpload` (`/v1/properties` + photos MinIO)
│   │   ├── hooks/            ← useDebouncedValue, use-properties-queries (TanStack Query)
│   │   ├── components/       ← listagem, form, `AuthPropertyPhoto` (blob autenticado)
│   │   ├── utils/            ← field-masks, property-media (HEIC→JPEG + WebP Worker), property-media-save (capa/retry), property-api-error
│   │   └── types/            ← PropertyListing, ListingType, …
│   ├── calendar/             ← agenda (Dia/Semana/Mês) + CalendarMiniPanel (dashboard) — **API**
│   │   ├── components/       ← CalendarPage, grids, ScheduleFormDialog, MiniPanel
│   │   ├── data/             ← mock-data.ts (EMPTY_APPOINTMENT apenas)
│   │   ├── services/         ← calendar-service.ts → `imoveisFetch` (`/v1/appointments`)
│   │   ├── hooks/            ← use-calendar-queries (TanStack Query) + useDebouncedValue
│   │   └── types/            ← CalendarAppointment (`agentId`), …
│   ├── settings/             ← configurações (API `/v1/settings/*`; store local só accent SSR)
│   │   ├── components/       ← SettingsPage, sidebar (+ fade/seta overflow no xs), profile tabs, AccentThemeSync, panels
│   │   ├── data/             ← accent-presets.ts + settings-store.ts (espelho accent) + team-members-cache
│   │   ├── hooks/            ← query-keys + use-settings-queries + use-auth-blob-url + use-horizontal-scroll-overflow
│   │   ├── services/         ← settings-service.ts → `imoveisFetch` (`/v1/settings/*`)
│   │   ├── utils/            ← settings-form-styles (Field/sx Listify + modal*Sx) + horizontal-scroll-overflow
│   │   └── types/            ← AgentProfile, DocumentFile, SystemSettings, …
│   ├── transactions/         ← negócios (vendas/locações), split de comissões, repasses — **API**
│   │   ├── components/       ← listagem + KPIs de negócios, detalhe, split, layout shell,
│   │   │                       reports section (embutida no Financeiro)
│   │   ├── data/             ← transactions-filters.ts (+ mock-data legado não usado no hot path)
│   │   ├── hooks/            ← useTransactions, useTransaction, useUpdateSplit, useTransactionsReport
│   │   ├── schemas/          ← Zod (commission split 100% — validação de formulário)
│   │   ├── services/         ← transactions-service / create-transaction / reports → `imoveisFetch`
│   │   └── types/
│   ├── finance/              ← KPIs, DRE, extrato, repasses + relatórios (`/transactions/finance`) — **API**
│   │   ├── components/       ← finance-page, KPI grid, tabelas (+ TransactionsReportsSection)
│   │   ├── data/             ← seed legado (não usado no hot path)
│   │   ├── hooks/            ← useFinancialSummary, usePersonalCommissions
│   │   ├── repositories/     ← commission-config → `imoveisFetch` (`/v1/finance/*`)
│   │   ├── services/         ← finance-service.ts, commission-service.ts (math/RBAC client)
│   │   └── types/
│   ├── shared/session/       ← sessão mock org (AGENCY \| SINGLE_AGENT) p/ finance RBAC
│   └── agent-catalog/        ← página pública: SSR `agent-catalog-service` + client `agent-catalog-client-service`; hook `use-public-catalog-listings` (`page`/`perPage` + ListifyPagination); `CatalogThemeScope` replica o `accentColorId` da loja; proxies `/api/public/agents/.../photo` e `/api/public/properties/.../photos/...`
│
├── styles/theme.css          ← tokens CSS residuais (accent/chart/Tailwind); MUI em `src/theme/`
```

### Onde cada coisa mora

| Situação | Lugar |
| -------- | ----- |
| Primitivo genérico (Button, Card, Table, Input, Avatar…) | **`@citybox/mui`** (ou `@mui/material` se gap) — nunca `@citybox/ui` |
| **Modal / Dialog** | **`@/components/ui/modal`** — padrão “Adicionar compromisso” (glass + campos brancos); ver §4.1; nunca `Dialog` cru |
| **Ícone de KPI / estatística em cards** | **`@/components/ui/stat-icon-badge`** — superfície neutra (`listifyElevatedSurface` + `text.secondary`); **proibido** fundo/ícone semântico por card (`bg-success-soft`, `text-warning`, etc.) |
| **Tabs / segmented pill (DRE, views, filtros)** | **`@/components/ui/segmented-control`** — track `listifyElevatedSurface` + item ativo `primary.main`; **proibido** `bg-secondary`/`bg-card` Tailwind solto em dark mode |
| **Paginação de listas** | **`@/components/ui/listify-pagination`** (`ListifyPagination`) — caixa elevada, “Por página”, `X–Y de Z`, opções em múltiplos de 8 (`buildPerPageOptions`). Listagens de API: `page`/`perPage` no backend. Listas estáticas: `useClientListPagination`. **Proibido** só setas prev/next ou dump da coleção na tela |
| Data / hora em formulários | **`DatePicker`** + **`TimePicker`** de `@citybox/mui/molecules` — padrão em **todo** o app (agenda, leads, relatórios/financeiro); não usar `input type="date|time"` nem máscara manual `DD/MM`. Helpers: `isoDateToLocalDate` / `localDateToIsoDate` em `features/shared/utils/calendar.ts`. |
| Tema / cores / radius / tipografia MUI | `src/theme/` — nunca hardcode de cor em componente MUI |
| Componente visual customizado do Imóveis, sem regra de negócio | `src/components/` (compor MUI se for novo) |
| Componente que conhece dados/regra de uma feature | `features/<feature>/components/` |
| Componente/tipo/util usado por 2+ features | `features/shared/` |
| Dado mockado | `features/<feature>/data/` — nunca inline no componente |
| Acesso a dados (hoje mock, amanhã API) | `features/<feature>/services/` |
| Rota | `src/app/**/page.tsx` — só importa e renderiza o componente da feature |

Regras que valem sempre:

- **Idioma:** código, arquivos, pastas, tipos e rotas em **inglês**; texto visível ao
  usuário em **português**.
- **Sem cor hardcoded** — MUI: `theme.palette` / `sx`; legado shadcn: tokens CSS
  (`bg-primary`, `text-muted-foreground`, …). Cor nova no MUI entra em `src/theme/`;
  no híbrido CSS ainda pode ir em `styles/theme.css`.
- **Server Component por padrão**; `'use client'` só onde há estado/evento/browser API.
- Dados descem por **props** a partir do componente de página da feature.
- **Erro de API na UI:** nunca exibir status/código/mensagem crua da API. Traduzir para
  português apontando o campo com problema — ver `features/properties/utils/property-api-error.ts`
  (usa `ImoveisApiError.details`, o array `message` do `ValidationPipe`).
- **Proibido:** `@citybox/ui` / `packages/ui` / `lucide-react` / `toast` de `sonner` direto.
- **Modais:** sempre o padrão §4.1 (`@/components/ui/modal` + `modal*-Sx`).
- **Scroll:** sempre o padrão §4.2 — **única** rolagem vertical de página na borda da viewport (`PAGE_SCROLL_CLASS`); modais/pickers/horizontal com `SCROLL_CLASS` (`@/lib/scroll`).
- **Data/hora:** `DatePicker` + `TimePicker` do `@citybox/mui` com `modalPickerFieldSx` / `modalTimeFieldSx`.

### 4.1 Padrão de Modal (sistema todo)

Referência visual: agenda **“Adicionar compromisso”**. Ao pedir “refazer modal”, aplicar **sempre** este padrão:

1. **Shell** — `Modal` + `ModalScrollBody` + `ModalTitle` + `ModalContent` + `ModalActions` (`ModalCancelButton` / `ModalConfirmButton`).
2. **Paper glass** (já default no `Modal`): `rgba(255,255,255,0.42)`, `blur(42.6px)`, sombra `0px 2px 8.2px #32323226`, radius **28px**, padding `{ xs: 2.5, sm: 3.5 }`, `maxHeight: 90vh`, `overflowX: hidden` (sem scroll horizontal no mobile).
3. **Título** — bold `1.25rem` / weight 700 (default de `ModalTitle`).
4. **Campos** — caixas brancas sólidas radius 16px, sombra `xs`, **sem** outline/fieldset:
   - texto → `modalFieldRootSx`
   - select → `modalSelectFieldSx` (`displayEmpty`, sem `InputLabel` flutuante)
   - busca → `modalSearchFieldSx` (pill)
   - data/hora → `modalPickerFieldSx` / `modalTimeFieldSx` (+ label externo `modalFieldLabelSx`; Início/Fim empilhados em `xs`)
5. **Seções** — título com `modalSectionTitleSx` (ex.: “Escolher lead”).
6. **Footer** — Cancelar + ação primária; em `xs` empilhados (`ModalActions` column).
7. **Exports** — `@/components/ui/modal` (shell + `modal-form-styles`).

Não usar `form-control-styles` de transações **dentro** de modais; esse util fica para filtros/painéis de página.

### 4.2 Padrão de Scroll (sistema todo)

Referência: casca do painel (`DashboardShell`). A barra **não** fica no miolo do
conteúdo (`max-width: 1440` + padding) — fica na **borda direita da viewport**.

1. **Página do painel** — só a `DashboardShell` rola a página (única rolagem vertical):
   - `<main className={PAGE_SCROLL_CLASS}>` full-bleed (`overflow: auto` + `scrollbarGutter: stable`)
   - miolo interno: `maxWidth: 1440` / `mx: auto` / gutter / **`minHeight: 100%` sem `height: 100%`**
     (conteúdo cresce; o `<main>` rola)
   - CSS: `imoveis-page-scroll` em `styles/theme.css` (track suave Listify + thumb)
   - No painel, `html`/`body` ficam `overflow: hidden` (`html:has([data-imoveis-dashboard])`)
     para não aparecer a barra da janela junto da casca (ex.: Configurações → Informações)
2. **Features** (leads lista/kanban, agenda, settings, dashboard, imóveis…) —
   altura natural, **sem** `overflow-y` / `h-full` + `overflow: hidden` de “tela fill”
   (exceto o kanban, abaixo).
   Kanban: cada coluna tem **altura limitada** + **scroll vertical interno**
   (`SCROLL_CLASS` + `data-kanban-column-scroll`); fatia inicial de **10** cards e
   botão **Ver mais** carrega a próxima fatia. No mobile, pan **horizontal** entre colunas.
3. **Scroll interno permitido** — só em superfícies isoladas: modais (`ModalScrollBody`),
   pickers/dialogs, overflow **horizontal** de tabelas/chips, **e colunas do kanban**.
   Sempre `className={SCROLL_CLASS}` (`imoveis-scroll`) + `overflowY`/`overflowX`
   conforme o caso. Nunca scrollbar nativa sem a classe.
4. **Constantes** — `@/lib/scroll` (`SCROLL_CLASS`, `PAGE_SCROLL_CLASS`, `PAGE_SCROLL_SELECTOR`). Preferir importar
   a constante a hardcodar a string.
5. **Paginação → topo da lista** — componente canônico [`ListifyPagination`](src/components/ui/listify-pagination.tsx)
   (`@/components/ui/listify-pagination`). O scroll ao topo está **embutido** (`useScrollListToTopOnPageChange`):
   no painel rola o scroller mais próximo (`.imoveis-page-scroll`, modal ou drawer); no catálogo público, o `window`.
   Não dispara no primeiro render. **Obrigatório** em qualquer lista paginada — não reimplementar chevrons/`TablePagination`.
   Coleção já carregada: `useClientListPagination` + `paginateItems`. API com `page`/`perPage`: só o `ListifyPagination`.

**Proibido:** `overflow-y-auto` / `overflow: auto` vertical em wrappers de página ou
colunas de feature dentro do max-width (cria barra “no meio” ou scroll aninhado) —
**exceto** o viewport de cards do kanban (`data-kanban-column-scroll`).

## 5. Tema

### 5.1 MUI — `src/theme/` (fonte de verdade para telas migradas)

Espelha `apps/erp/web/src/theme/`. Identidade visual alinhada ao shadcn atual:

| Aspecto | Valor |
| ------- | ----- |
| Primary default | `#ff740d` (accent `orange`) — 7 presets em `accent-color.ts` |
| Background / paper | `#F4F5F7` / `#FFFFFF` (dark: quase preto / card um degrau acima) |
| `shape.borderRadius` | **24** (≡ `--radius: 1.5rem`) |
| Button / Chip / OutlinedInput | pill (`borderRadius: 999`) |
| Paper / Card | flat (elevation 0 + borda `divider`) |
| Typography | Plus Jakarta Sans via `var(--font-app-sans)` (`layout.tsx` / `next/font`) |
| Status | `semantic-palette.ts` (soft em `.light`) |

`ImoveisMuiThemeProvider` aplica `mode` (`ColorModeProvider`) + `accentColorId` (settings store)
em `createAppTheme`. `withCssBaseline={false}` até o cutover.

### 5.2 CSS legado — `src/styles/theme.css` (híbrido)

Ainda alimenta componentes shadcn não migrados. `globals.css` importa o DS ui e **depois**
o tema — a ordem importa.

- `--primary` laranja por padrão; `--radius: 1.5rem`.
- **Cor de destaque:** `data-accent` no `<html>` (`orange` \| `amber` \| …) — espelhado
  pelo mesmo `accentColorId` que o tema MUI; persistência em `imoveis.accent.v1` +
  `imoveis.settings.v1` (aplica ao clicar no swatch; no mobile os círculos ficam **numa linha** com `space-between`; no `sm+` grupo compacto à esquerda, sem espalhar na largura do form). Sombras/gradientes de botões e IA usam
  `accent-styles.ts` (`primarySoftShadow`, `primaryButtonShadow`, `primaryVerticalGradient`);
  popovers Listify usam `primarySoftSurface` / `listifyPopoverPaperSx` (cream **opaco** via
  `color-mix` com o accent — não `alpha` transparente) — nunca cream/laranja
  fixo (`listifyPrimary[0]` / `#ff8415`).
- Tokens de status / gráfico / sidebar como antes.
- Fonte: Plus Jakarta Sans → `--font-app-sans` → `--font-sans`.

No cutover (Fase 9): remover dependência de tokens do ui; manter no máximo vars mínimas
(font / chart) ou mover charts para hex do theme TS.

### Claro e escuro

`ColorModeProvider` (`src/lib/color-mode.tsx`) alterna `.dark` no `<html>`; bootstrap
blocking via `<script>` nativo no **Server Component** `app/layout.tsx`, primeiro filho
do `<body>` (React 19 — sem `next/script`, sem Client Component, sem `<head>` manual).
Troca pelo **menu do avatar** (`components/layout/user-menu.tsx`). Storage: `localStorage.theme`.

**Regra (dark mode):** componentes **não** usam `listifyGreyscale[n]` direto em `sx` —
somente tokens semânticos do tema MUI (`secondary.light/main/dark`, `background.paper`,
`text.primary/secondary`, `divider`, `primary.main`). Inputs de página compartilhados:
`src/theme/listify-field-styles.ts`; modais: `modal-form-styles.ts` (callbacks `(theme) => …`).
Dark palette: `imoveisDarkPaletteOverrides` em `presets/imoveis-theme.ts`. CSS vars
(`.dark` em `theme.css`) alimentam Tailwind/recharts/TopLoader — manter sincronizado com
`resolveAccentPalette(id, mode)`.

---

## 6. Scripts

```bash
pnpm dev:imoveis                              # (raiz) imoveis-web :3111 + imoveis-api :3112
pnpm --filter @citybox/imoveis-web dev        # :3111
pnpm --filter @citybox/imoveis-web build
pnpm --filter @citybox/imoveis-web lint       # tsc --noEmit && eslint .
pnpm --filter @citybox/imoveis-web typecheck
```

**Docker:** o `Dockerfile` deve copiar `apps/imoveis/permissions/package.json` no
stage `deps` e rodar `pnpm --filter @citybox/imoveis-permissions build` **antes**
do `next build` (`main`/`types` do package apontam para `dist/`). `@citybox/mui`
é consumido via source (`transpilePackages`) — sem step de build.

Package manager: **pnpm** apenas. O app é membro do workspace via
`apps/imoveis/*` no `pnpm-workspace.yaml`.

### Env (Keycloak + painel + catálogo público)

| Variável | Default | Uso |
| -------- | ------- | --- |
| `NEXT_PUBLIC_KEYCLOAK_ISSUER` | `http://127.0.0.1:8080/realms/citybox-imoveis` (dev local) | Issuer OAuth (browser) — realm próprio, **não** `citybox-dev` |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT` | `imoveis-web` | Client Keycloak (PKCE S256) — **não** `citybox-backoffice` |
| `KEYCLOAK_CLIENT_SECRET` | `imoveis-web-dev-secret` (dev) | Secret server-side — **nunca** `NEXT_PUBLIC_` |
| `KEYCLOAK_INTERNAL_ISSUER` | mesmo que `NEXT_PUBLIC_*` em dev | BFF → Keycloak (auth-code); não misturar remoto/local |
| `NEXT_PUBLIC_BACKOFFICE_ORIGIN` | `http://localhost:3111` | Redirect OAuth/logout — cadastrar `<origem>/auth/callback` no client `imoveis-web` (prod: `IMOVEIS_ORIGIN` / `https://imoveis.aplopes.com`; o `sync-realm.sh` mescla essa origem) |
| `NEXT_PUBLIC_IMOVEIS_API_URL` | `http://127.0.0.1:3112/api` | Base da imoveis-api (catálogo público direto) |
| `IMOVEIS_API_URL` | (fallback `NEXT_PUBLIC_*`) | Upstream do proxy BFF |
| `NEXT_PUBLIC_IMOVEIS_STORE_ID` | `dev-store-imoveis` | Fallback do **painel** / sitemap single-store; **não** define mais o catálogo `/agents/:slug` (API resolve a loja pelo slug no banco) |
| `IMOVEIS_STORE_ID` | (fallback `NEXT_PUBLIC_*`) | Mesmo papel server-side para painel/sitemap; catálogo público usa `/v1/public/agents/:slug` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3111` | Origem pública preferida (WhatsApp/OG/sitemap); em produção use HTTPS real |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3111` | Fallback de origem (legado); prioridade abaixo de `NEXT_PUBLIC_APP_URL` |

**Painel autenticado:** `imoveisFetch` → `/api/proxy/imoveis/*` (cookie → Bearer; `X-Store-Id` via `store-bridge` / `StoreProvider`). Rotas scopeless: `v1/members/me`, `v1/members/roles`.

**Catálogo público (mobile-first, desktop preservado em `md+`):** SSR via [`agent-catalog-service.ts`](src/features/agent-catalog/services/agent-catalog-service.ts) → API **`/v1/public/agents/:slug`** (resolve a loja/organization no banco; sem Bearer e **sem** `IMOVEIS_STORE_ID` fixo). **Só imóveis `available` com `agentId` do slug do corretor** (catálogo por usuário, não inventário da loja). **Accent da loja:** a resposta pública inclui o mesmo `accentColorId` escolhido em Configurações do sistema; `CatalogThemeScope` aplica o preset ou hex customizado em MUI e CSS vars. **Home:** header Listify **flutuante** (`Paper` 16–20px, `background.paper`, botões 999px `secondary.main` — mesmo contrato do topbar do painel; **sem** faixa full-bleed / glass `rgba(15,23,42)` / `bg-card`) + `CatalogSearchFilterBar` (busca debounce 400ms, input `listifyElevatedSurface`; categorias circulares de tipo + chips de finalidade) + listagem SSR/client com **`page`/`perPage`** (`CATALOG_LISTINGS_PER_PAGE` = 8, **`ListifyPagination`**, opções em múltiplos de 8). **Cards** (`catalog-property-card`): `background.paper`, radius **20px**, sem `border-border`/`bg-card` (dark = greyscale paper, não `--card` oklch); capa **inset 12px**. Página 1 sem filtro: **Imóveis recomendados** = primeiros 4 (`CATALOG_RECOMMENDED_COUNT`, carrossel horizontal no mobile / grade no `md+`; cards com **altura uniforme** — título 2 linhas, preço/specs reservados, largura fixa no carrossel); **Próximos imóveis** = restantes da página atual (lista compacta; **sem** geolocalização). Demais páginas ou com filtro/busca: grade `CatalogPropertyCard`. **Ver todos** → `/agents/:slug/listings` (preserva `q`/`purpose`/`type`; identity header Listify). **Lista completa:** mesmos filtros + `PropertyCard` em grade + `ListifyPagination`. **Detalhe do imóvel:** `PropertyDetailHeader` (hero full-bleed + thumbs + share) + `PropertyFeatures` + descrição/diferenciais + formulário de lead + **CTA sticky “Fale conosco”** (`variant="sticky-bar"`: botão contained primary sem faixa de fundo no rodapé; abre WhatsApp com link `/p/:id?action=new-lead`). Proxies foto. Tema claro/escuro `imoveis.catalog.theme`. **Link curto** `/p/:propertyId` (público no `proxy.ts`, **sem JWT** — crawler do WhatsApp lê OG): `generateMetadata` com `og:title` / `og:description` / `og:image` absoluta via `/v1/public/listings/:id`. **WhatsApp (detalhe):** mensagem limpa só com `🔗 Link do imóvel` → `/p/:id?action=new-lead` (`encodeURIComponent`; origem via `NEXT_PUBLIC_APP_URL`); **sem** link `/leads/new` no texto. **Interceptor:** se corretor autenticado abre `?action=new-lead`, banner “Criar Lead Agora” → `/leads/new?propertyId=&source=whatsapp`; cliente anônimo ignora o query. **/leads/new** pré-preenche `propertyId` (e opcionalmente name/phone).

Arquivo local: `apps/imoveis/web/.env.local` (git-ignored; copiar de `.env.example`). Keycloak **dev = local `:8080`**, realm **`citybox-imoveis`** (senha provisória do CreateStore via `KEYCLOAK_INTERNAL_ISSUER` do admin-api); imoveis-api em `:3112`. O JWT precisa de `azp=imoveis-web` (a API rejeita `citybox-backoffice` / `citybox-dev`). Google Calendar (`GOOGLE_*` na API) é OAuth separado — não misturar com o login Keycloak.

### Configuração no Keycloak

O imóveis usa o client **`imoveis-web`** no realm **`citybox-imoveis`** (ADR C-16; mesmo padrão da clínica).
Redirects/webOrigins em `infra/keycloak/import/citybox-imoveis-realm.json`:
`http://127.0.0.1:3111/*`, `http://localhost:3111/*`, `https://imoveis.aplopes.com/*`.
Em Keycloak já provisionado, `sync-realm.sh` mescla `IMOVEIS_ORIGIN`
(padrão `https://imoveis.aplopes.com`) nos redirect URIs / webOrigins.
---

## 7. Rotas e estado atual

O app tem **duas áreas** e nenhuma landing page: o painel ocupa a raiz e a única
página pública é o catálogo do corretor.

| Rota | Área | Estado |
| ---- | ---- | ------ |
| `/entrada` | Auth | ✅ Pós-callback OAuth — 1 loja auto-entra; N lojas usa a última salva, senão `/selecionar-loja` |
| `/selecionar-loja` | Auth | ✅ Picker multi-loja (MUI Select) |
| `/` | Painel | ✅ Dashboard — layout Listify (gap 20px); KPIs/performance/deals/listings/leads/reminders via **`GET /v1/dashboard/overview`**; featured via `useRotatingFeaturedProperty`; aside **calendário (appointments) acima / lembretes abaixo** |
| `/leads` | Painel | ✅ Contatos — lista + **kanban de negócios** (`PATCH /v1/deals/:id/stage`; soltar em `awaiting_property` desvincula imóvel do lead; soltar em `contract_signed` abre transação; **não** dá para arrastar para `payment_confirmed` sem `transactionId` — confirme o pagamento em Negócios); kanban: **10 cards/coluna** + **Ver mais** + **scroll vertical por coluna**; lista com **ListifyPagination** no rodapé (múltiplos de 8; **scroll ao topo** ao mudar de página); no **xs** o topo/base da lista arredonda na 1ª célula visível (Nome; coluna Nº oculta); **Importar Leads** (modal CSV → `POST /v1/leads/batch`); **Exportar** CSV UTF-8 BOM (`exportLeadsToCSV`); card em **Imóvel selecionado** → botão anexar contrato (`/leads/:id?tab=documents`); card em **Pagamento confirmado** → resolve `transactionId` (lista/`GET /v1/deals/:id`, fallback por `leadId`) e abre `/transactions/:id#rental-payout` (bloco Locação e repasse); ficha do lead com aba Documentos em **Contrato** (anexar contrato + imóvel move o funil para `contract_sent`; WhatsApp só entrega o link) + **Outros documentos**; CTA **Criar transação** na etapa contrato assinado; prefill envia `dealId` |
| `/leads/new` | Painel | ✅ Formulário Listify; query **`propertyId`** pré-vincula imóvel; **`source=whatsapp`** → origem WhatsApp + corretor da sessão em `agentIds`; `autoFocus` no nome; name/phone opcionais; **intenção de pagamento** opcional (Select: à vista, financiamento, FGTS, permuta) em Interesse no imóvel |
| `/leads/[id]` | Painel | ✅ Detalhes Listify — sidebar (foto, imóvel vinculado com **capa real** via `matchedProperties[].coverPhotoUrl`, status, timeline de progresso) + mesmo form; `GET/PATCH/DELETE`; aba Documentos: upload MinIO (`POST /v1/leads/:id/documents`) quando o lead já existe — anexar **contrato** + imóvel avança o funil a `contract_sent`; **Enviar WhatsApp** gera link `/d/:token` (`POST …/send-whatsapp`); badge **Visualizado** (`viewedAt`); **Marcar como assinado** → `PATCH /v1/deals/:id/stage` `contract_signed`; **Salvar alterações** → redirect `/leads` |
| `/properties` | Painel | ✅ Imóveis ativos Listify (Figma grid `18098:13393` / lista `18103:15934`) — toolbar, cards e tabela alinhados; busca/paginação server-side via **imoveis-api** (`GET /v1/properties`); **TablePagination** no rodapé (caixa full-width, controles centralizados, múltiplos de 8 conforme o total; **scroll ao topo** ao mudar de página); **corretor associado** (`agentId` → `getAgentDisplayName`) em card, coluna/lista e CSV; `FilterPopover`; CRUD; fotos e documentos MinIO; sync catálogo corretor; **imóvel indisponível** (`sold-out`/`occupied`/`reserved`) renderiza card/linha desabilitados (grayscale + overlay "Indisponível" no card; linha esmaecida) — ainda abre a ficha para reativar |
| `/properties/new` | Painel | ✅ Formulário Listify (Figma `18105:17040`) — sidebar prévia (**Corretor:** nome) + documentos, fotos, infos básicas, localização (CEP ViaCEP + geocode Nominatim → `mapCoordinate` + Leaflet pin **travado**; **Editar / Salvar / Cancelar**; catálogo público usa o **mesmo Leaflet só leitura**) e **catálogo público** (descrição + diferenciais); `POST /v1/properties` + upload multipart |
| `/properties/[id]` | Painel | ✅ Formulário editar via `PropertyFormLoader` (`GET/PATCH/DELETE` + sync fotos/documentos MinIO); prévia exibe **corretor associado** (`agentId`); descrição/diferenciais alimentam seções **Sobre o imóvel** e **Diferenciais** no catálogo; id inexistente → redirect `/properties` |
| `/calendar` | Painel | ✅ Agenda — modal **Adicionar compromisso** com Autocomplete de lead (`useLeadsQuery` = mesmos cadastros do módulo `/leads`); CRUD via **imoveis-api**; sheet do compromisso; sheet do dia com **ListifyPagination** (scroll ao topo) |
| `/settings` | Painel | ✅ Configurações — API `/v1/settings/*`; gates CASL via `useSessionPermissions` / `useCan`; listas (equipe, documentos, perfil imóveis/clientes) com **ListifyPagination** |
| `/help` | Painel | ✅ Central de ajuda — hero com busca em tempo real (módulos + FAQ em `question`/`answer`/`tags`); com termo ativo o FAQ sobe acima dos módulos. Cards de módulos (filtro CASL `canNav`). FAQ: chips (Todos / Geral / Módulos / Financeiro / Suporte), accordion MUI, **ListifyPagination** (8 por página, scroll ao topo), “Esta resposta foi útil?” (sessionStorage), empty state + **Abrir ticket de suporte**. Canais de SAC no rodapé da página. Modal Listify de ticket (assunto, descrição, anexos; `submitSupportTicket` gera protocolo **local**, sem envio à equipe). Entrada pelo `UserMenu` (**Ajuda & Suporte**), não pelo header |
| `/transactions` | Painel | ✅ Negócios — **cards** (ativos, valor bruto, comissão, concluídos); listagem com busca (debounce 400ms), `FilterPopover` (tipo, status, corretor), **ListifyPagination** (múltiplos de 8, scroll ao topo), coluna **Pagamento** (meio previsto); botão **Nova transação** / **Promover lead** (`CreateTransactionDialog` no padrão §4.1 — **meio de pagamento** obrigatório; Select = mesmos 4 valores do lead: à vista / financiamento / FGTS / permuta; pré-seleciona `paymentIntents` do lead); vendas + locações; link → detalhe |
| `/transactions/[id]` | Painel | ✅ Detalhe — resumo (incl. meio de pagamento), **Documentos** (`GET /v1/transactions/:id/documents`: checklist pendente/anexado/enviado + lista do lead/imóvel), **Comissões** (percentual/valor total editável; RBAC ADMIN/MANAGER; no mobile **Restaurar padrão** / **Salvar comissões** empilhados, full-width, gap 12px; `sm+` lado a lado), **Confirmar pagamento / Cancelar (desistência)** (confirmar → redirect `/transactions`); locação + repasse; links Abrir ficha / Usar como base de novo imóvel; histórico |
| `/transactions/finance` | Painel | ✅ Financeiro + Relatórios — sub-nav **Negócios \| Financeiro**; KPIs condicionais `SINGLE_AGENT` (livro-caixa) vs `AGENCY` (DRE, extrato, repasses); tabelas com **ListifyPagination**; seção Relatórios (período + tabelas por status/tipo/corretor) |
| `/transactions/reports` | Painel | ↩️ Redirect → `/transactions/finance` (relatórios unificados na aba Financeiro) |
| `/agents/[slug]` | Pública | ✅ Catálogo — accent da loja + header Listify flutuante; busca/categorias; recomendados (4) na pág. 1; **ListifyPagination** (`page`/`perPage`); FAB WhatsApp |
| `/agents/[slug]/listings` | Pública | ✅ Só imóveis — identity header Listify; grade `PropertyCard` paper 20px; mesmos filtros; **ListifyPagination**; FAB WhatsApp |
| `/agents/[slug]/listings/[listingId]` | Pública | ✅ Detalhe — hero/thumbs + **Leaflet só leitura** + features + lead + CTA sticky “Fale conosco” (WhatsApp); Open Graph |
| `/p/[propertyId]` | Pública | ✅ Link curto (WhatsApp/OG); mesma UI de detalhe (form e WA pelos toggles da loja; **Leaflet só leitura** se houver `mapCoordinate` — cliente **não** edita pin nem autoriza GPS); cliente lê `?action=new-lead` + sessão Keycloak (`SameSite=Lax`); banner corretor → `/leads/new?propertyId=&source=whatsapp` |
| `/d/[token]` | Pública | ✅ Abrir documento do lead: ack (`POST /api/public/documents/:token/ack`) + stream; links velhos `/api/public/documents/:token` seguem baixando sem ack |

`[slug]` é o identificador público do corretor (ex.: `/agents/ana-helena`). Slug
desconhecido → `notFound()`. Ambas as rotas públicas são dinâmicas (`ƒ` no build).

---

## 8. Pendências conhecidas

- **Leads + imóveis + agenda + negócios/financeiro + dashboard:** consumidos da **imoveis-api** (`src/lib/imoveis-api.ts`). Kanban de contatos: 6 queries paralelas por `DealStage` (`useKanbanDealsQueries`); drag atualiza etapa via `PATCH /v1/deals/:id/stage`. Import CSV: modal `ImportLeadsModal` → `POST /v1/leads/batch`. Export CSV leads: `exportLeadsToCSV` (BOM UTF-8 + colunas Nome/Telefone/Email/Status/Origem/**Intenção de pagamento**/Imóveis/Data); demais via `download-csv.ts`.
- **Lembretes scoped:** header, sidebar de leads e card da agenda passam `useCurrentAgentId()` → `GET /v1/reminders?agentId=` (TeamMember.agentId da loja ativa). Kind `document` (contratos/anexos) só aparece se `documentsAlerts` estiver ligado nas configurações.
- **Auth Keycloak + CASL:** BFF PKCE; providers `PermissionsProvider` + `StoreProvider`; callback → `/entrada?fresh=1`; `GET /v1/members/me` descobre lojas (+ `agentId`/`memberId` por loja); com 1 loja entra direto; com N entra na última do `localStorage` se ainda acessível (não força picker a cada login); nav/path gates via `@citybox/imoveis-permissions` (`features/imoveis/permissions/`).
- **Escopo de dados:** por padrão **todo perfil** (admin inclusive) vê só o próprio `agentId` em leads, imóveis, negócios, agenda, busca, lembretes, dashboard e relatório. Admin/dono pode filtrar outro corretor ou pedir `agentId=all` (loja). Corretor nunca cruza carteiras. Web: `useSessionAgentScope` (`agentId` + `ready`) — listas/dashboard **só** disparam após membership e **sempre** mandam `agentId` na query (cache React Query isolado por usuário).
- **Designação de corretores (form de lead/negócio):** `useAssignableLeadAgents` / `useAssignableTransactionAgents` leem `GET /v1/settings/users` (permitido a quem tem Lead/Transaction, não só Team) e **sempre** incluem o corretor da sessão se a lista vier vazia.
- **Sessão mock (legado):** `features/shared/session/` — troca via UserMenu **somente sem SSO**; com Keycloak ativo usa JWT + permissões da loja ativa.
- **Transações:** `imoveisFetch` → `/v1/transactions` (list/create draft/get/**documents**/split/rental-payout/status/report); TanStack Query; criação via `createTransactionFromDraft` (orquestração no backend) — draft Zod exige `paymentMethod` (**mesmo catálogo do lead**: `cash`/`financing`/`fgts`/`trade-in`; labels em `LEAD_PAYMENT_INTENT_LABEL`). Prefill do lead parseia `budgetRange` / `property.cost` em `grossValueCents` e mostra telefone/e-mail só leitura. Negócios antigos com PIX/TED/etc. continuam legíveis na listagem. Ao **promover lead**, o picker prioriza **imóveis matched do lead** e os mantém pré-selecionáveis mesmo em `reserved` (já indisponíveis para outros); API aceita `reserved` se o imóvel estiver linkado ao lead/deal. Busca geral continua filtrando `status=available`. Confirmar pagamento avança o deal CRM para `payment_confirmed` **e** marca o imóvel como `sold-out`/`occupied`; etapa `handover` no funil fecha o lead (`closed-won`). Kanban: botão 🤝 só em `contract_signed` sem `transactionId`.
- **Imóveis (disponibilidade):** na ficha indisponível — **Reativar (Disponível)** e **Usar como base de novo imóvel** (`/properties/new?from=<id>` pré-preenche metadados, sem fotos/docs).
- **Financeiro:** `imoveisFetch` → `/v1/finance/*` (summary, commissions, rental-payouts, commission-config, expenses); `/transactions/finance` com KPIs, tabelas por perfil org e **relatórios**.
- Imóveis: fotos e **documentos** via MinIO (multipart + `AuthPropertyPhoto` / `imoveisFetchBlob`); **até 20 fotos** (JPEG/PNG/WebP **ou HEIC iPhone**, máx. 4 MB cada — `propertyPhotosCaption`); HEIC vira JPEG no cliente (`heic2any`) e depois WebP (~1 MB, lado ≤ 1600, Worker em `public/vendor/browser-image-compression.js`, sem jsDelivr); a **primeira foto é a capa** (chip + “Usar como capa” + dnd-kit; `PUT /v1/properties/:id/photos/order` no save — erro de ordem não é engolido); `savePropertyWithMedia` continua o lote se um POST falhar e devolve drafts para retry (só reenvia quem ainda tem `file`); progresso no tile (Otimizando/Enviando n/m); `photoUrls` e `documents[].path` na API = paths relativos autenticados; arquivo só sobe ao salvar o imóvel; `DocumentViewerDialog` resolve `path` em blob autenticado (documento antigo sem `path` continua exibindo "arquivo não disponível"); filtros via `FilterPopover`; recomendação dashboard via `useRotatingFeaturedProperty` (API). **Catálogo público** (`/agents/:slug`): `dynamic = 'force-dynamic'` + refetch da listagem no mount para a capa não ficar presa ao HTML antigo; cards usam `coverPhotoUrl` (1ª foto por `sortOrder`).
- Lembretes / **notificações** (dashboard/leads/agenda + sino do header):
  `RemindersPanel` e popovers listam **só itens ainda não visualizados**
  (clicar no card abre o destino; **Marcar como lida** na base de cada
  item dispensa sem navegar e some da lista).
  Popover do sino/leads tem **fechar (X)**. Máx. **3**
  no card (`REMINDERS_CARD_VISIBLE_LIMIT`); **+N** / chevron abre sheet com o
  restante. Origens: `GET /v1/reminders` (inclui leads site/WhatsApp `new-lead`).
  Recomendação: `useRotatingFeaturedProperty` cicla imóveis `available` a cada
  **20s**; diferenciais na lateral + **só o título** (1 linha) acima da foto.
- Lembretes de **leads** / **agenda** / **header** (`useLeadsReminders` → `features/reminders`): `GET /v1/reminders` (compromissos + follow-ups + **novos leads site/WhatsApp**). Polling 30s; toast via `NewLeadNotificationsListener` ao detectar `new-lead`. **Notificações (sino, card e sheet)** = só as ainda **não visualizadas**; clique no item abre o destino; **Marcar como lida** na base de cada card (texto 13–14px, área clicável) dispensa aquele item e some da lista; **X** fecha o popover.
- **Busca global (header):** `features/search` — `CommandPalette` (`filterMode=external`, ⌘/Ctrl+K); entidades via `GET /v1/search` (FTS Postgres multi-token); páginas/atalhos (`SEARCHABLE_PAGES`) e nav filtrados no client. Clique: detalhe / agenda `?date=&appointmentId=` / settings `?section=`.
- **Dashboard:** `dashboard-service` → `/v1/dashboard/overview` (period do gráfico dispara refetch); receita = mesma regra de `finance/summary` (escopo pessoal por corretor não-admin); módulos sem permissão CASL omitem KPIs/cards; mini agenda e featured usam `useCurrentAgentId` / agent da loja.
- Agenda: **grade sem scroll interno** (altura natural; a **página** rola). Layout: **≥ 1400px** — sidebar 280px (notificações + mini empilhados) à esquerda da grade; **abaixo de 1400px** — grade full width e os **dois cards sob ela em colunas iguais** (`1fr | 1fr`). Corte em `CALENDAR_SIDE_LAYOUT_MIN` (cards descem cedo ao encolher). Listagem filter **Todos** (admin) / **Meus** (corretor). `+N mais` → sheet. **Google Calendar** banner + OAuth `/calendar?connected=true`; com status conectado (ou logo após OAuth), `POST …/google-calendar/sync` envia **passados e futuros** sem `googleEventId` (máx. 200).
- Configurações: sync catálogo leads (`PUT /v1/agents/:agentId/leads`) e imóveis
  (`PUT /v1/agents/:agentId/properties` — legado). **Catálogo público:** só imóveis
  `available` com `agentId` do corretor do slug (create/save no painel envia
  `agentId`). **Perfil → Imóveis vendidos:** só `sold-out` do corretor (automático ao concluir negócio). **Perfil → Clientes:** só leads `closed-won` (venda concluída).
- **Configurações via API** (`features/settings/hooks/use-settings-queries.ts`):
  store (sistema + notificações; payload JSON de integrações permanece na API, sem
  aba UI), perfil/foto/docs legais, privacidade, billing (cards do plano; sem botão de pagamento), equipe, documentos por pasta
  (CRUD upload/PATCH/DELETE) com **seção Contratos** dedicada (pasta `signed`; espelho
  de contratos do lead) separada das demais pastas. **Google Calendar:** banner de conexão no topo da
  **Agenda** (`CalendarGoogleBanner` → OAuth; callback `/calendar?connected=true` +
  toast de sucesso + backfill); badge “Conectado” se já houver token; no card do
  perfil: **Sincronizar pendentes** + desconectar. Seções do menu: profile, privacy, notifications, users,
  system, billing (+ delete-account para owner). **Papéis de equipe** no formulário:
  `admin` (Administrador), `broker` (Administrador/Corretor),
  `affiliated` (Corretor filiado), `assistant` (Assistente) — catálogo em
  `@citybox/imoveis-permissions` /
  `USER_ROLE_LABEL`. **Meu perfil / privacidade / notificações** a qualquer membro
  ativo (sem checkbox `settings`); notificações → `GET store` +
  `PUT …/store/notifications`; system/users só com CASL correspondente.
  `useCurrentAgentId()` (store `agentId`) alimenta perfil e link do catálogo.
  `SettingsBootstrap` prefetch store + users **só com `storeId` ativo**; chave React Query
  inclui loja (`settingsKeys.users(storeId)` / `store(storeId)` / `billing(storeId)` /
  `profile(storeId, agentId)`) — evita listar equipe/perfil do fallback
  `dev-store-imoveis` (403 no `ImoveisScopeGuard`). `StoreProvider` registra o
  `storeId` na ponte `store-bridge` em **`useLayoutEffect`** (antes do `useEffect`
  do React Query), para `imoveisFetch` no mesmo commit já enviar o header certo.
  PUT parcial usa cache
  (`settingsKeys.store(storeId)`).
- **Cor de destaque com API:** `syncAccentColorFromApi` + swatch com PUT imediato.
- Avatares usam iniciais; capa de imóvel sem foto usa SVG (`PropertyImage`).
- Testes web: `node --import tsx --test` no `package.json` (catálogo: mappers, WhatsApp, display, gallery, **capa/gallery photos**, share, split home; + prefill de transação; + map intenção de pagamento → meio do modal; + help-content/search/faq-data/faq-answer/faq-feedback/ticket; + paginate-items; + reminder fingerprint; + overflow de abas settings; + filter-templates-by-surface; + export CSV intenção de pagamento; + compressão de foto (`property-media` + `property-media-save`); + CEP/mapa (`map-coordinate` + `map-pin-session` + `cep-lookup`); + `src/lib/scroll.test.ts`; + `src/lib/store-bridge.test.ts`). Sem Vitest/RTL ainda. API tem Jest nos use-cases.
- Sem `output: 'standalone'`/deploy configurado.
- **DS MUI** — cutover Fase 9: zero `@citybox/ui`/`lucide-react`; tema `src/theme/`;
  plano `.claude/plans/imoveis/mui-migration.plan.md`. Nota: system props de
  `Stack`/`Typography` do `@citybox/mui` preferir via `sx` (MUI 9).
  Ícones: `@mui/icons-material/X` path-a-path.
