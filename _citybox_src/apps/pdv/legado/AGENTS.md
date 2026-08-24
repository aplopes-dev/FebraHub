# AGENTS.md — PDV (frontend PWA)

> **Para agentes de IA:** Este arquivo é a fonte de verdade sobre este módulo.
> Leia-o integralmente antes de qualquer ação. Ao modificar código neste módulo,
> atualize as seções relevantes deste arquivo na mesma operação. Nunca remova
> seções — apenas atualize ou adicione.

---

## 1. Identidade do Módulo

| Campo                                | Valor                                                              |
| ------------------------------------ | ------------------------------------------------------------------ |
| **Nome**                             | `apps/pdv/frontend` · pacote `@citybox/pdv`                        |
| **Tipo**                             | App Next.js (frontend) · **PWA** de ponto de venda                 |
| **Responsável**                      | Bruno Lopes — Aplopes Tecnologia                                   |
| **Status**                           | 🟡 Scaffold (PWA configurado; domínio em construção)               |
| **Porta**                            | `3109`                                                             |
| **Última atualização deste arquivo** | 2026-07-23                                                         |


**Propósito em uma linha:**
Frontend **instalável (PWA)** do PDV Citybox, compartilhado pelas verticais
**food** e **varejo** — operação de caixa/venda em tablet ou desktop.

---

## 2. Posição no Monorepo

```
citybox/
├── apps/
│   ├── pdv/
│   │   └── frontend/          ← VOCÊ ESTÁ AQUI (@citybox/pdv · :3109)
│   ├── erp/                   ← backoffice do lojista (:3107)
│   └── verticals/food/api/    ← food-api (futuro backend do PDV food)
├── packages/
│   └── ui/                    ← @citybox/ui (design system)
└── AGENTS.md
```

**Depende de:**
- `@citybox/ui` (`workspace:*`) — design system; `transpilePackages: ['@citybox/ui']`.
- **Serwist** (`serwist` + `@serwist/turbopack`) — service worker / PWA (Turbopack).

**Consumido por:** ponta da UI do operador de caixa — nada interno consome o PDV.

---

## 3. Stack e Versões

| Tecnologia           | Versão   | Observação                                              |
| -------------------- | -------- | ------------------------------------------------------- |
| pnpm                 | workspace| **Único** package manager — nunca npm/yarn             |
| TypeScript           | ~5.8.3   | `strict: true`                                          |
| Next.js              | 16.2.7   | App Router; `output: 'standalone'`; `src/`              |
| React / React DOM    | 19.2.7   |                                                         |
| TailwindCSS          | 4.3.0    | `@citybox/ui/styles` + `tailwind.config.ts`             |
| Serwist              | ^9.5     | PWA via `@serwist/turbopack` (compatível com Turbopack) |
| Zustand              | ^5.0     | Carrinho / estado do pedido no POS                      |
| jsPDF                | ^4.2     | Geração do PDF do recibo (preview + impressão)          |
| use-mask-input       | ^3.10    | Máscara de telefone no modal de clientes                |

---

## 4. Estrutura de Pastas

