# keycloak — infra

Keycloak 26 — **SSO** central (C-07). Realm dev `citybox-dev`. Porta **8080**.

## Papel no monorepo

- **App, backoffice, admin** — OAuth/OIDC unificado.
- **Sync:** `pnpm run keycloak:sync` + `nest-common` identity.

SSO central: app consumidor, backoffice por vertical, admin plataforma.

## Subir

```bash
cp .env.example .env
docker compose up -d
```

Console: http://localhost:8080 — admin do `.env`

Realm importado: `citybox-dev` (arquivo `import/citybox-dev-realm.json`). Clients: `citybox-app`, `citybox-backoffice`, `citybox-admin`, `citybox-core-admin`. **Secrets dos clients confidenciais não ficam no JSON** — `sync-realm.sh` injeta via `KEYCLOAK_BACKOFFICE_SECRET` (client `citybox-backoffice` / `erp-web`), `KEYCLOAK_ADMIN_WEB_SECRET` (client `citybox-admin` / admin-web), `KEYCLOAK_CORE_ADMIN_CLIENT_SECRET` ou `KEYCLOAK_ADMIN_CLIENT_SECRET` (client `citybox-core-admin` / admin-api).

> **Histórico:** o client `citybox-erp-comercio` (usado em dev pelo antigo `apps/erp-comercio/web`, :3110) foi aposentado em 2026-07-31 quando o app foi renomeado para `apps/erp/web` e passou a reaproveitar o `citybox-backoffice`. O client `citybox-erp-comercio` **não foi apagado automaticamente** do Keycloak (o `sync-realm.sh` é aditivo — não remove clients que saem do JSON); remover manualmente no Admin Console quando conveniente.

Dev local (Keycloak em `127.0.0.1:8080`):

```env
KEYCLOAK_ISSUER=http://127.0.0.1:8080/realms/citybox-dev
```

Produção/staging (`auth.aplopes.com`):

```env
KEYCLOAK_ISSUER=https://auth.aplopes.com/realms/citybox-dev
```

Sync: `pnpm run keycloak:sync` (cria o realm se não existir e aplica clients, roles e usuários de seed).

### Client `citybox-core-admin`

Service account do **core-api** para sync de perfil e atribuição de roles no backoffice (`manage-users`, `view-clients`). Secret dev: `citybox-core-admin-dev-secret` — configurar em `services/platform-apps.env` como `KEYCLOAK_ADMIN_CLIENT_*`.

### Troca de senha (Meu perfil)

O `core-api` altera senha via **Account REST API** do Keycloak (`POST /account/credentials/password`), usando o JWT do próprio usuário. O client `citybox-backoffice` tem `directAccessGrantsEnabled: false` (sem ROPC).

**Multi-réplica (backoffice BFF):** o `erp-web` (backoffice) deduplica refresh tokens **in-process** por pod. Enquanto o deploy tiver **N réplicas Next.js sem sticky session**, não habilite `revokeRefreshToken` no client/realm — rotação agressiva invalida tokens entre pods. Ver [`apps/erp/web/docs/session-auth-debt.md`](../../apps/erp/web/docs/session-auth-debt.md).

### Usuários de teste (backoffice)

| Usuário | Senha | Uso |
|---------|-------|-----|
| `lojista` | `aplopes` | Operador com as 12 verticais — uma loja por vertical em Ilhéus |
| `admin` | `aplopes` | Admin plataforma com todas as verticais |

Após recriar o container, rode `KEYCLOAK_URL=https://auth.aplopes.com bash infra/keycloak/scripts/sync-realm.sh` — isso aplica clients, roles **e** permissões dos usuários `admin` / `lojista`. Se o token no browser não tiver `vertical.*.view`, limpe `citybox-backoffice-session` e faça login de novo.

Redirects do client `citybox-backoffice` (SSO compartilhado ERP / clínica / imóveis / beautiful): o `sync-realm.mjs` mescla `BACKOFFICE_ORIGIN`, `CLINICA_ORIGIN`, `IMOVEIS_ORIGIN` e `BEAUTIFUL_ORIGIN` (+ portas locais `:3111`/`:3115`). Sem isso o login em `imoveis.aplopes.com` falha com `Parâmetro inválido: redirect_uri`.

