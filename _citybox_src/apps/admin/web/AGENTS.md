# AGENTS.md — Admin Web (admin-web)

> **Para agentes de IA:** Este arquivo é a fonte de verdade sobre este módulo.
> Leia-o integralmente antes de qualquer ação. Ao modificar código neste módulo,
> atualize as seções relevantes deste arquivo na mesma operação. Nunca remova
> seções — apenas atualize ou adicione.

---

## 1. Identidade do Módulo

| Campo            | Valor                                              |
| ---------------- | -------------------------------------------------- |
| **Nome**         | `apps/admin/web` · pacote `@citybox/admin-web` |
| **Tipo**         | App Next.js (frontend) · Backoffice de operação da plataforma |
| **Responsável**  | Bruno Lopes — Aplopes Tecnologia                   |
| **Status**       | 🟡 Em desenvolvimento                              |
| **Porta**        | `3108`                                             |
| **Última atualização deste arquivo** | 2026-08-21 (Dockerfile: build de `@citybox/messaging` antes do Next) |


**Propósito em uma linha:**
Painel web da **operação da plataforma** CityBox — onboarding e gestão de
**clientes**, **usuários internos**, **planos** e **financeiro**. Consome a
`@citybox/admin-api` (:3103) via proxy server-side.

> **"Cliente" aqui é a Loja.** Desde o PLAT-001 não existe entidade `Client` separada: o
> empresário que contrata o Citybox tem uma Loja, e é ela a unidade de billing. A rota é
> `/clientes` e aponta para `/v1/stores`.

---

## 2. Posição no Monorepo

```
citybox/                          ← raiz do monorepo (Turborepo + pnpm)
├── apps/
│   ├── admin/
│   │   ├── api/                  ← @citybox/admin-api (:3103) — BACKEND consumido
│   │   └── web/                  ← VOCÊ ESTÁ AQUI (@citybox/admin-web · :3108)
│   ├── erp/                      ← backoffice do lojista (:3107)
│   └── marketplace/ · workers/ · verticals/…
├── packages/
│   ├── ui/                       ← @citybox/ui (design system; atoms/molecules/organisms)
│   ├── contracts/ · events/ · …
└── AGENTS.md                     ← contexto raiz (modelo deste arquivo)
```

**Depende de:**
- `@citybox/ui` (`workspace:*`) — design system (Atomic Design + Tailwind v4 + shadcn). `transpilePackages: ['@citybox/ui']`.
- `apps/admin/api` (:3103) — backend; acessado **somente** via proxy server-side `/api/proxy/admin/[...path]` (nunca direto do browser).
- **Keycloak** — login OAuth2 **Authorization Code + PKCE** (client `citybox-admin`).

**Consome (não consumido por nada interno):** é a ponta da UI da operação.

---

## 3. Stack e Versões

| Tecnologia          | Versão   | Observação                                                    |
| ------------------- | -------- | ------------------------------------------------------------- |
| Node.js             | ≥ 20     | `@types/node` 22                                              |
| pnpm                | workspace| **Package manager do monorepo** — nunca npm/yarn             |
| TypeScript          | 5.8.x    |                                                               |
| Next.js             | 16.2.7   | **App Router**; `output: 'standalone'`                        |
| React               | 19.2.7   |                                                               |
| TailwindCSS         | v4       | ⚠️ **TEM `tailwind.config.ts`** (config TS, não só CSS) — ver 5.2 |
| TanStack Query      | 5.x      | server state (queries/mutations); provider em `lib/query-provider` |
| TanStack Table      | 8.x      | tabelas (listas de clientes/lojas/usuários)                   |
| React Hook Form     | 7.x      | formulários + `@hookform/resolvers`                           |
| Zod                 | v4       | schemas de formulário (sempre `error.issues`, nunca `error.errors`) |
| recharts            | 3.x      | gráficos do dashboard/financeiro                              |
| sonner              | 2.x      | toasts                                                        |
| use-mask-input      | 3.x      | máscaras (documento, telefone, moeda)                         |
| nextjs-toploader    | 3.x      | barra de progresso de navegação                              |
| lucide-react        | —        | ícones                                                        |
| Vitest + Testing Library + jsdom | 3.x | testes unitários                                 |

---

## 4. Estrutura de Pastas

Organização **por feature** (vertical slice). Cada feature reúne sua camada de
dados (TanStack Query), componentes, schemas e utilitários.

```
apps/admin/web/
├── src/
│   ├── app/                      ← Next.js App Router
│   │   ├── layout.tsx            ← root layout (html/body, fontes, metadata)
│   │   ├── login/page.tsx        ← inicia login OAuth (PKCE)
│   │   ├── auth/
│   │   │   ├── layout.tsx
│   │   │   └── callback/page.tsx ← recebe code, troca por tokens
│   │   ├── (dashboard)/          ← GRUPO autenticado (sidebar + header)
│   │   │   ├── layout.tsx        ← AppProviders (SessionProvider + QueryProvider + PlatformAdminLayout)
│   │   │   ├── providers.tsx
│   │   │   ├── page.tsx          ← Dashboard (/)
│   │   │   ├── clientes/{page.tsx,[id]/page.tsx}  ← LOJAS (a rota /lojas foi renomeada
│   │   │   │                                          na Fase 8; não existe mais /lojas)
│   │   │   ├── financeiro/{page,layout,faturas-e-cobrancas,assinaturas,gateway}
│   │   │   ├── planos/page.tsx · usuarios/page.tsx · audit/page.tsx
│   │   │   └── config/billing/page.tsx
│   │   └── api/                  ← ROUTE HANDLERS (server-side, BFF)
│   │       ├── auth/{token,session,logout}/route.ts   ← troca/checagem/limpeza de tokens
│   │       └── proxy/admin/[...path]/route.ts         ← PROXY → admin-api (injeta Bearer)
│   ├── features/                 ← FEATURES (vertical slice)
│   │   ├── stores/   usuarios/                        ← integradas à API
│   │   │                                              (features/clients/ foi APAGADA na Fase 8)
│   │   ├── planos/    financeiro/   dashboard/        ← majoritariamente mock/stub
│   │   │   ├── api/        ← funções de dados da feature (adaptam DTO→domínio) + query-keys.ts
│   │   │   ├── hooks/      ← React Query (use*Query / use*Mutations) + helpers de UI
│   │   │   ├── schemas/    ← Zod (validação de formulário)
│   │   │   ├── components/ ← componentes da feature (tabelas, diálogos, steps, detail)
│   │   │   ├── lib/        ← mappers, formatadores, params de lista
│   │   │   ├── data/       ← mocks (mock-*.ts) para campos ainda sem backend
│   │   │   └── types.ts    ← tipos de domínio da feature
│   │   └── …
│   ├── components/               ← shell e componentes globais
│   │   ├── platform-admin-layout.tsx · admin-header.tsx · admin-sidebar-footer.tsx
│   │   └── simple-page.tsx · placeholder-page.tsx
│   ├── hooks/                    ← hooks globais (use-cep-address-lookup)
│   └── lib/                      ← núcleo de infra do app
│       ├── admin-api.ts          ← CLIENTE HTTP tipado → /api/proxy/admin (todos os DTOs)
│       ├── auth.ts · auth-server.ts · auth-cookie.ts · oauth-pkce.ts  ← fluxo OAuth/PKCE + cookies
│       ├── platform-access.ts(+.test) ← checagem de roles de acesso
│       ├── admin-navigation.ts   ← grupos do menu, títulos, breadcrumbs
│       ├── query-client.ts · query-provider.tsx ← TanStack Query
│       ├── session-context.tsx   ← contexto de sessão (client)
│       ├── api-error.ts · cep-feedback.ts
├── next.config.ts · tailwind.config.ts · postcss.config.mjs
├── tsconfig.json · eslint.config.mjs · vitest.config.ts
├── Dockerfile · README.md
├── .env.example                  ← referência de variáveis (copiar para .env.development)
└── AGENTS.md                      ← ESTE ARQUIVO
```

