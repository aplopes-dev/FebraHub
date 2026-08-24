# Plano — Um realm Keycloak por sistema

**Data:** 2026-08-13
**Escopo:** plataforma (todos os apps)
**Pré-condição aceita pelo usuário:** todos os usuários do `citybox-dev` são de teste. **Banco e realm podem ser resetados.** Não há migração de dados.

---

## 1. Problema

Hoje existe **um realm** (`citybox-dev`) com 4 clients, e o client `citybox-backoffice` é
compartilhado por ERP, clínica, imóveis e beautiful — mesmo secret, mesmas redirect URIs,
mesmas client roles.

Três defeitos estruturais decorrem disso:

| # | Defeito | Mecanismo |
|---|---|---|
| D1 | Mesmo e-mail em dois sistemas quebra o cadastro | `duplicateEmailsAllowed: false` — e-mail é chave única **do realm**. Criar usuário na vertical B para alguém que já existe pela vertical A devolve 409, e cada app trata diferente. |
| D2 | Login no ADMIN entra automaticamente no ERP | Cookie `KEYCLOAK_IDENTITY` é **por realm**. Clients separados compartilham sessão por design. |
| D3 | Qualquer API pode reescrever usuário de qualquer sistema | Service account único `citybox-core-admin` (realm role `platform_admin`, `manage-users` no realm) está no `.env` de 6 APIs. Todas podem `PUT /users/{id}`, `reset-password` e `logout` em qualquer usuário. |

Nenhum dos três se resolve com client separado — client isola aplicação (redirect URI,
secret, audience), não identidade nem sessão. **Realm é a fronteira correta.**

Arquitetura real do produto (confirmada no código): cada sistema tem schema Postgres
próprio com identidade local completa — `erp.users` + `Membership`, `beautiful.members` +
`StoreMember`, `clinica.*`, `imoveis.*`. O admin gerencia **clientes do Citybox**
(organizações, planos, assinaturas, faturas) e provisiona via evento
`citybox.store.created.v1`. São SaaS independentes com um painel de fornecedor — não um
ecossistema de identidade única.

## 2. Alvo

### 2.1 Matriz de realms

Um Keycloak (26.6), seis realms:

| Realm | Client web | Service account próprio | SA para o admin chamar |
|---|---|---|---|
| `citybox-admin` | `admin-web` (confidencial) | — | — |
| `citybox-erp` | `erp-web` (confidencial) | `erp-provisioning` | `admin-m2m` |
| `citybox-clinica` | `clinica-web` (confidencial) | `clinica-provisioning` | `admin-m2m` |
| `citybox-beautiful` | `beautiful-web` (confidencial) | `beautiful-provisioning` | `admin-m2m` |
| `citybox-imoveis` | `imoveis-web` (confidencial) | `imoveis-provisioning` | `admin-m2m` |
| `citybox-marketplace` | `marketplace-app` (público + PKCE) | `marketplace-provisioning` | — |

- **`<sistema>-provisioning`** — usada pela própria API para criar seus membros.
  `manage-users` **apenas do seu realm**. Substitui o `citybox-core-admin` global.
- **`admin-m2m`** — vive **dentro do realm da vertical**; a credencial fica no `admin-api`.
  É como o admin autentica as chamadas M2M `admin-api → vertical-api`. A vertical valida
  `azp=admin-m2m` para reconhecer o chamador.
- **Role `platform.admin`** — deixa de ser role global cruzando sistemas e passa a ser
  **role local de cada realm**, atribuída **exclusivamente** ao service account `admin-m2m`
  daquele realm. É assim que o padrão do ERP (`@RequirePermission('platform.admin')` +
  `PermissionGuard`) continua funcionando sem nenhuma mudança de código.
- Redirect URIs: **lista explícita**, uma por domínio/porta. Proibido `http://localhost:*`.

### 2.2 O que desaparece

- Realm `citybox-dev` e clients `citybox-backoffice`, `citybox-app`, `citybox-core-admin`
- Client roles `vertical.comercio.view`, `vertical.clinic.view`, `vertical.imoveis.view`,
  `vertical.beautiful.view` — sem sentido quando cada sistema tem realm próprio.
  Consequência: `KeycloakProvisioningService.provisionMember()` perde os parâmetros
  `verticalRole` e `realmRole`, e a porta `IdentityProvider` do ERP perde
  `ensureComercioBackofficeAccess()` — **estar no realm já é o gate de acesso**.
- Realm role global `platform_admin` (e as variantes `platform_admin_client` /
  `platform.admin` aceitas em `apps/verticals/beautiful/api/src/shared/infra/http/auth/platform-admin.ts`)
  como chave cruzada entre sistemas

### 2.3 Contrato de env (idêntico em todo sistema)

```bash
KEYCLOAK_BASE_URL=http://127.0.0.1:8080
KEYCLOAK_REALM=citybox-<sistema>
KEYCLOAK_ISSUER=${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}
KEYCLOAK_CLIENT_ID=<sistema>-web
KEYCLOAK_CLIENT_SECRET=<secret>
KEYCLOAK_ALLOWED_AZP=<sistema>-web,admin-m2m
KEYCLOAK_PROVISIONING_CLIENT_ID=<sistema>-provisioning
KEYCLOAK_PROVISIONING_CLIENT_SECRET=<secret>
```

Secrets de dev em Keycloak local: `<clientId>-dev-secret` (ex.: `erp-web-dev-secret`).
Fora de localhost, cada client confidencial declara o nome do env em `secretEnv`, no seu
JSON de realm.

Web (Next.js) adiciona `NEXT_PUBLIC_KEYCLOAK_ISSUER` e `NEXT_PUBLIC_KEYCLOAK_CLIENT`.

No `admin-api`, uma credencial M2M por vertical:

```bash
KEYCLOAK_ERP_M2M_ISSUER / _CLIENT_ID / _CLIENT_SECRET
KEYCLOAK_CLINICA_M2M_...
KEYCLOAK_BEAUTIFUL_M2M_...
KEYCLOAK_IMOVEIS_M2M_...
```

### 2.4 Invariantes de segurança (critério de aceite global)

1. Todo `AuthGuard` valida **`issuer` único** (sem lista de fallback) **e `azp`**.
   ⚠️ **Corrigido na execução da F0:** era "`aud`/`azp`". Token real de `admin-m2m` no
   realm `citybox-erp` traz `aud: account` — o Keycloak só põe o client em `aud` com
   *audience mapper*. `azp` carrega sempre o `client_id`. Validar `aud` sem mapper
   rejeitaria todo token válido. Ver ADR C-17, bloco 1.
2. Nenhum serviço tem credencial com `manage-users` fora do seu próprio realm.
3. Nenhuma redirect URI com wildcard de host ou porta.
4. Cada secret de client pertence a **um** app.

### 2.5 Padrão canônico de tenancy e provisionamento — o ERP é a referência

