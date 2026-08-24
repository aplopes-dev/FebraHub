# Deploy em produção — um realm Keycloak por sistema (ADR C-16/C-17)

> **Como usar este arquivo:** é o prompt/roteiro do deploy. Leia a seção 1 para
> entender o que mudou, execute a seção 5 na ordem e valide com a seção 6.
> **Nada aqui é opcional** — a refatoração troca a fundação de autenticação de
> todos os sistemas, e um passo pulado derruba login ou provisionamento.

---

## 1. O que mudou, em uma frase

Antes: **um realm** (`citybox-dev`) com **um client compartilhado**
(`citybox-backoffice`) para todos os sistemas.
Agora: **um realm por sistema**, cada um com clients, secrets e service account
próprios.

### 1.1 Por que mudou (os dois defeitos que o cliente sentiu)

| Defeito | Causa raiz | Como o realm resolve |
|---|---|---|
| Criar usuário com o mesmo e-mail em duas verticais falhava | e-mail é único **por realm**; um realm só = um espaço de e-mails para todo o ecossistema | Cada sistema tem seu espaço de e-mails — `ana@x.com` pode existir na Clínica e no Comércio como identidades distintas |
| Logar no ADMIN logava automaticamente no ERP | sessão SSO é **por realm**; mesmo realm = mesma sessão | Sessões independentes: entrar no Admin não dá acesso ao ERP |

Um *client* por sistema **não** resolveria nenhum dos dois — client isola
aplicação (redirect URI, secret, roles), não identidade nem sessão.

### 1.2 Os seis realms

| Realm | Sistema | App(s) |
|---|---|---|
| `citybox-admin` | Admin da Plataforma | admin-web (:3108) + admin-api (:3103) |
| `citybox-erp` | Comércio (food + varejo) | erp-web (:3107) + erp-api (:3114) + PDV |
| `citybox-clinica` | Clínica | clinica-web (:3113) + clinica-api (:3172) |
| `citybox-beautiful` | Beautiful | beautiful-web (:3115) + beautiful-api (:3173) |
| `citybox-imoveis` | Imóveis | imoveis-web (:3111) + imoveis-api (:3112) |
| `citybox-marketplace` | Marketplace (consumidor) | app + marketplace-bff (:3102) |

### 1.3 Clients por realm

Cada realm de sistema tem:

- **`<sistema>-web`** — client confidencial do frontend (login do usuário).
  Exceção: `marketplace-app` é **público + PKCE** (app do consumidor) e mantém
  `directAccessGrantsEnabled: true` (o BFF usa Direct Access Grant — ADR C-07).
- **`<sistema>-provisioning`** — service account com `manage-users`
  **restrito ao próprio realm**. É quem a API usa para criar/atualizar usuários.
- **`admin-m2m`** — só nas verticais (erp, clinica, beautiful, imoveis).
  Service account que o **admin-api** usa para chamar a API da vertical.
  Tem apenas a role `platform.admin`; **não** tem `manage-users`.
- **`fiscal-m2m`** — só no `citybox-erp`. Usado pela erp-api para falar com a
  fiscal-api. Role `fiscal_operator`.

### 1.4 Outras mudanças que afetam o deploy

1. **`@citybox/nest-common` foi removido.** O `KeycloakProvisioningService` virou
   cópia local em cada API (`src/shared/infra/keycloak/`). Nada muda em env —
   citado porque some do `pnpm-lock`/build.

2. **fiscal-api saiu da borda.** Não tem realm (não tem usuários) e **não é mais
   chamada pelo browser**. O `erp-web` perdeu o proxy `/api/proxy/fiscal`; quem
   chama é a **erp-api** via M2M (`fiscal-m2m`). A fiscal-api autoriza por `azp`
   contra uma allowlist e **nega token sem `azp`**.

3. **Validação de token endureceu.** Os `AuthGuard` agora exigem:
   - `issuer` **único e obrigatório** (acabou a lista de fallback com
     `auth.citybox.com` e `127.0.0.1:8080` hardcoded)
   - `azp` na allowlist `KEYCLOAK_ALLOWED_AZP`
   → **`.env` desatualizado não degrada: derruba.** A API lança no boot ou
   responde 401/503.

4. **Tema de login novo** (`infra/keycloak/theme`, movido de `apps/`):
   white-label MUI, layout por vertical, título da aba por sistema. Todos os
   realms usam `loginTheme: "citybox"` — **um tema só**, a identidade é derivada
   do nome do realm em runtime.

5. **`--import-realm` foi removido** dos composes (base e prod). Ver §3.

---

## 2. Ordem de dependência (por que a sequência importa)