```
apps/pdv/frontend/
├── public/icons/                 ← ícones PWA (logobrand → PNG 48–512)
├── src/
│   ├── styles/
│   │   └── pdv-theme.css         ← tema PDV (cores + escala touch)
│   ├── app/                      ← Next App Router (page = shell fino)
│   │   ├── layout.tsx            ← data-theme="pdv" + AppShell
│   │   ├── page.tsx              ← renderiza features/pos PosPage
│   │   ├── pedidos/page.tsx      ← renderiza features/orders OrdersLayout
│   │   ├── clientes/page.tsx     ← renderiza features/customers CustomersLayout
│   │   ├── mesas/page.tsx        ← renderiza features/tables TablesLayout
│   │   ├── mesas/editar-layout/page.tsx ← TablesEditLayout (editor drag)
│   │   ├── produtos/page.tsx     ← renderiza features/products ProductsLayout
│   │   ├── globals.css           ← shell nativo + import do tema
│   │   ├── manifest.ts · sw.ts · serwist/ · ~offline/
│   ├── components/               ← infra de app (não domínio)
│   │   ├── app-shell.tsx
│   │   ├── serwist-provider.tsx
│   │   ├── toast/                ← ToastProvider/useToast (toast visual próprio do PDV)
│   │   ├── pdv-delete-modal.tsx  ← confirmação de exclusão (ícone X vermelho)
│   │   └── pdv-confirm-modal.tsx ← confirmação positiva (check + botão primary)
│   └── features/
│       ├── shared/               ← transversal (logo da loja, tipos Store, …)
│       │   ├── components/ · data/ · types/
│       ├── pos/                  ← módulo da tela principal (caixa)
│       │   ├── components/       ← PosLayout, header/menu/catalog/order, CustomersModal, PaymentModal, ReceiptPreviewModal, …
│       │   ├── lib/              ← pos-nav, build-receipt-pdf (jsPDF), receipt-pdf-actions, build-order-receipt
│       │   ├── pages/pos-page.tsx
│       │   ├── context/pos-ui-context.tsx
│       │   ├── hooks/            ← use-pos-ui.ts, use-pos-store.ts (Zustand: items, customer ativo, orders, customers, tables, discount)
│       │   ├── types/            ← catalog, customer (+ email/birthDate/address/memberSince/isMember/memberExpiresAt), order (+ paymentMethod/cashierName), payment, receipt, pos-ui
│       │   └── data/             ← mock catalog + placeholder-orders + placeholder-customers
│       ├── orders/               ← tela `/pedidos` (listagem, filtros, detalhes, recibo)
│       │   └── components/       ← OrdersLayout, order-delete via PdvDeleteModal
│       ├── customers/            ← tela `/clientes` (listagem, cadastro, exclusão)
│       │   └── components/       ← CustomersLayout, CustomerFormModal (add/edit), CustomerDetailModal
│       ├── tables/               ← tela `/mesas` + editor `/mesas/editar-layout`
│       │   ├── components/       ← TablesLayout, TablesList, TablesFloorPlan, TableFloorShape, TablesFloorEmpty,
│       │   │                       TablesEditLayout, TablesEditCanvas, TableEditToolbar, TableEditFormModal
│       │   ├── data/             ← placeholder-floor-tables (+ fixture Caixa)
│       │   ├── hooks/            ← use-floor-layout-store (Zustand: tables, showCashier)
│       │   └── types/            ← FloorTable, FloorFixture
│       └── products/             ← tela `/produtos` (listagem mock)
│           ├── components/       ← ProductsLayout, ProductsFiltersModal, ProductFormModal (multi-step),
│           │                       ProductFormStepper, ProductFormStepInfo, ProductFormStepPricing,
│           │                       ProductImageUpload
│           ├── data/             ← placeholder-products
│           ├── hooks/            ← use-products-store (addProduct, skuExists, deleteProduct)
│           └── types/            ← PdvProduct
├── next.config.ts
└── AGENTS.md
```

### Layout da página principal (`features/pos`)

```
┌──────────────────────────────────────────┬──────────────────┐
│ Header: [☰] logo loja           [🔍]     │                  │
├────────┬─────────────────────────────────┤   OrderPanel     │
│ Menus  │  Itens (filtrados pelo menu)    │   (vazio)        │
│ 120²   │                                 │                  │
│ Todos* │                                 │                  │
└────────┴─────────────────────────────────┴──────────────────┘
```
`*` = ativo padrão (`ALL_MENUS_ID`). Item ativo: bg branco, borda gradiente
`#E5E5E5→#A3A3A3`, barra esquerda 8×54 gradiente cinza→preto.

---

## 5. Restrições Críticas

### 5.1 Package Manager
```
SEMPRE: pnpm --filter @citybox/pdv <script>
NUNCA:  npm install / yarn add  (create-next-app com npm gera package-lock — remover)
```

### 5.2 PWA / Serwist
```
- SW fonte: src/app/sw.ts
- SW servido em: /serwist/sw.js (via createSerwistRoute)
- Registro: <SerwistProvider swUrl="/serwist/sw.js"> no root layout
- Manifest: src/app/manifest.ts → /manifest.webmanifest
- Fallback offline: /~offline (também em additionalPrecacheEntries)
- next.config DEVE usar withSerwist() de @serwist/turbopack
```