Decisão do usuário: **beautiful e imóveis devem seguir o mesmo padrão do ERP**, tanto no
realm próprio quanto no provisionamento de organização + owner.

O padrão do ERP, extraído de `apps/erp/api/src/modules/tenancy/`:

| Elemento | Arquivo de referência no ERP |
|---|---|
| **Porta de identidade** no domínio | `domain/providers/identity-provider.interface.ts` |
| **Adapter** Keycloak na infra | `infrastructure/keycloak/keycloak-identity.adapter.ts` |
| **Fake** para teste sem Keycloak | `tests/fake-identity.provider.ts` |
| Provisionamento **síncrono** (M2M, devolve senha) | `application/use-cases/provision-platform-store/` |
| Provisionamento **assíncrono** (evento, sem senha) | `infrastructure/messaging/consumers/store-platform.consumer.ts` |
| Sync de organização a partir do evento | `application/use-cases/sync-organization-from-store/` |
| Dedupe de evento (at-least-once) | `infrastructure/messaging/event-dedupe.service.ts` |
| Rota M2M protegida | `infrastructure/http/routes/provision-platform-store/provision-platform-store.route.ts` — `@SkipTenant()` + `@RequirePermission('platform.admin')` |
| Autorização | `shared/infra/http/guards/permission.guard.ts` + `PermissionProfile` no schema |

**A regra que define o padrão:** o domínio conhece a porta `IdentityProvider`, e **nunca**
o Keycloak. Comentário na própria interface: *"O domínio só conhece 'criar uma identidade e
dar a ela uma senha de primeiro acesso' — nada de realms, roles ou tokens."*

**Onde beautiful e imóveis divergem hoje** (é o que a F1 corrige):

| Divergência | Beautiful | Imóveis |
|---|---|---|
| Injeta `KeycloakProvisioningService` de `@citybox/nest-common` **direto no use case**, sem porta de domínio | `store-setup/application/use-cases/ensure-platform-store-owner/` | idem, via wrapper `settings/application/policies/run-keycloak.ts` |
| Passa `verticalRole` + `realmRole` globais ao provisionar | `vertical.beautiful.view` + `store_staff` | `vertical.imoveis.view` + `store_staff` |
| Guard de plataforma fora do padrão | `platform-admin.guard.ts` + `auth/platform-admin.ts` (`isPlatformAdmin` aceita 4 roles diferentes) | — |
| Tenancy espalhada em vez de um módulo | `store-setup` + `members` | `store-setup` + `settings` (sem `Organization`; usa `storeId` como raiz) |

**Alvo pós-refatoração** (idêntico nas três verticais):

```
modules/tenancy/                        ← módulo único, como no ERP
  domain/providers/identity-provider.interface.ts
  infrastructure/keycloak/keycloak-identity.adapter.ts
  application/use-cases/provision-platform-store/    ← síncrono, devolve senha
  application/use-cases/sync-organization-from-store/
  infrastructure/messaging/consumers/store-platform.consumer.ts
  infrastructure/messaging/event-dedupe.service.ts
  tests/fake-identity.provider.ts
```

Com a rota M2M protegida por `@RequirePermission('platform.admin')` — resolvida pela role
local do realm atribuída ao `admin-m2m` (§2.1). O `PlatformAdminGuard` do beautiful e o
`isPlatformAdmin` multi-role **são deletados**.

---

## 3. Execução paralela

```
F0 fundação      F1 (seis agentes)                              F2      F3     F4     F5
(1 agente)   ──▶ ┌─ T1.B erp ──────────────┐ (termina 1º)  ──▶ M2M ──▶ esp. ──▶ gate ──▶ docs
                 ├─ T1.A admin ────────────┤
                 ├─ T1.C clinica ──────────┤
                 ├─ T1.F marketplace ──────┤
                 ├─ T1.D beautiful ════════╡ ⚠ refactor + realm
                 └─ T1.E imoveis ══════════╛ ⚠ refactor + realm + investigação
```

**Isolamento:** cada agente da F1 roda em **worktree própria**
(`Agent` com `isolation: "worktree"`). Os seis conjuntos de arquivos são disjuntos.

**Sem pacote compartilhado — decisão explícita do usuário.** Não haverá
`@citybox/authentication`, e `@citybox/nest-common` é **removido**. Cada sistema mantém a
sua própria cópia do código de autenticação e provisionamento, dentro do seu app.
Consolidar em pacote fica para depois, quando o padrão tiver assentado e der para ver com
calma o que merece ser extraído.

Consequência que o plano precisa absorver: **a consistência deixa de ser garantida pelo
compilador e passa a ser garantida por documento + revisão.** É por isso que a T0.2
(§F0) deixa de ser opcional e vira o artefato mais importante da fundação, e a F4 ganha
uma verificação cruzada entre os seis apps (T4.5).

**Caminho crítico: T1.D e T1.E.** Depois da decisão de alinhar beautiful e imóveis ao
padrão do ERP, essas duas deixaram de ser "trocar env" e viraram refactor arquitetural.
Estimativa relativa: T1.B ≈ 1×, T1.A/C/F ≈ 1,5×, T1.D ≈ 3×, T1.E ≈ 4×. Lançar D e E
**primeiro**, no mesmo disparo das outras — elas é que definem o fim da F1.

**Dependência interna da F1:** T1.B (erp) é a referência viva do padrão. Mitigação para
não serializar: a T0.2 publica os moldes de código **antes** da F1 começar, então os seis
agentes copiam do documento sem esperar o ERP.

**Regra anti-conflito:** nenhum agente da F1 altera `packages/` nem `pnpm-lock.yaml`. Se
precisar de dependência nova, **para e reporta**. A remoção de `@citybox/nest-common` do
workspace acontece na F4, depois que os três apps que o usam já tiverem internalizado o
código.

**Regra de escopo:** T1.D e T1.E têm limite explícito escrito na tarefa. Agente que
encontrar motivo para expandir (migration nova, virar `PermissionProfile`, mexer em outro
módulo) **para e reporta** — não decide sozinho.

**Regra de merge:** F1 só integra depois que os seis agentes terminarem e o gate da F4
passar. Não fazer merge parcial — o realm antigo some de uma vez.

---

## F0 — Fundação (bloqueia tudo)

**Um agente (`architect`), duas tarefas em sequência: T0.1 → T0.2.**

Sem pacote compartilhado, a F0 não produz código de aplicação — produz a **configuração
dos realms** e o **documento canônico** de onde os seis agentes da F1 copiam. É uma fase
curta, e inteiramente documental+infra.

### T0.1 — ADR + realms como código ✅ CONCLUÍDA (2026-08-13)
**Agente:** `architect`
**Arquivos:**
- `packages/docs/platform/ADR-C-16-realm-por-sistema.md` (novo)
  ⚠️ **Desvio:** o plano dizia `gestao/docs/adrs/`, caminho que o `CLAUDE.md` referencia
  mas que **não existe** no repositório. A documentação de arquitetura real vive em
  `packages/docs/platform/`. O ADR registra o desvio.
