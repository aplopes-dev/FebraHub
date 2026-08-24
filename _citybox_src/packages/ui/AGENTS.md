# AGENTS.md — Design System (@citybox/ui)

> **Para agentes de IA:** Este arquivo é a fonte de verdade sobre o pacote
> `@citybox/ui`. Leia-o integralmente antes de qualquer ação. Ao adicionar/alterar
> componentes, tokens ou exports, atualize as seções relevantes deste arquivo na
> mesma operação. Nunca remova seções — apenas atualize ou adicione.

---

## 1. Identidade do Módulo

| Campo            | Valor                                                  |
| ---------------- | ------------------------------------------------------ |
| **Nome**         | `packages/ui` · pacote `@citybox/ui`                   |
| **Tipo**         | **Design System** React (biblioteca de componentes — atomic design) |
| **Responsável**  | Bruno Lopes — Aplopes Tecnologia                       |
| **Status**       | 🟢 Em uso (base de UI de todos os frontends)           |
| **Consumido via**| **source** (TS/TSX) — sem build; apps usam `transpilePackages` |
| **Última atualização deste arquivo** | 2026-08-21 |

**Propósito em uma linha:**
Biblioteca compartilhada de UI do monorepo CityBox — **React 19 + Tailwind v4 +
shadcn**, organizada por **atomic design** (atoms → molecules → organisms →
templates), com tokens de cor **OKLCH** e tema claro/escuro via classe `.dark`.

> ⚠️ **README desatualizado:** `packages/ui/README.md` descreve uma versão antiga
> (Instrument Sans + Fraunces, `data-theme="warm"`, `tokens.css`, `RegistryPanel`).
> A referência **canônica e atual** é o **`STYLEGUIDE.md`** (Inter Variable, `.dark`,
> OKLCH) e **este AGENTS.md**.

---

## 2. Posição no Monorepo

```
citybox/
├── apps/
│   ├── erp/                  ← consome @citybox/ui (backoffice do lojista)
│   ├── erp-comercio/web/     ← consome @citybox/ui (backoffice comércio · scaffold)
│   ├── platform/admin/       ← consome @citybox/ui (admin-web)
│   ├── pdv/frontend/         ← consome @citybox/ui (PDV PWA · food/varejo)
│   ├── keycloak-theme/       ← consome @citybox/ui (telas de login)
│   ├── imoveis/web/          ← consome @citybox/ui (vertical imóveis · :3111)
│   └── verticals/*/web        ← webs das verticais (quando houver)
├── packages/
│   ├── ui/                   ← VOCÊ ESTÁ AQUI (@citybox/ui)
│   └── …
└── AGENTS.md                 ← contexto raiz (modelo deste arquivo)
```

**Depende de:** Radix UI, shadcn, `cmdk`, `recharts`, `react-hook-form` +
`@hookform/resolvers`, `embla-carousel-react`, `vaul`, `sonner`, `react-day-picker`,
`input-otp`, `motion`, `date-fns`, `lucide-react`, `class-variance-authority`,
`clsx`, `tailwind-merge`, `next-themes`, `@tanstack/react-table`, `zod`,
`@fontsource-variable/inter`.

**Consumido por:** **todos os frontends** do monorepo (erp, erp-comercio,
admin-web, pdv, keycloak-theme, webs verticais). É a fundação visual — mudanças
aqui propagam para todos os apps.

**peerDependencies:** `react ^19` · `react-dom ^19`.

---

## 3. Stack e Versões

