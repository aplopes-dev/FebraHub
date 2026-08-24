# AGENTS.md — Keycloak Theme (Citybox)

> **Para agentes de IA:** Este arquivo é a fonte de verdade sobre este módulo.
> Leia-o integralmente antes de qualquer ação. Ao modificar código neste módulo,
> atualize as seções relevantes deste arquivo na mesma operação. Nunca remova
> seções — apenas atualize ou adicione.

---

## 1. Identidade do Módulo

| Campo            | Valor                                              |
| ---------------- | -------------------------------------------------- |
| **Nome**         | `infra/keycloak/theme` · pacote `@citybox/keycloak-theme` |
| **Tipo**         | Tema de **login do Keycloak** (SPA React empacotada via Keycloakify) |
| **Responsável**  | Bruno Lopes — Aplopes Tecnologia                   |
| **Status**       | 🟢 Em uso — todos os realms locais                  |
| **Tema Keycloak**| `citybox` (v2.0.0) · só **login** (account = `none`) |
| **Última atualização deste arquivo** | 2026-08-14                     |

**Propósito em uma linha:**
Personaliza as telas de **login/autenticação do Keycloak** para os **seis realms**
(ADR C-16: `citybox-admin`, `citybox-erp`, `citybox-clinica`, `citybox-beautiful`,
`citybox-imoveis`, `citybox-marketplace`) com a identidade CityBox — **tema neutro
white-label** (sem cor de produto), **logo CityBox + nome da vertical em destaque**
e **layout diferente por sistema** (split/centered/panel-card), usando o design
system **`@citybox/mui`** (MUI).

---

## 2. Posição no Monorepo

```
citybox/
├── infra/
│   └── keycloak/
│       ├── theme/                ← VOCÊ ESTÁ AQUI (@citybox/keycloak-theme)
│       ├── import/*-realm.json   ← realms sincronizados via `pnpm keycloak:sync`
│       ├── scripts/              ← sync-realm.mjs / build-theme.sh
│       ├── Dockerfile            ← build multi-stage: tema (JAR) → Keycloak
│       └── docker-compose.yml
├── packages/
│   └── mui/                      ← @citybox/mui (Button, FormField, PasswordInput, Logo…)
└── AGENTS.md                     ← contexto raiz
```

> **Movido de `apps/keycloak-theme` em 2026-08-14** — o tema faz parte da infra
> do Keycloak; morar em `infra/keycloak/theme` deixa Dockerfile, realms e tema
> no mesmo lugar. Registrado no `pnpm-workspace.yaml` como `infra/keycloak/theme`.

**Depende de:**
- **Keycloakify v11** — compila esta SPA React em um **tema Keycloak** (FTL + bundle).
- `@citybox/mui` (`workspace:*`) — design system MUI (consumido via **source**;
  o Vite transpila o TS do pacote direto).
- `@mui/material` / `@mui/icons-material` / Emotion — mesmos majors do `@citybox/mui`.
- **Keycloak 26.x** — servidor alvo (testado com 26.6.0).

**Consumido por:**
- O servidor **Keycloak** — todos os realms usam `loginTheme: "citybox"` nos JSONs
  de `../import/`. Indiretamente, todos os apps que fazem login via Keycloak.

**NÃO depende mais de:** `@citybox/ui` (Tailwind/shadcn) — removido na migração
para MUI em 2026-08-14, junto com Tailwind v4 e o carousel embla.

---

## 3. Stack e Versões