- `infra/keycloak/import/citybox-admin-realm.json` (novo)
- `infra/keycloak/import/citybox-erp-realm.json` (novo)
- `infra/keycloak/import/citybox-clinica-realm.json` (novo)
- `infra/keycloak/import/citybox-beautiful-realm.json` (novo)
- `infra/keycloak/import/citybox-imoveis-realm.json` (novo)
- `infra/keycloak/import/citybox-marketplace-realm.json` (novo)
- `infra/keycloak/import/citybox-dev-realm.json` (remover ao final da F4)
- `infra/keycloak/scripts/sync-realm.mjs` + `sync-realm.sh` (adaptar para N realms)
- `infra/keycloak/docker-compose.yml` (import de múltiplos realms)

**Fazer:**
- ADR registrando a decisão, os três defeitos e a contrapartida aceita (mesmo humano em
  dois sistemas = duas contas; identity brokering fica como evolução futura)
- Um JSON por realm conforme a matriz §2.1, com redirect URIs explícitas
- Cada realm com seu próprio `passwordPolicy`; `citybox-admin` com **MFA obrigatório**
- Script de sync iterando o diretório de import em vez de um arquivo fixo

**Aceite:** `pnpm keycloak:sync` sobe os 6 realms; nenhuma redirect URI contém `*` no host
ou na porta.

⚠️ **Correção do aceite:** o texto original exigia que `citybox-dev` deixasse de ser
importado já na F0 — o que **contradiz** a §5 ("realms novos convivem com o antigo") e
quebraria todos os apps antes da F1 terminar. `citybox-dev` continua importado e
sincronizado **até a F4**, e o JSON foi marcado com `_deprecated`.

**Resultado da execução (2026-08-13, Keycloak local 26.6):**
- 7 realms sincronizados: os 6 novos + `citybox-dev` em convivência
- Invariante 3 ✓ nos 6 realms novos — nenhum wildcard de host/porta
- Invariante 2 ✓ — `manage-users` só do `<sistema>-provisioning` do próprio realm
- **D1 ✓** — `joao@teste.com` criado em `citybox-clinica` **e** `citybox-beautiful`,
  ambos HTTP 201, `sub` distinto e independente (usuários de teste removidos depois)
- **D3 ✓** — `admin-m2m` criando usuário → **403**; `erp-provisioning` acessando
  `citybox-clinica` → **403**; `erp-provisioning` no próprio realm → 200 (controle)
- `sync-realm.mjs` reescrito: itera o diretório de import e é genérico — a versão anterior
  tinha `if (client.clientId === 'citybox-backoffice')` hardcoded
- Secrets: cada client confidencial declara `secretEnv` no JSON; dev local cai em
  `<clientId>-dev-secret`, que preserva os valores atuais do `citybox-dev`
- `docker-compose.yml`: healthcheck de `/realms/citybox-dev` → `/realms/master`

### T0.2 — ADR de referência: o molde de autenticação e tenancy ✅ CONCLUÍDA (2026-08-13)
**Agente:** o mesmo da T0.1 (`architect`), após terminar o ADR de realms
**Arquivo:** `packages/docs/platform/ADR-C-17-padrao-auth-tenancy.md` (novo)

**Esta é a peça mais importante da fundação.** Sem pacote compartilhado, este documento é
a única coisa que impede os seis sistemas de divergirem. Ele não é resumo — é **molde de
código, pronto para copiar**, com a versão canônica de cada arquivo que vai existir
duplicado nos seis apps.

O documento contém, com o código completo:

**Bloco 1 — verificação de token** (`src/shared/infra/keycloak/keycloak-jwt.ts`)
```ts
// issuer ÚNICO vindo do env — SEM a lista de fallback que existe hoje nas 6 cópias
// (auth.citybox.com, auth.citybox.com:8080, 127.0.0.1:8080)
export function verifyKeycloakJwt(
  token: string,
  jwks: JWKSLike,
  opts: { issuer: string; audience: string | string[] },  // audience OBRIGATÓRIA
): Promise<JWTVerifyResult>;
```

**Bloco 2 — leitura de claims** (`src/shared/infra/http/auth/authenticated-user.ts`)
```ts
export type AuthenticatedUser = {
  sub: string; roles: string[]; username?: string; email?: string;
};
// clientId vem do env do próprio app — nada de 'citybox-backoffice' hardcoded
export function authenticatedUserFromJwtPayload(
  payload: JWTPayload, opts: { clientId: string },
): AuthenticatedUser;
```

**Bloco 3 — guard** (`src/shared/infra/http/guards/auth.guard.ts`)
Molde do `canActivate` validando issuer **e `azp`** (não `aud` — ver §2.4).

**Bloco 4 — porta de identidade** (`modules/tenancy/domain/providers/identity-provider.interface.ts`)
A interface do ERP **sem** `ensureComercioBackofficeAccess` (§2.2).

**Bloco 5 — serviço de provisionamento** (`src/shared/infra/keycloak/keycloak-provisioning.service.ts`)
Cópia de `packages/nest-common/src/keycloak/keycloak-provisioning.service.ts`, **sem**
`verticalRole` / `realmRole` em `provisionMember()`. **Preservar o tratamento de 409 por
e-mail** — está documentado no comentário da linha 188 do original e é o que evita o
defeito D1 voltar.

**Bloco 6 — web** (`src/lib/oauth-pkce.ts`, `auth-server.ts`, `auth.ts`)
`buildAuthorizeUrl` **sem default de `client_id`** — hoje
`apps/erp/web/src/lib/oauth-pkce.ts:80` tem `?? 'citybox-backoffice'`. Preservar
`isSafeLogoutUrl` (`apps/erp/web/src/lib/auth.ts:25`).

**Bloco 7 — árvore alvo do módulo `tenancy`** (§2.5) e a regra da rota M2M:
`@SkipTenant()` + `@RequirePermission('platform.admin')`.

**Bloco 8 — fora de escopo, explícito:** converter o modelo de permissões do beautiful
para `PermissionProfile`; introduzir `Organization` em imóveis sem a decisão da E1.

**Aceite:** os seis agentes da F1 conseguem implementar copiando deste documento, sem se
consultarem e sem esperar o T1.B (erp) terminar.

**Resultado da execução (2026-08-13):** os 8 blocos escritos com código completo.
Descoberta que mudou o invariante 1 (§2.4): **validar `azp`, não `aud`** — evidência do
token real está no bloco 1 do ADR. Novo env no contrato §2.3:
`KEYCLOAK_ALLOWED_AZP=<sistema>-web,admin-m2m`.

---

## F1 — Migração por sistema (6 agentes em paralelo)