### 4.1 Fluxo de dados (browser → API)

```
Componente (client)
  → hook React Query (features/<f>/hooks/use-*-query|mutations)
    → função da feature (features/<f>/api/<f>-api.ts)   ← adapta DTO ↔ tipo de domínio
      → lib/admin-api.ts (adminFetch)                   ← fetch p/ /api/proxy/admin (mesma origem, cookies)
        → app/api/proxy/admin/[...path]/route.ts        ← resolve access token do cookie, injeta Bearer
          → admin-api :3103 (ADMIN_API_URL)
```
- O browser **nunca** chama a admin-api direto — sempre o proxy same-origin.
- Tokens ficam em **cookies httpOnly** (`auth-cookie.ts`); o proxy faz refresh quando expirado e regrava cookies (`resolveAccessTokenForBff`).

---

## 5. Restrições Críticas

> ⚠️ Estas restrições causam erros em build/runtime ou quebram o padrão se ignoradas.

### 5.1 Package Manager
```
SEMPRE: pnpm --filter @citybox/admin-web <script>
NUNCA:  npm install / yarn add
```

### 5.2 TailwindCSS v4 **com** `tailwind.config.ts`
```
Este app USA tailwind.config.ts (content + theme.extend com tokens hsl(var(--…))).
Diferente de outros apps Tailwind v4 do monorepo que configuram só via CSS.
Ao adicionar tokens/cores, editar tailwind.config.ts E as CSS vars correspondentes.
```

### 5.3 Acesso ao backend só via proxy
```ts
// ✅ CORRETO — passa pelo proxy same-origin (injeta auth + refresh)
import { fetchStores } from '@/lib/admin-api';            // usa /api/proxy/admin
// ❌ ERRADO — chamar admin-api :3103 direto do browser (CORS + sem token)
fetch('http://127.0.0.1:3103/api/v1/stores')
```

### 5.4 Server state é TanStack Query (não duplicar em estado local)
```ts
// queries/mutations em features/<f>/hooks; chaves em features/<f>/api/query-keys.ts
// Sempre invalidar pela chave correta após mutation.
```

### 5.5 Zod v4
```ts
error.issues[0].message   // ✅
error.errors[0].message   // ❌
```

### 5.6 `typescript.ignoreBuildErrors: true` no `next.config.ts`
```
O BUILD do Next NÃO falha em erro de tipo. NÃO confie no build para checar tipos.
Rode SEMPRE:  pnpm --filter @citybox/admin-web typecheck   (tsc --noEmit)
O script "lint" já roda tsc --noEmit + eslint.
```

### 5.7 Next 16 — sem `middleware.ts`
```
A proteção de rota é feita por: route handlers de auth + proxy que retorna 401 +
SessionProvider/redirect no client. Não há middleware.ts. Não criar um sem necessidade.
```

### 5.8 Componentes de UI vêm de `@citybox/ui`
```tsx
import { Button } from '@citybox/ui/atoms';
import { DataTable, PageHeader, ModalForm } from '@citybox/ui/organisms';
// Não recriar primitivos localmente; sem cores hardcoded (usar tokens do tema).
```

---

## 6. Padrões de Código

### 6.1 Cliente HTTP tipado (`lib/admin-api.ts`)
```ts
// adminFetch encapsula fetch p/ o proxy, com credentials e tratamento de erro/204.
export async function fetchStores(params?: {…}) {
  return adminFetch(`/v1/stores?…`) as Promise<{ data: StoreListItemDto[]; meta: {…} }>;
}
// Tipos *Dto descrevem o contrato HTTP (camada de transporte).
```

### 6.2 Camada de dados da feature (`features/<f>/api`)
```ts
// adapta DTO de transporte → tipo de domínio da feature; centraliza params de lista.
export async function listStores(params: StoresListParams): Promise<StoresListResult> { … }
// query-keys.ts: fábrica hierárquica de chaves (all → lists → list(params) → details → detail(id)).
```

### 6.3 Hook de leitura (TanStack Query)
```ts
export function useStoresQuery(params: StoresListParams) {
  const query = useQuery({
    queryKey: storesKeys.list(params),
    queryFn: () => listStores(params),
    placeholderData: keepPreviousData,
  });
  return { stores: query.data?.data ?? [], total: query.data?.meta.total ?? 0, … };
}
// Mutations em use-*-mutations.ts → onSuccess invalida storesKeys.lists()/detail(id).
```

### 6.4 Formulário (RHF + Zod v4)
```ts
// features/<f>/schemas/*.ts → schema Zod; resolver via @hookform/resolvers/zod.
// Multi-step usa componentes new-*-step-*.tsx + navegação dedicada.
```

### 6.5 Página (App Router, em português nas rotas)
```tsx
// app/(dashboard)/clientes/page.tsx → renderiza a view da feature (client component).
// Rotas em PT (clientes, lojas, usuarios, planos, financeiro, audit); código/símbolos em inglês.
```

