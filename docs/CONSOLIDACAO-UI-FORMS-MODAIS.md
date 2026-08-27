# Consolidation Opportunities — Fewer Forms, Modals & Duplicated Patterns

> A survey of repeated patterns across the FebraHub monorepo (`apps/web` +
> `apps/api`) that can be merged into shared building blocks. The goal is **less
> duplicated code, fewer diverging screens, and less maintenance** — with no
> behavior change. Every item below points at real files and counts found in the
> codebase, so each can be picked up independently.

---

## TL;DR

The shared foundation **already exists and is good**. The problem is **partial
adoption**: many screens re-implement by hand what these primitives already do.
"Consolidation" here mostly means *migrating the outliers onto primitives we
already have*, plus creating ~3 primitives that are still missing.

| Layer | Already shared | Still duplicated by hand |
|---|---|---|
| Modals | `ModalCentro`, `ModalConfirmar`, `ModalPrompt` | native `window.prompt`, ad-hoc `position:fixed inset:0` overlays, 3 hand-rolled drawers |
| Forms | `FormCrud`, `PaginaCrud<T>` (schema-driven CRUD) | ~15 screens re-implementing list+form+delete state |
| Field markup | `inputAv` / `labelAv` in `estilos.ts` | copied `label + input + error` trios in ~15 files |
| Buttons | `BOTAO_OURO`, `BotaoPrimario`, `estilos.ts` | 3 competing "primary button" spellings, stray `background: C.gold` |
| HTTP | `api.*` client, `ErroApi` | consistent, but service clients repeat CRUD boilerplate |
| Backend DTOs | per-module | no shared `PaginacaoDto`; pagination re-declared per module |
| CSS | `globals.css` design tokens | 21 feature CSS files, several near-duplicate `.*-btn`/`.*-card` rules |

---

## 1. Modals & dialogs

### 1.1 Native `window.confirm` / `prompt` / `alert` still in code
We already have `ModalConfirmar` and `ModalPrompt`, but native dialogs remain:

- `components/loja/FilaLoja.tsx:372` → `window.prompt("Motivo do cancelamento?")`
  **→ replace with `ModalPrompt`** (danger variant, required reason).
  `components/pdv/VendasPdv.tsx` already did exactly this migration and is the model.

Native dialogs behave differently from the rest of the app (no Esc handling that
matches, no theming, no loading lock), so each is a UX inconsistency.

> **Action:** grep `window\.(confirm|prompt|alert)|\bconfirm\(|\bprompt\(` and
> convert every hit to `ModalConfirmar` / `ModalPrompt`.

### 1.2 Two competing modal "shells"
There are **two separate implementations** of the same concept (fixed overlay +
panel + close button + Esc):

1. **`ModalCentro`** — centered, `zIndex 60/61`, `var(--modal-fundo)`, sticky header.
2. **`FormCrud`** — right-side drawer, `zIndex 80`, `rgba(0,0,0,.45)`, its own header.

On top of that, **drawer shells are copy-pasted**, each with its own overlay,
`Escape` `useEffect`, and header/close button:

- `components/crm/DrawerCliente.tsx`
- `components/crm/DrawerNegocio.tsx`
- `components/territorial/DrawerEmpresa.tsx`

That's the same drawer chrome written 4× (those three + `FormCrud`).

**→ Extract a generic `DrawerLateral`** (`components/ui/DrawerLateral.tsx`) with
`titulo`, `aoFechar`, `largura`, `children`, mirroring the `ModalCentro` API.
`FormCrud` and the three CRM/territorial drawers consume it. Result: **one**
drawer shell and **one** centered-modal shell, with Esc/backdrop/focus handled
in a single place.

### 1.3 Ad-hoc overlays inside big screens
Screens that hand-roll `position:fixed inset:0` overlays instead of reusing
`ModalCentro`:

- `components/loja/OperacoesLoja.tsx`, `components/loja/CardapioPublico.tsx`
- `components/hubs/comercial/PainelVerdes.tsx`
- `app/(app)/pedagogico/turmas/[id]/page.tsx`, `.../monitores/page.tsx`, `.../cs/page.tsx`
- `components/shell/BuscaGlobal.tsx` (spotlight — reasonable to keep specialized)

