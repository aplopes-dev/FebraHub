# AGENTS.md — Design System MUI (@citybox/mui)

> **Para agentes de IA:** Este arquivo é a fonte de verdade sobre o pacote
> `@citybox/mui`. Leia-o integralmente antes de qualquer ação. Ao adicionar/alterar
> componentes, tokens ou exports, atualize as seções relevantes deste arquivo na
> mesma operação. Nunca remova seções — apenas atualize ou adicione.

---

## 1. Identidade do Módulo

| Campo                                | Valor                                                                                     |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| **Nome**                             | `packages/mui` · pacote `@citybox/mui`                                                    |
| **Tipo**                             | Biblioteca de componentes **MUI** (atomic design)                                         |
| **Responsável**                      | Bruno Lopes — Aplopes Tecnologia                                                          |
| **Status**                           | 🟢 Em uso — `erp-web` (DualSidebar) + `imoveis-web` (app completo) + `beautiful-web` (AppSidebar 1 coluna) |
| **Consumido via**                    | **source** (TS/TSX) — sem build; apps usam `transpilePackages`                            |
| **Última atualização deste arquivo** | 2026-08-21 (`DatePicker`/`TimePicker`: `slotProps.htmlInput` para placeholder — MUI X v8 dropa `textField.inputProps`; `createAppTheme` no modo escuro não herda paleta clara; ícones/`CssBaseline` herdam `text.primary`) |

**Propósito em uma linha:**
Wrappers MUI organizados em atomic design, com **tema pluggable por app** —
cada frontend cria o próprio tema via `createAppTheme(overrides)` e o injeta no
`CityboxMuiProvider`. O pacote **não** embute uma marca única.

> Complementa (não substitui) `@citybox/ui` (Tailwind/shadcn). Use `@citybox/mui`
> apenas nos apps que adotarem Material UI.

---

## 2. Posição no Monorepo

```
citybox/
├── apps/
│   ├── erp-comercio/web/     ← DualSidebar + DualDashboardLayout
│   ├── imoveis/web/          ← app completo MUI + tema `src/theme/`
│   └── verticals/beautiful/web/ ← AppSidebar 1 coluna (:3114)
├── packages/
│   ├── ui/                   ← DS Tailwind/shadcn (@citybox/ui)
│   ├── mui/                  ← VOCÊ ESTÁ AQUI (@citybox/mui)
│   └── messaging/
└── AGENTS.md
```

**Depende de:** `@mui/material`, `@mui/icons-material`, `@emotion/react`,
`@emotion/styled`, `@emotion/cache`, `@mui/material-nextjs`, `@iconify/react`
(Solar via Iconify — ver `src/icons/`).

**Consumido por:**
| Consumidor | Uso |
|---|---|
| `apps/erp/web` | Shell: `DualSidebar` + `DualDashboardLayout` + tema `comercioMuiTheme` |
| `apps/imoveis/web` | App completo (cutover 2026-07-29): tema `imoveisMuiTheme` + atoms/molecules/organisms |
| `apps/verticals/beautiful/web` | Scaffold `AppSidebar` + `AppDashboardLayout` + tema `beautifulMuiTheme` (sem auth) |

**peerDependencies:** `react ^19` · `react-dom ^19`.

---

## 3. Stack e Versões

| Tecnologia   | Versão    | Observação                                                       |
| ------------ | --------- | ---------------------------------------------------------------- |
| pnpm         | workspace | **Package manager do monorepo** — nunca npm/yarn                 |
| TypeScript   | 5.9.x     |                                                                  |
| React        | 19 (peer) | apps fornecem o React                                            |
| MUI Material | **9.x**   | `@mui/material` + `@mui/icons-material` + `@mui/material-nextjs` |
| Emotion      | 11.x      | runtime de estilo do MUI                                         |
| Iconify      | 6.x       | `@iconify/react` — Solar atrás de `Icon name` + `variant`        |

---

## 4. Estrutura de Pastas

