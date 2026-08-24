# AGENTS.md — Vertical Beautiful (web + api)

> **Para agentes de IA:** Fonte de verdade do **conjunto** `apps/verticals/beautiful`
> (web + api). Detalhes por app: [`web/AGENTS.md`](web/AGENTS.md) e
> [`api/AGENTS.md`](api/AGENTS.md). Ao modificar código, atualize este arquivo e o
> filho correspondente na mesma operação. Nunca remova seções — apenas atualize/adicione.

---

## 1. Identidade do Módulo

| Campo | Valor |
| ----- | ----- |
| **Nome** | `apps/verticals/beautiful` — guarda-chuva **web + api** |
| **Tipo** | Vertical de negócio (scaffold) — Next.js Web + NestJS API |
| **Responsável** | Bruno Lopes — Aplopes Tecnologia |
| **Status** | Membership + store-setup + CASL + Financeiro ledger + temas por loja |
| **Última atualização deste arquivo** | 2026-08-20 |

**Propósito em uma linha:**
Esqueleto da vertical **Beautiful** com Clean Architecture na API e shell AppSidebar MUI no web,
para o time desenvolver features a partir daí.

**Documentação humana:** [`Documentação.md`](Documentação.md) · [`Configurações.md`](Configurações.md).  
**Deploy (produção):** [`infra/docker-compose.yml`](infra/docker-compose.yml) — `beautiful_api` (`127.0.0.1:3173`) + `beautiful_web` (**host `127.0.0.1:3118` → container `:3115`**; neste VPS a `3115` já é do CRM), MinIO bucket `citybox-beautiful`, rede `aplopes-platform`. Origem pública **`https://salao.aplopes.com`** (`BEAUTIFUL_ORIGIN`). Nginx host faz proxy TLS → `:3118` (BFF; Nest não é público). Realm `citybox-beautiful`, client `beautiful-web`.

---

## 2. Composição

| App | Caminho | Pacote | Porta | Stack | Status |
|-----|---------|--------|-------|-------|--------|
| **Permissions** | [`permissions/`](permissions/) | `@citybox/beautiful-permissions` | — | CASL + TypeScript | 🟢 Catálogo / presets / ability |
| **Web** | [`web/`](web/) | `@citybox/beautiful-web` | `3115` | Next.js 16 · React 19 · `@citybox/mui` | 🟢 Shell + cadastros + agenda + settings + estoque + financeiro mock + ⌘K + CASL |
| **API** | [`api/`](api/) | `@citybox/beautiful-api` | `3173` | NestJS 11 · Clean Architecture · Prisma 7 (schema `beautiful`) | 🟢 Membership + store-setup + PermissionGuard |

```
apps/verticals/beautiful/
├── permissions/  ← @citybox/beautiful-permissions (CASL)
├── web/       ← @citybox/beautiful-web (:3115)
├── api/       ← @citybox/beautiful-api (:3173)
├── infra/     ← docker-compose (api + web) rede aplopes-platform
└── AGENTS.md  ← ESTE ARQUIVO
```

---

## 3. Arquitetura de Conjunto

```
Operador (browser)
  → beautiful-web (:3115) — login Keycloak PKCE; SessionProvider + StoreProvider
  → gate: vertical.beautiful.view + loja via GET /v1/members/me
  → /api/proxy/beautiful — cookies httpOnly → Bearer + X-Store-Id (scopeless: members/me|roles)
  → beautiful-api (:3173) — AuthGuard → PlatformAdminGuard → StoreScopeGuard → PermissionGuard + @StoreId
  → PostgreSQL schema `beautiful`

Admin cria loja vertical=Beautiful
  → outbox citybox.store.created → fila beautiful.store-setup
  → EnsurePlatformStoreOwner (Keycloak + Member OWNER sem senha)
  → callback citybox.provisioning.completed → deploymentStatus=ACTIVE
  → admin "Gerar senha" → M2M POST …/platform/stores/:id/owner/reset-password
```

**Hoje:** web não chama Nest direto; BFF injeta JWT. Loja ativa vem de `StoreProvider` (`members/me` com permissões efetivas). JWT sem `vertical.beautiful.view` → 403 no BFF. Sem `StoreMember` + `X-Store-Id` → 403 na API. Rotas anotadas com `@RequirePermission` (`@citybox/beautiful-permissions`). Nav/ações web via `useAbility` / `<Can>`. CORS browser→`:3173` **desligado**. Convite de membros em `/equipe` (`POST /v1/members` + checkboxes CASL).

---

## 4. Como Rodar

```bash
pnpm --filter @citybox/beautiful-api dev    # :3173 · Swagger /api/v1/docs · Health /api/health
pnpm --filter @citybox/beautiful-web dev    # :3115

# ou na raiz:
pnpm dev:beautiful
```

API (primeira vez, com Postgres no ar):

```bash
pnpm infra:up:postgres   # se necessário
cp apps/verticals/beautiful/api/.env.example apps/verticals/beautiful/api/.env
pnpm --filter @citybox/beautiful-api db:generate
# migrations quando existir o 1º model: pnpm --filter @citybox/beautiful-api db:migrate:dev
```

---

## 5. Decisões de Arquitetura (nível conjunto)

