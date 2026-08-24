# Vertical Clínica — Guia de Arquitetura e Padrões

> **Migrado do ERP em 2026-07-29.** Este documento veio do módulo `clinic` do
> antigo shell multi-vertical `apps/erp` (removido em 2026-07-31 — `apps/erp`
> foi reaproveitado como novo nome de `apps/erp-comercio`).
> Caminhos e rotas foram atualizados para o app dedicado, mas o texto pode ainda
> conter resquícios da época multi-vertical. Para arquitetura do app (auth,
> proxies, envs, débito herdado) a referência é
> [`apps/verticals/clinica/web/AGENTS.md`](../../../AGENTS.md); este arquivo cobre
> os **padrões de rota e domínio** da clínica.

---

## Visão geral

`@citybox/clinica-web` (`apps/verticals/clinica/web`, porta **3113**) é o
backoffice dedicado da clínica. Diferente do ERP multi-vertical (onde cada
vertical vivia em `/{vertical}`), aqui **as rotas do backoffice ficam na raiz** —
a rota base é **`/`**, não `/clinic`.

| Camada | Caminho | Papel |
|--------|---------|-------|
| Design system | `packages/ui` | Primitivos (`@citybox/ui/atoms`), composições (`molecules`, `organisms`) |
| Shell | `src/shell/` | Topbar, seletor de clínica, route guard |
| Infra vertical | `src/lib/vertical/` | Registry lazy, tipos, navegação, permissões |
| **Features clinic** | `src/features/clinic/` | **Toda a lógica de UI da clínica** |
| **Rotas Next.js** | `src/app/(clinic)/` | **Só roteamento** — páginas finas que importam de `features/` |
| UI compartilhada | `src/features/shared/` | `ErpPage`, equipe, CEP, fiscal |

A clínica consome a **`clinica-api`** (`apps/verticals/clinica/api`, porta
**3172**) via proxy `/api/proxy/clinica` para configurações, pacientes, agenda,
estoque, financeiro e **vendas/CRM**.

---

## Regra de ouro: `app/` vs `features/`

```
app/(clinic)/page.tsx              →  importa página de features/clinic/
app/(clinic)/configuracoes/        →  importa páginas de features/clinic/pages/settings/
app/(clinic)/[...segments]/        →  fallback placeholder para rotas do menu sem página dedicada
```

**`app/(clinic)/` não contém lógica de negócio nem componentes complexos.**

Padrão de rota (thin page):

```tsx
'use client';

import { MinhaPage } from '@/features/clinic/modules/meu-modulo/pages/minha-page';

export default function MinhaRota() {
  return <MinhaPage />;
}
```

**Nova tela:** implementar em `features/clinic/...` e criar um `page.tsx` fino em `app/(clinic)/...`.

---

## Arquitetura da vertical

```
app/(clinic)/
├── layout.tsx          → ClinicShell (_shell.tsx)
├── _shell.tsx          → auth, loja, permissões, providers
├── page.tsx            → dashboard · Indicadores (rota principal)
├── relatorios/         → aba Relatórios
├── tarefas/            → aba Tarefas
├── [...segments]/      → placeholder para rotas sem página
├── configuracoes/      → sub-rotas de settings
└── {rota}/page.tsx     → thin imports

features/clinic/
├── manifest.ts         → registro lazy da vertical
├── layout/             → ClinicErpLayout (sidebar 1 coluna)
├── lib/                → navigation, theme, icons, dev-mock
├── components/         → componentes transversais da vertical (ex.: settings nav)
├── pages/              → páginas de topo / placeholders
└── modules/            → domínios de negócio (a expandir)
    └── {dominio}/
        ├── components/
        ├── pages/
        ├── lib/
        ├── types/
        └── data/       → mocks até existir API
```

### Fluxo de carregamento

