# ADR C-16 — Um realm Keycloak por sistema

**Status:** aceito
**Data:** 2026-08-13
**Substitui:** o realm compartilhado `citybox-dev` com o client `citybox-backoffice`
servindo quatro apps.

> **Nota de local:** o `CLAUDE.md` aponta os ADRs para `gestao/docs/adrs/`, diretório que
> não existe no repositório. A documentação de arquitetura real vive em
> `packages/docs/platform/` (`ARQUITETURA-ALVO-TENANCY-VERTICAIS.md`,
> `ARQUITETURA-PERMISSOES-CASL.md`, …), e é onde este ADR foi colocado.

## Contexto

O Citybox é um **portfólio de SaaS independentes** com um painel de fornecedor, e não um
ecossistema de identidade única. Cada sistema tem schema Postgres próprio com identidade
local completa:

| Sistema | Schema | Modelagem de identidade |
|---|---|---|
| ERP | `erp` | `User` (`keycloakSub @unique`) + `Organization` + `Membership` + `PermissionProfile` + `BranchAccess` |
| Clínica | `clinica` | `ClinicStore` + membros próprios |
| Beautiful | `beautiful` | `Member` (`keycloakSub @unique`) + `Organization` + `Store` + `StoreMember` |
| Imóveis | `imoveis` | `TeamMember` + `StoreSettings` (raiz em `storeId`) |
| Admin | — | `stores`, `plans`, `subscriptions`, `invoices` — os **clientes** do Citybox |

O admin gerencia as organizações dos outros sistemas e provisiona via evento
`citybox.store.created.v1`; cada vertical consome e se auto-provisiona.

Apesar disso, até aqui **todos compartilhavam um único realm** (`citybox-dev`), com o
client `citybox-backoffice` usado por ERP (:3107), imóveis (:3111), clínica (:3113) e
beautiful (:3115) — mesmo secret, mesmas redirect URIs, mesmas client roles.

### Os três defeitos

| # | Defeito | Mecanismo |
|---|---|---|
| **D1** | Mesmo e-mail em dois sistemas quebrava o cadastro | `duplicateEmailsAllowed: false` — e-mail é chave única **do realm**. Criar usuário na vertical B para alguém que já existia pela vertical A devolvia 409, e cada app tratava diferente. |
| **D2** | Login no ADMIN entrava automaticamente no ERP | O cookie `KEYCLOAK_IDENTITY` é **por realm**. Clients separados compartilham sessão — é a definição de SSO. |
| **D3** | Qualquer API podia reescrever usuário de qualquer sistema | Service account único `citybox-core-admin`, com `manage-users` no realm, presente no `.env` de **seis** APIs. Todas podiam `PUT /users/{id}`, `reset-password` e `logout` em qualquer usuário do ecossistema. |

**Nenhum dos três se resolve com client separado.** Client isola aplicação (redirect URI,
secret, audience); não isola identidade nem sessão. As camadas do Keycloak são:

- **Realm** → isola identidade (unicidade de e-mail), sessão SSO e escopo de service account
- **Client** → isola aplicação (redirect URIs, secret, roles de cliente, timeouts)

## Decisão

**Um realm por sistema**, no mesmo Keycloak (26.6).

| Realm | Client web | Service account próprio | SA do admin |
|---|---|---|---|
| `citybox-admin` | `admin-web` (confidencial) | `admin-provisioning` | — |
| `citybox-erp` | `erp-web` (confidencial) | `erp-provisioning` | `admin-m2m` |
| `citybox-clinica` | `clinica-web` (confidencial) | `clinica-provisioning` | `admin-m2m` |
| `citybox-beautiful` | `beautiful-web` (confidencial) | `beautiful-provisioning` | `admin-m2m` |
| `citybox-imoveis` | `imoveis-web` (confidencial) | `imoveis-provisioning` | `admin-m2m` |
| `citybox-marketplace` | `marketplace-app` (público + PKCE) | `marketplace-provisioning` | — |

Definidos como código em `infra/keycloak/import/<realm>-realm.json`, aplicados por
`pnpm keycloak:sync`.

### Papéis

- **`<sistema>-provisioning`** — usada pela própria API para criar seus membros. Recebe
  `manage-users`, `view-users` e `query-users` de `realm-management` **do seu realm e de
  mais nenhum**. Substitui o `citybox-core-admin` global.
- **`admin-m2m`** — vive **dentro do realm da vertical**; a credencial fica no `admin-api`
  e é como ele autentica as chamadas `admin-api → vertical-api`. **Não recebe
  `manage-users`**: só a role `platform.admin`.
- **`platform.admin`** — deixa de ser role global cruzando sistemas e passa a ser role
  **local de cada realm**, atribuída **exclusivamente** ao service account `admin-m2m`.
  É o que faz o padrão do ERP (`@RequirePermission('platform.admin')` + `PermissionGuard`)
  continuar valendo sem mudança de código.

### O que desaparece

- Realm `citybox-dev`; clients `citybox-backoffice`, `citybox-app`, `citybox-core-admin`
- Client roles `vertical.comercio.view`, `vertical.clinic.view`, `vertical.imoveis.view`,
  `vertical.beautiful.view` — **estar no realm já é o gate de acesso**
- A realm role global `platform_admin` e suas variantes (`platform_admin_client`,
  `platform.admin` como permission) usadas como chave cruzada