```
packages/mui/
├── src/
│   ├── index.ts                 ← reexporta tudo
│   ├── atoms/
│   │   ├── button/
│   │   ├── input/
│   │   ├── typography/
│   │   ├── icon/                  ← reexport de `icons/` (API semântica)
│   │   ├── checkbox/
│   │   ├── badge/                 ← Chip compacto
│   │   ├── tabs/                  ← Tabs + Tab
│   │   ├── select/                ← Select + MenuItem + FormControl + InputLabel
│   │   ├── menu/
│   │   ├── skeleton/
│   │   ├── radio/                 ← Radio + RadioGroup + FormControlLabel
│   │   ├── popover/
│   │   ├── switch/
│   │   ├── divider/
│   │   ├── icon-button/           ← reexport thin @mui/material/IconButton
│   │   ├── avatar/                ← Avatar MUI (foto + fallback)
│   │   ├── card/                  ← Card + Header/Content/Actions/Media/ActionArea
│   │   └── index.ts
│   ├── icons/
│   │   ├── icon.tsx               ← `<Icon name="home" variant="linear" />`
│   │   ├── icons-provider.tsx     ← variant padrão do app
│   │   ├── registry.ts            ← mapa semântico → glifo Solar (+ variants)
│   │   └── index.ts
│   ├── molecules/
│   │   ├── search-input/
│   │   ├── form-field/
│   │   ├── progress-mobile-stepper/ ← MobileStepper progress + Voltar/Próximo
│   │   ├── password-input/
│   │   ├── button-group/
│   │   ├── drawer/                ← drawer lateral (filtros/import)
│   │   ├── scroll-area/           ← scrollbar fino (hover)
│   │   ├── currency-input/        ← input monetário BRL (estilo caixa)
│   │   ├── autocomplete/          ← MUI Autocomplete + TextField outlined small
│   │   ├── multi-select/          ← Autocomplete multiple + chips (value: string[])
│   │   ├── date-picker/           ← DatePicker (@mui/x-date-pickers + dayjs pt-BR)
│   │   ├── time-picker/           ← TimePicker (`HH:mm` 24h; @mui/x-date-pickers + dayjs pt-BR)
│   │   ├── date-range-picker/     ← 2× DatePicker (@mui/x-date-pickers + dayjs pt-BR)
│   │   ├── empty-state/           ← título + descrição + action
│   │   ├── number-spinner/        ← number field MUI Spinner (@base-ui/react)
│   │   ├── number-input/          ← compat → NumberSpinner (API minValue/maxValue)
│   │   ├── nav-user/              ← avatar + menu do usuário (header/sidebar)
│   │   ├── toast/                 ← Toaster + toast API + templates (progress/simple)
│   │   └── index.ts
│   ├── organisms/
│   │   ├── data-table/            ← paginação server-side + isLoading + onRowClick
│   │   ├── user-form/
│   │   ├── header/                ← AppBar do shell (≠ PageHeader)
│   │   ├── page-header/           ← título + actions de feature
│   │   ├── sidebar/               ← Drawer simples (legado)
│   │   ├── app-sidebar/           ← sidebar 1 coluna (colapsável ícone)
│   │   ├── dual-sidebar/          ← rail ícones + painel (expandable)
│   │   ├── confirmation-dialog/
│   │   ├── command-palette/       ← busca global (Dialog + grupos + ⌘K)
│   │   └── index.ts
│   ├── templates/
│   │   ├── dashboard-layout/
│   │   ├── app-dashboard-layout/  ← AppSidebar + header slot + main
│   │   ├── dual-dashboard-layout/ ← DualSidebar + header slot + main
│   │   ├── auth-layout/
│   │   └── index.ts
│   └── theme/
│       ├── tokens.ts
│       ├── create-theme.ts
│       ├── citybox-mui-provider.tsx
│       ├── app-router-cache-provider.tsx  ← reexport Next 16 Emotion cache
│       └── index.ts
├── package.json
├── tsconfig.json
└── AGENTS.md
```