### 5.3 Shell nativo (anti “cara de site”)
```
OBRIGATÓRIO no PDV (já no layout + globals.css):
- viewport: maximumScale=1, userScalable=false, viewportFit=cover
- body/html: select-none, overscroll-none, touch-manipulation
- CSS: -webkit-tap-highlight-color: transparent; overscroll-behavior: none
- Conteúdo dentro de <AppShell> (safe-area + scroll interno pdv-app-scroll)
- Inputs/textarea já reabilitam seleção; texto selecionável extra → classe pdv-selectable ou select-text
Telas fullscreen (ex. KDS/grade) podem usar <AppShell scrollable={false}>.
```

### 5.3.1 Tema PDV (`data-theme="pdv"`)
```
Cores (src/styles/pdv-theme.css):
  --background / --pdv-surface = #F7F7F7
  --border / --pdv-border      = #E5E5E5
  --card / --pdv-card          = #FFFFFF

Escala touch (não reutilizar h-8/h-9 do ERP/admin “como está”):
  --radius               = 8px (cards / superfícies)
  --pdv-control-radius   = **12px** — fonte única para input/select/textarea/botões
  --radius-sm…4xl        = var(--pdv-control-radius) (alinha rounded-* do DS)
  --pdv-control-h        = 2.75rem (44px) — button default / input
  --pdv-control-h-lg     = 3rem
  --pdv-header-h         = 4rem

Utilitários locais:
  .pdv-card · .pdv-header-bar · .pdv-order-rail · .pdv-field (trigger/custom control)
  .pdv-primary-gradient-btn · .pdv-gradient-border-btn · .pdv-destructive-gradient-btn
    → border-radius via --pdv-control-radius (não usar rounded-lg/xl conflitante)

Formulários: mesmo raio dos botões (`--pdv-control-radius`). Não passar `rounded-3xl`
em Input/Textarea. Triggers custom → `pdv-field`.

NÃO editar packages/ui para “ficar maior no PDV” — sobrescrever via tema.
```

### 5.4 UI só de `@citybox/ui`
```tsx
import { Button } from '@citybox/ui/atoms';
// Sem componentes locais de Button/Card/etc.; sem cores hardcoded.
```

### 5.5 Workspace / paths Tailwind
```
O pacote vive em apps/pdv/frontend — incluído no pnpm-workspace via "apps/pdv/*".

⚠️ Mesma profundidade de apps/erp/web (app dentro de um subdiretório do pacote): no globals.css o @source do DS é
  ../../../../../packages/ui/src  (5 níveis a partir de src/app/)
e no tailwind.config.ts:
  ../../../packages/ui/src/**/*   (3 níveis a partir da raiz do pacote)

tsconfig paths (como erp/admin):
  "@citybox/ui" → ../../../packages/ui/src/index.ts
  "@citybox/ui/*" → ../../../packages/ui/src/components/*
```

---

## 6. Padrões de Código

- Componentes de UI: `@citybox/ui` (atoms / molecules / organisms).
- Estilos: tokens OKLCH via `@citybox/ui/styles`.
- PWA metadata (`applicationName`, `appleWebApp`, `viewport.themeColor`) no root layout.
- `SerwistProvider` **não** importar direto de `@serwist/turbopack/react` no Server Component — usar o bridge `components/serwist-provider.tsx` (`"use client"`).
- Telas novas: renderizar **dentro** do `AppShell` do layout (já envolve `{children}`); não recriar `min-h-screen` no body — usar `min-h-full` / flex no `main`.
- Não remover `select-none` / `overscroll-none` do `body` sem motivo; exceções locais com `select-text` / `pdv-selectable`.

---

## 7. Variáveis de Ambiente

| Variável | Escopo | Obrigatória | Descrição        |
| -------- | ------ | ----------- | ---------------- |
| `PORT`   | server | ➖ (3109)   | Porta do app     |

> Auth / proxies / APIs ainda não configurados (scaffold PWA).

---

## 8. Scripts

```bash
pnpm --filter @citybox/pdv dev         # next dev -p 3109
pnpm --filter @citybox/pdv build        # next build (+ SW via Serwist)
pnpm --filter @citybox/pdv start        # next start -p 3109
pnpm --filter @citybox/pdv typecheck    # tsc --noEmit
pnpm --filter @citybox/pdv lint         # tsc --noEmit && eslint .
```