| Decisão | Motivo |
|---------|--------|
| Path `beautiful` (não `beauty`) | Nome pedido no scaffold; backlog histórico pode usar `beauty` em outros docs |
| AuthGuard na API antes do BFF web | Fase A isolou mutações; Fase C ligou PKCE/proxy |
| CORS off no Nest | Browser só same-origin BFF; compose sem `CORS_ORIGINS` |
| Web 100% `@citybox/mui` (sem `@citybox/ui`) | Paridade com imóveis; evita misturar DS |
| API réplica do padrão food/erp-comercio Clean Arch | Padrão único das verticais Nest |
| Realm `citybox-beautiful` + client `beautiful-web` | Sessão e unicidade de e-mail independentes dos demais sistemas |

---

## 6. Contexto para a IA

- Domínio/API → `api/` (ver `api/AGENTS.md`). Copie `modules/_example/` para o 1º módulo.
- UI → `web/` em `src/features/<feature>/`; rotas finas em `app/(app)/`.
- **Não** registrar `_example` no `AppModule`.
- **Não** instalar com npm/yarn.
- **No catálogo admin** (`StoreVertical = 'Beautiful'`): consumer `beautiful.store-setup` + M2M owner + `BEAUTIFUL_API_URL` no admin-api.

---

## 7. Histórico de Mudanças Estruturais

| Data | Mudança | Impacto |
| ---- | ------- | ------- |
| 2026-08-20 | **Temas visuais por loja:** `StoreSettings.themeId` + aba Aparência no web (8 paletas Light/Dark) | api + web |
| 2026-08-20 | **Equipe alinhada à Clínica:** `organizationRole` identifica o responsável; cargo da loja é operacional (`profissional`/`recepcao`/`gerente`); OWNER com todas as permissões imutáveis | permissions + api + web |
| 2026-08-14 | Compose alinhado ao issuer `KEYCLOAK_BEAUTIFUL_ISSUER` e ao consumer RabbitMQ | Produção usa realm dedicado e recebe eventos `citybox.store.*` |
| 2026-08-14 | **Lançamento Financeiro no Agendamento:** criação automática de lançamento de receita (`pending`) no ato da criação do agendamento com vencimento (`dueDate`) no dia marcado; cancelamento automático do lançamento ao cancelar o agendamento (`status=cancelled`). | API appointments + financial |
| 2026-08-12 | **Agenda COMPLETED → ledger:** gera receita `appointment_complete` ao concluir agendamento | API appointments + financial |
| 2026-08-12 | **Financeiro ledger ponta a ponta:** API `v1/financial/*` (accounts/categories/entries) + migration + seed store-setup; web React Query (sem Comissões) | Substitui mock; CASL `access` Financial |
| 2026-08-12 | **Financeiro web mock:** layout espelho Clínica (Fluxo/Transações/Config) em MUI + dados mocados | UI `/financeiro/*`; depois integrado à API |
| 2026-08-11 | **Fase G CASL:** package `@citybox/beautiful-permissions`; PermissionGuard; Equipe checkboxes; nav/`Can` | Authz granular alinhada à Clínica |
| 2026-08-11 | **Professional→Member (padrão Clínica):** remove entidade Professional; grade/serviços em Member; agenda usa `Member.id` | Uma pessoa = um Member com Keycloak |
| 2026-08-10 | **store-setup Beautiful:** no catálogo admin; fila `beautiful.store-setup`; OWNER via evento + M2M `platform/stores/:id/owner*` + `BEAUTIFUL_API_URL` | Loja sai de PROVISIONING; card Gerar senha |
| 2026-08-10 | Etapa 4 Fase E: Membership (Organization/Store/Member/StoreMember + StoreScopeGuard + members/me + POST invite + role KC + StoreProvider) | Login com vínculo de loja |
| 2026-08-10 | Etapa 4 Fase D: CORS browser off + compose BFF envs | fechado |
| 2026-08-10 | Etapa 4 Fase C: BFF/PKCE + `/api/proxy/beautiful` + login/gate | Tokens httpOnly; remove bypass web `dev-admin` |
| 2026-08-10 | Etapa 4 Fase B: `storeId` nos models + `@StoreId` + web `X-Store-Id` | Isolamento por loja; Membership ainda depois |
| 2026-08-10 | Etapa 4 Fase A: AuthGuard Keycloak na API + bypass web `dev-admin` | Mutações exigem Bearer |
| 2026-08-07 | settings + categorias clientes + estoque IN/OUT + ⌘K real | Placeholders de config/estoque/busca fechados (lean) |
| 2026-08-07 | Etapa 1 (1.1/1.2/1.4): editar/remarcar/cancelar + Início lean | Sem seed (1.3) |
| 2026-08-06 | Web **Agenda**: drawer de detalhes + status | Clique no card → detalhes; PATCH status |
| 2026-08-06 | Web **Agenda**: cliente novo no form | POST `newClient` no mesmo request do agendamento |
| 2026-08-06 | Web **Agenda** integrada à API | Remoção do mock; React Query + `appointment-service` |
| 2026-08-06 | API **Agenda (Appointments)** | Models + GET/POST/PATCH status; web agenda ainda mock até integração |
| 2026-08-06 | Módulo **Clientes** ponta a ponta (API + web) | Cadastro lean nome+telefone; base para Agenda futura |
| 2026-08-03 | Scaffold `web/` + `api/` criado (sem auth) | Vertical Beautiful existe no monorepo |