> **Status em 2026-08-13** — 3 de 6 concluídos, 3 retomados após interrupção do processo.
>
> | Tarefa | Estado | Evidência |
> |---|---|---|
> | T1.B erp | ✅ concluída | env `citybox-erp`, `azp` validado, zero resíduo, **971 testes ✓** |
> | T1.A admin | ✅ concluída | env `citybox-admin`, `azp` validado, **259 testes ✓**; resíduos de `citybox-backoffice` são só comentários históricos |
> | T1.F marketplace | ✅ concluída | api 73 ✓ / bff 17 ✓; achou a regressão do `directAccessGrants` (§F0/T0.1) |
> | T1.C clinica | 🟡 retomada | API pronta (`azp` ✓, provisioning internalizado); faltava `web/.env*` |
> | T1.D beautiful | 🟡 retomada | D1 pronta (porta ✓, guard deletado ✓, provisioning ✓); faltava D2 inteira |
> | T1.E imoveis | 🟡 retomada | E2 pronta (porta ✓, provisioning ✓); faltava E3 e o retorno da E1 |
>
> Os seis apps passam `typecheck` — o trabalho parcial ficou consistente, só incompleto.
> **Execução sem worktree:** a F0 não estava commitada, e worktrees partem de `HEAD` —
> os agentes não veriam os ADRs, que é de onde copiam o código. Rodaram no working tree
> principal, com a regra "não tocar `packages/` nem `pnpm-lock.yaml`" garantindo o
> isolamento.

Todos dependem de **F0 completa**.

**Checklist comum a todo agente da F1:**
1. Trocar `.env.example` (e `.env.development`) para o contrato §2.3
2. API: **reescrever no lugar** `src/shared/infra/http/auth/authenticated-user.ts` e
   `src/shared/infra/keycloak/keycloak-jwt.ts` a partir dos blocos 1 e 2 da T0.2.
   Os arquivos continuam locais ao app — **não** há import de pacote compartilhado
3. API: `AuthGuard` conforme o bloco 3, **validando `aud`/`azp`**
4. API: provisionamento com a credencial `<sistema>-provisioning` — remover todo uso de
   `citybox-core-admin`
5. Web: reescrever `lib/auth*` e `lib/oauth-pkce.ts` conforme o bloco 6
6. Remover qualquer referência a `citybox-backoffice`, `citybox-admin`,
   `citybox-core-admin`, `citybox-app`, `platform_admin`, `vertical.*.view`
7. Ajustar `prisma/seed.ts` para o novo realm
8. Atualizar `.spec.ts` correspondentes
9. **Atualizar o `AGENTS.md` do módulo** (política obrigatória do CLAUDE.md)

**Item extra para clinica (T1.C), beautiful (T1.D) e imoveis (T1.E)** — são os três apps
que hoje importam `@citybox/nest-common`:

10. **Internalizar** o `KeycloakProvisioningService`: copiar para
    `src/shared/infra/keycloak/keycloak-provisioning.service.ts` do próprio app, a partir
    do bloco 5 da T0.2. Remover `@citybox/nest-common` do `package.json` do app e trocar
    todos os imports. São 25 arquivos no total (10 em imóveis, 7 em beautiful, 8 em
    clínica) — listados nas tarefas.
11. Copiar também o fake de teste correspondente, já que os `.spec.ts` desses apps
    mockam o serviço.

**Duplicação é intencional.** O agente **não** deve criar pacote, helper compartilhado ou
symlink para "evitar repetição". A consolidação será avaliada depois, com o padrão já
assentado. Agente que propuser extrair pacote **para e reporta**.

### T1.A — admin
**Realm:** `citybox-admin` · **Client:** `admin-web`
**Arquivos:**
- `apps/admin/api/.env.example`
- `apps/admin/api/src/shared/infra/http/auth/authenticated-user.ts` + `.spec.ts`
- `apps/admin/api/src/shared/infra/http/guards/auth.guard.ts`
- `apps/admin/api/src/shared/infra/keycloak/keycloak-admin.service.ts` + `.spec.ts`
- `apps/admin/api/src/shared/infra/keycloak/keycloak-jwt.ts`
- `apps/admin/api/src/modules/users/infrastructure/keycloak/keycloak-user.adapter.ts`
- `apps/admin/api/src/modules/users/domain/keycloak/keycloak-user.provider.interface.ts`
- `apps/admin/api/src/modules/users/tests/fake-keycloak-user.provider.ts`
- `apps/admin/api/src/modules/stores/tests/fake-keycloak-admin.service.ts`
- `apps/admin/web/.env.example`, `.env.development`
- `apps/admin/web/src/lib/auth.ts`, `auth-server.ts`, `oauth-pkce.ts`
- `apps/admin/web/src/app/api/auth/token/route.ts`
- `apps/admin/api/AGENTS.md`, `apps/admin/web/AGENTS.md`, `apps/admin/AGENTS.md`

**Específico:** o `keycloak-admin.service.ts` do admin hoje faz `reset-password`, `logout`
e `PUT /users` em usuários de **todos** os sistemas (defeito D3). Após a migração ele opera
**apenas** sobre usuários do realm `citybox-admin` (a equipe Citybox). A gestão de membros
das verticais passa 100% pelo M2M da F2 — o admin não escreve mais no Keycloak alheio.

**Não fazer nesta tarefa:** o M2M `admin → vertical` é a F2. Aqui, apenas deixar o ponto
de extensão pronto e marcar com `TODO(F2)`.

### T1.B — erp
**Realm:** `citybox-erp` · **Client:** `erp-web`
**Arquivos:**
- `apps/erp/api/.env.example`, `apps/erp/api/prisma/seed.ts`
- `apps/erp/api/src/shared/infra/http/auth/authenticated-user.ts` + `.spec.ts`
- `apps/erp/api/src/shared/infra/http/guards/auth.guard.ts`
- `apps/erp/api/src/shared/infra/keycloak/keycloak-admin.service.ts`, `keycloak-jwt.ts`,
  `keycloak-unavailable.error.ts`
- `apps/erp/api/src/modules/tenancy/infrastructure/keycloak/keycloak-identity.adapter.ts`
- `apps/erp/web/src/lib/auth.ts`, `auth-server.ts`, `auth-cookie.ts`, `auth-fetch.ts`,
  `oauth-pkce.ts`
- `apps/erp/web/src/app/api/auth/token/route.ts`, `src/app/auth/callback/`, `src/app/auth/sso/`
- `apps/erp/web/src/components/auth/require-auth.tsx`
- `apps/erp/api/AGENTS.md`, `apps/erp/web/AGENTS.md`, `apps/erp/AGENTS.md`

**Específico:** o ERP **é a referência do padrão** (§2.5), então esta tarefa é a menor das
seis — só troca de realm. Duas mudanças pontuais:
- Remover `ensureComercioBackofficeAccess()` da porta `IdentityProvider`
  (`domain/providers/identity-provider.interface.ts`), do `KeycloakIdentityAdapter` e do
  `KeycloakAdminService` — a role `vertical.comercio.view` deixa de existir