**Instalar / testar PWA:** rode `dev` ou `start`, abra `http://localhost:3109` em Chrome/Edge (HTTPS ou localhost), DevTools → Application → Manifest / Service Workers. Use “Install app” / ícone de instalação.

---

## 9. Módulos Implementados

| Área            | Status     | Notas                                      |
| --------------- | ---------- | ------------------------------------------ |
| Scaffold Next   | 🟢         | App Router + `@citybox/ui`                 |
| PWA (Serwist)   | 🟢         | SW + manifest + offline fallback           |
| Ícones PWA      | 🟢         | PNG 48–512 (`any` full-bleed) + maskable 192/512 a partir de `logobrand.svg` |
| Shell nativo    | 🟢         | viewport travado + AppShell + CSS anti-web |
| Tema PDV        | 🟢         | `data-theme=pdv` — #F7F7F7 / #E5E5E5 / #FFF + controles touch |
| Página POS      | 🟢         | 2 colunas + header; catálogo + customização + carrinho (Zustand) + desconto + mesas |
| Página Pedidos  | 🟢         | `/pedidos` — listagem, filtros de status, busca, ordenação (popover), filtros avançados (pagamento/tipo/valor, modal Aplicar/Cancelar), pílulas de filtro/ordenação ativos, dropdown de ações (detalhes/imprimir/deletar), `PdvDeleteModal` + toast |
| Página Clientes | 🟢         | `/clientes` — listagem (ID/Nome/Sobrenome/Sexo/Telefone/Endereço/Membro desde), busca, ordenação e filtro por sexo (popover), pílulas ativas; dropdown por linha com Ver detalhes / Editar / Deletar; `CustomerDetailModal` ("Perfil do Cliente": ID, cadastro, nome/sobrenome, sexo, nascimento+idade, telefone, email, endereço, status/validade de assinatura) com botão Editar → `CustomerFormModal` (add/edit, com email/nascimento/assinatura); `PdvDeleteModal` + toast; botões no gradiente primário do PDV (não verde) |
| Página Mesas    | 🟢         | `/mesas` + `/mesas/editar-layout`: store Zustand `useFloorLayoutStore`; lista + planta read-only; editor com drag-and-drop nativo, add/edit/rotate/delete, toggle Caixa, reset; Salvar via `PdvConfirmModal` (primary); exclusão via `PdvDeleteModal`. Distinto do `TablesModal` operacional do POS |
| Página Produtos | 🟢         | `/produtos` — listagem mock; modal **Filtros**; modal multi-step **Adicionar/Editar Produto** (720px, 4 passos completos com pré-preenchimento, atualização de store via `updateProduct` e modal de confirmação `PdvConfirmModal` no salvamento); busca/ordenar; empty state; excluir via `PdvDeleteModal` |
| Página Relatório | 🟢         | `/relatorio` & `/relatorios` — dashboard completo fiel à referência: filtro de período, botão Baixar, 4 cards de KPI (ícones na cor primária `#171717`), gráfico de Visão Geral de Vendas (`SalesOverviewChart`), Top 10 Produtos com badges de troféu, roscas de Status de Produtos e Estoque (`StatusDonutChart`) e tabela de Pedidos Recentes com chips de cliente |
| Página Estoque   | 🟢         | `/estoque` — módulo completo com design padronizado ao de Produtos: KPI summary bar (total itens, valor R$, estoque baixo, esgotado), abas **Estoque Atual** e **Histórico de Movimentações**, busca/ordenar/filtrar, modais `StockEntryModal` (Entrada), `StockExitModal` (Saída/Ajuste), `StockFiltersModal` e confirmação `PdvConfirmModal` com integração à store `useStockStore` |
| Página Configurações | 🟢    | `/configuracoes` & `/configuracao` — tela de configurações completa e fiel à referência: menu lateral com 8 abas (Configurações da Loja, Categorias, Modificadores, Métodos de Pagamento, Taxas, Descontos, Recibo, Impressoras), upload de logo com drag & drop/preview, formulário de dados da loja em PT-BR, cor primária `#171717`, salvamento com toast e persistência via `useSettingsStore` |
| Clientes (POS)  | 🟢         | `CustomersModal` (novo/existente) + banner no pedido + toast; lista compartilhada via `usePosStore.customers`; limpa cliente ativo no `clearOrder` (pagamento) |
| Pagamento       | 🟢         | `PaymentModal` + sucesso; integração com registro de histórico de vendas |
| Recibo PDF      | 🟢         | `ReceiptPreviewModal`: jsPDF → Blob → iframe; Imprimir via `printPdfBlob` |
| Domínio PDV     | 🟢         | Carrinho (`usePosStore`); cliente/desconto/mesas do pedido; persistência local |
| Auth / APIs     | 🔴 Pendente|                                                                           |