> **Convenção interna (desde 2026-07-28):** pastas e arquivos em **kebab-case**.
> Exports públicos permanecem PascalCase (`Button`, `DatePicker`, …) — consumidores
> importam `import { Button } from "@citybox/mui"` sem mudança.

### 4.1 Entrypoints (`package.json` → `exports`)

| Import                   | Conteúdo                                                                                                                                                                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@citybox/mui`           | tudo (atoms+molecules+organisms+templates+theme)                                                                                                                                                                                                                                     |
| `@citybox/mui/atoms`     | Button, Input, Typography, Icon, Checkbox, Badge, Tabs, Tab, Select, Menu, MenuItem, Skeleton, Radio, RadioGroup, FormControlLabel, Popover, FormControl, InputLabel, Switch, Divider, **IconButton**, Box, Stack, Paper, **Grid**, Tooltip, Alert, AlertTitle, Dialog(+Title/Content/Actions), **Card**(+Header/Content/Actions/Media/ActionArea) |
| `@citybox/mui/molecules` | SearchInput, FormField, PasswordInput, ButtonGroup, Drawer, ScrollArea, CurrencyInput, Autocomplete, MultiSelect, **DatePicker**, **TimePicker**, DateRangePicker, EmptyState, NumberSpinner, NumberInput, NavUser, **Logo**, **Toaster**, **toast** |
| `@citybox/mui/organisms` | DataTable, UserForm, Header, PageHeader, Sidebar, **AppSidebar**, DualSidebar, ConfirmationDialog, CommandPalette |
| `@citybox/mui/templates` | DashboardLayout, **AppDashboardLayout**, DualDashboardLayout, AuthLayout |
| `@citybox/mui/theme`     | `createAppTheme`, `baseTokens`, `CityboxMuiProvider`, `AppRouterCacheProvider`                                                                                                                                                                                                       |
| `@citybox/mui/icons`     | `Icon`, `IconsProvider`, `ICON_MAP`, `IconName`, `IconVariant`                                                                                                                                                                                                                       |

---

## 5. Restrições Críticas

### 5.1 Package Manager

```
SEMPRE: pnpm --filter @citybox/mui <script>
NUNCA:  npm install / yarn add
```

### 5.2 Consumido via **source** — sem build

```
Exports apontam para .ts/.tsx. Apps Next.js precisam de:
  transpilePackages: ['@citybox/mui']
```

### 5.3 Tema é do **app**, não do pacote

```
Cada frontend cria o próprio theme com createAppTheme(overrides)
e envolve a árvore com <CityboxMuiProvider theme={appTheme}>.
NÃO hardcodar cores de produto nos componentes do pacote —
usar tokens do theme (palette.primary, typography, spacing…).
```

### 5.4 Camadas atomic (não pular para cima)

```
atoms → molecules → organisms → templates
- Composições importam camadas inferiores por path relativo.
- Novo componente DEVE ser exportado no index.ts da camada.
```

### 5.5 Não misturar com `@citybox/ui` no mesmo shell sem decisão explícita

```
Os dois DS coexistem no monorepo, mas misturar Tailwind/shadcn + MUI
na mesma árvore exige cuidado (CssBaseline, fontes, tokens).
Prefira um DS por app (ou por área bem isolada).
```

### 5.6 Ícones — duas fontes (escolha consciente)

```
1) Semânticos (marca / navegação / features):
   SEMPRE: import { Icon } from "@citybox/mui/icons";
           <Icon name="home" />                 // variant do provider / linear
           <Icon name="home" variant="bold" />  // por ícone
   NUNCA:  import { Icon } from "@iconify/react";
   NUNCA:  <Icon icon="solar:home-2-bold" />    // acopla ao Solar
   NUNCA:  nomes do Solar na API pública (home-2-bold)

   Variants: linear | line-duotone | bold | bold-duotone
   Default do app: CityboxMuiProvider iconVariant=… ou <IconsProvider variant=…>
   Novo ícone: adicionar em registry.ts (nome semântico → glifo, sem sufixo).