```
Keycloak no ar (sem realms)
   └─> pnpm keycloak:sync ............ cria os 6 realms + clients + secrets
          └─> secrets em mãos ........ cada app precisa da secret do SEU client
                 └─> .env dos apps ... issuer/realm/client/azp/provisioning
                        └─> migrations Prisma
                               └─> subir as APIs
                                      └─> subir os webs
```

O sync **falha alto** (não silencioso) se faltar uma secret fora de localhost —
isso é intencional e serve de checklist.

---

## 3. ⚠️ Armadilha: `--import-realm` mata o boot

Os JSONs em `infra/keycloak/import/` carregam campos que **só o
`sync-realm.mjs` entende**: `secretEnv`, `serviceAccountRealmRoles`,
`serviceAccountClientRoles`. O importador nativo do Keycloak **recusa campo
desconhecido e aborta o boot** com `Unrecognized field`, deixando o container em
loop de restart.

- `infra/keycloak/docker-compose.yml` → `command: start-dev` (sem import) ✅
- `infra/keycloak/docker-compose.prod.yml` → **corrigido nesta entrega** de
  `start --import-realm` para `start` ✅

Se o servidor de produção tiver um override local com `--import-realm`, **remova
antes de subir**. O caminho único de configuração é `pnpm keycloak:sync`.

---

## 4. Variáveis de ambiente

### 4.1 Convenção

Em produção troque `http://127.0.0.1:8080` pelo issuer público
(ex.: `https://auth.aplopes.com`). O **issuer gravado no token** precisa bater
exatamente com o `KEYCLOAK_ISSUER` das APIs — inclusive protocolo e ausência de
barra final.

> **Issuer interno vs público:** `clinica-web` e `beautiful-web` aceitam
> `KEYCLOAK_INTERNAL_ISSUER` para chamadas server-side dentro da rede Docker
> (ex.: `http://aplopes_keycloak:8080/realms/...`), enquanto
> `NEXT_PUBLIC_KEYCLOAK_ISSUER` é o público do browser. Se usar, o **token
> continua sendo emitido com o issuer público** — as APIs validam o público.

### 4.2 Secrets do Keycloak (ambiente de onde você roda o sync)

Arquivo `infra/keycloak/.env` (ou exportadas na shell). **Todas obrigatórias em
produção** — sem elas o sync aborta:

```bash
KEYCLOAK_URL=https://auth.aplopes.com
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=<senha do admin do master>

# Secrets dos clients (gere valores fortes e únicos — 32+ chars aleatórios)
KEYCLOAK_ADMIN_WEB_SECRET=
KEYCLOAK_ADMIN_PROVISIONING_SECRET=

KEYCLOAK_ERP_WEB_SECRET=
KEYCLOAK_ERP_PROVISIONING_SECRET=
KEYCLOAK_ERP_M2M_CLIENT_SECRET=
KEYCLOAK_FISCAL_M2M_CLIENT_SECRET=

KEYCLOAK_CLINICA_WEB_SECRET=
KEYCLOAK_CLINICA_PROVISIONING_SECRET=
KEYCLOAK_CLINICA_M2M_CLIENT_SECRET=

KEYCLOAK_BEAUTIFUL_WEB_SECRET=
KEYCLOAK_BEAUTIFUL_PROVISIONING_SECRET=
KEYCLOAK_BEAUTIFUL_M2M_CLIENT_SECRET=

KEYCLOAK_IMOVEIS_WEB_SECRET=
KEYCLOAK_IMOVEIS_PROVISIONING_SECRET=
KEYCLOAK_IMOVEIS_M2M_CLIENT_SECRET=

KEYCLOAK_MARKETPLACE_PROVISIONING_SECRET=

# SMTP (opcional; sem SMTP_HOST + SMTP_FROM o sync não configura e-mail)
SMTP_HOST= ; SMTP_PORT=587 ; SMTP_USER= ; SMTP_PASS= ; SMTP_FROM= ; SMTP_FROM_NAME=
```

`marketplace-app` é público — não tem secret.

### 4.3 admin-api