### 6.6 Testes (Vitest + Testing Library + jsdom)
```ts
// *.test.ts(x); ex.: src/lib/platform-access.test.ts. Config em vitest.config.ts.
// `resolve.alias` mapeia "@/*" -> src/ (necessário p/ importar via alias nos testes).
// `esbuild.jsx: 'automatic'` obrigatório — sem isso, componentes de @citybox/ui (cujo
// tsconfig usa "jsx": "preserve") quebram em runtime com "React is not defined" assim que
// um deles é efetivamente renderizado (não falha no import, só no primeiro render).
// Componentes: renderWithProviders() de src/test-utils.tsx (QueryClientProvider de teste,
// retry:false) — ex.: src/features/stores/components/new-store-dialog.test.tsx.
// @testing-library/user-event instalado — usar `userEvent.click`, não `fireEvent.click`,
// para qualquer elemento Radix (Tabs, Select, Dialog): Radix Tabs ativa via onMouseDown,
// não onClick — `fireEvent.click` não dispara a troca de aba (data-state fica "inactive").
// Conteúdo de Radix Select (SelectContent/SelectItem) só monta no DOM quando aberto —
// não dá para asserir texto de uma option sem abrir o select primeiro.
// `vitest.setup.ts` (test.setupFiles) roda `afterEach(cleanup)` do RTL globalmente —
// obrigatório porque este projeto NÃO usa `test.globals: true`, então o auto-cleanup
// nativo do RTL não é registrado sozinho; sem isso, um arquivo com 2+ `render()` em
// `it()`s separados vaza DOM entre os testes (ex.: "multiple elements found").
```

---

## 7. Variáveis de Ambiente