1. `app/(clinic)/layout.tsx` monta `ClinicShell` (`_shell.tsx`)
2. Shell carrega manifest lazy via `lib/vertical/registry.ts` → `features/clinic/manifest.ts`
3. Providers: `VerticalDefinitionProvider`, `VerticalPermissionsProvider`, `VerticalBrandingProvider`
4. `ClinicErpLayout` renderiza sidebar + conteúdo
5. `VerticalRouteGuard` valida acesso à rota
6. `page.tsx` importa a page real de `features/clinic/`

---

## Manifest

Arquivo: `features/clinic/manifest.ts`

Exporta `clinicManifest: VerticalManifest` com:

| Campo | Valor atual |
|-------|-------------|
| `id` | `clinic` |
| `label` | `Clínica` |
| `platformPermission` | `vertical.clinic.view` |
| `brand` | `CLINIC_BRAND` (`lib/navigation.ts`) |
| `theme` | `CLINIC_THEME` (`lib/theme.ts`) — primária `#0891b2` |
| `navModules` | `CLINIC_NAV_MODULES` (`lib/navigation.ts`) |
| `navDefaults` | módulo `clinica`, leaf `visao-geral` |
| `usesStoreBrandingApi` | `false` (stub) |
| `usesStorePermissionsApi` | `false` (stub) |

Registro lazy em `lib/vertical/registry.ts` (já configurado — não editar sem necessidade).

---

## Navegação (menu lateral)

Fonte de verdade: `features/clinic/lib/navigation.ts`

### Módulo Clínica