| Tecnologia        | Versão   | Observação                                                   |
| ----------------- | -------- | ------------------------------------------------------------ |
| Node.js           | ≥ 20     |                                                              |
| pnpm              | workspace| **Package manager do monorepo** — nunca npm/yarn            |
| TypeScript        | 5.7.x    | `type: module` (ESM)                                         |
| React             | 19       | SPA renderizada dentro do HTML servido pelo Keycloak         |
| Vite              | 6        | dev server + build do bundle                                 |
| Keycloakify       | ^11      | plugin Vite + CLI (`keycloakify build` / `start-keycloak`)   |
| MUI Material      | 9.x      | via `@citybox/mui` + imports diretos (`CircularProgress` etc.) |
| `@citybox/mui`    | workspace| tema pluggable (`createAppTheme`) + componentes              |
| Keycloak (alvo)   | 26.x     | testado com 26.6.0; targets: `all-other-versions` (não 22–25) |

---

## 4. Estrutura de Pastas

Keycloakify mapeia cada **página do Keycloak** (`*.ftl`) para um componente React.
O `KcPage` é o roteador por `pageId`; páginas não customizadas caem no tema-pai
(`keycloak.v2`).

```
infra/keycloak/theme/
├── index.html                    ← shell HTML (fonte Inter via Google Fonts, #root) — DEV e cabeçalho do FTL
├── vite.config.ts                ← plugins: react + keycloakify({ themeName: 'citybox', … })
├── preview-realm.json            ← realm mínimo p/ `test:keycloak` (SEM campos custom do sync)
├── src/
│   ├── main.tsx                  ← entrypoint: monta <KcPage kcContext={…}> no #root
│   ├── kc.gen.tsx                ← GERADO pela Keycloakify (não editar à mão)
│   └── login/
│       ├── getContext.ts         ← resolve o kcContext: real (window.kcContext) ou MOCK (dev, ?pageId=)
│       ├── KcContext.ts          ← tipo do contexto (augmentar aqui se houver atributo custom do realm)
│       ├── KcPage.tsx            ← roteia por kcContext.pageId → página React; injeta favicon + título da aba ("Citybox — {vertical}")
│       ├── theme-variant.ts      ← REALM → variante: label, LAYOUT, slides (sem cor — white-label)
│       ├── variant-theme.ts      ← tema MUI NEUTRO único (getNeutralTheme; primária cinza-tinta)
│       ├── AuthShell.tsx         ← casca de TODAS as páginas: 4 layouts, logo+vertical grande, Alert global
│       ├── VisualPanel.tsx       ← lado "imagem" NEUTRO: grafite + glow + grade; mode "backdrop" p/ panel-card
│       └── pages/
│           ├── Login.tsx                 ← login.ftl
│           ├── LoginResetPassword.tsx    ← login-reset-password.ftl
│           ├── LoginUpdatePassword.tsx   ← login-update-password.ftl
│           ├── LoginUpdateProfile.tsx    ← login-update-profile.ftl
│           ├── LoginInfo.tsx             ← info.ftl
│           ├── LoginError.tsx            ← error.ftl
│           └── LogoutConfirm.tsx         ← logout-confirm.ftl
├── public/
│   ├── icon.svg                  ← favicon do tema
│   └── keycloakify-dev-resources/  ← assets/JS padrão do Keycloak p/ o preview de DEV (gerado)
├── dist/                         ← saída do `vite build` (assets do tema)
├── dist_keycloak/                ← saída do `keycloakify build` → JAR(s) do tema p/ deploy
├── package.json · tsconfig.json
└── AGENTS.md                      ← ESTE ARQUIVO
```

### 4.1 Páginas customizadas (mapeamento `pageId` → componente)

| `pageId` (Keycloak FTL)      | Componente React              | Tela                              |
| ---------------------------- | ----------------------------- | --------------------------------- |
| `login.ftl`                  | `pages/Login.tsx`             | Login (usuário/senha, remember-me, esqueci a senha — **sem** link de registro) |
| `login-reset-password.ftl`   | `pages/LoginResetPassword.tsx`| Recuperar senha                   |
| `login-update-password.ftl`  | `pages/LoginUpdatePassword.tsx`| Definir nova senha               |
| `login-update-profile.ftl`   | `pages/LoginUpdateProfile.tsx`| Completar/atualizar perfil        |
| `info.ftl`                   | `pages/LoginInfo.tsx`         | Mensagem informativa              |
| `error.ftl`                  | `pages/LoginError.tsx`        | Erro                              |
| `logout-confirm.ftl`         | `pages/LogoutConfirm.tsx`     | Confirmação de logout             |
| **demais**                   | _(fallback)_                  | Usa o tema-pai `keycloak.v2`      |