```bash
# Realm próprio
KEYCLOAK_BASE_URL=https://auth.aplopes.com
KEYCLOAK_REALM=citybox-admin
KEYCLOAK_ISSUER=https://auth.aplopes.com/realms/citybox-admin
KEYCLOAK_CLIENT_ID=admin-web
KEYCLOAK_CLIENT_SECRET=<KEYCLOAK_ADMIN_WEB_SECRET>
KEYCLOAK_ALLOWED_AZP=admin-web

# RENOMEADAS: eram KEYCLOAK_ADMIN_CLIENT_ID / _SECRET
KEYCLOAK_PROVISIONING_CLIENT_ID=admin-provisioning
KEYCLOAK_PROVISIONING_CLIENT_SECRET=<KEYCLOAK_ADMIN_PROVISIONING_SECRET>

# NOVAS — M2M por vertical (o admin chama a API de cada sistema)
KEYCLOAK_ERP_M2M_ISSUER=https://auth.aplopes.com/realms/citybox-erp
KEYCLOAK_ERP_M2M_CLIENT_ID=admin-m2m
KEYCLOAK_ERP_M2M_CLIENT_SECRET=<KEYCLOAK_ERP_M2M_CLIENT_SECRET>

KEYCLOAK_CLINICA_M2M_ISSUER=https://auth.aplopes.com/realms/citybox-clinica
KEYCLOAK_CLINICA_M2M_CLIENT_ID=admin-m2m
KEYCLOAK_CLINICA_M2M_CLIENT_SECRET=<KEYCLOAK_CLINICA_M2M_CLIENT_SECRET>

KEYCLOAK_BEAUTIFUL_M2M_ISSUER=https://auth.aplopes.com/realms/citybox-beautiful
KEYCLOAK_BEAUTIFUL_M2M_CLIENT_ID=admin-m2m
KEYCLOAK_BEAUTIFUL_M2M_CLIENT_SECRET=<KEYCLOAK_BEAUTIFUL_M2M_CLIENT_SECRET>

KEYCLOAK_IMOVEIS_M2M_ISSUER=https://auth.aplopes.com/realms/citybox-imoveis
KEYCLOAK_IMOVEIS_M2M_CLIENT_ID=admin-m2m
KEYCLOAK_IMOVEIS_M2M_CLIENT_SECRET=<KEYCLOAK_IMOVEIS_M2M_CLIENT_SECRET>
```

> Sem os blocos M2M, criar loja no admin **não provisiona** o responsável na
> vertical (a loja fica presa em `PROVISIONING`).

### 4.4 erp-api

```bash
KEYCLOAK_BASE_URL=https://auth.aplopes.com
KEYCLOAK_REALM=citybox-erp
KEYCLOAK_ISSUER=https://auth.aplopes.com/realms/citybox-erp
KEYCLOAK_CLIENT_ID=erp-web
KEYCLOAK_CLIENT_SECRET=<KEYCLOAK_ERP_WEB_SECRET>
KEYCLOAK_ALLOWED_AZP=erp-web,admin-m2m      # ← o admin chama esta API
KEYCLOAK_PROVISIONING_CLIENT_ID=erp-provisioning
KEYCLOAK_PROVISIONING_CLIENT_SECRET=<KEYCLOAK_ERP_PROVISIONING_SECRET>

# NOVO — a erp-api passou a ser quem fala com a fiscal-api
FISCAL_API_URL=https://<host-interno-da-fiscal-api>
KEYCLOAK_FISCAL_M2M_CLIENT_ID=fiscal-m2m
KEYCLOAK_FISCAL_M2M_CLIENT_SECRET=<KEYCLOAK_FISCAL_M2M_CLIENT_SECRET>
```

### 4.5 clinica-api / beautiful-api / imoveis-api

Mesmo shape, trocando o nome do sistema:

```bash
KEYCLOAK_BASE_URL=https://auth.aplopes.com
KEYCLOAK_REALM=citybox-<sistema>
KEYCLOAK_ISSUER=https://auth.aplopes.com/realms/citybox-<sistema>
KEYCLOAK_CLIENT_ID=<sistema>-web
KEYCLOAK_CLIENT_SECRET=<KEYCLOAK_<SISTEMA>_WEB_SECRET>
KEYCLOAK_ALLOWED_AZP=<sistema>-web,admin-m2m
KEYCLOAK_PROVISIONING_CLIENT_ID=<sistema>-provisioning
KEYCLOAK_PROVISIONING_CLIENT_SECRET=<KEYCLOAK_<SISTEMA>_PROVISIONING_SECRET>
```

> **clinica-api:** confira também `RABBITMQ_URL` — sem ela o consumidor de
> `citybox.store.*` sobe sem consumir e a loja nunca é provisionada (foi
> exatamente o erro visto em dev).

### 4.6 fiscal-api

Não tem realm. Autoriza por issuer + `azp`:

```bash
KEYCLOAK_ALLOWED_ISSUERS=https://auth.aplopes.com/realms/citybox-erp
KEYCLOAK_ALLOWED_AZP=fiscal-m2m
```