- Confirmar que `permission.guard.ts` resolve `platform.admin` a partir da role **local**
  do realm `citybox-erp` atribuída ao `admin-m2m` (§2.1), sem mudança de código

**Esta tarefa deve terminar primeiro.** T1.D e T1.E copiam a porta e o adapter já ajustados
daqui. Se o agente do ERP alterar a forma da porta, avisar D e E antes de seguir.

### T1.C — clinica
**Realm:** `citybox-clinica` · **Client:** `clinica-web`
**Arquivos:**
- `apps/verticals/clinica/api/.env.example`
- `apps/verticals/clinica/api/src/shared/infra/http/auth/authenticated-user.ts` + `.spec.ts`
- `apps/verticals/clinica/api/src/shared/infra/http/guards/auth.guard.ts`,
  `clinic-scope.guard.ts`, `permission.guard.ts`
- `apps/verticals/clinica/api/src/shared/infra/keycloak/keycloak-jwt.ts`
- `apps/verticals/clinica/api/src/modules/members/members.module.ts`
- `apps/verticals/clinica/api/src/modules/store-setup/store-setup.module.ts`
- `apps/verticals/clinica/web/.env.example`, `.env.development`
- `apps/verticals/clinica/web/src/lib/auth-server.ts`, `oauth-pkce.ts`,
  `vertical-permissions.ts`
- `apps/verticals/clinica/infra/docker-compose.yml`
- `apps/verticals/clinica/api/AGENTS.md`, `apps/verticals/clinica/web/AGENTS.md`

**Específico:** `vertical-permissions.ts` mapeia realm roles (`platform_admin`,
`store_staff`, `vertical.clinic.view`) para permission IDs CASL. Com realm próprio esse
mapa deixa de existir — as permissões vêm de `@citybox/clinica-permissions` + do schema
`clinica`. Remover `KEYCLOAK_CLINIC_VIEW_ROLE` e `BACKOFFICE_ROLE_PERMISSIONS`.

**Internalizar `nest-common` (checklist item 10) — 8 arquivos + `package.json`:**
`modules/members/`: `create-member.use-case.ts`, `manage-member.use-case.ts` + `.spec.ts`,
`provision-organization-owner.use-case.ts` + `.spec.ts`, `members.module.ts`;
`modules/store-setup/`: `clinic-store-seeder.ts`, `store-setup.module.ts`.
Conferir com `grep -rn "@citybox/nest-common" apps/verticals/clinica/api` antes de fechar.

### T1.D — beautiful ⚠️ tarefa dupla: realm + refactor para o padrão ERP

**Realm:** `citybox-beautiful` · **Client:** `beautiful-web`
**Caminho crítico.** Maior que as demais — dividida em duas etapas sequenciais dentro
da mesma worktree. **D1 antes de D2**: refatorar primeiro e migrar o realm depois evita
mexer em duas dimensões no mesmo arquivo.

#### D1 — Refactor para o padrão §2.5
- **Internalizar `nest-common` (checklist item 10) — 7 arquivos + `package.json`:**
  `modules/members/`: `create-member.use-case.ts` + `.spec.ts`,
  `reset-platform-store-owner-password.use-case.ts` + `.spec.ts`, `members.module.ts`;
  `modules/store-setup/`: `ensure-platform-store-owner.use-case.ts` + `.spec.ts`.
  Conferir com `grep -rn "@citybox/nest-common" apps/verticals/beautiful/api`.
  **Ordem:** internalizar primeiro, depois esconder atrás da porta `IdentityProvider` —
  assim o diff de cada passo fica legível
- **Criar** `modules/tenancy/domain/providers/identity-provider.interface.ts`
  — copiar a porta do ERP **sem** `ensureComercioBackofficeAccess`
- **Criar** `modules/tenancy/infrastructure/keycloak/keycloak-identity.adapter.ts`
- **Criar** `modules/tenancy/tests/fake-identity.provider.ts`
- **Reescrever** `store-setup/application/use-cases/ensure-platform-store-owner/ensure-platform-store-owner.use-case.ts`
  para injetar `IdentityProvider` em vez de `KeycloakProvisioningService`
- **Reescrever** `store-setup/application/use-cases/provision-platform-store/provision-platform-store.use-case.ts`
  espelhando o do ERP (síncrono, devolve `{ username, provisionalPassword }`)
- **Deletar** `shared/infra/http/guards/platform-admin.guard.ts`,
  `shared/infra/http/auth/platform-admin.ts`,
  `shared/infra/http/decorators/require-platform-admin.decorator.ts`
- **Substituir** todo `@RequirePlatformAdmin()` por `@RequirePermission('platform.admin')`,
  resolvido pelo `permission.guard.ts` no padrão do ERP
- Consolidar `store-setup` + `members` sob o módulo `tenancy` conforme §2.5

**Decisão registrada:** `Member.permissions Json` + `store-role.catalog.ts` do beautiful
**não** precisam virar `PermissionProfile` nesta leva. O padrão exigido é o de
**identidade e provisionamento**; o catálogo de permissões pode continuar lean. Se a
etapa D1 revelar que o `permission.guard.ts` do beautiful não consegue resolver
`platform.admin` sem `PermissionProfile`, **parar e reportar** em vez de expandir escopo.

#### D2 — Realm próprio
- `apps/verticals/beautiful/api/.env.example`, `prisma/seed.ts`
- `src/shared/infra/http/auth/authenticated-user.ts` + `.spec.ts`
- `src/shared/infra/http/guards/auth.guard.ts` + `.spec.ts`, `permission.guard.ts`,
  `store-scope.guard.ts`
- `src/shared/infra/keycloak/keycloak-jwt.ts`
- `src/modules/members/members.module.ts`, `src/modules/store-setup/store-setup.module.ts`
- `apps/verticals/beautiful/web/.env.example`
- `apps/verticals/beautiful/web/src/lib/auth-server.ts`, `oauth-pkce.ts`,
  `vertical-permissions.ts`
- `apps/verticals/beautiful/infra/docker-compose.yml`
- `apps/verticals/beautiful/api/AGENTS.md`, `web/AGENTS.md`, `apps/verticals/beautiful/AGENTS.md`

**Atenção:** `Member` tem `username @unique` **e** `keycloakSub @unique`. Com realm
exclusivo, `usernameFromEmail()` deixa de poder colidir com outra vertical — confirmar
que `store-setup/application/policies/owner-identity.ts` não carrega desambiguação que
virou morta.

### T1.E — imoveis ⚠️ tarefa dupla: realm + refactor para o padrão ERP

**Realm:** `citybox-imoveis` · **Client:** `imoveis-web`
**A maior das seis.** Imóveis é a mais distante do padrão: **não tem `Organization`** —
usa `storeId` como raiz e `TeamMember` + `StoreSettings` no módulo `settings`.