### 4.2 Variantes por realm — white-label: layout diferencia, NUNCA cor

Os sistemas são white-label: a cor primária é a cor de brand da **organização**
(só aparece dentro do app). O login é **neutro** em todos (primária `#18181B`,
painel grafite) e cada sistema se distingue pelo **layout** + nome da vertical
em destaque (20px/700) ao lado do logo CityBox.

| Realm                 | Variante      | Label ao lado do logo | Layout        |
| --------------------- | ------------- | --------------------- | ------------- |
| `citybox-admin`       | `admin`       | Admin da Plataforma   | `centered` (form no centro, sem painel) |
| `citybox-erp`         | `erp`         | Comércio              | `split-right` (form esq., painel dir.) |
| `citybox-clinica`     | `clinica`     | Clínica               | `split-left` (painel esq., form dir.) |
| `citybox-beautiful`   | `beautiful`   | Beautiful             | `panel-card` (card sobre painel em tela cheia) |
| `citybox-imoveis`     | `imoveis`     | Imóveis               | `split-right` |
| `citybox-marketplace` | `marketplace` | Marketplace           | `panel-card`  |

Realm desconhecido cai em `admin` (mais conservador). Fonte: `src/login/theme-variant.ts`.

---

## 5. Restrições Críticas

> ⚠️ Estas restrições quebram o build do tema ou o runtime no Keycloak se ignoradas.

### 5.1 Package Manager
```
SEMPRE: pnpm --filter @citybox/keycloak-theme <script>
NUNCA:  npm install / yarn add
```

### 5.2 Não editar arquivos gerados
```
src/kc.gen.tsx  → GERADO pela Keycloakify. Não editar; é regenerado no build.
public/keycloakify-dev-resources/  → assets de DEV gerados; não editar à mão.
```

### 5.3 O HTML real vem do Keycloak, não do index.html
```
index.html só é usado no DEV (vite preview). Em produção, o Keycloak serve a página
(FTL) e injeta `window.kcContext`. NÃO depender de DOM/rotas próprias — o ciclo de vida
é do Keycloak (form POST → url.loginAction).
```

### 5.4 Adicionar nova página = mapear o `pageId` no `KcPage.tsx`
```
Criar pages/<Nova>.tsx e adicionar o case do pageId (ex.: "register.ftl") em KcPage.tsx.
Sem o case, a página cai no fallback (tema-pai keycloak.v2).
```

### 5.5 Formulários seguem o contrato do Keycloak
```tsx
// O <form> deve postar para a URL do kcContext (ex.: url.loginAction) com os
// names esperados (username, password, credentialId, rememberMe…). NÃO trocar
// por fetch/JSON — o Keycloak processa o POST do form.
<Box component="form" action={url.loginAction} method="post"> … </Box>
```

### 5.6 Erros de campo vêm de `messagesPerField`
```ts
messagesPerField.existsError("username", "password")
messagesPerField.getFirstError("username")
// Mensagem global em kcContext.message ({ type: "error" | "warning" | … , summary }).
// O AuthShell recebe `message` e renderiza um <Alert severity={type}>.
```

### 5.7 Links de navegação: usar `devUrl(...) ?? url.<realLink>`
```tsx
// devUrl() permite navegar entre páginas no preview de DEV (?pageId=…);
// em produção devUrl() é undefined e cai na URL real do Keycloak.
href={devUrl("login-reset-password.ftl") ?? url.loginResetCredentialsUrl}
```