> Um JWKS por issuer. Para liberar outro sistema no futuro, some o issuer à
> lista **e** o client M2M ao `KEYCLOAK_ALLOWED_AZP` — token sem `azp` é negado.

### 4.7 Frontends (Next.js)

⚠️ **`NEXT_PUBLIC_*` é embutido no build.** Trocar a env sem **rebuildar** a
imagem não tem efeito.

```bash
# admin-web
NEXT_PUBLIC_KEYCLOAK_ISSUER=https://auth.aplopes.com/realms/citybox-admin
NEXT_PUBLIC_KEYCLOAK_CLIENT=admin-web
KEYCLOAK_ADMIN_WEB_SECRET=<KEYCLOAK_ADMIN_WEB_SECRET>

# erp-web
NEXT_PUBLIC_KEYCLOAK_ISSUER=https://auth.aplopes.com/realms/citybox-erp
NEXT_PUBLIC_KEYCLOAK_CLIENT=erp-web
KEYCLOAK_CLIENT_SECRET=<KEYCLOAK_ERP_WEB_SECRET>

# clinica-web / beautiful-web (+ KEYCLOAK_INTERNAL_ISSUER opcional)
NEXT_PUBLIC_KEYCLOAK_ISSUER=https://auth.aplopes.com/realms/citybox-<sistema>
NEXT_PUBLIC_KEYCLOAK_CLIENT=<sistema>-web
KEYCLOAK_CLIENT_SECRET=<secret do client web>
```

### 4.8 marketplace-bff

```bash
KEYCLOAK_BASE_URL=https://auth.aplopes.com
KEYCLOAK_REALM=citybox-marketplace
KEYCLOAK_ISSUER=https://auth.aplopes.com/realms/citybox-marketplace
KEYCLOAK_CLIENT_ID=marketplace-app          # público, sem secret
KEYCLOAK_PROVISIONING_CLIENT_ID=marketplace-provisioning
KEYCLOAK_PROVISIONING_CLIENT_SECRET=<KEYCLOAK_MARKETPLACE_PROVISIONING_SECRET>
```

### 4.9 Envs que deixaram de existir

Remova dos `.env` de produção (hoje não fazem nada; deixá-las confunde o
próximo deploy):

| Removida | Substituta |
|---|---|
| `KEYCLOAK_ADMIN_CLIENT_ID` / `_SECRET` | `KEYCLOAK_PROVISIONING_CLIENT_ID` / `_SECRET` |
| `KEYCLOAK_BACKOFFICE_SECRET` | secret do `<sistema>-web` de cada realm |
| qualquer issuer apontando para `realms/citybox-dev` | `realms/citybox-<sistema>` |

---

## 5. Roteiro do deploy

### Passo 0 — antes de tocar em produção

- [ ] **Backup do banco do Keycloak** (`aplopes_keycloak_db_data`) e dos bancos
      de aplicação. O realm `citybox-dev` **não é apagado** por este deploy, mas
      backup é a rede de segurança se precisar voltar.
- [ ] Gerar as ~16 secrets (§4.2) e guardar no cofre.
- [ ] Confirmar que nenhum override de compose usa `--import-realm` (§3).

### Passo 1 — redirect URIs dos domínios reais

Os JSONs em `infra/keycloak/import/` listam `*.citybox.com` e alguns
`*.aplopes.com`. **Wildcard é proibido** (invariante 3 do ADR C-16), então cada
host real precisa estar listado explicitamente. Lacunas conhecidas:

| Realm | Já cobre | Falta se o domínio for usado |
|---|---|---|
| `citybox-beautiful` | `beautiful.citybox.com` | `beautiful.aplopes.com` |
| `citybox-marketplace` | `app.citybox.com` | domínio real do app |

Edite o JSON do realm **antes** do sync — ele é a fonte de verdade.

### Passo 2 — Keycloak no ar

```bash
docker compose -f infra/keycloak/docker-compose.yml -f infra/keycloak/docker-compose.prod.yml up -d keycloak
```

Aguarde `healthy` (o healthcheck bate em `/realms/master`).

### Passo 3 — criar os realms

```bash
pnpm keycloak:sync
```

Com `KEYCLOAK_URL` apontando para produção e as secrets de §4.2 no ambiente.
O script é **idempotente** e **aditivo**: aplica realms, clients, service
accounts, roles, user profile e SMTP. Rodar de novo é seguro.

> **Aditivo:** role/client removido do JSON **não** é apagado do servidor —
> exclua à mão pela Admin API se precisar.

Para sincronizar só um realm: `KEYCLOAK_REALMS=citybox-erp pnpm keycloak:sync`.