| Leaf | Path | Status |
|------|------|--------|
| Indicadores | `/` | 🟡 mock frontend | Página principal; 3 KPI cards, layout 55/45 + card full-width Orçamentos, dialogs/PDF/WhatsApp; sem cabeçalho e com fundo cinza |
| Relatórios | `/relatorios` | 🟡 mock frontend | Catálogo Accordion + período/Exportar; tabela Aniversariantes; demais “em breve” |
| Tarefas | `/tarefas` | 🟢 API | Consultas canceladas (`missed`+`cancelled_*` via `GET /v1/dashboard/tasks/cancelled-appointments`) + card Pacientes; Reagendar / Ignorar / WhatsApp |
| Pacientes | `/pacientes` | ✅ API | Lista + cadastro + categorias via `clinica-api` |
| Ficha do paciente | `/pacientes/[id]/[aba]` | 🟢 Sobre + orçamentos/**Prontuário** (`tratamentos`)/anamnese/documentos/financeiro/**arquivos** + alertas retorno API | Label da aba = **Prontuário**; copy = **Procedimento**; nutrição = Inicializar |
| Agenda | `/agenda` | 🟢 API | `clinicaFetch` → appointments, internal-events, fit-ins, return-alerts, categories, available-slots; compromissos bloqueiam consultas; `clinic-datetime.ts`; badge retorno semanal nos popovers |
| Vendas | `/vendas` | 🟢 API | CRM kanban → `clinica-api` (`sales.api.service.ts`); ordem de cards (`sortOrder`/`reorder`); etapas Agendada/Perdida fixas no fim; filtro período custom (dia civil BRT) |
| Marketing | `/marketing` | 🟢 API | PageNav Comunicação \| Indicações; layout breakout `-m-4` (scroll `main`); `/marketing/indicacoes` → `GET /v1/indicacoes/*`; form público `/campanha/...` |
| Loja | `/loja` | 🟡 mock | Pacotes de Comunicação + Assinatura Eletrônica; liberação de pacotes no admin (aba Pacotes adicionais) |

### Módulo Administrativo

| Leaf | Path | Status |
|------|------|--------|
| Estoque | `/estoque` | 🟢 API | `stock.api.service.ts` → clinica-api; listagem + histórico retiradas; paginação/busca/ordenação server-side |
| Financeiro | `/financeiro` | 🟢 API | Fluxo de caixa + config + Transações (`v1/financial/*`); layout mobile sem travar altura; PageNav com scroll-x; KPIs tablet 2+1 |
| Configurações | `/configuracoes` | ✅ parcial | Clínica, planos, anamneses, contrato, equipe (horários API); categorias + pacientes integrados |

Rotas no menu **sem** `page.tsx` dedicado caem em `app/(clinic)/[...segments]/page.tsx` → `ClinicPlaceholderPage`.

### Rotas públicas (sem auth)

| Rota | Status | Descrição |
|------|--------|-----------|
| `/public/clinic/anamnese/[token]` | 🟢 API | BFF `/api/public/clinic/anamnesis/[token]` → clinica-api `@Public()`; preenchimento mobile pelo paciente |

---

## Configurações (sub-navegação)

Layout: `app/(clinic)/configuracoes/layout.tsx` → `ClinicSettingsNav`  
Nav horizontal: `features/clinic/components/clinic-settings-nav.tsx` (`PageNav` do `@citybox/ui` — scroll horizontal no mobile).

Estilos de sheet exclusivos da vertical: `features/clinic/lib/clinic-sheet-styles.ts` + `features/clinic/clinic-sheets.css` (importado em `app/(clinic)/layout.tsx`). Tabelas das abas (planos, anamneses, contrato, categorias) usam `erpDataTableStyleProps` de `features/shared/lib/data-table-styles.ts` (cabeçalhos alinhados ao conteúdo); planos/anamneses com `overflow-x-auto` no mobile. Sheet de planos: após confirmar troca de padrão, guard anti-dismiss fantasma (AlertDialog→Sheet).

| Aba | Path | Status |
|-----|------|--------|
| Clínica | `/configuracoes` | ✅ `ClinicaSettingsContent` — dados cadastrais da unidade |
| Equipe | `/configuracoes/equipe` | 🟠 Mock — lista, convite/edição em sheet, permissões mock |
| Planos | `/configuracoes/planos` | 🟠 Mock — tabela + sheet 2 passos (especialidades/tratamentos BRL) |
| Anamneses | `/configuracoes/anamneses` | 🟢 API | modelos e biblioteca de perguntas via `clinica-api` |
| Contrato | `/configuracoes/contrato` | 🟠 Mock parcial — listagem + sheet fullscreen, variáveis drag, textarea |
| Categoria de Paciente | `/configuracoes/categoria-paciente` | ✅ API | `v1/patient-categories` |
| Categoria de Agendamento | `/configuracoes/categoria-agendamento` | ✅ API | `v1/appointment-categories` (CRUD próprio; sem espelho de pacientes) |
| Categoria (legado) | `/configuracoes/categoria` | redirect | → `categoria-paciente` |

Documentação detalhada (implementado vs pendente): Wiki → **Configurações & Parâmetros** (`wiki/wiki-erp/wiki-erp-clinic`, seção 11.0).

---

## Layout e sidebar

A clinic usa **`AppSidebar` de uma coluna** (`features/clinic/layout/clinic-erp-layout.tsx`).

> Food e varejo usam `AppSidebarDual` (duas colunas) via `shell/vertical-erp-layout.tsx` — **não copiar esse padrão**; nossa vertical tem layout próprio.

Ícones do menu: `features/clinic/lib/icons.ts` (`resolveClinicLeafIcon`).

---

## Design system

- **Sempre** importar primitivos de `@citybox/ui` — nunca criar `Button`, `Card`, `Badge`, etc. locais
- Layout de página: `ErpPage` de `@/features/shared/components`
- **Sem cores hardcoded** — usar tokens CSS (`var(--primary)`, etc.) ou `CLINIC_THEME`
- Tema claro/escuro via classe `.dark` (next-themes)

Imports típicos:

```tsx
import { Button, Input } from '@citybox/ui/atoms';
import { PageNav, FormField } from '@citybox/ui/molecules';
import { PageHeader, DataTable } from '@citybox/ui/organisms';
import { ErpPage } from '@/features/shared/components';
```

---

## Estrutura recomendada por domínio

Ao implementar features reais, organizar como em food (referência de padrão, **não editar food**):

```
features/clinic/modules/
├── patients/
│   ├── components/
│   ├── pages/patients-page.tsx
│   ├── lib/
│   ├── types/
│   └── data/              # mocks até API existir
├── schedule/
├── sales/
└── settings/              # migrar configuracoes para cá no futuro
    ├── components/
    │   └── clinic-settings-nav.tsx
    └── pages/
```

---

## Checklist para nova feature

1. **Menu** — adicionar/ajustar leaf em `features/clinic/lib/navigation.ts`
2. **Página** — criar em `features/clinic/modules/{dominio}/pages/...`
3. **Componentes** — em `features/clinic/modules/{dominio}/components/` (nunca em `app/`)
4. **Rota** — `app/(clinic)/{path}/page.tsx` importando a page de features
5. **Layout** — `ErpPage` + componentes `@citybox/ui`
6. **Tipos/hooks** — `types/`, `lib/` dentro do módulo
7. **Mocks** — `data/` até existir API; depois trocar por fetch/hooks
8. **Ícone** — registrar em `lib/icons.ts` se novo item no menu

---

## Padrões de código

- `'use client'` nas pages de features que usam hooks
- **Imutabilidade** — criar novos objetos, nunca mutar in-place
- Arquivos focados: 200–400 linhas típico, máximo ~800
- Funções pequenas (< 50 linhas)
- Sem `eslint-disable @typescript-eslint/*` nem `@ts-ignore`
- Erros tratados explicitamente — nunca engolir falhas

---

## Permissões e dev mock

- Permissão da vertical: `vertical.clinic.view`
- Registro: `apps/verticals/clinica/web/src/lib/modules.tsx` (já inclui `clinic`)
- Dev mock: `features/clinic/lib/dev-mock.ts`
- Keycloak dev: permissão configurada em `infra/keycloak/import/citybox-dev-realm.json`

Para rodar localmente:

```bash
pnpm --filter @citybox/clinica-web dev   # :3113
```

Acesso: `http://localhost:3113`

---

## O que NÃO fazer

| ❌ Evitar | ✅ Fazer |
|----------|---------|
| Editar `features/food/`, `features/varejo/` | Trabalhar só em `features/clinic/` e `app/(clinic)/` |
| Colocar lógica em `app/(clinic)/*.tsx` | Thin pages que importam de `features/clinic/` |
| Criar componentes UI locais (Button, Card…) | Usar `@citybox/ui` |
| Cores hardcoded | Tokens CSS / `CLINIC_THEME` |
| Copiar layout dual-column do food | Manter `ClinicErpLayout` (sidebar 1 coluna) |

---

## Estado atual dos arquivos

```
features/clinic/
├── manifest.ts
├── clinic-sheets.css
├── layout/clinic-erp-layout.tsx
├── lib/
│   ├── navigation.ts
│   ├── theme.ts
│   ├── icons.ts
│   ├── dev-mock.ts
│   └── clinic-sheet-styles.ts
├── components/
│   ├── clinic-settings-nav.tsx
│   └── clinic-compact-switch.tsx
├── pages/
│   ├── dashboard-page.tsx        # reexport → modules/dashboard
│   └── placeholder-page.tsx
├── modules/
│   ├── dashboard/              # 🟢 Indicadores API; Relatórios API; Tarefas = cancelled-appointments + Pacientes
│   ├── patients/               # lista + ficha — API (Sobre/foto/orçamentos/tratamentos/anamnese/documentos/financeiro/arquivos)
│   │   ├── services/             # patients, patient-categories, patient-budgets, patient-anamnesis, patient-contract-emissions, patient-prescriptions, patient-certificates, patient-financial-entries, patient-files
│   │   ├── hooks/                # React Query (lista, detalhe, mutations, foto, categorias)
│   │   ├── components/           # tabelas, sheets, patient-photo-dialog, detail/* (header: seta ← ao lado da foto)
│   │   ├── pages/                # patients-page, patient-files-page, …
│   │   ├── layout/               # patient-detail-layout (header + nav)
│   │   ├── lib/                  # patient-api-mappers, RHF+Zod, validação
│   │   ├── types/                # clinic-patient, patient-api, patient-file
│   │   └── data/                 # mocks só onde API ainda não existe
│   └── settings/
│       ├── pages/clinica-settings-page.tsx
│       ├── components/clinic-settings-form.tsx
│       ├── anamneses/
│       ├── contracts/
│       ├── categories/           # categorias de paciente (API v1/patient-categories)
│       ├── plans/
│       ├── team/
│       └── data/mock-clinic-settings.ts
├── financeiro/                 # fluxo de caixa + Transações API (financial.api.service → v1/financial/*); config TabsList cinza
├── estoque/
├── agenda/
├── vendas/                     # mock
└── marketing/                  # backoffice API; form público mock

app/(clinic)/
├── layout.tsx              # importa clinic-sheets.css
├── _shell.tsx
├── page.tsx
├── icon.tsx
├── [...segments]/page.tsx
├── pacientes/
│   ├── page.tsx
│   └── [id]/
│       ├── layout.tsx
│       ├── page.tsx        # redirect → /sobre
│       ├── sobre/ · calculo-imc/ · orcamentos/ · tratamentos/ · anamnese/
│       ├── documentos/ · financeiro/ · arquivos/
│       └── …
├── financeiro/
│   ├── fluxo-de-caixa/page.tsx
│   ├── transacoes/page.tsx
│   └── configuracoes/page.tsx
└── configuracoes/
    ├── layout.tsx
    ├── page.tsx
    ├── equipe/page.tsx
    ├── planos/page.tsx
    ├── anamneses/page.tsx
    ├── contrato/page.tsx
    ├── categoria/page.tsx              # redirect → categoria-paciente
    ├── categoria-paciente/page.tsx
    └── categoria-agendamento/page.tsx

app/public/clinic/
├── layout.tsx
├── public-clinic-theme-shell.tsx
└── anamnese/[token]/page.tsx
```

---

## Aba Arquivos (ficha do paciente) — jul/2026

Rota: `/pacientes/[id]/arquivos` · Tab: `patient-files-tab.tsx` · Wiki: `wiki-erp-clinic` → **24-arquivos-paciente**.

| Bloco | Comportamento (API integrada) |
|-------|-------------------------------|
| Toolbar | título **Arquivos**, busca server-side (debounce 400ms), **Novo** (pasta · imagem · arquivo · câmera), **Selecionar todas** |
| Breadcrumb | `GET …/drive/breadcrumb` — raiz **Arquivos** → subpastas |
| Grade | cards pastas/arquivos da pasta corrente (`GET …/drive?folderId=&search=`) |
| Ações (⋯) | Abrir · Baixar · Renomear · Mover · Excluir (mutations via React Query) |
| Upload | `clinicaUpload` multipart `POST …/files`; painel fixo inferior com status |
| Preview | imagens fullscreen via proxy `…/files/:id/content`; PDF/outros em nova aba |

Integração: `patient-files.service` + `use-patient-files-queries`. Sem badge "Em breve" (`PATIENT_DETAIL_IMPLEMENTED_TABS`). Fase 2: presigned URLs, drag-and-drop, ações em lote.

---

## Referências externas (somente leitura)

- Monorepo: `CLAUDE.md` na raiz do projeto
- ERP README: `apps/verticals/clinica/web/README.md`
- Tipos do manifest: `apps/verticals/clinica/web/src/lib/vertical/types.ts`
- ADRs: `gestao/docs/adrs/`