2) Chrome MUI / controles nativos (preferir Material Icons):
   OK: import CloseIcon from "@mui/icons-material/Close";
   Usar em: Drawer (fechar), NumberSpinner (±), DualSidebar (toggle),
   PasswordInput (visibility), e qualquer affordance “padrão Material”.

Regra prática: se o ícone comunica marca/domínio → `Icon` Solar;
se é chrome de componente MUI (fechar, expandir, ±) → `@mui/icons-material`.
```

### 5.7 Modo escuro (`createAppTheme`)

```
Se qualquer override tiver palette.mode === 'dark', createAppTheme
NÃO mescla baseTokens.palette (texto #1A1C1E / action.active preto).
CssBaseline precisa setar color + backgroundColor no body (override
parcial de `body` substitui o default do MUI).
```

---

## 6. Padrões de Código

### 6.1 Atom = thin wrapper MUI

```tsx
import MuiButton from "@mui/material/Button";
export function Button(props: ButtonProps) {
  return <MuiButton {...props} />;
}
```

### 6.2 Molecule/Organism = composição com `"use client"`

```tsx
// importa atoms/molecules relativos; Props tipadas; sem cor hardcoded.
```

### 6.3 Tema por app

```tsx
// apps/meu-app/src/theme.ts
import { createAppTheme } from "@citybox/mui/theme";

export const appTheme = createAppTheme({
  palette: {
    primary: { main: "#0B5FFF" },
  },
  // Raio padrão do projeto — propaga para Button, Paper, Input, Chip, Dialog…
  shape: { borderRadius: 8 },
});
```

```tsx
// apps/meu-app/src/app/providers.tsx
import { CityboxMuiProvider } from "@citybox/mui/theme";
import { appTheme } from "../theme";

export function Providers({ children }: { children: React.ReactNode }) {
  return <CityboxMuiProvider theme={appTheme}>{children}</CityboxMuiProvider>;
}
```

### 6.4 Ícones semânticos

```tsx
import { Icon } from "@citybox/mui/icons";

<Icon name="home" />
<Icon name="settings" variant="linear" size={20} />
<Icon name="sales" variant="bold-duotone" sx={{ color: "primary.main" }} />
```

Default do app (todos os ícones):

```tsx
<CityboxMuiProvider theme={appTheme} iconVariant="linear">
  {children}
</CityboxMuiProvider>
```

Adicionar no `registry.ts` (só o glifo, sem sufixo):

```ts
delete: "trash-bin-trash",
```

---

## 7. Setup & Uso no App Consumidor

```ts
// next.config — transpilar o pacote
transpilePackages: ["@citybox/mui"];
```

```tsx
import { Button, Input } from "@citybox/mui/atoms";
import { SearchInput, FormField, Toaster, toast } from "@citybox/mui/molecules";
import { DataTable, Header, Sidebar } from "@citybox/mui/organisms";
import { DashboardLayout, AuthLayout } from "@citybox/mui/templates";
import { createAppTheme, CityboxMuiProvider } from "@citybox/mui/theme";
```

```tsx
// layout — dentro de CityboxMuiProvider
<Toaster position="bottom-right" template="progress" />

// em qualquer lugar (imperativo)
toast.success("Salvo", { description: "Produto atualizado." });
toast.error("Falha", { description: error.message });
toast.info("Em breve");
toast.warning("Atenção", { template: "simple" }); // outro layout
```

> Este pacote **não tem variáveis de ambiente**.

> **Toast:** peer/dep `sonner`. Novos templates = componente em
> `molecules/toast/templates/` + entrada em `TOAST_TEMPLATES`.
> Não importar `toast` de `sonner` direto nos apps MUI — usar `@citybox/mui`.
---

## 8. Scripts

```bash
pnpm --filter @citybox/mui typecheck   # tsc --noEmit
pnpm --filter @citybox/mui lint        # eslint src --ext .ts,.tsx

# NÃO há "build" — consumido via source.
```

---

## 9. Inventário do Pacote

### Atoms

`Button`, `Input`, `Typography`, `Icon`, `Checkbox`, `Badge`, `Tabs`, `Tab`,
`Select`, `MenuItem`, `FormControl`, `InputLabel`, `Menu`, `Skeleton`, `Radio`,
`RadioGroup`, `FormControlLabel`, `Popover`, `Switch`, `Divider`, `Avatar`,
`Box`, `Stack`, `Paper`, **`Grid`** (MUI Grid v2 API — `container`/`size`/`spacing`),
**`Card`** (+ `CardHeader`, `CardContent`, `CardActions`, `CardMedia`,
`CardActionArea` — thin wrappers MUI, sem cores de produto; composição
`Header`+`Content`+`Actions` ou `ActionArea`+`Media`+`Content`)

### Molecules

`SearchInput`, `FormField` (outlined + **label flutuante**), `PasswordInput`,
`ButtonGroup`, `Drawer`, `ScrollArea`
(`scrollAreaSx` — scrollbar fino, visível no hover), `CurrencyInput` (BRL, API
`value`/`onValueChange` em reais), `Autocomplete` (MUI + TextField outlined small;
`label`/`placeholder`/`errorMessage`), `NumberSpinner` (recipe MUI + Base UI NumberField;
botões −/+ laterais), `NumberInput` (wrapper compatível → NumberSpinner),
`NavUser` (avatar + menu do usuário; variantes `header` | `sidebar`),
**`Logo`** (símbolo/wordmark Citybox a partir de `logobrand.svg`/`logotipo.svg`; `variant` + `brandColor` + `symbolColor` para contraste claro/escuro),
**`DatePicker`** / **`TimePicker`** (`@mui/x-date-pickers` + dayjs pt-BR; TimePicker valor `HH:mm` 24h; placeholder em `slotProps.htmlInput`, não em `textField.inputProps`),
**`Toaster` / `toast`** (sistema de notificações baseado em sonner; templates
`progress` (default — barra pastel) e `simple`; variantes success/error/info/warning)

### Organisms

`DataTable` (paginação server-side 1-based, `isLoading` skeleton, `onRowClick`,
`getRowHref` + `linkComponent` — linha clicável com `<a>`/`Link` **esticado** sobre a
`<tr>` real, sem `component={Link}` no row (HTML inválido `<a><td>` → hydration error);
controles internos: `pointer-events: auto` + `stopRowNavigation` quando preciso),
altura mínima de linha **56px** alinhada a thumbnails 40px),
`UserForm`, `Header` (AppBar shell), `PageHeader` (título + actions de feature),
`Sidebar` (Drawer legado), **`AppSidebar`** (1 coluna colapsável — equivalente MUI
do `@citybox/ui` AppSidebar; `navGroups`/`footerNavItems`/`brandNode`/`collapsible`;
toggle na borda superior entre sidebar e header),
`DualSidebar` (rail ícones **18px** + painel controlado; toggle do painel
permanece no rail com coluna 2 fechada), `ConfirmationDialog`,
`CommandPalette` (busca global: Dialog + grupos; filtro `local` \| `external`; query controlado; `loading`; atalho ⌘K opcional)

### Templates

`DashboardLayout`, **`AppDashboardLayout`** (AppSidebar + header full-bleed + main),
`DualDashboardLayout` (DualSidebar + header full-bleed + main),
`AuthLayout`

### Theme

`baseTokens`, `createAppTheme`, `CityboxMuiProvider`, `AppRouterCacheProvider`

Palette custom: `sidebar` (AppSidebar 1 coluna + coluna 2 DualSidebar) · `muted` (`#F5F5F5` — chips/badges
e hover de `Button` outlined/text; `color="muted"` no `Badge`/`Chip`/`Button`) ·
`background.header`