### 5.8 `preview-realm.json` não pode ter campos custom do sync
```
`test:keycloak` importa o realm NATIVAMENTE (--import-realm). Os JSONs de
../import/ carregam campos que só o sync-realm.mjs entende (secretEnv,
serviceAccountRealmRoles…) — o importador nativo recusa campo desconhecido e
mata o boot. Por isso o preview usa um realm próprio, mínimo e limpo.
```

### 5.9 Tema único, variante por realm
```
NÃO criar um themeName por sistema. O tema é um só ("citybox"); a identidade
muda em runtime via kcContext.realm.name (theme-variant.ts). Todos os realms
de ../import/ apontam loginTheme: "citybox".
```

---

## 6. Padrões de Código

### 6.1 Página tipada pelo `pageId`
```tsx
import type { KcContext } from "../KcContext";
type LoginKcContext = Extract<KcContext, { pageId: "login.ftl" }>;
export default function Login({ kcContext }: { kcContext: LoginKcContext }) {
  const { realm, url, login, auth, message, messagesPerField, usernameHidden } = kcContext;
  // … AuthShell + @citybox/mui (Button, FormField, PasswordInput)
}
```

### 6.2 Toda página usa o `AuthShell`
```tsx
const variant = getThemeVariant(kcContext);
return (
  <AuthShell variant={variant} title="…" subtitle="…" message={message ?? undefined}>
    {/* só o form/conteúdo — marca, tema MUI, alert global e rodapé moram no shell */}
  </AuthShell>
);
```

### 6.3 Resolução do contexto (`getContext.ts`)
```ts
// Produção: window.kcContext (injetado pelo Keycloak).
// Dev: mock via createGetKcContextMock; pageId vem de ?pageId= na URL.
export const kcContext = realKcContext ?? getKcContextMock({ pageId: getDevPageId() });
export const devUrl = (pageId) => (realKcContext ? undefined : `?pageId=${pageId}`);
```

### 6.4 Visual
- Componentes de `@citybox/mui` (`Button`, `FormField`, `PasswordInput`, `Logo`,
  `Checkbox`); layout com `Box`/`Stack` + `sx`. Sem Tailwind.
- Tema por variante: `getVariantTheme(variant)` (cacheado) → `CityboxMuiProvider`.
- Layout: form à esquerda + `VisualPanel` à direita (desktop, `md+`).
- Sem link de registro no login — contas são provisionadas pelo admin.
- Textos em **pt-BR**.

---

## 7. Variáveis de Ambiente

Este módulo **não usa `.env`**. A configuração relevante está em `vite.config.ts`
(plugin `keycloakify`) e nos scripts:

| Config                         | Onde                        | Valor                                   |
| ------------------------------ | --------------------------- | --------------------------------------- |
| `themeName`                    | `vite.config.ts`            | `citybox` (único p/ todos os realms)    |
| `themeVersion`                 | `vite.config.ts`            | `2.0.0`                                 |
| `accountThemeImplementation`   | `vite.config.ts`            | `none` (sem tema de account)            |
| `keycloakVersionTargets`       | `vite.config.ts`            | `all-other-versions: true` (não 22–25)  |
| Keycloak de teste              | script `test:keycloak`      | versão `26.6.0`, porta `8081`           |
| Realm importado no teste       | script `test:keycloak`      | `./preview-realm.json`                  |

---

## 8. Scripts

```bash
# DEV — preview no browser (Vite), com mock de contexto
pnpm --filter @citybox/keycloak-theme dev
#   Navegar entre páginas: http://localhost:5173/?pageId=login.ftl
#   Trocar de sistema:      …&variant=clinica (admin|erp|clinica|beautiful|imoveis|marketplace)

# TESTAR no Keycloak REAL (KC 26.6.0 na :8081 com preview-realm.json e o tema aplicado)
pnpm --filter @citybox/keycloak-theme test:keycloak

# BUILD do tema → JAR(s) em dist_keycloak/ (para deploy no Keycloak)
pnpm --filter @citybox/keycloak-theme build-keycloak-theme   # vite build && keycloakify build

# BUILD + DEPLOY no Keycloak local (raiz do monorepo — rebuilda a imagem Docker e reinicia)
pnpm keycloak-theme:build

# Checagem de tipos
pnpm --filter @citybox/keycloak-theme typecheck              # tsc --noEmit
```