| Tecnologia        | Versão  | Observação                                                |
| ----------------- | ------- | --------------------------------------------------------- |
| pnpm              | workspace | **Package manager do monorepo** — nunca npm/yarn        |
| TypeScript        | 5.9.x   |                                                           |
| React             | 19 (peer) | apps fornecem o React (peer dep)                        |
| TailwindCSS       | v4      | via `@tailwindcss/vite`; **config no CSS** (sem `tailwind.config.ts` próprio) |
| shadcn            | 4.x     | base dos primitivos (`components.json`, style `radix-luma`) |
| Radix UI          | 1.x     | primitivos acessíveis por trás dos atoms                  |
| `class-variance-authority` + `tailwind-merge` + `clsx` | — | variantes e merge de classes (`cn`) |
| next-themes       | 0.4     | alterna `.dark` no `<html>`                               |
| Storybook         | 10.x    | catálogo interativo (`:6006`) + addon-a11y                |
| Vite              | 6       | usado pelo Storybook e pelo Tailwind plugin               |
| Inter Variable    | —       | `@fontsource-variable/inter` (fonte única)                |

---

## 4. Estrutura de Pastas

Organização por **atomic design**. `components/ui/` guarda os primitivos shadcn
"stock"; `components/atoms/` os **reembrulha/expõe** (com stories); `molecules`/
`organisms` são composições próprias do CityBox; `templates` (páginas inteiras)
fica sob demanda.

```
packages/ui/
├── src/
│   ├── index.ts              ← entrypoint "." → reexporta atoms+molecules+organisms+templates + lib(cn,types,tab-styles)
│   ├── components/
│   │   ├── ui/               ← PRIMITIVOS shadcn "stock" (button.tsx, input.tsx, dialog.tsx, table.tsx, …)
│   │   ├── atoms/            ← expõe os primitivos (cada <x>/{<x>.tsx reexporta ../../ui/<x>, index.ts, [<x>.stories.tsx]})
│   │   ├── molecules/        ← composições pequenas próprias (form-field, search-input, currency-input, …)
│   │   ├── organisms/        ← blocos complexos (app-sidebar, data-table, modal-form, page-header, …)
│   │   └── templates/        ← páginas inteiras (vazio hoje; criado sob demanda por app)
│   ├── lib/
│   │   ├── utils.ts          ← `cn()` = twMerge(clsx(...))
│   │   ├── types.ts          ← `BaseProps` ({ className?, children? })
│   │   └── tab-styles.ts     ← classes utilitárias de abas (TAB_LIST_LINE_CLASS, TAB_TRIGGER_LINE_CLASS, …)
│   ├── hooks/
│   │   └── use-mobile.ts(.tsx)  ← hook de breakpoint mobile (usado pela Sidebar)
│   └── styles/
│       └── globals.css       ← Tailwind v4 + tw-animate-css + shadcn + Inter; @theme inline (tokens OKLCH) + .dark
├── .storybook/               ← main.ts · preview.ts · preview.css
├── components.json           ← config shadcn (style "radix-luma", css em src/styles/globals.css, baseColor neutral)
├── vite.config.ts            ← plugin tailwind + alias "@" → src
├── package.json              ← exports por camada; SEM script "build"
├── STYLEGUIDE.md             ← ★ referência canônica de uso/tema
├── README.md                 ← ⚠️ desatualizado
├── logobrand.svg · logotipo.svg
└── AGENTS.md                  ← ESTE ARQUIVO
```

### 4.1 Entrypoints (`package.json` → `exports`)
| Import | Conteúdo |
|--------|----------|
| `@citybox/ui` | tudo (atoms+molecules+organisms+templates) + `cn`, `BaseProps`, `tab-styles` |
| `@citybox/ui/atoms` | primitivos shadcn |
| `@citybox/ui/molecules` | composições pequenas |
| `@citybox/ui/organisms` | blocos complexos |
| `@citybox/ui/templates` | páginas inteiras (sob demanda) |
| `@citybox/ui/styles` | `src/styles/globals.css` (tokens + base Tailwind + Inter) |
| `@citybox/ui/logobrand.svg` | asset da marca |

---

## 5. Restrições Críticas

> ⚠️ Ignorar isto quebra o consumo nos apps ou a consistência visual.

### 5.1 Package Manager
```
SEMPRE: pnpm --filter @citybox/ui <script>
NUNCA:  npm install / yarn add
```