- Como consequência: `provisionMember()` perde `verticalRole` / `realmRole`, e a porta
  `IdentityProvider` do ERP perde `ensureComercioBackofficeAccess()`

### Políticas por realm

Realm próprio permite política proporcional ao risco — impossível no realm compartilhado:

| Realm | Senha | Sessão idle | MFA |
|---|---|---|---|
| `citybox-admin` | 14 chars + maiúscula/minúscula/dígito/especial | 15 min | **TOTP obrigatório** |
| verticais | 10 chars, `notUsername`, `notEmail` | 30 min | opcional |
| `citybox-marketplace` | 8 chars | 30 dias | opcional |

## Invariantes

1. Todo `AuthGuard` valida **`issuer` único** (sem lista de fallback) **e `azp`**
2. Nenhum serviço tem credencial com `manage-users` fora do seu próprio realm
3. Nenhuma redirect URI com wildcard de host ou porta
4. Cada secret de client pertence a **um** app

## Verificação

Executado contra o Keycloak local em 2026-08-13, após `pnpm keycloak:sync`:

```
Invariante 3 — wildcard em redirect URI / webOrigins
  ✓ citybox-admin   ✓ citybox-erp        ✓ citybox-clinica
  ✓ citybox-beautiful  ✓ citybox-imoveis  ✓ citybox-marketplace

Invariante 2 — quem tem manage-users em cada realm
  citybox-admin      → service-account-admin-provisioning
  citybox-erp        → service-account-erp-provisioning
  citybox-clinica    → service-account-clinica-provisioning
  citybox-beautiful  → service-account-beautiful-provisioning
  citybox-imoveis    → service-account-imoveis-provisioning
  citybox-marketplace→ service-account-marketplace-provisioning

D1 — mesmo e-mail em dois sistemas
  POST joao@teste.com em citybox-clinica   → 201
  POST joao@teste.com em citybox-beautiful → 201
  subs distintos e independentes: e44dd6d7-… / 71baf276-…

D3 — menor privilégio
  admin-m2m cria usuário no próprio realm            → 403 ✓
  erp-provisioning acessa usuários de citybox-clinica → 403 ✓
  erp-provisioning acessa usuários de citybox-erp     → 200 ✓ (controle)
```

Token de `admin-m2m` no realm `citybox-erp`:

```
iss              : http://127.0.0.1:8080/realms/citybox-erp
azp              : admin-m2m
realm_access     : ['platform.admin']
realm-management : (nenhuma)   ← não gerencia usuários
```

## Consequências

**Positivas**
- D1, D2 e D3 resolvidos por construção, não por convenção
- Comprometer uma API expõe os usuários daquele produto e de mais nenhum
- Política de senha, MFA e sessão proporcionais ao risco de cada produto
- Tela de login com a marca de cada sistema (`loginTheme` por realm)
- `keycloakSub @unique` de cada schema passa a ser coerente com a realidade

**Negativas**
- O mesmo humano dono de clínica **e** salão terá duas contas e duas senhas.
  **Aceito**: são produtos diferentes, comprados e faturados separadamente.
  Se virar demanda, a saída é *identity brokering* — um realm `citybox-identity`
  como IdP dos realms de produto, adicionável depois sem refazer nada.
- O `admin-api` passa a manter uma credencial M2M por vertical, em vez de uma só.
  É o preço do menor privilégio, e é auditável.

## Notas de implementação

- **Migração de usuários: não houve.** Toda a base era de teste e foi descartada.
- `citybox-dev` continua importado e sincronizado **até a fase F1 terminar**, para que os
  apps sigam funcionando durante a migração. Removido na F4. O JSON está marcado com
  `_deprecated`.
- O `sync-realm.mjs` foi reescrito: itera todos os `*-realm.json` do diretório de import e
  é **genérico** — a versão anterior tinha blocos `if (client.clientId ===
  'citybox-backoffice')` porque um client servia quatro apps.
- Secrets: cada client confidencial declara `secretEnv` no seu JSON (ex.:
  `KEYCLOAK_ERP_WEB_SECRET`). Em Keycloak local, sem a env, cai em
  `<clientId>-dev-secret`.
- O healthcheck do `docker-compose.yml` passou de `/realms/citybox-dev` para
  `/realms/master`, que não depende de qual realm de aplicação existe.

### Correções aplicadas durante a migração dos apps

1. **`marketplace-app` precisa de `directAccessGrantsEnabled: true`.** O JSON nasceu com
   `false`, o que teria quebrado `POST /auth/login` com `400 unauthorized_client`: o
   `marketplace-bff` media o login do consumidor por Direct Access Grant (ADR C-07) e
   devolve `accessToken`/`refreshToken` no corpo, sem redirect OIDC. O client legado
   `citybox-app` já tinha a flag habilitada — foi uma regressão ao escrever o realm novo.
2. **`description` de client é `varchar(255)`.** Estourar o limite faz o Keycloak
   responder **500 `unknown_error`**, sem indicar a causa (só o log do container mostra
   `value too long for type character varying(255)`). O `sync-realm.mjs` passou a validar
   isso antes do PUT e a falhar com mensagem explícita.

## Referências

- Plano de execução: `.claude/plans/_platform/2026-08-13-keycloak-realm-por-sistema.md`
- Molde de código dos apps: [ADR C-17](ADR-C-17-padrao-auth-tenancy.md)