**Política de senha do `citybox-admin`:** 14 caracteres + TOTP obrigatório. O
script só relaxa isso quando `KEYCLOAK_URL` é localhost — **em produção a
política vale**, então a senha do primeiro admin precisa atendê-la.

### Passo 4 — tema de login

O tema é compilado **dentro da imagem** do Keycloak
(`infra/keycloak/Dockerfile`, multi-stage com Maven):

```bash
pnpm keycloak-theme:build
```

Isso rebuilda a imagem e reinicia o container. Em produção, ajuste o comando
para usar o overlay de prod, ou publique a imagem no registry e faça pull.

### Passo 5 — migrations

Os apps acumularam migrations. Aplique **antes** de subir as APIs:

```bash
pnpm --filter @citybox/admin-api      db:migrate:deploy   # 26 migrations
pnpm --filter @citybox/erp-api        db:migrate:deploy   # 44
pnpm --filter @citybox/clinica-api    db:migrate:deploy   # 44
pnpm --filter @citybox/beautiful-api  db:migrate:deploy   # 17
pnpm --filter @citybox/imoveis-api    db:migrate:deploy   # 26
```

> Contagens são do total de migrations no repo, não do que falta em produção —
> rode `db:migrate:status` antes para ver o delta real.

### Passo 6 — `.env` e subida

1. Aplicar §4.3–§4.8 em cada serviço.
2. **Rebuildar os frontends** (`NEXT_PUBLIC_*` é build-time).
3. Subir APIs, depois webs.

### Passo 7 — primeiro usuário admin

O realm `citybox-admin` nasce sem usuários. Crie o admin pelo console do
Keycloak (realm `citybox-admin` → Users), respeitando a política de senha.
Se o usuário for criado com required action pendente (ex.: `CONFIGURE_TOTP`) e
você não for configurar TOTP agora, limpe as required actions dele — senão o
login retorna *"Account is not fully set up"*.

---

## 6. Validação pós-deploy

Os dois defeitos originais, mais os invariantes de segurança:

```bash
# 1. Cada realm responde e serve o tema novo
for r in admin erp clinica beautiful imoveis marketplace; do
  echo -n "citybox-$r: "
  curl -s "https://auth.aplopes.com/realms/citybox-$r/.well-known/openid-configuration" \
    | grep -o '"issuer":"[^"]*"' || echo FALHOU
done

# 2. D1 — mesmo e-mail em dois realms (deve dar 201 nos dois, subs diferentes)
#    Testar via Admin API com o token do <sistema>-provisioning de cada realm.

# 3. Invariante 2 — provisioning de um realm NÃO alcança outro
#    Token de erp-provisioning tentando criar usuário em citybox-clinica → 403
```

Checklist manual:

- [ ] Login funciona nos 6 sistemas, cada um com **seu layout** e o título da
      aba `Citybox — <vertical>`
- [ ] **D2:** logar no Admin e abrir o ERP → o ERP **pede login** (sessões
      independentes)
- [ ] **D1:** criar usuário com o mesmo e-mail em duas verticais → funciona
- [ ] Criar loja no admin → vertical provisiona organização + responsável
      (não fica em `PROVISIONING`)
- [ ] Emissão fiscal pelo ERP funciona (agora passando pela erp-api, não pelo
      browser)
- [ ] Tela de "já sei quem você é" mostra o e-mail + "Entrar com outra conta"

---

## 7. Rollback

O realm antigo `citybox-dev` **continua intacto** — este deploy não o apaga.
Para voltar: reverter os `.env` dos apps para o issuer/client antigos
(`realms/citybox-dev`, `citybox-backoffice`) e fazer deploy da imagem anterior
dos apps. O tema novo permanece instalado, mas o realm `citybox-dev` aponta para
`citybox-admin` (`loginTheme` legado) — sem impacto funcional.

**Ponto sem retorno:** as migrations Prisma. Rollback de banco exige o backup do
Passo 0.

---

## 8. Referências

| O quê | Onde |
|---|---|
| Decisão de realm por sistema, invariantes e evidências | `packages/docs/platform/ADR-C-16-realm-por-sistema.md` |
| Padrão de auth/tenancy copiado em cada app | `packages/docs/platform/ADR-C-17-padrao-auth-tenancy.md` |
| Fonte de verdade dos realms | `infra/keycloak/import/*-realm.json` |
| Script de sync (único escritor da config) | `infra/keycloak/scripts/sync-realm.mjs` |
| Tema de login | `infra/keycloak/theme/AGENTS.md` |
| Plano da refatoração (fases e resultados) | `.claude/plans/_platform/2026-08-13-keycloak-realm-por-sistema.md` |