#### E1 — Investigação bloqueante (antes de qualquer código)
Responder e registrar no `AGENTS.md`:
1. Imóveis consome `citybox.store.*`? Existe
   `modules/store-setup/infrastructure/messaging/consumers/store-platform.consumer.ts`,
   mas o CLAUDE.md afirma que a loja fica presa em `deploymentStatus=PROVISIONING`.
   **Verificar o que é verdade** — a doc pode estar defasada.
2. Introduzir `Organization` (migration Prisma no schema `imoveis`) ou manter `storeId`
   como raiz de tenancy?

**Se (2) exigir migration**, ela precisa de `database-reviewer` (gate obrigatório do
CLAUDE.md) e a tarefa deixa de caber no paralelismo da F1 — nesse caso **imóveis sai
desta leva** e entra numa F6 dedicada. Decidir aqui, não no meio da implementação.

#### E2 — Refactor para o padrão §2.5
- **Internalizar `nest-common` (checklist item 10) — 10 arquivos + `package.json`.**
  É o app que mais depende dele. `modules/settings/`: `mock-keycloak.ts`,
  `run-keycloak.ts`, `settings.module.ts`, `create-team-member.use-case.ts`,
  `update-team-member.use-case.ts`, `delete-team-member.use-case.ts` + `.spec.ts`,
  `reset-team-member-password.use-case.ts` + `.spec.ts`;
  `modules/store-setup/`: `ensure-platform-store-owner.use-case.ts`.
  Conferir com `grep -rn "@citybox/nest-common" apps/imoveis/api`.
  **Ordem:** internalizar primeiro, depois esconder atrás da porta
- **Criar** a porta `IdentityProvider` + adapter + fake, como em D1
- **Reescrever** `store-setup/application/use-cases/ensure-platform-store-owner/`
  para usar a porta; remover a dependência direta de `KeycloakProvisioningService`
- **Avaliar remoção** de `settings/application/policies/run-keycloak.ts` — o wrapper
  existe para traduzir erro de infra; com a porta no domínio, o tratamento vai para o
  adapter (padrão do ERP com `keycloak-unavailable.error.ts`)
- `settings/application/policies/mock-keycloak.ts` → substituído pelo `fake-identity.provider.ts`

#### E3 — Realm próprio
- `apps/imoveis/api/.env.example`, `prisma/seed.ts`
- `src/shared/infra/http/auth/authenticated-user.ts` + `.spec.ts`
- `src/shared/infra/http/guards/auth.guard.ts`
- `src/shared/infra/keycloak/keycloak-jwt.ts`
- `src/modules/settings/settings.module.ts`,
  `src/modules/settings/domain/errors/keycloak-provisioning-failed.error.ts`
- `src/modules/store-setup/store-setup.module.ts`
- `apps/imoveis/web/src/lib/auth-server.ts`, `oauth-pkce.ts`, `vertical-permissions.ts`
- `apps/imoveis/infra/docker-compose.yml`
- **Criar** `apps/imoveis/api/AGENTS.md` (não existe), atualizar `apps/imoveis/web/AGENTS.md`

### T1.F — marketplace
**Realm:** `citybox-marketplace` · **Client:** `marketplace-app` (público, PKCE)
**Arquivos:**
- `apps/marketplace/api/src/auth/auth.guard.ts`, `auth.service.ts`, `auth.mapper.ts`
- `apps/marketplace/api/src/common/auth/keycloak-jwt.ts`
- `apps/marketplace/api/src/identity/keycloak-admin.service.ts`
- `apps/marketplace/api/test/keycloak-admin.service.test.ts`, `auth.mapper.test.ts`
- `apps/marketplace/api/docker-compose.prod.yml`
- `apps/marketplace/bff/.env.example`, `src/config.ts`, `src/auth/keycloak.service.ts`
- `apps/marketplace/bff/scripts/setup-keycloak.ts`
- `apps/marketplace/bff/docker-compose.prod.yml`
- `apps/marketplace/api/AGENTS.md`, `apps/marketplace/bff/AGENTS.md`

**Específico:** o BFF já tem `KEYCLOAK_REALM` parametrizado (`src/config.ts:33`) e
clients `citybox-consumer` / `citybox-consumer-admin` — está mais perto do alvo que os
outros. `scripts/setup-keycloak.ts` provavelmente vira redundante com o import declarativo
da T0.1; decidir entre remover ou apontar para o novo realm.

---

## F2 — M2M admin → verticais (sequencial, depois da F1)

> **✅ CONCLUÍDA em 2026-08-13.**
> - `http-vertical-member-provisioning.adapter.ts`: `serviceToken()` passou a receber a
>   vertical; cache de token virou `Map` por vertical (tokens de realms diferentes não se
>   substituem); credenciais resolvidas por `VERTICAL_M2M_ENV_PREFIX`.
> - `http-signature-package-provisioning.adapter.ts`: mesmo tratamento, fixo em
>   `KEYCLOAK_CLINICA_M2M_*`.
> - Env ausente falha **nomeando a env que faltou**, em vez de cair no genérico "não foi
>   possível falar com a vertical" — que escondia a causa.
> - `apps/admin/api/.env.example`: 12 envs novas (4 verticais × issuer/client/secret).
> - Lado das verticais **já estava pronto pela F1**: os quatro `.env.example` têm
>   `KEYCLOAK_ALLOWED_AZP=<sistema>-web,admin-m2m`.
> - Verificação: `admin-api build` limpo, **259 testes ✓**.
>
> ⚠️ **Correção de método:** `@citybox/admin-api` **não tem script `typecheck`** (só
> `build` + `test`). A varredura anterior o marcou como ✓ por falso positivo — a saída
> "None of the selected packages has a typecheck script" não contém a palavra `error`,
> então passou pelo filtro. Validado agora por `build`.

Cruza os limites de sistema, por isso **não** pode rodar em paralelo com a F1.

### T2.1 — Credencial M2M por vertical
**Agente:** 1 agente, sem worktree (toca 5 apps)
**Arquivos:**
- `apps/admin/api/src/modules/stores/infrastructure/providers/http-vertical-member-provisioning.adapter.ts`
- `apps/admin/api/src/modules/stores/infrastructure/providers/http-signature-package-provisioning.adapter.ts`
- `apps/admin/api/.env.example`
- guards das 4 verticais (aceitar `azp=admin-m2m`)

**Fazer:**
- Hoje o adapter obtém um token `client_credentials` no realm único e reusa para todas as
  verticais. Passa a resolver **issuer + client_id + secret por vertical**, com cache de
  token por vertical.
- Cada vertical valida `azp === 'admin-m2m'` e trata como chamador confiável do admin.
- Escopo mínimo: `admin-m2m` só pode o que a API da vertical expõe em `/api/v1/...` —
  **não** ganha `manage-users` no realm da vertical.