### 5.2 Consumido via **source** — sem build, apps precisam transpilar
```
Os exports apontam para .ts/.tsx (não há dist). Cada app consumidor precisa de
  transpilePackages: ['@citybox/ui']   (Next.js)  — ou equivalente no bundler.
NÃO existe script "build"; "typecheck"/"lint" validam o pacote.
```

### 5.3 Sem cores/typografia hardcoded — usar **tokens**
```tsx
// ✅ tokens do tema (OKLCH), claros/escuros automáticos
className="bg-primary text-primary-foreground border-border"
// ❌ cor hardcoded
className="bg-[#E85D04] text-white"
```

### 5.4 Camadas do atomic design (não pular para cima)
```
ui (shadcn stock) → atoms → molecules → organisms → templates
- Novos primitivos shadcn entram em components/ui e são expostos via atoms/.
- Composição reutilizável vira molecule/organism com export no index.ts da camada.
- Cada componente novo PRECISA ser exportado no index.ts da sua camada (senão não sai no entrypoint).
```

### 5.5 Merge de classes sempre com `cn()`
```tsx
import { cn } from "@citybox/ui";   // twMerge + clsx — evita conflito de classes Tailwind
<div className={cn("px-3 py-2", className)} />
```

### 5.6 Tema é aplicado pelo **app**, não pelo pacote
```
O app importa @citybox/ui/styles no seu globals.css e usa next-themes
(ThemeProvider attribute="class") para alternar .dark. O pacote NÃO injeta tema sozinho.
```

### 5.7 README é legado — seguir STYLEGUIDE/este AGENT
```
Ignorar README.md (Instrument Sans/Fraunces, data-theme="warm", tokens.css, RegistryPanel).
Atual: Inter Variable, classe .dark, OKLCH, @citybox/ui/styles.
```

---

## 6. Padrões de Código

### 6.1 Atom = reexporta o primitivo shadcn de `components/ui`
```tsx
// components/atoms/button/button.tsx
import type { ComponentProps } from "react";
import { Button as UiButton, buttonVariants } from "../../ui/button";
export { UiButton as Button, buttonVariants };
export type ButtonProps = ComponentProps<typeof UiButton>;
// + components/atoms/button/index.ts (re-export) e button.stories.tsx (opcional)
```

### 6.2 Molecule/Organism = composição própria com `"use client"`
```tsx
// importa atoms relativos (../../atoms/...) + cn (../../../lib/utils)
// expõe Props tipadas; sem cor hardcoded; export no index.ts da camada.
```

### 6.3 Variantes com CVA + `cn`
```tsx
import { cva } from "class-variance-authority";
const variants = cva("base...", { variants: { ... }, defaultVariants: { ... } });
```

### 6.4 Stories (Storybook)
```
<componente>.stories.tsx ao lado do componente; addon-a11y habilitado.
```

### 6.5 `Card` — superfície flat (padrão Citybox)
```
O primitivo Card usa shadow-none + ring-0 + border border-border/50 — contorno visível
sem sombra de fundo. bg-card no tema claro pode coincidir com bg-background; a borda
define o card. Para remover borda em casos específicos, passe border-0 no className.
Não usar shadow-sm/shadow-md em cards de backoffice.
```

---

## 7. Setup & Uso no App Consumidor

```css
/* globals.css do app */
@import "@citybox/ui/styles";   /* tokens OKLCH + base Tailwind + Inter */
```
```tsx
// layout.tsx — tema claro/escuro
import { ThemeProvider } from "next-themes";
<html lang="pt-BR" suppressHydrationWarning>
  <body>
    <ThemeProvider attribute="class" defaultTheme="light">{children}</ThemeProvider>
  </body>
</html>
```
```ts
// next.config — transpilar o pacote (consumido via source)
transpilePackages: ['@citybox/ui']
```
```tsx
// uso
import { Button, Input, Label } from "@citybox/ui/atoms";
import { SearchInput, CurrencyField, MultiSelect } from "@citybox/ui/molecules";
import { DataTable, ModalForm, PageHeader } from "@citybox/ui/organisms";
import { cn } from "@citybox/ui";
```