---

## 9. Fluxo (como funciona em runtime)

### 9.1 Em produção (dentro do Keycloak)
```
1. Usuário acessa um client (ex.: admin-web) → é redirecionado ao Keycloak do
   realm do sistema (ex.: citybox-admin).
2. O Keycloak renderiza a FTL da página (ex.: login.ftl) com o tema "citybox",
   injetando window.kcContext (realm, url, login, messages, …) e o bundle JS do tema.
3. main.tsx monta <KcPage kcContext={window.kcContext}>; KcPage escolhe a página pelo pageId.
4. theme-variant.ts deriva a variante do NOME do realm → layout/label/painel do sistema (cores sempre neutras — white-label).
5. Submit → POST para o Keycloak, que valida credenciais e segue o fluxo OIDC.
   Erros voltam em message/messagesPerField.
```

### 9.2 Em desenvolvimento (preview Vite)
```
1. pnpm dev sobe o Vite; getContext.ts detecta ausência de window.kcContext e usa um MOCK.
2. O pageId vem de ?pageId= na URL; a variante de ?variant= (mock não tem realm real).
3. devUrl() troca de página no preview sem um Keycloak real.
```

### 9.3 Deploy do tema
```
1. `pnpm keycloak-theme:build` (raiz) → docker build multi-stage
   (infra/keycloak/Dockerfile): instala deps, roda vite+keycloakify, copia o JAR
   para /opt/keycloak/providers/ e reinicia o container citybox_keycloak.
2. Os realms de ../import/ já apontam loginTheme: "citybox" (via pnpm keycloak:sync).
```

---

## 10. Decisões de Arquitetura

> Registre aqui o raciocínio por trás de decisões não-óbvias.

| Data | Decisão                                                       | Motivo                                                        |
| ---- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| —    | Keycloakify (React) em vez de FTL/CSS puro                    | Reusar design system e React; identidade visual única         |
| —    | Customizar **apenas** páginas de login (account = `none`)     | Escopo do produto é a jornada de autenticação                 |
| —    | Páginas não mapeadas caem no tema-pai `keycloak.v2`           | Cobertura segura sem reimplementar todas as telas             |
| —    | `getContext` com mock + `?pageId=` no DEV                     | Iterar visualmente sem subir um Keycloak a cada mudança       |
| —    | `devUrl() ?? url.<real>` nos links                            | Mesmo código funciona no preview (mock) e no Keycloak (real)  |
| —    | Target `all-other-versions` (exclui 22–25)                    | Alvo é Keycloak moderno (26.x)                                |
| 2026-08-14 | **Movido para `infra/keycloak/theme`**                  | Tema é parte da infra do Keycloak (Dockerfile/realms juntos)  |
| 2026-08-14 | **Migrado `@citybox/ui` → `@citybox/mui`**              | Projeto está migrando os frontends para MUI                   |
| 2026-08-14 | **Tema único `citybox` + variante por realm**           | ADR C-16: realm = sistema; um themeName por sistema é redundante e os realms já apontavam `loginTheme: "citybox"` |
| 2026-08-14 | **AuthShell comum às 7 páginas**                        | Split form|painel idêntico em tudo; página só entrega o form  |
| 2026-08-14 | **Sem link "Criar conta" no login**                     | Contas são provisionadas pelo admin (sem auto-registro)       |
| 2026-08-14 | **White-label: tema neutro + layout por sistema**       | Cor primária é da organização (dentro do app); login diferencia sistemas por layout (`centered`/`split-right`/`split-left`/`panel-card`) e nome da vertical em 20px |