`components/loja/BalcaoPdv.tsx` alone has **36** modal/dialog references and **11**
raw inputs — the biggest single candidate to break into subcomponents that
consume the primitives.

> **Rule:** no new `position:fixed inset:0` overlay outside `components/ui/*`.

---

## 2. Forms

### 2.1 The winning pattern: `PaginaCrud` + `FormCrud`
Already adopted (leave alone; they are the *target* for the rest):
`components/cadastros/loja/Crud*.tsx` and `components/cadastros/pedagogico/Crud*.tsx`.
They declare only `colunas`, a `campos` schema (`CampoCrud[]` from
`cadastros/tipos.ts`) and `carregar/salvar/apagar` — the list, pagination, drawer
form, delete-confirm modal and loading/error states come for free.

### 2.2 Screens that re-implement CRUD by hand → should use `PaginaCrud`
Each carries its own `useState(aberto)`, inline form, buttons and delete-confirm:

- `components/compras/Fornecedores.tsx` — **24** raw inputs, full hand-rolled CRUD
- `components/loja/GestaoCategorias.tsx`, `EstoqueGeral.tsx`, `InventarioLoja.tsx`
- `components/permissoes/PainelUsuarios.tsx` (**22** form-style refs), `PainelPerfis.tsx`
- `components/notificacoes/PainelComunicados.tsx` (**18**)
- `components/financeiro/CadastrosFinanceiro.tsx`, `CentralFinanceiro.tsx`
- Pedagogical screens: `turmas/novo` (**17** inputs), `turmas/[id]` (**19**), `cs` (**13**), `alunos` (**9**)
- `components/loja/CatalogoLoja.tsx` (**29** raw inputs — has the image uploader, so
  keep the shell but move the plain fields to §2.3)

**→ Migrate the clean "list + form" ones first** (Fornecedores → GestãoCategorias →
Comunicados → CadastrosFinanceiro) to `PaginaCrud`. Screens with tabs/uploaders
stay bespoke but use the field primitive from §2.3.

### 2.3 Missing: a "form field" primitive
`FormCrud` renders `input/textarea/select` internally, but everyone **outside** it
repeats the same `label (labelAv) + control (inputAv) + error` trio. The
`inputAv`/`labelAv` pair is copied across ~15 files (CRM, permissões,
notificações, fiscal, formulários, brain…).

**→ Create `components/ui/CampoFormulario.tsx`** (`Campo`, `CampoTexto`,
`CampoSelect`, `CampoTextarea`) wrapping label + control + error + required mark,
using the same `CampoCrud` shape, usable *outside* `FormCrud`. Collapses ~100
scattered `inputAv`/`labelAv` usages into calls to one component.

### 2.4 Near-identical evaluation forms
`components/formularios/FormAvaliacaoEvento.tsx`, `FormAvaliacaoGGB.tsx`,
`FormMaestro.tsx`, `FormRetencao.tsx` share the same structure (field grid, submit,
saving/error states), differing only in the fields. Good candidates to become
schema-driven (`CampoCrud[]`) via a shared `FormEsquema` (i.e. `FormCrud` without
the drawer chrome).

---

## 3. Buttons & style constants

- `estilos.ts` already centralizes `BOTAO_OURO` / `BOTAO_SECUNDARIO` / `PINTURA_OURO`.
  Its own comment records that **5 screens** had re-declared the gold flat. Keep
  hunting: any `background: C.gold` used as a **button background** is a contrast
  bug (per AGENTS.md the gold button background must be the gradient / `.fh-btn-ouro`,
  never flat `var(--gold)`).
- Three ways to paint the same primary CTA coexist: `BotaoPrimario`, `BotaoSalvar`,
  and the `BOTAO_*` constants. **→ Standardize on `BotaoPrimario`**; keep `BOTAO_*`
  only as the inline-style fallback; deprecate `BotaoSalvar` if redundant.

---

## 4. Repeated component state (the "invisible boilerplate")

The same block appears in almost every screen with a modal/form:

```ts
const [aberto, setAberto] = useState(false);
const [editando, setEditando] = useState<T | null>(null);
const [salvando, setSalvando] = useState(false);
const [erro, setErro] = useState<string | null>(null);
// + Escape useEffect + reset-on-open + save→close→reload
```