### E-mail (convites / reset de senha)

O Keycloak **não** lê `SMTP_*` do `food_api` nem do `core-api`. O remetente (`from`) fica no **realm** via Admin API.

O script `sync-realm.sh` carrega `services/platform-apps.env` e aplica `smtpServer` no realm `citybox-dev` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`).

Erro típico sem sync: `Invalid sender address 'null'` ao chamar `execute-actions-email` (convite de usuário no Food).

**Convite de usuário (Food API):** `execute-actions-email` usa `client_id=citybox-backoffice` e `redirect_uri` (`KEYCLOAK_INVITE_REDIRECT_URI`, padrão `https://backoffice.citybox.com/auth/sso`). Após definir a senha, o tema `info.ftl` redireciona para `/auth/sso` (OAuth com PKCE no backoffice). Nome e sobrenome ficam opcionais no Keycloak — completar em **Meu perfil** no ERP. O `sync-realm.sh` aplica user profile e `baseUrl` do client (`BACKOFFICE_ORIGIN`, padrão `https://backoffice.citybox.com`). Em produção, defina `KEYCLOAK_ADMIN_PASSWORD` (sem fallback).

```bash
KEYCLOAK_URL=https://auth.aplopes.com bash infra/keycloak/scripts/sync-realm.sh
```

## Volumes

- `citybox_keycloak_db_data` — Postgres interno do Keycloak (isolado do transacional B-01)

## Temas Citybox (`themes/citybox/`)

Seguem o guideline `@citybox/ui` (`STYLEGUIDE.md`) — tema **warm**, Instrument Sans + Fraunces, PT-BR.

| Tipo | Pasta | Uso |
|------|-------|-----|
| **login** | `login/` | Fluxo do cliente: login, reset/update senha, OAuth, erros |
| **account** | `account/` | Console “Minha conta” (`index.ftl` + logo + `citybox-account.css` com vars PF em hex; masthead dark do Keycloak é sobrescrito) |
| **admin** | `admin/` | Console admin do realm `master` |
| **email** | `email/` | Convites, reset de senha, verificação de e-mail |

Realm `citybox-dev`: `loginTheme`, `accountTheme` e `emailTheme` = `aplopes` (`import/citybox-dev-realm.json`).  
Realm `master`: `adminTheme` = `aplopes` (via `sync-realm.sh`).

E-mails usam `email/html/template.ftl` com card warm, CTA laranja e cópia em português.

**Mensagens:** `messages_pt.properties` e `messages.properties` (login + email) ficam espelhados — o fallback em inglês também é PT-BR porque `defaultLocale=pt`.

**Tokens CSS:** fonte canônica em `common/resources/css/citybox-tokens.css`; cada tema carrega via `styles=css/citybox-tokens.css …` (cópias em `login/`, `account/`, `admin/resources/css/`).

**FTLs (login + e-mail):** auto-escape HTML do Keycloak — variáveis dinâmicas **sem** `?html` (quebra o template com erro 500 / “Failed to template email”); URLs em JS no login usam `?js_string`.

**Segurança clients:** `webOrigins` sem `*` — apenas origens explícitas (produção + `localhost`/`127.0.0.1` para dev). O `sync-realm.mjs` descarta `*` se ainda aparecer no JSON.

Em dev (`start-dev`), alterações em `themes/` aparecem após refresh. Volume `./themes` já está no `docker-compose.yml`.

```bash
# Aplicar temas + SMTP no realm em execução
KEYCLOAK_URL=https://auth.citybox.com bash services/keycloak/scripts/sync-realm.sh

# Se o cache de tema atrapalhar em dev, reinicie o container
docker compose -f infra/keycloak/docker-compose.yml restart keycloak
```

## Customização

Edite `import/citybox-dev-realm.json` e recrie o container. Em produção use `start` (não `start-dev`) e TLS na borda Nginx.