---

## 10. Decisões de Arquitetura

| Data       | Decisão                                      | Motivo                                                                 |
| ---------- | --------------------------------------------- | ---------------------------------------------------------------------- |
| 2026-07-13 | **Serwist + `@serwist/turbopack`** (não next-pwa) | Next 16 usa Turbopack; `@serwist/next` webpack-only; route handler gera o SW |
| 2026-07-13 | App em `apps/pdv/frontend`                    | Espaço para API/outros pacotes sob `apps/pdv/` no futuro               |
| 2026-07-13 | PDV único food + varejo                       | Mesma UX de caixa; diferenças de vertical por feature flags/rotas      |
| 2026-07-14 | Recibo em PDF (jsPDF) no modal, não HTML      | Alinhado ao ERP (iframe + object URL); impressão via iframe oculto     |

---

## 11. Contexto para a IA

### O que NÃO fazer
- Não instalar com npm/yarn nem commitar `package-lock.json` / `node_modules`.
- Não usar `@serwist/next` / `next-pwa` — o padrão é `@serwist/turbopack`.
- Não recriar primitivos de `@citybox/ui`.
- Não remover `/~offline` nem o precache correspondente sem atualizar o SW.

### Ao evoluir o PDV
1. Manter o PWA instalável (manifest + ícones + SW).
2. Integrar auth/proxy no padrão do monorepo quando chegar a hora.
3. Atualizar este `AGENTS.md` e a raiz se porta/estrutura mudarem.

---

## 12. Histórico de Mudanças Estruturais