| Variável                       | Escopo  | Obrigatória | Descrição                                          |
| ------------------------------ | ------- | ----------- | -------------------------------------------------- |
| `PORT`                         | server  | ➖ (3108)   | Porta do app                                       |
| `ADMIN_API_URL`                | server  | ✅          | Base da admin-api (ex.: `http://127.0.0.1:3103/api`) — usada pelo proxy |
| `KEYCLOAK_ADMIN_WEB_SECRET`    | server  | ✅          | Client secret do `citybox-admin` (troca de tokens) |
| `KEYCLOAK_INTERNAL_ISSUER`     | server  | ➖          | Issuer interno (server→Keycloak) se diferente do público |
| `NEXT_PUBLIC_ADMIN_ORIGIN`     | público | ✅          | Origem do app (redirects/PKCE)                     |
| `NEXT_PUBLIC_KEYCLOAK_ISSUER`  | público | ✅          | Issuer do realm dedicado `citybox-admin` |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT`  | público | ✅ (`admin-web`) | Client ID público/confidential usado com PKCE |

> Tudo com prefixo `NEXT_PUBLIC_` vai para o bundle do cliente — **nunca** colocar segredo lá.
> Referência: `.env.example` (copiar para `.env.development`).

---

## 8. Scripts

```bash
pnpm --filter @citybox/admin-web dev        # next dev -p 3108 --hostname 0.0.0.0
pnpm --filter @citybox/admin-web build       # next build (output standalone)
pnpm --filter @citybox/admin-web start       # node .next/standalone/.../server.js (PORT=3108)
pnpm --filter @citybox/admin-web lint        # tsc --noEmit && eslint .
pnpm --filter @citybox/admin-web typecheck   # tsc --noEmit  (SEMPRE rodar — build ignora erros de tipo)
pnpm --filter @citybox/admin-web test        # vitest run
```

**Docker:** o `Dockerfile` deve copiar `packages/messaging/package.json` no stage `deps` e, no stage `build`, rodar `pnpm --filter @citybox/messaging build` **antes** do `next build` — o app importa `@citybox/messaging/clinic-strand` (exports → `dist/`).

---

## 9. Módulos / Features

> Atualize esta seção quando uma feature/rota for adicionada, integrada ou alterada.
> "Integrada" = consome a admin-api real via proxy; "Mock/Stub" = dados de `features/<f>/data`.

| Feature      | Rota(s)                                  | Status        | Backend (proxy → admin-api)                         |
| ------------ | ---------------------------------------- | ------------- | ------------------------------------------------------ |
| Dashboard    | `/`                                      | ✅ Integrada  | `/v1/dashboard/summary` (métricas operacionais/financeiras, alertas, pulso de 6 meses e mix de planos em tempo real) |
| Clientes     | `/clientes`, `/clientes/[id]`            | ✅ Integrada  | `/v1/clients*` (lista/detalhe/criar/editar/bloquear); aba Billing integrada com plano/ciclo/status/vencimento reais e cancelamento/alteração de plano. |
| Lojas        | `/lojas`, `/lojas/[id]`                  | ✅ Integrada  | `/v1/stores*` (CRUD, `settings`, `modules`, `team`, `audit-log`) |
| Usuários     | `/usuarios`                              | ✅ Integrada  | `/v1/users*` (lista/criar/editar/excluir/reenviar convite) |
| Planos       | `/planos`, `/config/billing`            | 🟡 Mock/Stub  | `/v1/platform/billing/plans` (stub)                    |
| Financeiro   | `/financeiro` (+ faturas-e-cobrancas, assinaturas, gateway) | 🟡 Mock/Stub | `/v1/finance/settlements` (stub) / `fetchOrganizations` agrega settlements |
| Auditoria    | `/audit`                                 | ✅ Integrada  | `/v1/platform/audit` (trilha de logs global e histórico de ações críticas com busca e paginação server-side) |
| Dashboard    | `/`                                      | 🟡 Mock       | métricas mockadas (`features/dashboard/data`)          |
| Clientes     | `/clientes`, `/clientes/[id]`            | ✅ Integrada  | `/v1/stores*` — **a rota se chama "Clientes" e aponta para lojas** (a loja é o cliente, PLAT-001). CRUD, `settings`, `modules`, `team`, `audit-log`, `plan`+`billing` no detalhe; troca de plano via `PATCH /v1/stores/:id/plan`; clínicas: aba **Pacotes adicionais** via `signature-package-requests`. As rotas `/v1/clients*` **não existem mais** (Fase 10). Criação de loja devolve `meta` com credenciais provisórias do responsável (`StoreMemberCredentialsDialog` na página) |
| Usuários     | `/usuarios`                              | ✅ Integrada  | `/v1/users*` (lista/criar/editar/excluir/reenviar convite) |
| Planos       | `/planos`                                | ✅ Integrada  | `/v1/platform/billing/plans*` (CRUD real, filtro `?vertical=`; catálogo por vertical/tier — PLAT-001/T040-T043). `/config/billing` continua stub/legado |
| Financeiro   | `/financeiro` (+ contas-a-receber, assinaturas, gateway) | 🟡 Mock/Stub | `/v1/finance/settlements` (stub) / `fetchOrganizations` agrega settlements |
| Auditoria    | `/audit`                                 | 🟡 Stub       | `/v1/platform/audit`                                   |

### Infra / lib transversal
- **Auth (OAuth2 PKCE)** — `oauth-pkce.ts` (begin/exchange), `auth-server.ts` (issuer/secret/refresh/cookies), `auth-cookie.ts` (ACCESS/ID/REFRESH httpOnly), route handlers `app/api/auth/{token,session,logout}`.
- **Proxy** — `app/api/proxy/admin/[...path]/route.ts`: GET/POST/PUT/PATCH/DELETE → injeta `Bearer`, timeout 30s, refresh + regrava cookies.
- **Acesso** — `platform-access.ts`: roles aceitas `platform_admin`, `platform_operator`, `platform_admin_client`, `platform.admin`.
- **Navegação** — `admin-navigation.ts`: `ADMIN_NAV_GROUPS`, `getAdminPageTitle`, `getAdminBreadcrumbs`.
- **CEP** — `hooks/use-cep-address-lookup.ts` + `lib/cep-feedback.ts` → `/v1/cep/:cep`.

### Endpoints consumidos (via `lib/admin-api.ts`)
`/v1/clients*` · `/v1/stores*` (settings/modules/team/audit-log/signature-package-requests) · `/v1/users*` · `/v1/invoices*` ·
`/v1/cep/:cep` · `/v1/platform/{audit,billing/plans,verticals}` ·
`/v1/onboarding/{organizations,stores}` · `/v1/finance/settlements`.
> Alguns (`onboarding`, `finance/settlements`, `platform/*`) são stubs/legado e podem não existir
> ainda na admin-api atual (que expõe users, clients, stores, cep, me/stores, health).

---

## 10. Decisões de Arquitetura

> Registre aqui o raciocínio por trás de decisões não-óbvias.

| Data       | Decisão                                                     | Motivo                                                            |
| ---------- | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| 2026-07-30 | **Aba "Membros" removida; no lugar dela, o cartão "Responsável pelo acesso"** — `store-owner-card.tsx` abre a aba Overview do detalhe do cliente quando `teamSource === "vertical"`, mostrando username, nome, e-mail, selo de situação (Sem senha definida / Senha definida / Acesso desativado) e um botão que lê **"Gerar senha"** quando `hasPassword === false` e **"Resetar senha"** quando `true` — mesma rota (`POST .../vertical-team/owner/reset-password`) nos dois casos. Saíram `tabs/team-tab.tsx`, `use-vertical-team-query.ts`, `listVerticalTeam`/`mapVerticalTeamMember` e o item "Gerar credenciais do responsável" do dropdown do header (o cartão o substitui, com rótulo que reflete o estado). `StoreEmployee` perdeu `isOwner`/`isDisabled`, que só a tabela da vertical usava | Decisão do dono do produto: pelo admin gerencia-se **apenas o responsável** da organização; colaborador é cadastrado dentro do app da vertical. Listar a equipe aqui prometia uma gestão que este painel não faz. O cartão fica na Overview (aba padrão) porque as duas perguntas do operador — quem responde pela loja e se essa pessoa já consegue entrar — precisam de resposta sem navegação. O rótulo depende de `hasPassword` porque "resetar" a senha de quem nunca teve uma descreve errado o que o botão faz, e o responsável **nasce sem senha** no provisionamento. Vertical fora do ar vira erro explícito ("não foi possível consultar o responsável"), nunca cartão vazio — vazio leria como "esta loja não tem responsável" e levaria a cadastro em duplicidade. As ações de criar/editar/remover membro em `platform.store_members` (rotas, `stores-api`, mutations, `StoreMemberFormDialog`, `StoreMemberActionsMenu`) **continuam existindo** para lojas `teamSource === "platform"`; hoje ficam sem tela que as invoque |
| 2026-07-30 | **Aba "Membros" lê a fonte indicada por `teamSource`** — `LojaDetail.teamSource` (`'platform' \| 'vertical'`) decide entre `detail.team` e `GET /v1/stores/:id/vertical-team` (`useVerticalTeamQuery` + `mapVerticalTeamMember`). Com `'vertical'`: selo `Badge` "Responsável" na linha do OWNER, vazio explicando onde cadastrar, e criar/editar/remover/resetar senha desabilitados com tooltip. "Gerar credenciais do responsável" continua ativa | A aba aparecia vazia para clínicas — lia `platform.store_members`, e o membro vive em `clinica.members` (PLAT-001). O `if (vertical === 'Clínica')` que existia no `store-detail-header.tsx` virou `teamSource === 'vertical'`: quem responde pela equipe é uma capacidade da vertical (expor ou não API de membros), não a identidade dela, então o backend decide e a UI obedece — vertical nova não pede mudança de tela. As ações desabilitadas escrevem em `platform.store_members`: deixá-las ativas faria o operador ver "sucesso" sem efeito nenhum. O papel exibido é o **clínico** (por unidade); `organizationRole` vira selo, não cargo |
| 2026-07-30 | **Seletor de vertical reduzido a `Comércio` e `Clínica`** — `Vertical`, `StoreVerticalDto`, os `z.enum` de loja/plano, os filtros e os mocks atualizados juntos; `VERTICAL_STYLES` do `@citybox/ui` ficou com duas entradas | O admin não pode oferecer vertical sem sistema por trás. `Comércio` cobre food e varejo (mesmo ERP); `Imóveis` fica fora até `apps/imoveis/api` provisionar loja de verdade — cadastrar hoje deixaria a loja em `PROVISIONING` para sempre |
| 2026-07-30 | **"Gerar credenciais do responsável"** no menu de ações da loja (`store-detail-header.tsx`), só quando a vertical é dona da equipe. Reaproveita o `StoreMemberCredentialsDialog` que já existia. **Atualizado em 2026-07-30:** o guard era `detail.vertical === 'Clínica'` e passou a ser `detail.teamSource === 'vertical'` (ver linha do `teamSource` acima) | O Keycloak de desenvolvimento não tem SMTP, então convite por e-mail não sai: o operador precisa **ver** usuário e senha para repassar. A senha vive só em `useState` do header — nunca em cache do TanStack Query, que a deixaria sobrevivendo a navegações e visível no devtools. Guard por vertical porque só a Clínica expõe API de membros (`vertical-team`); nas outras a equipe segue no cadastro da plataforma e a rota recusaria a chamada |
| —          | Proxy server-side (`/api/proxy/admin`) p/ falar com a API   | Esconde tokens (httpOnly), evita CORS, centraliza refresh         |
| —          | OAuth2 **Authorization Code + PKCE** via Keycloak           | Login seguro de SPA sem expor client secret no browser            |
| —          | TanStack Query como camada de server state                  | Cache, dedupe, invalidação; evita prop drilling                   |
| —          | Organização **por feature** (api/hooks/components/schemas)  | Coesão alta; cada slice é autocontido                             |
| —          | Camada `lib/admin-api` (DTO) separada de `features/api` (domínio) | Isola o contrato HTTP do modelo de UI                       |
| —          | `typescript.ignoreBuildErrors: true`                        | Build não trava em CI por tipos; checagem fica no `typecheck`/`lint` (rodar sempre) |
| —          | Mocks em `features/<f>/data` p/ campos sem backend          | Permite evoluir a UI antes da API; trocar por dados reais ao integrar |
| 2026-07-18 | PLAT-001/T032 (apagar `features/clients/` por completo) **não executado** nesta sessão | Descobertas 2 dependências cruzadas reais na hora de tentar: `features/dashboard/lib/platform-stats.ts` importa `mockClients` de `features/clients/data`, e `lib/admin-api.ts` importa o type `ClientStore` de `features/clients/types`. Apagar a feature agora quebraria o dashboard. T032 fica pendente até essas duas dependências serem resolvidas (mover/inline o que for necessário) — tratar como tarefa explícita antes de reabrir T032, não assumir que "depende de T029, T031" (únicas dependências listadas em tasks.md) é suficiente |

---

## 11. Contexto para a IA

### O que NÃO fazer neste módulo
- Não chamar a admin-api direto do browser — sempre via `lib/admin-api` → proxy.
- Não duplicar server state em `useState`/contexto — usar TanStack Query e invalidar pela chave.
- Não criar `middleware.ts` (não é o padrão aqui).
- Não assumir Tailwind "config-less": este app **tem** `tailwind.config.ts` — editar tokens lá.
- Não confiar no `next build` para checar tipos (`ignoreBuildErrors`) — rodar `typecheck`/`lint`.
- Não usar `error.errors` do Zod — é `error.issues` (v4).
- Não recriar componentes de `@citybox/ui` localmente nem hardcodar cores.
- Não colocar segredo em variável `NEXT_PUBLIC_*` (vai para o bundle).
- Não instalar pacotes com npm/yarn — usar pnpm.

### Ao criar uma nova **feature**
1. `features/<nome>/` com `api/` (`<nome>-api.ts` + `query-keys.ts`), `hooks/`, `components/`, `schemas/`, `lib/`, `data/` (mocks), `types.ts`.
2. Tipos de transporte (`*Dto`) + função `fetch*` em `lib/admin-api.ts`.
3. Hooks de query/mutation; chaves hierárquicas em `query-keys.ts`; invalidar após mutation.
4. Schema Zod para formulários (RHF + `@hookform/resolvers/zod`).
5. Rota em `app/(dashboard)/<rota-pt>/page.tsx` (rota em português; símbolos em inglês).
6. Adicionar item em `lib/admin-navigation.ts` (`ADMIN_NAV_GROUPS`) e título/breadcrumb se necessário.
7. Atualizar a tabela de features na seção 9.

### Fluxo de trabalho esperado
1. **Frontend-first**: montar a UI com mocks (`features/<f>/data`) e validar.
2. Definir os `*Dto` + `fetch*` em `lib/admin-api` e adaptar em `features/<f>/api`.
3. Ligar via hooks React Query; trocar mocks por dados reais.
4. Rodar `typecheck` + `lint` + `test`.
5. Atualizar este `AGENTS.md`.

---

## 11.9 Nomenclatura: "Clientes" É a loja (PLAT-001 / Fase 8)

Desde PLAT-001 a `Store` é a unidade de billing e absorveu os dados do antigo `Client`.
Não existe mais entidade acima dela.

- Rota `/clientes` (era `/lojas`); o menu tem **um** item "Clientes".
- `features/clients/` foi **apagada** (Fase 8) e o type `ClientStore` que a segurava saiu
  do `lib/admin-api.ts` na Fase 10, junto com todas as funções `/v1/clients*`.
- **Reaproveitar membro entre lojas saiu na Fase 10** (`GET /team/available`,
  `POST /team/batch`): o `Client` era a fronteira de tenant dessa feature e, sem ele,
  listar membro de outra loja passaria dado de equipe entre negócios distintos. O
  `StoreMemberFormDialog` perdeu a aba "existente" e cria/edita só membro novo.
- `clientId` saiu de `Loja`/`LojaDetail`/`StoreListItemDto`; `clientName` **ficou**,
  carregando o nome da própria loja (ver §12.4 do ADR PLAT-001).
- `features/stores/` é a feature canônica: o detalhe reúne Sobre/Fiscal, Plano, Billing,
  Módulos, Operacional e Logs na mesma tela. A aba **Membros saiu em 2026-07-30** — pelo
  admin gerencia-se só o responsável, exibido no cartão "Responsável pelo acesso" da
  Overview (ver seção 10). Em clínicas (`vertical === "Clínica"`), a aba **Pacotes adicionais**
  aparece **após Configurações** e lista/libera solicitações via
  `GET/PATCH /v1/stores/:id/signature-package-requests*` (proxy M2M → clinica-api).
- `Clínica` ganhou entrada em `VERTICAL_STYLES` do `@citybox/ui` — antes caía no cinza
  do `DEFAULT_STYLE` porque a chave não existia. Mesma regra vale para qualquer
  vertical nova: adicione a cor **junto** com o valor no catálogo.
- **O seletor de vertical oferece:** `Comércio`, `Clínica`, `Imóveis` e `Beautiful`.
  O tipo `Vertical` vive em `features/stores/types.ts` e espelha `StoreVertical` do
  `admin-api` — os dois mudam juntos, mais `StoreVerticalDto` em `lib/admin-api.ts`,
  os `z.enum` de `new-store-schema.ts`/`plan-schema.ts` e os grupos de filtro.

## 12. Histórico de Mudanças Estruturais

> Não é changelog de features — registra mudanças que afetam o contexto da IA.

| Data       | Mudança                                             | Impacto                          |
| ---------- | --------------------------------------------------- | -------------------------------- |
| 2026-08-21 | Dockerfile passa a copiar `packages/messaging` e rodar `pnpm --filter @citybox/messaging build` antes do `next build` | Corrige `Can't resolve '@citybox/messaging/clinic-strand'` no deploy |
| 2026-08-14 | Dockerfile e compose de produção passam a embutir `citybox-admin` / `admin-web`; secret continua apenas no runtime server-side | Build do Next não referencia mais o realm legado `citybox-dev` |
| 2026-08-12 | **Provision on demand na UI:** após create, redirect para `/clientes/:id`; card "Responsável" sempre visível; `PENDING`/`FAILED` → botão Provisionar + modal de confirmação (nome/e-mail/username) + loading; sucesso abre diálogo de credenciais; `ACTIVE` → Gerar / Gerar nova senha. Badge `PENDING`. `POST /v1/stores/:id/provision` via `useProvisionStoreMutation`. | Senha deixa de sair no create; operador provisiona no detalhe |
| 2026-08-14 | **Vertente Nutrição no create:** select Odontologia \| Fisioterapia \| Nutrição; `CLINIC_STRANDS` via `@citybox/messaging` | Vertentes nutrição |
| 2026-08-12 | **Vertente da Clínica (Parte 2):** select obrigatório Odontologia \| Fisioterapia no create; detalhe/edição read-only na aba Fiscal; `clinicStrand` no schema e payload de create | Vertentes Parte 2 |
| 2026-08-11 | **Vertente da Clínica no create (Parte 1):** `clinicStrand` no tipo `Loja` e nos DTOs; Input read-only Odontologia até o pack fisio existir | Parte 1 das vertentes |
| 2026-08-11 | **Credenciais do responsável na criação da loja:** `POST /v1/stores` devolve `{ data, meta: { username, temporaryPassword } \| null }`; `createPlatformStore`/`createStore` (novo `StoreCreateMetaDto`/`CreateStoreMeta`) repassam o `meta`; a página `/clientes` abre o `StoreMemberCredentialsDialog` quando o `meta` vem preenchido | O operador entrega o primeiro acesso **no cadastro**, sem depender do card "Gerar senha" da vertical. Senha segue só em `useState` da página (nunca no cache do TanStack Query), uma única exibição — mesmo padrão do reset de senha. `meta: null` (sem `responsibleName`/`billingEmail`) simplesmente não abre o diálogo |
| 2026-08-11 | **Dev local Keycloak `:8080`** — `.env.development` com issuer local + client `citybox-admin`; seed `admin` / `citybox` | Evita confusão com `auth.aplopes.com` (usuários distintos) |
| 2026-08-07 | **Pacotes adicionais API-backed:** aba Clínica consome `GET/PATCH …/signature-package-requests*` (proxy → clinica-api); removido mock localStorage | `solicitacoes-tab.tsx`, `admin-api`, hooks `useSignaturePackageRequests*` |
| 2026-08-04 | **Provisionamento Comércio na UI:** PJ exige razão social; PF envia `legalName=tradeName`; badge `deploymentStatus` no header; card Responsável aparece quando `ERP_API_URL` torna `teamSource=vertical` | Operador vê falha/provisionamento e consegue Gerar/Resetar senha do OWNER do ERP |
| 2026-07-31 | **Rename `apps/platform/admin` → `apps/admin/web`:** pacote `@citybox/admin-web` inalterado; sibling `apps/platform/api` → `apps/admin/api` (`@citybox/platform-api` → `@citybox/admin-api`). Porta (3108), schema Postgres e client Keycloak `citybox-admin` inalterados | Consolida a nomenclatura `apps/<nome>/{api,web}` do monorepo; ver `../AGENTS.md` §9 |
| 2026-07-17 | Webhook Asaas e Processamento de Cobranças          | Implementação do recebimento assíncrono de eventos do Asaas (criação, atualização, pagamento, vencimento) no backend para atualizar faturas locais. |
| 2026-06-25 | Arquivo `AGENTS.md` criado                           | —                                |
| 2026-07-02 | Substituição do array `prices` na UI de planos por campos `monthlyPrice` e `yearlyPrice` com cálculo automático do valor anual | Simplificação de bindings no react-hook-form, eliminação de erros de compilação TS, e nova lógica de cálculo de preço anual |
| 2026-07-02 | Aba Billing em detalhes do cliente | Adicionada aba Billing com dados de assinatura reais (plano, ciclo, status, vencimento), possibilidade de upgrade/downgrade de plano e cancelamento de assinatura. |
| 2026-07-02 | Visualização de preço pago na assinatura             | Adicionada coluna "Valor do Plano" exibindo o preço pago real formatado na aba de cobrança do cliente. |
| 2026-07-03 | Firmeza do contrato com o enum CRU para cycle e status | Remoção das traduções de ciclo no client-side. Alterado o envio e mapeamento do ciclo de faturamento para usar diretamente os enums crus (`MONTHLY` e `YEARLY`). |
| 2026-07-07 | Integração de faturas reais no detalhamento de clientes | Atualizado o helper `mapClientDetail` para mapear e carregar faturas reais da API para a aba financeira do cliente. |

| 2026-07-07 | Registro de pagamento manual de faturas na UI | Adicionado botão "Registrar pagamento" na listagem de faturas que abre um Dialog para seleção do método e executa a mutation no backend. |
| 2026-07-07 | Integração de dados reais nas páginas de Finanças | Atualizado o painel Financeiro principal, Assinaturas e Contas a Receber para carregarem KPIs, faturas e assinaturas reais do backend, mantendo apenas logs de Webhooks/Gateway mocados. |

| 2026-07-08 | Otimização na aba de Assinaturas (Junção/Join de tabelas no backend) | A listagem de assinaturas no admin-web agora consome dados do plano e cliente agregados em uma única requisição HTTP para a API de assinaturas, eliminando consultas em lote paralelas no frontend. |
| 2026-07-09 | Migração de Status de Loja no Frontend | Atualização do enum de status de lojas de ativa/bloqueada/em_implantacao para IN_SETUP/TRAINING/PRODUCTION/BLOCKED/OFFLINE e remoção de referências ao campo deletado deploymentStatus. |
| 2026-07-14 | Componente de Visualização/Edição de Detalhes de Membro | Adicionado o componente `MemberDetailSheet` na aba de usuários de detalhes de cliente. Suporta visualizar e editar (com chaves de acesso a lojas e cargo por loja) e salva alterações atualizando o cache local do React Query. |
| 2026-07-14 | Integração de rota de detalhe de membro no admin-web | Adicionado suporte ao endpoint GET /v1/clients/members/:id por meio do hook useClientMemberQuery no componente MemberDetailSheet. |
| 2026-07-14 | Atribuição de cargos e lojas do membro em lote | Refatorado o salvamento em MemberDetailSheet para agrupar remoções, edições e inclusões e enviar em uma única requisição PATCH ao backend. |
| 2026-07-14 | Fluxo de Criação de Membro Multi-loja | Implementação do formulário de criação em NewMemberSheet permitindo associar o usuário a várias lojas em uma única requisição. |
| 2026-07-15 | Correção no mapeamento de data de contratação (createdAt) | Mapeado o campo `createdAt` em `mapSubscription` do frontend e na interface `SubscriptionDto` para que a data de contratação seja exibida corretamente no histórico da aba Billing. |
| 2026-07-16 | Campo de observações (notes) na fatura manual | Campo de observações (notes) adicionado no fluxo de criação de faturas manuais (front + DTOs + backend + banco). |
| 2026-07-17 | Visualização de boleto de cobrança com Asaas | Substituído o botão "Reenviar boleto" por "Visualizar boleto" na listagem de faturas, integrando-o com o novo endpoint de payment-details da API e abrindo o boleto/fatura em nova aba. |
| 2026-07-18 | Componente Modal de Visualização de Boleto (`ViewBoletoModal`) | Criado o componente `ViewBoletoModal` e o hook `useInvoicePaymentDetailsQuery` para exibir os detalhes da fatura/boleto (código de barras, Pix copia e cola, embed em iframe e botão de nova aba) em um modal interno ao clicar em "Visualizar boleto". |
| 2026-07-20 | Redirecionamento direto para `invoiceUrl` nas faturas do cliente | Removida a ação "Copiar Pix" em `invoices-columns.tsx` e adicionado o botão "Abrir fatura" que redireciona o operador em uma nova aba para o link `invoiceUrl`. |
| 2026-07-21 | Tipagem forte, novos KPIs e dados reais nas metas do dashboard financeiro | Atualizados `types.ts`, `admin-api.ts` e `use-finance-queries.ts` com a nova tipagem de KPIs (`BillingKpis`) e o campo opcional `whatsapp` no tipo `Invoice`. O componente `FinancialGoalsRow` foi refatorado para consumir dados reais do backend e o arquivo de mock `mock-dashboard.ts` foi removido. |
| 2026-07-22 | Filtros funcionais de período no dashboard financeiro e correção da home | Refatorado o `FinancialDashboardHeader` para ler/escrever filtros na URL (`useSearchParams`). Sincronizados os hooks e componentes do dashboard (`FinancialHeroCards`, `FinancialKpiStrip`, `FinancialGoalsRow`, `RevenueComparisonChart`, `FinancialSummaryPanel`) para reagir dinamicamente a mudanças nas datas de filtro. Corrigidas também as comparações de status de plano de `"ativo"` para `"ACTIVE"` em `platform-stats.ts` para restaurar o carregamento correto da home do painel. |
| 2026-07-22 | Refatoração de KPIs Financeiros (Backend-Driven) | Removida a dependência do endpoint paginado useFinanceInvoices no dashboard de KPIs. O hook useBillingKpis agora recebe e mapeia os arrays agregados de topDefaulters e revenueHistory diretamente do backend (removendo agrupamentos client-side e evitando truncamento por perPage). |
| 2026-07-22 | Integração de Dados Reais no Gateway Financeiro | Conectada a página de Gateway (/financeiro/gateway) à API do backend (substituindo mocks em mock-webhook-logs e gateway-stats com os hooks useGatewayEvents e useGatewayStats, usando paginação manual no DataTable). |
| 2026-07-22 | Filtros e busca server-side em Contas a Receber | Implementados filtros e busca por nome do cliente via API no Contas a Receber (`/financeiro/contas-a-receber`). Removido o filtro client-side e adicionada paginação manual via `manualPagination` no `DataTable` com reset automático de página ao mudar parâmetros. |
| 2026-07-23 | Integração Real do Dashboard e Auditoria Global | Conectada a Home (`/`) à API de resumo de dados (`/v1/dashboard/summary`) e a Auditoria (`/audit`) à listagem global (`/v1/platform/audit`). Implementado o sincronismo de datas/filtros via parâmetros da URL no dashboard, debounce de busca de 400ms na trilha de auditoria e paginação server-side. Removidos helpers de mock (`mock-platform-dashboard.ts` e `platform-stats.ts`). |
| 2026-07-24 | Ajustes e Refatoração no Dashboard Principal | Removido o componente de alertas `<PlatformAlertsStrip />` e ajustado o rodapé informativo para layout simétrico de 2 colunas. Otimizada a visibilidade da legenda do gráfico de verticais (`VerticalsChart`), forçando a cor `var(--orbitly-ink)` para os rótulos de Lojas e Clientes. |
| 2026-07-18 | PLAT-001 (US1 frontend, T020-T023) — fluxo "Nova Loja" reescrito sem seleção de Cliente | `NewStoreStepIdentity` perdeu o combobox de Cliente; novo step `NewStoreStepPlan` (plano filtrado por vertical via `usePlansByVerticalQuery` + `?vertical=`); `NewStoreStepFiscal` reescrito para campos diretos da Store (`personType`/`document`/`legalName`/`stateRegistration`/`responsibleName`/`billingEmail`, substituindo o antigo `mesmoCnpjMatriz`/CNPJ-da-matriz). `newStoreSchema` ganhou um discriminante `mode: 'create' \| 'edit'` — `superRefine` só exige plano+fiscal completo quando `mode==='create'`; `EditStoreDialog` reusa os mesmos steps de fiscal/localização (sem plano, sem vertical) com `mode: 'edit'`. `map-form-to-store-payload.ts` dividido em `mapFormToCreateStorePayload`/`mapFormToUpdateStorePayload`. `Loja.clientId` e `StoreListItemDto.clientId` viram `string \| null` (loja nova nasce sem Cliente); `ClientGroupCell` renderiza texto plano (sem link) quando `clientId` é `null`. `Vertical` (5 valores: Food/Varejo/Clínica/Educação/Serviços) definido localmente em `features/stores/types.ts`, não mais reexportado de `features/clients/types` — desacopla `stores` de `clients` antes da remoção do módulo (T062). |
| 2026-07-18 | `validate-brazilian-document.ts` movido de `features/clients/lib/` para `lib/` (compartilhado) | Necessário para `features/stores` validar CPF/CNPJ no novo step fiscal sem depender de `features/clients` (que será removida na Phase 7/T062 da spec `001-store-billing-unit`) |
| 2026-07-18 | `vitest.config.ts` ganhou `resolve.alias` para `@/*` → `src/` | Faltava resolução do alias usado em praticamente todo o app; sem isso nenhum teste de componente que importa via `@/...` conseguia rodar. Primeiro teste de componente do app (`new-store-dialog.test.tsx`) e helper `src/test-utils.tsx` (`renderWithProviders` com `QueryClientProvider` de teste) adicionados junto |
| 2026-07-18 | PLAT-001 (US2 frontend, T029/T030/T031/T033) — tela única da loja: abas Fiscal/Plano/Billing + rota `/clientes` removida | `LojaDetail` passou a `extends StoreFormDetail` (em vez de `Loja`) e ganhou `plan?`/`billing` — corrige de quebra um bug pré-existente onde `LojaDetail` não tinha `usesClientDocument`/`document`/`personType`/etc que `mapStoreToFormData` (T020) já lia; os campos mortos `cnpj`/`razaoSocial`/`inscricaoEstadual`/`telefone`/`address: StoreAddress` (nunca lidos em lugar nenhum) foram removidos. Novas abas `FiscalTab`/`PlanTab`/`BillingTab` em `features/stores/components/store-detail/tabs/` — somente leitura (ação "Trocar plano" fica para US4/T053; registrar pagamento/nova fatura não fazem parte do escopo desta spec para lojas). `vitest.config.ts` ganhou `esbuild.jsx: 'automatic'` (sem isso, `@citybox/ui` — `"jsx": "preserve"` no seu tsconfig — quebra em runtime com "React is not defined" assim que um componente é de fato renderizado) e `@testing-library/user-event` foi instalado (Radix Tabs ativa via `onMouseDown`, não `onClick` — `fireEvent.click` não funciona para trocar de aba em teste). `store-detail-header.tsx` perdeu os links para `/clientes/:id` ("Pertence a" virou texto puro; "Ver responsável" removido do menu) — rota não existe mais. **T032 (apagar `features/clients/` por completo) NÃO foi executado** — ver linha de decisão correspondente na seção 10; há dependências cruzadas reais (`dashboard` e `lib/admin-api.ts`) que precisam ser resolvidas primeiro. `format-currency.ts` também movido para `lib/` (mesma motivação do `validate-brazilian-document.ts`) |
| 2026-07-18 | PLAT-001 (US3 frontend, T040-T043) — catálogo de planos por vertical/tier | Corrigido bug real onde criar/editar plano no admin-web sempre falhava com 400 (payload mandava `maxStores`, nunca `vertical`/`tier`/`maxNegocios`, exigidos pelo backend desde T036/T037 mas nunca portados ao frontend). `features/planos/types.ts` (`Plan`), `admin-api.ts` (`CreatePlanBodyDto`/`UpdatePlanBodyDto`), `plan-schema.ts`, `build-plan-payload.ts`, `map-plan-to-form-data.ts` e os steps do formulário (`PlanStepCommercial` ganhou Select de vertical + Input de tier; `PlanStepQuotas` renomeou "Limite de Lojas"→"Limite de Negócios") todos atualizados juntos. Filtro por vertical em `PLANS_FILTER_GROUPS` (só primeira vertical selecionada é enviada ao backend — `list-plans` só aceita um valor, não CSV). T042 (ligar seletor de plano do fluxo de criação de loja aos dados reais) já estava pronto desde T020/T022 — nenhuma mudança necessária. Tabela de features (seção 9) corrigida: "Planos" já não era mock/stub antes desta sessão (`page.tsx` já chamava `lib/admin-api.ts` direto), só o contrato de campos estava desatualizado. `vitest.setup.ts` criado (`test.setupFiles`) para rodar `afterEach(cleanup)` do RTL globalmente — sem `test.globals: true` neste projeto, o auto-cleanup do RTL não se registra sozinho e testes com 2+ `render()` no mesmo arquivo vazavam DOM entre `it()`s |
| 2026-07-18 | PLAT-001 (US4 frontend, T053-T055) — ação "Trocar Plano" + badge "Suspensa" | `ChangePlanDialog` (`store-detail/change-plan-dialog.tsx`) usa `usePlansByVerticalQuery(detail.vertical)` — mesmo hook de T020, garante que o seletor nunca busca plano de outra vertical (backend rejeitaria com `PlanVerticalMismatchError` de qualquer forma). Mutation `useChangeStorePlanMutation` chama `PATCH /v1/stores/:id/plan`. `resolveBlockedStatusLabel(auditLog)` novo em `lib/store-status-config.ts` distingue "Suspensa" (bloqueio automático, `actor === 'system:billing'`) de "Bloqueada" (manual) olhando o último evento `'Bloqueou a loja'` do audit log — só aplicado em `store-detail-header.tsx` (tem `auditLog`); a listagem (`stores-table-cells.tsx`) não tem esse dado e mantém o rótulo genérico |
| 2026-07-30 | PLAT-001 Fase 10 — `lib/admin-api.ts` perdeu todas as funções e DTOs de Cliente (`fetchClients`, `fetchClientById`, `createClient`, `updateClient`, `blockClient`, `createClientMember`, `deleteClientMember`, `fetchClientMemberById`, `updateClientMemberAssignments`, `ClientListItemDto`, `ClientDetailDto`, `UpsertClientBodyDto`, `ClientStore`, …) | Todas já estavam **órfãs** desde a Fase 8 (zero consumidores em `src/`), apontando para rotas que a Fase 10 removeu do backend. Filtros `clientId` de faturas/assinaturas viraram `storeId` — no backend o antigo `clientId` chegava no DTO e era descartado, então filtrar devolvia tudo |
| 2026-07-30 | PLAT-001 Fase 10 — removida a aba "membro existente" do `StoreMemberFormDialog` e o vínculo em lote | Os endpoints `GET :id/team/available` e `POST :id/team/batch` deixaram de existir. Sem `Client` como fronteira de tenant, cada loja é um cliente independente: listar/vincular membro de outra loja passaria equipe entre negócios distintos. Com um único painel restante, o `Tabs` saiu e o formulário renderiza direto; a prop `storeId` do diálogo (usada só pela query de disponíveis) foi removida |
| 2026-07-30 | **Aba "Membros" removida e substituída pelo cartão do responsável** — novos `components/store-detail/store-owner-card.tsx` (+ teste) e `hooks/use-vertical-owner-query.ts`; `lib/admin-api.ts` trocou `fetchVerticalTeam` por `fetchVerticalOwner` (`GET .../vertical-team/owner`) e `VerticalTeamMemberDto` virou `VerticalMemberDto`; `stores-api.ts` trocou `listVerticalTeam`/`mapVerticalTeamMember` por `getVerticalOwner`/`mapVerticalOwner`; `storesKeys.verticalTeam` virou `verticalOwner`; apagados `tabs/team-tab.tsx`, `tabs/team-tab.test.tsx` e `hooks/use-vertical-team-query.ts` | Pelo admin gerencia-se só o responsável (ver seção 10). `useResetStoreOwnerCredentialsMutation` ganhou um `onSuccess` que invalida **apenas** `storesKeys.verticalOwner` — sem ele o botão continuaria oferecendo "Gerar senha" depois da primeira geração, já que `hasPassword` muda na vertical. A senha provisória segue só em `useState` do cartão, nunca em cache |
| 2026-07-30 | **Credenciais do responsável da loja (vertical Clínica)** — `resetVerticalOwnerPassword` em `lib/admin-api.ts` (`POST /v1/stores/:id/vertical-team/owner/reset-password`), `resetStoreOwnerCredentials` em `features/stores/api/stores-api.ts`, hook `useResetStoreOwnerCredentialsMutation` e item "Gerar credenciais do responsável" no dropdown de `store-detail-header.tsx` | Fecha o fluxo do responsável: a `clinica-api` passou a provisionar a pessoa real a partir de `owner.responsibleName`/`owner.billingEmail` do evento `store.created`, mas ela nasce **sem senha** (Keycloak de dev sem SMTP ⇒ sem convite por e-mail). O diálogo `StoreMemberCredentialsDialog` já existia para a aba Equipe e foi reaproveitado — exibe usuário e senha **uma única vez**, com botão de copiar. A mutation não tem `onSuccess` que grave em cache de propósito: a senha só pode existir no estado local do diálogo. Diferente das demais mutations de membro, esta **não** devolve `LojaDetail` — o responsável vive na vertical, não na `team` que o platform espelha |