**→ Hooks** `useModalFormulario<T>()` → `{ aberto, editando, abrirNovo,
abrirEdicao, fechar, salvando, erro, submeter }`, and `useConfirmacao()` for the
`ModalConfirmar` `alvo/onConfirmar` pair. `PaginaCrud` already does this inline;
extract it so the hand-rolled screens can share it.

---

## 5. Frontend API service clients

`services/api/*.ts` are consistent (all go through the `api.*` client in
`client.ts`), but each still spells out the same CRUD quintet by hand, e.g.
`fornecedores.ts`:

```ts
export const fornecedoresListar = (busca?, situacao?) => api.get(...);
export const fornecedorObter   = (id) => api.get(`/fornecedores/${id}`);
export const fornecedorCriar   = (d) => api.post('/fornecedores', d);
export const fornecedorAtualizar= (id, d) => api.put(`/fornecedores/${id}`, d);
// …repeated per module across ~25 files
```

**→ Optional `recursoCrud('/fornecedores')` factory** returning
`{ listar, obter, criar, atualizar, remover }` typed by generics. Modules with a
plain REST CRUD (fornecedores, categorias, comunicados, financeiro cadastros)
collapse to one line; modules with custom actions keep their extra functions.
Low risk, high line-count reduction.

---

## 6. Backend (`apps/api`) DTOs & services

### 6.1 No shared pagination DTO
Pagination fields are re-declared per module instead of a base class:

```ts
// pedagogico/dto/turma.dto.ts, comercial/comercial.dto.ts (x2), …
@IsOptional() @Type(() => Number) @IsInt() @Min(1) pagina?: number = 1;
// + porPagina, + busca, each module its own spelling/limits
```

Filter/query DTOs (`FiltroOportunidadesDto`, `FiltroVendasDto`, `FiltroKanbanDto`,
`ListarNotificacoesDto`, `ConnectionsQueryDto`, …) each restate the same
`pagina/porPagina/busca` fields.

**→ Create a shared `PaginacaoDto`** (`common/dto/paginacao.dto.ts`) with
`pagina`, `porPagina` (with the same `@Min`/max clamp everywhere) and `busca`;
module filter DTOs `extends PaginacaoDto`. Also a `respostaPaginada(itens, total,
pagina, porPagina)` helper so every list endpoint returns the identical
`{ itens, total, pagina, por_pagina }` envelope the web `ListaCrud<T>` already
expects.

### 6.2 Repeated `skip/take` list logic
`skip/take/pagination` appears across ~30 services (crm, comercial, loja-cadastros,
pedagogico/matriculas, compras…). Once §6.1 lands, a small `paginar(prisma, args,
{ pagina, porPagina })` helper removes the copy-pasted `skip: (p-1)*n, take: n` +
`prisma.$transaction([findMany, count])` block from each.