| Data       | Mudança                                              | Impacto                |
| ---------- | ---------------------------------------------------- | ---------------------- |
| 2026-07-13 | Scaffold Next + PWA Serwist + `@citybox/ui` + porta 3109 | Módulo PDV criado   |
| 2026-07-13 | Shell nativo: viewport travado, AppShell (safe-area), CSS select/overscroll/tap/touch | Anti “cara de site” no caixa |
| 2026-07-13 | `features/pos` + `features/shared`: layout 2 colunas, header menu/logo/busca | Página principal stub |
| 2026-07-13 | Tema PDV (`pdv-theme.css`): superfície #F7F7F7, borda #E5E5E5, card #FFF + escala touch | Visual exclusivo do caixa |
| 2026-07-14 | Recibo: `build-receipt-pdf` + preview em iframe no `ReceiptPreviewModal` | PDF térmico ~80mm; impressão nativa do viewer |
| 2026-07-14 | Modal Clientes (`CustomersModal`) no pedido + `customer` no Zustand | Novo/existente; mock; nome no recibo |
| 2026-07-15 | Abas e Desconto: `PosTabs` reutilizável + `DiscountModal` + cálculo dinâmico no Zustand | Suporta código, predefinidos, porcentagem e preço |
| 2026-07-15 | Mesas no PDV: `TablesModal` (grid de 12 mesas) + `OrderTableBanner` + Lógica de Lançar/Salvar Conta no Zustand | Suporta carregar contas ativas, reservar e liberar |
| 2026-07-16 | Página `/pedidos` (`features/orders`): filtros avançados (modal), ordenação, pílulas ativas, dropdown de ações, `PdvDeleteModal` + toast | `PosOrder` ganhou `paymentMethod` e `cashierName`; recibo reaproveitado a partir da listagem |
| 2026-07-16 | Página `/clientes` (`features/customers`): `CustomersLayout` + `CustomerFormModal` (add/edit) + `CustomerDetailModal` | `PosCustomer` ganhou `address`/`memberSince`; lista de clientes migrou para `usePosStore.customers` (única fonte, compartilhada com `CustomersModal` do POS); ações da linha (ver/editar/deletar) e botões no gradiente primário do PDV |
| 2026-07-16 | "Perfil do Cliente" (`CustomerDetailModal`) redesenhado + `PosCustomer` ganhou `email`/`birthDate`/`isMember`/`memberExpiresAt` | `updateCustomerRecord` na store; `CustomerFormModal` ganhou campos de email, nascimento e assinatura (membro + validade); botão Editar do perfil abre o formulário pré-preenchido |
| 2026-07-16 | `PdvDeleteModal` extraído para `src/components/` | Confirmação de exclusão exclusiva do PDV (ícone X em gradiente vermelho) reaproveitada por pedidos e clientes, em vez do `ConfirmDialog` genérico do design system |
| 2026-07-22 | Página `/mesas` (`features/tables`): estrutura empty state (toolbar + lista + planta + legenda); CTA Editar Layout placeholder | Rota do menu Mesas; editor/CRUD e vínculo com mesas do POS ficam para fases seguintes |
| 2026-07-22 | `/mesas` com mock: lista + planta visual read-only, filtros e seleção sincronizada | Tipos `FloorTable`; editor de layout e integração com `usePosStore.tables` ainda fora |
| 2026-07-22 | Editor `/mesas/editar-layout`: drag nativo, CRUD, toggle Caixa, reset; `PdvConfirmModal` + store compartilhado | CTA Editar Layout navega para o editor; Salvar confirma e aplica na tela de Mesas |
| 2026-07-22 | Página `/produtos` (`features/products`): listagem + empty state, busca/ordenar/filtrar, mock Zustand | CTA Adicionar/editar ainda stub; rota do menu Produtos |
| 2026-07-22 | Modal de filtros em Produtos (`products-filters-modal.tsx`): draft→Aplicar; status, categoria, preço mín/máx, estoque | Botão Aplicar usa `pdv-primary-gradient-btn` (não verde da referência) |
| 2026-07-22 | Modal multi-step **Adicionar Produto** (720px): passo 1 completo; passos 2–4 placeholder; `addProduct`/`skuExists` na store | Salvar rascunho / Próximo / Salvar no primary PDV; editar produto ainda stub |
| 2026-07-22 | Tema PDV: `--pdv-control-radius` + override forte de Input/Textarea/`.pdv-field` | Formulários deixam de brigar com `rounded-3xl` do DS |
| 2026-07-22 | Modal Adicionar Produto — **passo 2 Precificação**: preço (obrig.), takeaway, imposto %; `CurrencyInput` | `product-form-step-pricing.tsx`; `priceCents` na persistência |
| 2026-07-23 | Modal Adicionar Produto — **passo 3 Variantes e Modificadores**: `ProductFormStepVariants`, adição e edição inline de linhas (sem modal) com botões de variante `ghost` (`Button variant="ghost"`), cor primária do PDV | `product-form-step-variants.tsx`; `PdvProduct` estendido com `attributes` e `modifiers` |
| 2026-07-23 | Modal Adicionar Produto — **passo 4 Ingredientes**: `ProductFormStepIngredients`, toggle Disponibilidade Ilimitada, busca com autocomplete, lista de ingredientes com quantidade e cálculo dinâmico de disponibilidade | `product-form-step-ingredients.tsx`; `PdvProduct` estendido com `ingredientsConfig` |
| 2026-07-23 | Modal Adicionar Produto — **Tradução PT-BR e Confirmação**: tradução completa para português BR em todas as etapas e adição do modal de confirmação `PdvConfirmModal` (`variant="warning"`, "Adicionar Produto?") ao concluir o cadastro | `product-form-modal.tsx`, `pdv-confirm-modal.tsx`, `product-form-step-variants.tsx`, `product-form-step-ingredients.tsx` |
| 2026-07-23 | **Edição de Produtos (`Editar`)**: integração do fluxo de edição no mesmo modal multi-step (`productToEdit`), preenchendo todos os 4 passos, permitindo edição com validação de SKU (ignorando próprio ID), salvamento via `updateProduct` na store e modal de confirmação "Salvar Alterações?" (`PdvConfirmModal`) com toast de sucesso | `products-layout.tsx`, `product-form-modal.tsx`, `use-products-store.ts` |
| 2026-07-23 | **Página de Relatórios (`/relatorio` & `/relatorios`)**: criação da dashboard completa em PT-BR idêntica à imagem de referência. Substituição dos ícones verdes nos cards de KPI pela cor primária do PDV (`#171717`). Componentes `SalesOverviewChart` (curva suave SVG + tooltip), `StatusDonutChart` (roscas de status do produto e estoque), Top 10 Produtos com troféus de classificação e tabela de Pedidos Recentes | `reports-layout.tsx`, `sales-overview-chart.tsx`, `status-donut-chart.tsx`, `mock-reports.ts`, `app/relatorio/page.tsx`, `app/relatorios/page.tsx` |
| 2026-07-23 | **Módulo de Estoque (`/estoque`)**: implementação completa de gestão de estoque padronizada visualmente à tela de Produtos. Inclui resumo de KPIs (total unidades, valor em R$, itens com estoque baixo/esgotado), alternância de abas (**Estoque Atual** e **Histórico de Movimentações**), busca, ordenar e filtros avançados, modais de **Entrada de Estoque** (`StockEntryModal`), **Saída / Ajuste** (`StockExitModal`), confirmação `PdvConfirmModal` e gerenciamento reativo com `useStockStore` e `useProductsStore` | `stock-layout.tsx`, `stock-entry-modal.tsx`, `stock-exit-modal.tsx`, `stock-filters-modal.tsx`, `use-stock-store.ts`, `types/stock.ts`, `app/estoque/page.tsx` |
| 2026-07-23 | **Estoque — Componentes DS `@citybox/ui` & Visão Analítica (Revenda vs Insumos)**: substituição de `<select>` nativos por `Select` do `@citybox/ui/atoms`. Implementação da **Visão Analítica de Estoque** para PDV com segregação entre **Produtos Prontos (Revenda Direta)**, **Insumos / Ingredientes (Matéria-Prima)** e **Produtos Preparados (Receitas)**, pílulas de sub-filtro de visão e indicação de *"Usado em: [Pratos]"* nos insumos | `stock-layout.tsx`, `stock-entry-modal.tsx`, `stock-exit-modal.tsx`, `stock-filters-modal.tsx`, `types/stock.ts`, `mock-stock.ts` |
| 2026-07-23 | **Página de Configurações (`/configuracoes` & `/configuracao`)**: criação da tela de configurações completa e fiel à imagem de referência. Menu lateral de abas (Configurações da Loja, Categorias, Modificadores, Métodos de Pagamento, Impostos, Descontos, Recibo, Impressoras) com indicador na cor primária do PDV (`#171717`). Formulário de dados da loja em PT-BR, caixa de upload de logo com preview e suporte a substituição, salvamento com toast de sucesso e persistência via `useSettingsStore` | `settings-layout.tsx`, `use-settings-store.ts`, `types/settings.ts`, `mock-settings.ts`, `app/configuracoes/page.tsx`, `app/configuracao/page.tsx` |
| 2026-07-23 | **Máscaras de Entrada (`use-mask-input`)**: aplicação do hook `useMaskInput` nos campos de formulário das Configurações (`Telefone de Contato`, `WhatsApp de Vendas`, `CEP` e `CNPJ da Empresa no Recibo`), garantindo formatação automática e validação de padrões brasileiros | `settings-layout.tsx`, `customer-form-modal.tsx`, `customers-modal.tsx` |
| 2026-07-23 | **TablesModal redesenhado com Floor Plan**: substituição do grid 3-colunas simples pelo layout visual da página de mesas (`/mesas`). Agora exibe sidebar com lista de mesas (nome, capacidade, shape, status, valor de consumo) e canvas de planta-baixa com formas (circle/square/rect), badges de capacidade, hachura para mesas ocupadas, grid de pontos e legenda. Busca por nome, footer com resumo da mesa selecionada e botões Cancelar / Confirmar Mesa. Bridge entre `useFloorLayoutStore` (visual) e `usePosStore` (vinculação ao pedido) | `tables-modal.tsx` |