---

## 11. Contexto para a IA

### O que NÃO fazer neste módulo
- Não editar `src/kc.gen.tsx` nem `public/keycloakify-dev-resources/` (gerados).
- Não transformar os forms em fetch/JSON — o Keycloak processa o **POST do form** para `url.*`.
- Não inventar nomes de campos — usar os esperados pelo Keycloak (`username`, `password`, `credentialId`, `rememberMe`, `password-new`, `password-confirm`, `session_code`).
- Não tratar `index.html` como a página real — em produção o HTML vem do Keycloak.
- Não usar Tailwind nem `@citybox/ui` — o tema é MUI (`@citybox/mui` + `sx`).
- Não colocar cor de sistema em lugar NENHUM do login — white-label: tema neutro único (`variant-theme.ts`); a diferenciação é por layout (`theme-variant.ts`).
- Não criar `themeName` novo por sistema — variante deriva do realm (§5.9).
- Não adicionar campos custom no `preview-realm.json` (§5.8).
- Não instalar pacotes com npm/yarn — usar pnpm.

### Ao customizar uma **nova página** do Keycloak
1. Criar `src/login/pages/<Nova>.tsx` tipada com `Extract<KcContext, { pageId: "<arquivo>.ftl" }>`.
2. Envolver o conteúdo no `AuthShell` (variant via `getThemeVariant(kcContext)`).
3. Adicionar o `case "<arquivo>.ftl"` em `src/login/KcPage.tsx` (com `Suspense`).
4. Usar `url.*` para actions/links e `messagesPerField`/`message` para erros.
5. Validar no DEV via `?pageId=<arquivo>.ftl&variant=<sistema>` e depois com `test:keycloak`.
6. Se a página exigir atributo custom do realm, augmentar o tipo em `KcContext.ts`.
7. Atualizar a tabela da seção 4.1 deste arquivo.

### Ao adicionar um **novo sistema/realm**
1. Adicionar a variante em `ThemeVariant` + `THEME_VARIANTS` + `VARIANT_BY_REALM`
   (`src/login/theme-variant.ts`): label, layout, slides (sem cor).
2. Garantir `loginTheme: "citybox"` no JSON do realm em `../import/`.
3. Atualizar a tabela §4.2.

### Fluxo de trabalho esperado
1. Desenvolver/visualizar no DEV (Vite + mock + `?pageId=` + `?variant=`).
2. `typecheck`.
3. Validar no Keycloak real (`pnpm keycloak-theme:build` + login num realm).
4. Atualizar este `AGENTS.md`.

---

## 12. Histórico de Mudanças Estruturais

> Não é changelog de features — registra mudanças que afetam o contexto da IA.

| Data       | Mudança                                             | Impacto                          |
| ---------- | --------------------------------------------------- | -------------------------------- |
| 2026-06-25 | Arquivo `AGENTS.md` criado                           | —                                |
| 2026-08-13 | Variantes por realm (6 sistemas) em `theme-variant.ts` | Login identifica o sistema pelo realm (ADR C-16) |
| 2026-08-14 | **Movido `apps/keycloak-theme` → `infra/keycloak/theme`**; workspace/Dockerfile atualizados | Novos paths; `pnpm-workspace.yaml` lista `infra/keycloak/theme` |
| 2026-08-14 | **Migração shadcn/Tailwind → `@citybox/mui`**; tema único `citybox`; `AuthShell`+`VisualPanel`; removidos `BrandHeader`, `LoginCarousel`, `AdminShell`, `LoginAdmin`, `LoginErp`, `globals.css` | Todas as páginas MUI; um layout split para todos os realms |
| 2026-08-14 | `preview-realm.json` próprio para `test:keycloak`   | Import nativo não aceita campos custom dos realms de `import/` |