**Aceite:** teste de integração provando que um token `admin-m2m` do realm `citybox-erp`
é **rejeitado** pela `clinica-api`.

---

## F3 — Casos especiais (2 agentes em paralelo, depois da F2)

> **✅ CONCLUÍDA em 2026-08-14.** Ambas as tarefas mudaram de forma em relação ao
> plano original, por causa do que a investigação revelou — detalhes abaixo.

### T3.1 — fiscal-api
**Arquivos:** `services/fiscal-api/src/shared/infra/keycloak/keycloak-jwt.ts`,
`src/shared/infra/http/guards/auth.guard.ts`, `src/shared/infra/http/auth/authenticated-user.ts`,
`.env.example`, `infra/fiscal-api/docker-compose.yml`, `services/fiscal-api/AGENTS.md`

**Investigar primeiro:** quem chama a `fiscal-api`. O grep não encontrou `FISCAL_API_URL`
configurado em nenhum consumidor — pode estar sem integração ativa.
- Se **só o ERP** consome → realm `citybox-erp`, client dedicado
- Se **várias verticais** consomem → é o único caso legítimo de multi-issuer; nesse caso,
  lista **explícita e fechada** de issuers aceitos, nunca fallback silencioso

**Aceite:** decisão documentada no `AGENTS.md` do serviço com a evidência de quem chama.

### ✅ Resultado da T3.1 (2026-08-14) — a investigação mudou a decisão duas vezes

**Investigação:** só o `erp-web` consome a `fiscal-api`, por um proxy que repassava o
**token do usuário final**, com `X-Company-Id` escolhido no front.

**Primeira leitura (errada):** reportei um IDOR — a `fiscal-api` não amarraria o
`companyId` ao token. Baseei-me no comentário do decorator `CompanyId`, que diz "NÃO
USADO por design no v1". **Esse comentário está desatualizado**: existe uma
`StoreMembershipCompanyAccessPolicy`, adicionada depois, que nega por padrão.

**O problema real:** essa policy resolvia `sub → platform.members → platform.store_members`.
Com um realm por sistema, o token vem de `citybox-erp` e a identidade do lojista mora em
`erp.users` — a cadeia quebraria e a `fiscal-api` ficaria inacessível pelo ERP.

**Decisão do usuário: opção A** — a chamada passou a sair da `erp-api`, com credencial
M2M. Implementado:
- Realm `citybox-erp`: role `fiscal_operator` + client `fiscal-m2m` (service account)
- `fiscal-api`: multi-issuer com **allowlist fechada** (`KEYCLOAK_ALLOWED_ISSUERS`) e
  **um JWKS por issuer** — a versão anterior iterava issuers contra um único JWKS, o que
  só funcionava porque eram hosts do *mesmo* realm; com realms distintos, cada um tem
  chave própria
- `StoreMembershipCompanyAccessPolicy` **removida** → `TrustedSystemCompanyAccessPolicy`
  (autoriza pelo `azp`). `TenantAccessModule` perdeu o `PrismaModule`: a autorização
  deixou de atravessar a fronteira de schema de outro serviço
- `erp-api`: módulo `fiscal` (porta + adapter M2M + 2 rotas). **As rotas não aceitam
  `companyId`** — ele é derivado do CNPJ da organização do tenant
- `erp-web`: `facilita-nfe` fala com a `erp-api`; `fiscal-client.ts`, o proxy
  `/api/proxy/fiscal` e o `use-fiscal-company.ts` removidos

**Verificação:** `fiscal-api build` e `erp-api`/`erp-web typecheck` limpos. Token real de
`fiscal-m2m` traz `azp=fiscal-m2m` + role `fiscal_operator`; `erp-web` **não consegue**
obter token M2M (`unauthorized_client`), então não alcança a `fiscal-api`.

### T3.2 — keycloak-theme por realm
**Arquivos:** `apps/keycloak-theme/src/login/theme-variant.ts`, `src/kc.gen.tsx`,
`vite.config.ts`, `infra/keycloak/themes/citybox/`, `apps/keycloak-theme/AGENTS.md`

**Fazer:** hoje a variante de tema é escolhida pelo `clientId`. Com realm por sistema,
cada realm aponta seu próprio `loginTheme`. Ganho: tela de login com a marca de cada
produto. Ajustar `theme-variant.ts` para chavear por realm e declarar `loginTheme` nos
6 JSONs da T0.1.

### ✅ Resultado da T3.2 (2026-08-14) — um tema, seis variantes

Pedido do usuário: **template diferente por realm, sempre com o logo CityBox + o nome da
vertical**. Implementado como **um tema (`citybox`) com variante por realm**, não seis
temas — seis pastas de tema duplicariam o CSS e divergiriam no primeiro ajuste.

- `getThemeVariant` passou a derivar do **realm** (`kcContext.realm.name`), não mais do
  `themeName` (que vinha do client). `themeName` fica como fallback para realm não
  migrado; `?variant=` segue servindo ao preview de DEV
- `ThemeVariant` foi de 2 para **6** valores: admin, erp, clinica, beautiful, imoveis,
  marketplace. Cada um com `label` (nome da vertical, ao lado do logo), paleta própria
  (`gradient`/`accent`/`dot`) e slides próprios
- `LoginCarousel` deixou de ter slides fixos no componente. Os três que existiam
  (Plataforma / Food / Varejo) eram **iguais em todo sistema e já desatualizados** —
  Food e Varejo viraram Comércio, e clínica/beautiful/imóveis nem apareciam. O conteúdo
  mudou-se para `theme-variant.ts`
- `carouselTag` saiu do config (o `tag` agora é por slide); autoplay e bullets só
  aparecem com 2+ slides

**Verificação:** `keycloak-theme typecheck` sem erros nos arquivos do app.
⚠️ Um erro **pré-existente** aparece no typecheck, vindo de
`packages/ui/.../currency-input/currency-field.tsx` (`'React' is declared but its value
is never read`) — sem alteração local, não é desta refatoração.

---

## F4 — Verificação (sequencial, bloqueia entrega)

### T4.1 — Gate de qualidade
```bash
pnpm build && pnpm lint && pnpm typecheck && pnpm test
```
Skill `verification-loop`. Zero `@ts-ignore`, zero `eslint-disable @typescript-eslint/*`.

### T4.2 — Reset e reprovisionamento limpo
```bash
pnpm infra:down && pnpm infra:up
pnpm keycloak:sync
# recriar bancos e rodar seeds de cada API
```
**Aceite:** subida do zero, sem nenhum resquício de `citybox-dev`.

### T4.3 — Matriz E2E dos defeitos
**Agente:** `e2e-runner`