> Este pacote **não tem variáveis de ambiente** — sua "configuração" é o tema
> (tokens em `globals.css`) e o `ThemeProvider` do app.

---

## 8. Scripts

```bash
pnpm --filter @citybox/ui storybook        # Storybook dev (:6006)
pnpm --filter @citybox/ui build-storybook  # build estático do Storybook
pnpm --filter @citybox/ui typecheck        # tsc --noEmit
pnpm --filter @citybox/ui lint             # eslint src --ext .ts,.tsx

# NÃO há "build" — o pacote é consumido via source (transpilePackages no app).
```

---

## 9. Inventário do Pacote

### Atoms (`@citybox/ui/atoms`) — primitivos shadcn
`accordion`, `alert`, `alert-dialog`, `aspect-ratio`, `avatar`, `badge`,
`breadcrumb`, `button`, `calendar`, `card`, `carousel`, `chart`, `checkbox`,
`collapsible`, `command`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`,
`form`, `hover-card`, `input`, `input-otp`, `item`, `label`, `menubar`, `navigation-menu`,
`pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`,
`select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`,
`switch`, `table`, `tabs`, `textarea`, `toggle`, `toggle-group`,
`motion-toggle-group`, `tooltip`.

### Molecules (`@citybox/ui/molecules`) — composições pequenas
| Componente | Uso |
|-----------|-----|
| `InputField` (`form-field`) | Label + Input + hint/erro |
| `CurrencyInput` / `CurrencyField` | input monetário BRL (estilo caixa, em centavos) |
| `MultiSelect` | seleção múltipla com busca (popover + command + badges) |
| `ComboboxSelect` | seleção única com busca (popover + command); opção com `label` + `description` opcional; botão de criar **fixo no rodapé** (fora do scroll da lista); props `modal` + `portalContainer` para uso **dentro de Drawer Vaul** (body com `pointer-events: none`) |
| `NumberInput` | input numérico com botões −/+ (React Aria `NumberField`; Origin UI / coss.com) |
| `SearchInput` | campo de busca |
| `DatePicker` / `DateRangePicker` | seleção de data/intervalo — trigger no **padrão de campo** (`bg-input/50` + `border-transparent` + `rounded-3xl`, igual a `Input`/`SelectTrigger`), estático (sem hover), ring no focus; `DatePicker` aceita `aria-label` no botão gatilho e `portalContainer` (uso dentro de Drawer Vaul, como `DateRangePickerInput`) |
| `AvatarUpload` | upload de avatar |
| `Logo` | logo CityBox |
| `NavUser` | bloco de usuário (sidebar) |
| `PageNav` / `PageTabs` | navegação/abas — `scrollMode` + `buttonsHideFrom` (`lg`\|`xl`\|`2xl`): Configurações=`2xl`; Financeiro=`xl` (sem setas em 1280/1366) |
| `ProfileContactCard` | cartão de contato |
| `StatCard` | métrica/KPI |
| `VerticalBadge` | badge da vertical |

### Organisms (`@citybox/ui/organisms`) — blocos complexos
`AppSidebar`, `AppSidebarDual` (`railVariant`: `icon-only` default legado |
food/varejo; `expandable` = rail com labels quando painel fechado — uso em |
erp-comercio; props `navGroups`, `footerNavItems`, `showPanelSearch`, |
`panelOpen`/`onPanelOpenChange`, `hasPanel`, `linkComponent`,
`brandNode`/`brandNodeCollapsed`), `AuditTimeline`,
`ConfirmDialog`, `DataTable`,
`EmptyState`, `EntityProfileHeader`, `EntitySummaryHeader`, `FilterPopover`,
`Kanban`, `ModalForm`, `ModalFormMultistep`, `ModalFormTabs`, `PageHeader`,
`RichTextEditor`.

> **`ConfirmDialog`:** prop `icon` aceita `LucideIcon | null` — passe `null` para omitir
> o círculo com ícone ao lado do título (ex.: exclusão de procedimento finalizado na clínica).

> **`ModalForm`** — modal padrão (cabeçalho + corpo com scroll + rodapé salvar/cancelar).
> `onSave` é opcional e `hideFooter` oculta o rodapé para modais sem ação de salvar
> (ex.: visualização/QR Code com ações próprias no corpo).

> **`Kanban`** (`KanbanProvider`/`KanbanBoard`/`KanbanHeader`/`KanbanCards`/`KanbanCard`) —
> board com drag-and-drop (dnd-kit). Além do arrasto de cards entre colunas, suporta:
> **reordenar colunas** (`KanbanColumnHandle` + `onColumnReorder` + `isColumnSortable` para
> travar colunas específicas), **drag otimista** de cards (`onDragOver` + `onDataChange` com
> `arrayMove`) e **`onCardDrop`** (snapshot final no drop — para persistir `sortOrder` sem
> depender do setState assíncrono). Prop **`layout`**: `'scroll'` (padrão, faixa `w-max` +
> ScrollBar H) ou `'fill'` (largura total; em viewports menores as colunas **quebram** com
> `flex-wrap`, em `lg+` ficam em uma linha — combine `KanbanBoard` com `basis-*`/`flex-1`).
> Prop opcional **`id`**: id estável do `DndContext` (SSR). Sem isso usa `useId()` do React —
> evita mismatch de `aria-describedby` (`DndDescribedBy-N` via contador de módulo do dnd-kit).
> `DragOverlay` só porta para `document.body` após mount (não usa `typeof window` no render).
> `KanbanCards` usa **`overflow-y-auto`** nativo (não Radix ScrollArea) e aceita
> **`viewportClassName`** / **`viewportStyle`** (ex. `maxHeight` para limitar cards
> visíveis e ativar scroll vertical por coluna).
> Cor de fundo das colunas pelo token **`--kanban-column`**.
> Usos: kanban de Vendas da Clínica (`scroll`); leads do Imóveis (`fill` + cores por status).

> **`AppSidebar`** — shell de backoffice de 1 coluna. Prop **`fillViewport`** (opt-in): aplica
> `h-svh overflow-hidden` no `SidebarProvider` e torna a `<main>` o **container de scroll**
> (`min-h-0 min-w-0 flex-1 overflow-y-auto p-4`). Necessário quando a página tem scroll interno
> próprio (kanban/agenda) para conter o scroll no board e não na página inteira. A vertical
> Clínica passa `fillViewport`. Separador vertical ao lado do `SidebarTrigger` no header usa
> `self-center` + `h-4` (o `Separator` base traz `self-stretch`, que desalinhava o traço do
> breadcrumb/`Clínica`).

> **`AppSidebarDual`** — shell de 2 colunas (rail + painel). Default `railVariant="icon-only"`
> (food/varejo). Opt-in `railVariant="expandable"`: rail **sempre** comprimido (só ícones);
> a coluna 2 abre/fecha sem expandir o rail. Props extras: `footerNavItems`,
> `showPanelSearch`, `panelOpen`/`onPanelOpenChange`, `hasPanel`, `linkComponent`,
> `brandNode` / `brandNodeCollapsed` (logo compacta no rail),
> `panelCloseLabel` / `panelCloseIcon` (botão acima do footer para fechar a coluna 2).
> No **expandable**, itens com `hasPanel` **não navegam** no rail — só abrem o painel;
> navegação fica nos leaves da coluna 2. `user` é **opcional** — omitir remove o `NavUser`
> do rodapé do rail (ex.: erp-web coloca o user no header). 1º uso expandable:
> `@citybox/erp-web` (antes `@citybox/erp-comercio`).

> **`RichTextEditor`** — editor de texto rico baseado em **Tiptap v3** (`@tiptap/react`,
> `@tiptap/starter-kit`, `@tiptap/extension-text-align`, `@tiptap/extension-placeholder`,
> `@tiptap/pm`). Saída em **HTML** (`value`/`onChange`), toolbar de formatação
> (negrito, itálico, sublinhado, tachado, H1–H3, listas, alinhamento, **emoticons**,
> desfazer/refazer)
> e nó atômico `variable` (chip que serializa para `{{token}}` via `data-variable`).
> Expõe handle imperativo (`RichTextEditorHandle`: `insertVariable`, `focus`) e suporta
> drop de chips externos (`dropMimeType` + `parseDropData`). A prop **`toolbar`** escolhe o
> conjunto de ações: `"full"` (padrão, todas) ou **`"basic"`** — só desfazer/refazer e os
> grupos de formatação (negrito → justificar), sem estilo/fonte, código, emoji, imagem, cor
> e busca (1º uso: anamnese do Inicializar da nutrição). A prop `page="a4"` ativa o
> modo **folha A4** (papel branco centralizado via tokens `--paper`/`--paper-foreground`,
> margens reais, guias de quebra de página e CSS de impressão `@page A4` escopado em
> `[data-rte-paper]`). Usado no editor de modelos de contrato da vertical Clínica.

### Templates (`@citybox/ui/templates`)
Vazio hoje — páginas inteiras criadas **sob demanda** por app.

### lib (`@citybox/ui`)
- `cn(...)` — merge de classes (twMerge + clsx).
- `BaseProps` — `{ className?, children? }`.
- `tab-styles` — classes utilitárias de abas (ex.: `TAB_LIST_LINE_CLASS`, `TAB_TRIGGER_LINE_CLASS`).

### hooks
- `use-mobile` — detecção de breakpoint mobile (usado pela `Sidebar`).

### styles / tema
- `globals.css` — `@import "tailwindcss"` + `tw-animate-css` + `shadcn` + Inter; `@theme inline` mapeia tokens; escala **OKLCH**; dark via `.dark`. Inclui tokens de `sidebar-*`, `chart-*` e `paper`/`paper-foreground` (papel de documento A4 — branco em ambos os temas).

---

## 10. Decisões de Arquitetura

| Decisão | Motivo |
|---------|--------|
| **Atomic design** (ui→atoms→molecules→organisms→templates) | Camadas claras; reuso crescente; baixo acoplamento |
| Consumir **via source** (sem build) + `transpilePackages` | Sem etapa de build/publish; DX rápida no monorepo |
| Base **shadcn** em `components/ui` exposta por `atoms/` | Padrão de mercado acessível (Radix) com camada CityBox por cima |
| **Tokens OKLCH** + `.dark` (next-themes) | Tema consistente claro/escuro sem cores hardcoded |
| `cn()` (twMerge+clsx) como único merge de classes | Evita conflito de utilitárias Tailwind |
| **Export obrigatório no index** da camada | Entrypoints estáveis (`@citybox/ui/atoms` etc.) |
| Tema aplicado pelo **app** (não pelo pacote) | App controla `ThemeProvider`/import de estilos |

---

## 11. Contexto para a IA

### O que NÃO fazer
- Não recriar primitivos (`Button`/`Card`/`Badge`/…) nos apps — importar de `@citybox/ui`.
- Não usar cores/typografia hardcoded — usar tokens (`bg-primary`, `text-muted-foreground`, …).
- Não esquecer de **exportar** o componente novo no `index.ts` da camada.
- Não adicionar `build` esperando `dist` — é consumido via source.
- Não aplicar tema dentro do pacote — quem controla é o app (next-themes + `@citybox/ui/styles`).
- Não seguir o `README.md` (legado) — usar `STYLEGUIDE.md` / este arquivo.
- Não mesclar classes "na mão" — usar `cn()`.
- Não instalar pacotes com npm/yarn — usar pnpm.

### Ao adicionar um **componente**
1. **Primitivo shadcn** → criar em `components/ui/<x>.tsx`; expor em `components/atoms/<x>/` (`<x>.tsx` reexporta `../../ui/<x>`, `index.ts`, opcional `<x>.stories.tsx`); adicionar no `atoms/index.ts`.
2. **Composição** → `components/molecules/<x>/` ou `components/organisms/<x>/` com Props tipadas, `"use client"` se usar estado/efeitos, sem cor hardcoded; adicionar no `index.ts` da camada.
3. Adicionar **story** (Storybook) quando fizer sentido.
4. `pnpm --filter @citybox/ui typecheck && lint`.
5. Atualizar a seção 9 deste arquivo.

### Ao adicionar/alterar **token de tema**
- Editar `src/styles/globals.css` (`@theme inline` + blocos `:root`/`.dark`); manter OKLCH; refletir nos apps automaticamente.

### Fluxo típico
1. Desenvolver/visualizar no **Storybook** (`:6006`).
2. Exportar na camada certa; `typecheck`/`lint`.
3. Consumir no app (já transpila via `transpilePackages`).
4. Atualizar este `AGENTS.md`.

---

## 12. Histórico de Mudanças Estruturais

> Não é changelog de features — registra mudanças que afetam o contexto da IA.

| Data       | Mudança                                              | Impacto                          |
| ---------- | ---------------------------------------------------- | -------------------------------- |
| 2026-08-21 | `RichTextEditor` A4 print: `box-sizing:border-box` + `max-width:100%` (evita corte da margem direita ao imprimir) | Alinhado a `patient-contract-paper-styles` na clínica |
| 2026-08-14 | `RichTextEditor.toolbar`: `"full"` (padrão) \| `"basic"` (desfazer/refazer + negrito→justificar) | Anamnese do Inicializar (nutrição); contrato segue `"full"` |
| 2026-08-03 | `TabsList` variant `line`: `data-[variant=line]:h-auto` (não herda `h-9` — evita scrollbar ↑↓ no tablist) | Sheets com abas line |
| 2026-08-03 | `PageNav.scrollMode`: `native` \| `buttons` (setas sem scroll/gesto) | Configurações clínica usa `buttons` |
| 2026-07-28 | `KanbanProvider`: `id` estável no `DndContext` (`useId` default) + DragOverlay portal pós-mount | Corrige hidratação `aria-describedby` (dnd-kit) |
| 2026-07-27 | `KanbanCards.viewportClassName` / `viewportStyle` | Scroll vertical com limite de altura (ex. 5 cards) |
| 2026-07-27 | `KanbanProvider.layout`: `'scroll'` \| `'fill'` (sem ScrollBar H) | Leads Imóveis: 5 colunas full-width |
| 2026-07-24 | `PageNav`: scroll horizontal nativo (overflow-x + nowrap) | Abas Financeiro/Config/Dashboard não cortam no mobile |
| 2026-07-24 | `AppSidebar` / `AppSidebarDual`: separador do `SidebarTrigger` com `self-center` + `h-4` | Corrige desalinhamento vertical com o breadcrumb |
| 2026-07-23 | Accordion: animação corrigida (`data-state` + `animate-accordion-*` em **500ms**); seta com `rotate-180` | Antes usava `data-open`/`data-closed` (sem efeito no Radix) — abertura parecia instantânea |
| 2026-07-25 | `DatePicker`: prop `portalContainer` (repassa ao `PopoverContent container`) | Calendário utilizável dentro de Drawer Vaul (ex.: Nova conta bancária do erp-comercio), como já era no `DateRangePickerInput` |
| 2026-07-24 | `PopoverContent`/`SelectContent`: prop `container` no Portal; `ComboboxSelect`/`DateRangePickerInput`: `modal` + `portalContainer` | Popover/Command/Select clicáveis dentro de Drawer Vaul |
| 2026-07-24 | `SelectItem`: highlight via `data-highlighted` (além de `focus`) | Hover/ponteiro no Select (ex.: dentro de Drawer/vaul) |
| 2026-07-24 | `AppSidebarDual` expandable: rail sempre comprimido (fechar painel não expande coluna 1) | erp-comercio: coluna 1 fixa em ícones |
| 2026-07-24 | `AppSidebarDual` expandable: rail com `hasPanel` não navega; botão fechar painel (`panelCloseLabel`/`panelCloseIcon`) acima do footer | erp-comercio: abre submenu sem trocar a página |
| 2026-07-24 | Molecule `ComboboxSelect` (select com busca + botão opcional de criar) | Reuso em formulários (ex.: categoria de cliente no erp-comercio) |
| 2026-07-24 | `ComboboxSelectOption.description` (+ `keywords` na busca): item com título + linha secundária muted | Lista de cliente no pedido de venda |
| 2026-07-23 | Atom `Item` (+ `ItemContent`/`ItemTitle`/…) exposto via `@citybox/ui/atoms` | Uso em erp-comercio (Unidades) |
| 2026-07-23 | Molecule `NumberInput` (React Aria NumberField + −/+) | Quantidade em formulários; 1º uso erp-comercio movimentações |
| 2026-07-22 | Header full-bleed (lojas + Command + user fora do rail) | UX multilojas / busca |
| 2026-07-22 | `AppSidebarDual`: `brandNodeCollapsed` (logo compacta no rail só ícones) | erp-comercio: full ↔ symbol |
| 2026-07-22 | `AppSidebarDual`: `user` opcional (omitir = sem NavUser no rodapé) | erp-comercio move user p/ header |
| 2026-07-22 | `AppSidebarDual`: `railVariant="expandable"`, `navGroups`, `footerNavItems`, `showPanelSearch`, controle `panelOpen` | ERP Comércio: rail labels ↔ painel |
| 2026-07-22 | Listado consumidor `apps/erp-comercio` (@citybox/erp-comercio) | Scaffold comércio passa a usar o DS |
| 2026-07-17 | `DatePicker`: prop opcional `aria-label` no botão gatilho | Acessibilidade (ex.: período custom do dashboard clínica) |
| 2026-07-13 | Listado consumidor `apps/pdv/frontend` (@citybox/pdv) | PDV PWA passa a usar o DS        |
| 2026-06-26 | Organism `RichTextEditor` (Tiptap v3) + deps `@tiptap/*` | Editor de texto rico reutilizável (1º uso: contratos da Clínica) |
| 2026-07-03 | `Card` padrão flat: `shadow-none` + `ring-0` + `border border-border/50` (antes `shadow-md` + `ring-1`) | Cards visíveis sem sombra; borda sutil no lugar do drop shadow |
| 2026-07-13 | `KanbanProvider.onCardDrop`: snapshot final no drop de card (persistir ordem sem race de setState) | Usado no CRM Vendas (`sortOrder` / reorder) |
| 2026-07-01 | `Kanban` estendido: reordenar colunas (`KanbanColumnHandle` + `onColumnReorder` + `isColumnSortable`) e drag otimista de cards (`onDataChange` + `onDragOver`) | Board suporta reordenação de colunas e move sem snapback (1º uso: Vendas da Clínica) |
| 2026-07-01 | `AppSidebar` ganhou prop opt-in **`fillViewport`** (main vira container de scroll: `h-svh` no provider + `overflow-y-auto` na `<main>`) | Necessário p/ conter o scroll de kanban/agenda no board; usado pela Clínica |
| 2026-07-01 | Token **`--kanban-column`** adicionado em `globals.css` (`@theme` → `--color-kanban-column`) | Fundo das colunas do kanban (mesmo valor visual do `--sidebar`, variável separada) |
| 2026-07-01 | `DatePicker` (molecule): trigger passou de `Button variant="outline"` para o **padrão de campo** (`bg-input/50` + `border-transparent` + `rounded-3xl`, estático) | Harmoniza com `Input`/`SelectTrigger`/`DateRangePicker` em formulários; muda todos os apps |
| 2026-06-25 | Arquivo `AGENTS.md` (@citybox/ui) criado              | —                                |
| —          | Tema migrou p/ Inter + `.dark` + OKLCH (ver STYLEGUIDE) | README ficou legado (warm/Fraunces) |