### 6.3 Guards / permission decorators — already good
`@ExigePermissao`, `@ExigeSetor`, `@Publica` are consistently used — no
consolidation needed, just keep new modules on them (don't hand-roll checks).

---

## 7. CSS: 21 feature stylesheets with near-duplicate rules

`app/*.css` is scoped per feature (`.loja-*`, `.ped-*`, `.com-*`, `.fin-*`,
`.bal-*`, `.co-*`, `.es-*`, `.ret-*`…). Many of them redefine the same button,
card, table, chip and badge treatments with a different prefix. Counts of gold /
button / token references: `globals.css` 173, `loja.css` 26, `balcao.css` 24,
`fila.css` 23, `pedagogico.css` 14, `comercial.css` 10…

The design tokens are already centralized in `globals.css` (`--gold`,
`--gold-top/base`, `--card-line`, `.fh-btn-ouro`, `alfa()`), so the values are
consistent — but the **shapes** (`.<prefix>-btn`, `.<prefix>-card`,
`.<prefix>-tabela`) are re-authored per feature.

**→ Promote the common shapes to `globals.css` utility classes** (`.fh-card`,
`.fh-tabela`, `.fh-chip`, reuse `.fh-btn-ouro`) and have feature CSS keep only
what's genuinely feature-specific (layout, colors of that hub). This is the
lowest-priority item (cosmetic risk), so do it last and per-feature.

---

## Incremental plan (each step isolated & testable)

1. **`DrawerLateral`** generic → `FormCrud` + `DrawerCliente/Negocio/Empresa` use it.
2. **`CampoFormulario`** → replace copied `inputAv/labelAv` (start with CRM & permissões).
3. **Kill native `confirm/prompt/alert`** → `ModalConfirmar/ModalPrompt` (`FilaLoja` first).
4. **Migrate "list+form" screens to `PaginaCrud`** (Fornecedores → GestãoCategorias → Comunicados → CadastrosFinanceiro).
5. **Hooks `useModalFormulario` / `useConfirmacao`** applied to the migrated screens.
6. **`recursoCrud` factory** for the flat REST service clients (§5).
7. **Backend `PaginacaoDto` + `respostaPaginada` + `paginar` helper** (§6).
8. **Schema-drive the evaluation forms** (§2.4).
9. **Break up `BalcaoPdv.tsx`** into subcomponents that consume the primitives.
10. **CSS utility classes** promoted to `globals.css`, per-feature (§7, last).

## Expected payoff

- ~15 files stop copying `inputAv/labelAv` → 1 component.
- 3 drawer shells + `FormCrud` → 1 `DrawerLateral`.
- Native dialogs (which behave differently) → 0.
- Hand-rolled CRUD screens (Fornecedores, categories, comunicados…) → `PaginaCrud`; tens of lines of state disappear per screen.
- ~25 service clients: the CRUD quintet collapses to a factory call.
- Pagination DTO/logic defined once instead of per module.
- One "open form → save → reload" path with Esc/backdrop/loading/error in one place.

## Guardrails (don't regress)

- **Rule:** `position:fixed inset:0` overlays only inside `components/ui/*`.
- **Rule:** no `window.confirm/prompt/alert` — use the modals.
- **Rule:** gold button background = gradient / `.fh-btn-ouro`, never flat `var(--gold)` (AGENTS.md).
- **Rule:** new list endpoints return the `{ itens, total, pagina, por_pagina }` envelope and `extends PaginacaoDto`.
- Run `tsc` / `next build` / ESLint **on the IdeaPad**, not in this workspace, after each step (AGENTS.md — no builds here).
# Consolidation Opportunities — Fewer Forms, Modals & Duplicated Patterns

> A survey of repeated patterns across the FebraHub monorepo (`apps/web` +
> `apps/api`) that can be merged into shared building blocks. The goal is **less
> duplicated code, fewer diverging screens, and less maintenance** — with no
> behavior change. Every item below points at real files and counts found in the
> codebase, so each can be picked up independently.

---

## TL;DR

The shared foundation **already exists and is good**. The problem is **partial
adoption**: many screens re-implement by hand what these primitives already do.
"Consolidation" here mostly means *migrating the outliers onto primitives we
already have*, plus creating ~3 primitives that are still missing.

| Layer | Already shared | Still duplicated by hand |
|---|---|---|
| Modals | `ModalCentro`, `ModalConfirmar`, `ModalPrompt` | native `window.prompt`, ad-hoc `position:fixed inset:0` overlays, 3 hand-rolled drawers |
| Forms | `FormCrud`, `PaginaCrud<T>` (schema-driven CRUD) | ~15 screens re-implementing list+form+delete state |
| Field markup | `inputAv` / `labelAv` in `estilos.ts` | copied `label + input + error` trios in ~15 files |
| Buttons | `BOTAO_OURO`, `BotaoPrimario`, `estilos.ts` | 3 competing "primary button" spellings, stray `background: C.gold` |
| HTTP | `api.*` client, `ErroApi` | consistent, but service clients repeat CRUD boilerplate |
| Backend DTOs | per-module | no shared `PaginacaoDto`; pagination re-declared per module |
| CSS | `globals.css` design tokens | 21 feature CSS files, several near-duplicate `.*-btn`/`.*-card` rules |

---

## 1. Modals & dialogs

### 1.1 Native `window.confirm` / `prompt` / `alert` still in code
We already have `ModalConfirmar` and `ModalPrompt`, but native dialogs remain:

- `components/loja/FilaLoja.tsx:372` → `window.prompt("Motivo do cancelamento?")`
  **→ replace with `ModalPrompt`** (danger variant, required reason).
  `components/pdv/VendasPdv.tsx` already did exactly this migration and is the model.

Native dialogs behave differently from the rest of the app (no Esc handling that
matches, no theming, no loading lock), so each is a UX inconsistency.

> **Action:** grep `window\.(confirm|prompt|alert)|\bconfirm\(|\bprompt\(` and
> convert every hit to `ModalConfirmar` / `ModalPrompt`.

### 1.2 Two competing modal "shells"
There are **two separate implementations** of the same concept (fixed overlay +
panel + close button + Esc):

1. **`ModalCentro`** — centered, `zIndex 60/61`, `var(--modal-fundo)`, sticky header.
2. **`FormCrud`** — right-side drawer, `zIndex 80`, `rgba(0,0,0,.45)`, its own header.

On top of that, **drawer shells are copy-pasted**, each with its own overlay,
`Escape` `useEffect`, and header/close button:

- `components/crm/DrawerCliente.tsx`
- `components/crm/DrawerNegocio.tsx`
- `components/territorial/DrawerEmpresa.tsx`

That's the same drawer chrome written 4× (those three + `FormCrud`).

**→ Extract a generic `DrawerLateral`** (`components/ui/DrawerLateral.tsx`) with
`titulo`, `aoFechar`, `largura`, `children`, mirroring the `ModalCentro` API.
`FormCrud` and the three CRM/territorial drawers consume it. Result: **one**
drawer shell and **one** centered-modal shell, with Esc/backdrop/focus handled
in a single place.

### 1.3 Ad-hoc overlays inside big screens
Screens that hand-roll `position:fixed inset:0` overlays instead of reusing
`ModalCentro`:

- `components/loja/OperacoesLoja.tsx`, `components/loja/CardapioPublico.tsx`
- `components/hubs/comercial/PainelVerdes.tsx`
- `app/(app)/pedagogico/turmas/[id]/page.tsx`, `.../monitores/page.tsx`, `.../cs/page.tsx`
- `components/shell/BuscaGlobal.tsx` (spotlight — reasonable to keep specialized)

`components/loja/BalcaoPdv.tsx` alone has **36** modal/dialog references and **11**
raw inputs — the biggest single candidate to break into subcomponents that
consume the primitives.

> **Rule:** no new `position:fixed inset:0` overlay outside `components/ui/*`.

---

## 2. Forms

### 2.1 The winning pattern: `PaginaCrud` + `FormCrud`
Already adopted (leave alone; they are the *target* for the rest):
`components/cadastros/loja/Crud*.tsx` and `components/cadastros/pedagogico/Crud*.tsx`.
They declare only `colunas`, a `campos` schema (`CampoCrud[]` from
`cadastros/tipos.ts`) and `carregar/salvar/apagar` — the list, pagination, drawer
form, delete-confirm modal and loading/error states come for free.

### 2.2 Screens that re-implement CRUD by hand → should use `PaginaCrud`
Each carries its own `useState(aberto)`, inline form, buttons and delete-confirm:

- `components/compras/Fornecedores.tsx` — **24** raw inputs, full hand-rolled CRUD
- `components/loja/GestaoCategorias.tsx`, `EstoqueGeral.tsx`, `InventarioLoja.tsx`
- `components/permissoes/PainelUsuarios.tsx` (**22** form-style refs), `PainelPerfis.tsx`
- `components/notificacoes/PainelComunicados.tsx` (**18**)
- `components/financeiro/CadastrosFinanceiro.tsx`, `CentralFinanceiro.tsx`
- Pedagogical screens: `turmas/novo` (**17** inputs), `turmas/[id]` (**19**), `cs` (**13**), `alunos` (**9**)
- `components/loja/CatalogoLoja.tsx` (**29** raw inputs — has the image uploader, so
  keep the shell but move the plain fields to §2.3)

**→ Migrate the clean "list + form" ones first** (Fornecedores → GestãoCategorias →
Comunicados → CadastrosFinanceiro) to `PaginaCrud`. Screens with tabs/uploaders
stay bespoke but use the field primitive from §2.3.

### 2.3 Missing: a "form field" primitive
`FormCrud` renders `input/textarea/select` internally, but everyone **outside** it
repeats the same `label (labelAv) + control (inputAv) + error` trio. The
`inputAv`/`labelAv` pair is copied across ~15 files (CRM, permissões,
notificações, fiscal, formulários, brain…).

**→ Create `components/ui/CampoFormulario.tsx`** (`Campo`, `CampoTexto`,
`CampoSelect`, `CampoTextarea`) wrapping label + control + error + required mark,
using the same `CampoCrud` shape, usable *outside* `FormCrud`. Collapses ~100
scattered `inputAv`/`labelAv` usages into calls to one component.

### 2.4 Near-identical evaluation forms
`components/formularios/FormAvaliacaoEvento.tsx`, `FormAvaliacaoGGB.tsx`,
`FormMaestro.tsx`, `FormRetencao.tsx` share the same structure (field grid, submit,
saving/error states), differing only in the fields. Good candidates to become
schema-driven (`CampoCrud[]`) via a shared `FormEsquema` (i.e. `FormCrud` without
the drawer chrome).

---

## 3. Buttons & style constants

- `estilos.ts` already centralizes `BOTAO_OURO` / `BOTAO_SECUNDARIO` / `PINTURA_OURO`.
  Its own comment records that **5 screens** had re-declared the gold flat. Keep
  hunting: any `background: C.gold` used as a **button background** is a contrast
  bug (per AGENTS.md the gold button background must be the gradient / `.fh-btn-ouro`,
  never flat `var(--gold)`).
- Three ways to paint the same primary CTA coexist: `BotaoPrimario`, `BotaoSalvar`,
  and the `BOTAO_*` constants. **→ Standardize on `BotaoPrimario`**; keep `BOTAO_*`
  only as the inline-style fallback; deprecate `BotaoSalvar` if redundant.

---

## 4. Repeated component state (the "invisible boilerplate")

The same block appears in almost every screen with a modal/form:

```ts
const [aberto, setAberto] = useState(false);
const [editando, setEditando] = useState<T | null>(null);
const [salvando, setSalvando] = useState(false);
const [erro, setErro] = useState<string | null>(null);
// + Escape useEffect + reset-on-open + save→close→reload
```

**→ Hooks** `useModalFormulario<T>()` → `{ aberto, editando, abrirNovo,
abrirEdicao, fechar, salvando, erro, submeter }`, and `useConfirmacao()` for the
`ModalConfirmar` `alvo/onConfirmar` pair. `PaginaCrud` already does this inline;
extract it so the hand-rolled screens can share it.

---

## 5. Frontend API service clients

`services/api/*.ts` are consistent (all go through the `api.*` client in
`client.ts`), but each still spells out the same CRUD quintet by hand, e.g.
`fornecedores.ts`:

```ts
export const fornecedoresListar = (busca?, situacao?) => api.get(...);
export const fornecedorObter   = (id) => api.get(`/fornecedores/${id}`);
export const fornecedorCriar   = (d) => api.post('/fornecedores', d);
export const fornecedorAtualizar= (id, d) => api.put(`/fornecedores/${id}`, d);
// …repeated per module across ~25 files
```

**→ Optional `recursoCrud('/fornecedores')` factory** returning
`{ listar, obter, criar, atualizar, remover }` typed by generics. Modules with a
plain REST CRUD (fornecedores, categorias, comunicados, financeiro cadastros)
collapse to one line; modules with custom actions keep their extra functions.
Low risk, high line-count reduction.

---

## 6. Backend (`apps/api`) DTOs & services

### 6.1 No shared pagination DTO
Pagination fields are re-declared per module instead of a base class:

```ts
// pedagogico/dto/turma.dto.ts, comercial/comercial.dto.ts (x2), …
@IsOptional() @Type(() => Number) @IsInt() @Min(1) pagina?: number = 1;
// + porPagina, + busca, each module its own spelling/limits
```

Filter/query DTOs (`FiltroOportunidadesDto`, `FiltroVendasDto`, `FiltroKanbanDto`,
`ListarNotificacoesDto`, `ConnectionsQueryDto`, …) each restate the same
`pagina/porPagina/busca` fields.

**→ Create a shared `PaginacaoDto`** (`common/dto/paginacao.dto.ts`) with
`pagina`, `porPagina` (with the same `@Min`/max clamp everywhere) and `busca`;
module filter DTOs `extends PaginacaoDto`. Also a `respostaPaginada(itens, total,
pagina, porPagina)` helper so every list endpoint returns the identical
`{ itens, total, pagina, por_pagina }` envelope the web `ListaCrud<T>` already
expects.

### 6.2 Repeated `skip/take` list logic
`skip/take/pagination` appears across ~30 services (crm, comercial, loja-cadastros,
pedagogico/matriculas, compras…). Once §6.1 lands, a small `paginar(prisma, args,
{ pagina, porPagina })` helper removes the copy-pasted `skip: (p-1)*n, take: n` +
`prisma.$transaction([findMany, count])` block from each.

### 6.3 Guards / permission decorators — already good
`@ExigePermissao`, `@ExigeSetor`, `@Publica` are consistently used — no
consolidation needed, just keep new modules on them (don't hand-roll checks).

---

## 7. CSS: 21 feature stylesheets with near-duplicate rules

`app/*.css` is scoped per feature (`.loja-*`, `.ped-*`, `.com-*`, `.fin-*`,
`.bal-*`, `.co-*`, `.es-*`, `.ret-*`…). Many of them redefine the same button,
card, table, chip and badge treatments with a different prefix. Counts of gold /
button / token references: `globals.css` 173, `loja.css` 26, `balcao.css` 24,
`fila.css` 23, `pedagogico.css` 14, `comercial.css` 10…

The design tokens are already centralized in `globals.css` (`--gold`,
`--gold-top/base`, `--card-line`, `.fh-btn-ouro`, `alfa()`), so the values are
consistent — but the **shapes** (`.<prefix>-btn`, `.<prefix>-card`,
`.<prefix>-tabela`) are re-authored per feature.

**→ Promote the common shapes to `globals.css` utility classes** (`.fh-card`,
`.fh-tabela`, `.fh-chip`, reuse `.fh-btn-ouro`) and have feature CSS keep only
what's genuinely feature-specific (layout, colors of that hub). This is the
lowest-priority item (cosmetic risk), so do it last and per-feature.

---

## Incremental plan (each step isolated & testable)

1. **`DrawerLateral`** generic → `FormCrud` + `DrawerCliente/Negocio/Empresa` use it.
2. **`CampoFormulario`** → replace copied `inputAv/labelAv` (start with CRM & permissões).
3. **Kill native `confirm/prompt/alert`** → `ModalConfirmar/ModalPrompt` (`FilaLoja` first).
4. **Migrate "list+form" screens to `PaginaCrud`** (Fornecedores → GestãoCategorias → Comunicados → CadastrosFinanceiro).
5. **Hooks `useModalFormulario` / `useConfirmacao`** applied to the migrated screens.
6. **`recursoCrud` factory** for the flat REST service clients (§5).
7. **Backend `PaginacaoDto` + `respostaPaginada` + `paginar` helper** (§6).
8. **Schema-drive the evaluation forms** (§2.4).
9. **Break up `BalcaoPdv.tsx`** into subcomponents that consume the primitives.
10. **CSS utility classes** promoted to `globals.css`, per-feature (§7, last).

## Expected payoff

- ~15 files stop copying `inputAv/labelAv` → 1 component.
- 3 drawer shells + `FormCrud` → 1 `DrawerLateral`.
- Native dialogs (which behave differently) → 0.
- Hand-rolled CRUD screens (Fornecedores, categories, comunicados…) → `PaginaCrud`; tens of lines of state disappear per screen.
- ~25 service clients: the CRUD quintet collapses to a factory call.
- Pagination DTO/logic defined once instead of per module.
- One "open form → save → reload" path with Esc/backdrop/loading/error in one place.

## Guardrails (don't regress)

- **Rule:** `position:fixed inset:0` overlays only inside `components/ui/*`.
- **Rule:** no `window.confirm/prompt/alert` — use the modals.
- **Rule:** gold button background = gradient / `.fh-btn-ouro`, never flat `var(--gold)` (AGENTS.md).
- **Rule:** new list endpoints return the `{ itens, total, pagina, por_pagina }` envelope and `extends PaginacaoDto`.
- Run `tsc` / `next build` / ESLint **on the IdeaPad**, not in this workspace, after each step (AGENTS.md — no builds here).