| Teste | Esperado |
|---|---|
| Criar `joao@x.com` como membro na clínica **e** no beautiful | Ambos criados, sem 409, `sub` diferente em cada realm |
| Logar no admin-web, abrir erp-web na mesma sessão de browser | erp-web pede login — **não** reaproveita a sessão |
| Enviar token do beautiful-web para a `clinica-api` | 401 |
| Enviar token do `admin-web` para a `erp-api` | 401 |
| Reset de senha no beautiful | Não afeta a conta do mesmo e-mail na clínica |
| Logout no erp-web | Não desloga o admin-web |
| Provisionar loja nova pelo admin em **cada** vertical | Organização + owner criados; `username` + senha provisória devolvidos no mesmo formato do ERP |
| Reenviar o mesmo `citybox.store.created.v1` (at-least-once) | Dedupe funciona; nenhum owner duplicado em nenhuma vertical |

### T4.4 — Revisão de segurança
**Agente:** `security-reviewer` + `/security-scan`
Checar os 4 invariantes de §2.4 em todos os apps. Confirmar que
`citybox-core-admin` não aparece em nenhum arquivo do repo.

### T4.5 — Diff cruzado das cópias + remoção do `nest-common`
**Agente:** `typescript-reviewer`
**Existe porque não há pacote compartilhado.** É o que substitui a garantia que o
compilador daria. Sem esta tarefa, a decisão de duplicar vira dívida invisível.

**Fazer:**
1. Comparar, lado a lado nos 6 apps, os arquivos que deveriam ser equivalentes:
   `keycloak-jwt.ts`, `authenticated-user.ts`, `auth.guard.ts`,
   `keycloak-provisioning.service.ts`, `oauth-pkce.ts`
2. Toda divergência é **justificada no `AGENTS.md` do app** ou **corrigida**. Divergência
   silenciosa não passa
3. Confirmar que os 4 invariantes de §2.4 estão implementados **do mesmo jeito** em todos
   — em especial a validação de `aud`/`azp`, que é a mais fácil de um agente esquecer
4. **Remover `packages/nest-common/` do workspace** e do `pnpm-workspace.yaml`, agora que
   clínica, beautiful e imóveis já internalizaram o serviço (checklist F1, item 10)
5. Rodar `pnpm install` e confirmar que nada mais resolve `@citybox/nest-common`

**Aceite:** relatório com o diff das cinco famílias de arquivo; zero divergência não
justificada; `grep -r "@citybox/nest-common"` volta vazio.

### ✅ Resultado da T4.5 (2026-08-14)

**`packages/nest-common/` removido.** As três referências restantes ao nome eram
comentários históricos ("cópia local do antigo…"), não imports. `pnpm install` limpo
depois da remoção. O workspace foi de 6 para 5 pacotes (`docs`, `messaging`, `mui`,
`tsconfig`, `ui`).

**Diff cruzado dos invariantes** — verificado nos **sete** serviços (os seis apps + a
`fiscal-api`):

| Invariante | Resultado |
|---|---|
| 1 — issuer único, sem fallback | ✓ 7/7. As ocorrências de `auth.citybox.com` são **comentários de JSDoc** documentando a remoção; a verificação foi refeita removendo comentários antes do grep, e nenhum default hardcoded sobrou em código |
| 1b — validação de `azp` | ✓ 7/7 |
| 2 — `manage-users` por realm | ✓ 6/6 realms: só o `<sistema>-provisioning` do próprio realm |
| 3 — wildcard em redirect/webOrigins | ✓ 6/6 realms limpos |

**Barreira do caminho fiscal, testada no Keycloak real:**
- `fiscal-m2m` → `azp=fiscal-m2m`, role `fiscal_operator` ✓
- `erp-web` → **não obtém token M2M** (`unauthorized_client`) — o client de usuário final
  não alcança a `fiscal-api` nem tentando ✓
- `admin-m2m` → tem `platform.admin`, mas **não** `fiscal_operator`, e está fora de
  `KEYCLOAK_ALLOWED_AZP` da fiscal ✓

---

## F5 — Documentação (depois da F4)

**Agente:** `doc-updater`
**Arquivos:** `AGENTS.md` raiz (seção 3 — mapa de serviços; nova seção de realms; **remover
`@citybox/nest-common` da lista de packages**), `CLAUDE.md` (seção "Packages" — o pacote
deixa de existir; seção de padrões de código — guards e auth),
`CLAUDE.md` (seção de padrões de código — guards e auth), `infra/AGENTS.md`,
`infra/keycloak/` README, `.claude/AGENTS.md` se aplicável.

Os `AGENTS.md` de módulo já foram atualizados dentro de cada tarefa da F1 — aqui é só o
que é estrutural/global.

---

## 4. Riscos

| Risco | Mitigação |
|---|---|
| **As seis cópias divergirem** — é o custo direto de não ter pacote, e o mecanismo exato que produziu o defeito D1 | Três camadas: (a) T0.2 entrega molde de código pronto para copiar, não prosa; (b) T4.5 faz diff cruzado dos seis apps antes da entrega; (c) o ADR C-17 fica como referência para mudanças futuras. **Aceito conscientemente pelo usuário** — consolidação em pacote fica para depois. |
| Um agente "resolver" a duplicação criando pacote por conta própria | Regra escrita no checklist da F1: propor extração = **para e reporta**. |
| Molde da T0.2 mudar durante a F1 | Congelar ao fim da T0.2. Mudança exige parar a F1 e replicar nos seis. |
| Seis agentes editando `pnpm-lock.yaml` | Nenhum agente da F1 toca em `packages/` ou no lock. A remoção de `@citybox/nest-common` do workspace é da F4 (T4.5). |
| **T1.D / T1.E viram refactor sem fim** (escopo escorregando de "realm" para "reescrever tenancy") | Limite escrito na tarefa: beautiful **não** migra para `PermissionProfile`; imóveis **não** ganha `Organization` sem a decisão da E1. Agente que quiser expandir **para e reporta**. |
| Imóveis precisar de migration Prisma (`Organization`) | Decidido na E1, **antes** de codar. Se precisar, imóveis sai da F1 e vira F6 com `database-reviewer` (gate obrigatório do CLAUDE.md). |
| `fiscal-api` sem consumidor identificado | T3.1 começa por investigação, não por código. |
| Secrets de 6 realms × 2-3 clients | Gerar na T0.1 e registrar em `infra/plataform-apps.env` + `services/platform-apps.env.example` na F2/T2.1. |
| Regressão silenciosa no provisionamento das verticais refatoradas | T4.3 ganha caso E2E: provisionar loja nova em cada vertical via admin e conferir que owner + senha provisória chegam iguais ao ERP. |

## 5. Ordem de merge

1. F0 → `main` (só ADRs + JSONs de realm; não toca código de app, realms novos convivem
   com o antigo)
2. F1 → seis PRs, merge **em bloco** após todos verdes. Nenhum toca `packages/`
3. F2 → PR único
4. F3 → dois PRs
5. F4 gate → T4.5 remove `packages/nest-common/`; só então remover
   `citybox-dev-realm.json` e `citybox-core-admin`
6. F5 → PR de docs