### Icons (`@citybox/mui/icons`)

`Icon` (`name` + `variant`), `IconsProvider`, `ICON_MAP`, `ICON_VARIANTS`,
`IconName`, `IconVariant`, `resolveIconId(name, variant)`.
Implementação: **Solar** via `@iconify/react`
([catálogo](https://icon-sets.iconify.design/solar/)).
Variants: `linear` (default) | `line-duotone` | `bold` | `bold-duotone`.

---

## 10. Decisões de Arquitetura

| Decisão                                      | Motivo                                                |
| -------------------------------------------- | ----------------------------------------------------- |
| Atomic design (atoms→…→templates)            | Mesma linguagem do `@citybox/ui`; camadas claras      |
| Consumir via source + `transpilePackages`    | DX rápida no monorepo, alinhado ao `@citybox/ui`      |
| Tema pluggable (`createAppTheme` + Provider) | Cada app tem identidade visual própria                |
| `createAppTheme` descarta `baseTokens.palette` no dark | Evita texto/`action.active` pretos sobre fundo escuro |
| Thin wrappers MUI                            | Evoluir API Citybox sem perder acessibilidade/API MUI |
| Pacote separado de `@citybox/ui`             | Evitar misturar stacks Tailwind e Emotion             |
| Ícones semânticos (`Icon name`) + registry   | Trocar Solar→Lucide/Material sem tocar nos apps       |
| Iconify + Solar + `variant`                  | Catálogo amplo; app escolhe linear/duotone/bold       |

---

## 11. Contexto para a IA

### O que NÃO fazer

- Não embutir cores/marca de um produto específico nos tokens default sem
  necessidade — overrides ficam no app.
- Não importar `@iconify/react` / IDs `solar:*` nos apps — usar `<Icon name="…" />`.
- Não esquecer de exportar no `index.ts` da camada.
- Não adicionar `build` esperando `dist`.
- Não instalar com npm/yarn.
- Não assumir que todos os frontends usam este pacote — só quem integrar.

### Ao adicionar um **ícone**

1. Escolher nome semântico estável (`delete`, não `trash-bin-trash-bold`).
2. Mapear o **glifo** Solar (sem sufixo de estilo) em `src/icons/registry.ts`.
3. Confirmar que o glifo existe nos 4 estilos (linear / line-duotone / bold / bold-duotone).
4. `pnpm --filter @citybox/mui typecheck`.

### Ao adicionar um componente

1. Colocar na camada certa (`atoms`/`molecules`/`organisms`/`templates`).
2. `"use client"` se usar estado/efeitos/eventos.
3. Exportar no `index.ts` da camada e refletir na seção 9.
4. `pnpm --filter @citybox/mui typecheck`.

### Fluxo de integração num app

1. `pnpm --filter <app> add @citybox/mui@workspace:*` (ou deps no package.json).
2. `transpilePackages: ['@citybox/mui']`.
3. Criar `theme.ts` do app com `createAppTheme(overrides)`.
4. Envolver layout com `CityboxMuiProvider`.
5. Atualizar §2 deste arquivo (consumidores).

---

## 12. Histórico de Mudanças Estruturais

| Data       | Mudança                                                                                                                                                                                                    | Impacto                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 2026-08-20 | Modo escuro: `createAppTheme` não faz merge da paleta clara; `CssBaseline` define `color`/`background` no `body`; `IconButton`/`ListItemIcon`/`SvgIcon` herdam texto do tema; `Icon` remapeia fill preto do Iconify | Ícones e texto visíveis no dark (Beautiful e demais apps MUI) |
| 2026-08-16 | `DataTable` `getRowHref`: deixa de usar `TableRow component={Link}` (HTML inválido `<a><td>` → hydration); link esticado absoluto sobre a `<tr>` + `pointer-events` nos controles | Corrige console error em listagens ERP (produtos etc.) |
| 2026-08-11 | Molecule **`ProgressMobileStepper`** (`MobileStepper` progress + Voltar/Próximo controlado) | Beautiful Equipe (criar/editar membro em 2 passos); `import { ProgressMobileStepper } from "@citybox/mui"` |
| 2026-08-07 | Atom **`Grid`** no layout (`Box`/`Stack`/`Paper`/`Grid`); API MUI v2 (`size`, `container`, `spacing`) | Apps MUI usam `import { Grid } from "@citybox/mui"` / `@citybox/mui/atoms` |
| 2026-08-06 | Atom **`Card`** (+ Header/Content/Actions/Media/ActionArea); thin wrappers MUI sem cores de produto | Apps MUI usam `import { Card } from "@citybox/mui/atoms"` |
| 2026-08-06 | `DualSidebar` rail icons: **18px** | Densidade do shell no erp-web |
| 2026-08-03 | **`Logo`** molecule + `AppSidebar` toggle na borda superior (meio sidebar/header); exports `logobrand.svg`/`logotipo.svg` | Beautiful e apps MUI reusam marca Citybox |
| 2026-08-03 | **`AppSidebar`** + **`AppDashboardLayout`** (sidebar 1 coluna colapsável); Beautiful migra de Dual para AppSidebar                                                                                        | Paridade com `@citybox/ui` AppSidebar; scaffold Beautiful usa 1 coluna           |
| 2026-08-03 | Consumidor **`beautiful-web`** (scaffold + `beautifulMuiTheme`)                                                                                                                                           | Vertical Beautiful no monorepo                                                   |
| 2026-07-30 | `CommandPalette`: query controlado, `filterMode` local/external, `loading` | Busca async (imoveis-web header) sem filtrar de novo no client |
| 2026-07-30 | Molecule **`TimePicker`** (`HH:mm` 24h; `@mui/x-date-pickers` + dayjs pt-BR); `DatePicker` ganha `sx`/`placeholder` | Formulários (ex.: agenda imóveis) usam pickers do DS em vez de `input type="time"` |
| 2026-07-29 | `DataTable`: `getRowHref` + `linkComponent` (linha como link; default `"a"`) — apps Next passam `Link` | Listagens disparam nextjs-toploader sem `router.push` |
| 2026-07-28 | Molecule **`toast`**: `Toaster` + API `toast.*` + templates `progress` (default, barra pastel) / `simple`; peer/dep `sonner` | erp-comercio-web troca Toaster shadcn; outros apps MUI reusam |
| 2026-07-28 | Atom **`Avatar`**; molecules **`NavUser`** (header/sidebar); organism **`CommandPalette`** (substituto MUI do CommandDialog shadcn)                                                                       | Shell header do erp-comercio-web 100% MUI                                        |
| 2026-07-28 | **`ICON_MAP`:** `landmark` → `banknote-2`; `scale` → `list-check`; novo `checklist` | Corrige ícones inexistentes (`bank-linear`, `scales-linear`) no menu Finanças e telas de contas |
| 2026-07-28 | **DatePicker 44px:** overrides em `MuiPickersOutlinedInput`/`MuiPickersFilledInput` (MUI X usa pickers próprios, não `MuiOutlinedInput`); `DatePicker`/`DateRangePicker` passam `size="medium"` | Paridade visual com TextField/Select |
| 2026-07-28 | **Drawer molecule flutuante:** inset 16px das bordas + `borderRadius` do tema + sombra; Sidebar (`MuiDrawer` direto) permanece colado | Painéis de filtro/form não encostam nas margens da tela |
| 2026-07-28 | **Densidade invertida:** default (`medium`) = **44px**; `size="small"` = **36px** (altura do `Button` medium); removido `defaultProps.size: "small"` dos campos | Formulários sem `size` ficam 44px; passe `size="small"` para alinhar campo ao botão |
| 2026-07-28 | **`FORM_CONTROL_HEIGHT` = 44px** no tema (`MuiOutlinedInput`, `MuiInputBase`, `MuiSelect`); `NumberSpinner`/`CurrencyInput` sem `size` compacto; botão no default MUI | Campos padronizados em 44px; botões independentes |
| 2026-07-28 | **Controles no tamanho padrão MUI (`medium`):** removido `size: "small"` default de `MuiButton`/`MuiTextField`; wrappers (`DatePicker`, `Autocomplete`, `NumberSpinner`, `Badge`, …) sem `small` implícito | ERP Comércio exibe botões/campos/selects no tamanho normal para avaliação visual |
| 2026-07-28 | **Estrutura interna kebab-case** (`button/button.tsx`, `date-range-picker/`, …); exports públicos inalterados                                                                                              | Padroniza paths do pacote; consumidores não mudam imports                        |
| 2026-07-28 | Atom **`IconButton`**; molecule **`DatePicker`** (`@mui/x-date-pickers` + dayjs pt-BR)                                                                                                                     | Estoque/compras/movimentações usam DatePicker do DS                              |
| 2026-07-28 | `MuiButton`: default `size="small"` + `minHeight: 40` (paridade com `TextField`/`Select` `size="small"`)                                                                                                   | Busca + CTA em `PageHeader` alinhados (ex.: unidade de medida)                   |
| 2026-07-28 | Atoms `Alert`/`Dialog`/`Tooltip`/`Box`/`Stack`/`Paper`; molecules `MultiSelect`, `DateRangePicker` (`@mui/x-date-pickers` + dayjs), `EmptyState`                                                           | Features erp-comercio importam DS em vez de `@mui/material` solto / shadcn       |
| 2026-07-28 | `DataTable`: `bodyCellSx.height: 56` (thumbnail 40px + padding)                                                                                                                                            | Linhas com/sem avatar (categorias vs produtos) ficam na mesma altura             |
| 2026-07-27 | Upgrade **Material UI 7 → 9** (`@mui/material` 9.2, icons, material-nextjs); Button `styleOverrides` via `variants`; system props só em `sx`                                                               | Breaking do MUI v9; apps consumidores precisam alinhar                           |
| 2026-07-27 | Política de ícones dual: Solar (`Icon`) para domínio/marca; `@mui/icons-material` para chrome MUI. `Drawer` close passa a `Close` Material                                                                 | Evita misturar Solar no chrome nativo do Drawer                                  |
| 2026-07-27 | Molecule `Autocomplete` (MUI Autocomplete + TextField outlined small)                                                                                                                                      | Form produto: fornecedores e sugestões                                           |
| 2026-07-27 | Molecule `NumberSpinner` (Base UI NumberField + recipe MUI Spinner); `NumberInput` vira wrapper compat; dep `@base-ui/react`                                                                               | Form produto usa NumberSpinner                                                   |
| 2026-07-27 | Atoms `Switch`, `Divider`; molecules `CurrencyInput`, `NumberInput`                                                                                                                                        | Formulário de produto (erp-comercio) migra campos monetários/numéricos e toggles |
| 2026-07-27 | Molecule `ScrollArea` (+ `scrollAreaSx`); DataTable body e Drawer content passam a usá-lo                                                                                                                  | Scroll estilizado reutilizável (filtros, tabelas, etc.)                          |
| 2026-07-27 | Atoms/molecules para listagens (Badge, Tabs, Select, Menu, Skeleton, Radio, Popover, Drawer) + organism `PageHeader`; DataTable com `isLoading`/`onRowClick`; SearchInput usa `Icon` semântico             | Paridade para migrar listagem Produtos do erp-comercio                           |
| 2026-07-27 | `Icon.variant` + `IconsProvider` / `CityboxMuiProvider.iconVariant` (linear, line-duotone, bold, bold-duotone)                                                                                             | App escolhe estilo Solar global ou por ícone                                     |
| 2026-07-27 | Camada `icons/`: `Icon` semântico + `ICON_MAP` (Solar via Iconify)                                                                                                                                         | Apps usam `name`; troca de lib centralizada                                      |
| 2026-07-27 | `DualSidebar` + `DualDashboardLayout` + `AppRouterCacheProvider`; 1º consumidor `erp-comercio-web`                                                                                                         | Shell Dual MUI no comércio                                                       |
| 2026-07-27 | Pacote `@citybox/mui` criado (scaffold atomic + theme pluggable)                                                                                                                                           | Pronto para 1º consumidor                                                        |
