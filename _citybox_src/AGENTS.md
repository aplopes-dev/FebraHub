# AGENTS.md — Monorepo Citybox (raiz)

> **Para agentes de IA:** Este é o arquivo-raiz da hierarquia de `AGENTS.md` do monorepo.
> Leia-o antes de qualquer ação para se orientar, depois abra o `AGENTS.md` do módulo
> específico em que vai trabalhar (índice na seção 4). Cada `AGENTS.md` é a **fonte de
> verdade** do seu escopo.
>
> ⚠️ **Política de manutenção (obrigatória):** ao modificar código, infraestrutura,
> schema ou configuração, **atualize o(s) `AGENTS.md` afetado(s) na mesma operação**
> (mesmo commit/PR). Detalhes na seção 7. Nunca remova seções — apenas atualize ou adicione.

---

## 1. O que é o Citybox

Plataforma municipal de comércio digital — **SaaS B2B** (backoffice para lojistas e operadores)

- **marketplace B2C** (app consumidor). Piloto single-city em **Ilhéus**.

* **Hierarquia de tenant:** Platform → Organization → Store.
* **Auth:** Keycloak (SSO/OIDC), JWT propagado por guards locais em cada API NestJS.
* **Mensageria:** RabbitMQ (CloudEvents 1.0) + padrão outbox; workers projetam read models.
* **Persistência:** PostgreSQL + Prisma. Apps core do marketplace usam multi-schema
  (`platform` + `tenant`); cada vertical/serviço tem seu próprio schema.

---

## 2. Stack e ferramentas globais

| Item                | Valor                                                          |
| ------------------- | -------------------------------------------------------------- |
| **Monorepo**        | Turborepo + **pnpm workspace**                                 |
| **Package manager** | **pnpm@9.15.0** — ÚNICO. Nunca usar `npm`/`yarn`.              |
| **Backend**         | NestJS 11 (catalog pin), TypeScript 5.x (alguns pacotes 6.x)   |
| **Frontend**        | Next.js 16 (App Router) + React 19, Tailwind v4, shadcn        |
| **ORM**             | Prisma (schemas por app — ver seção 6)                         |
| **Design system**   | `@citybox/ui` (atomic design, tokens OKLCH)                    |
| **Testes back**     | jest **ou** `node --import tsx --test` (varia por app)         |
| **Testes front**    | Vitest + Testing Library; E2E Playwright                       |
| **Infra local**     | Docker Compose por serviço em `infra/` (ver `infra/AGENTS.md`) |

Versões NestJS são fixadas via `catalog:` no `pnpm-workspace.yaml`. Para versões exatas
de cada módulo, consulte o `AGENTS.md` e o `package.json` do módulo.

---

## 3. Mapa de serviços e portas

| Serviço            | Pacote                       | Porta | Localização                         |
| ------------------ | ---------------------------- | ----- | ----------------------------------- |
| marketplace-api    | `@citybox/marketplace-api`   | 3101  | `apps/marketplace/api`              |
| marketplace-bff    | `@citybox/marketplace-bff`   | 3102  | `apps/marketplace/bff`              |
| admin-api          | `@citybox/admin-api`         | 3103  | `apps/admin/api`                    |
| realtime-gateway   | `@citybox/realtime-gateway`  | 3104  | `apps/realtime-gateway`             |
| workers            | `@citybox/workers`           | 3105  | `apps/workers`                      |
| payment-api        | `@citybox/payment-api`       | 3106  | `services/payment-api`              |
| erp-web (backoffice) | `@citybox/erp-web`         | 3107  | `apps/erp/web`                      |
| admin-web          | `@citybox/admin-web`         | 3108  | `apps/admin/web`                    |
| pdv (PWA)          | `@citybox/pdv`               | 3109  | `apps/pdv/frontend`                 |
| imoveis-web        | `@citybox/imoveis-web`       | 3111  | `apps/imoveis/web`                  |
| imoveis-api        | `@citybox/imoveis-api`       | 3112  | `apps/imoveis/api`                  |
| clinica-web        | `@citybox/clinica-web`       | 3113  | `apps/verticals/clinica/web`        |
| erp-api            | `@citybox/erp-api`           | 3114  | `apps/erp/api`                      |
| beautiful-web      | `@citybox/beautiful-web`     | 3115  | `apps/verticals/beautiful/web`      |
| fiscal-api         | `@citybox/fiscal-api`        | 3116  | `services/fiscal-api`               |
| food-api (piloto)  | `@citybox/food-api`          | 3171  | `apps/verticals/food/api`           |
| clinica-api        | `@citybox/clinica-api`       | 3172  | `apps/verticals/clinica/api`        |
| beautiful-api      | `@citybox/beautiful-api`     | 3173  | `apps/verticals/beautiful/api`      |
| keycloak-theme     | `@citybox/keycloak-theme`    | —     | `infra/keycloak/theme` (serve no Keycloak) |
| nginx              | reverse proxy                | 8088  | `infra/nginx`                       |

Hosts locais em `/etc/hosts`:

```
127.0.0.1 api.local.citybox.com app.local.citybox.com admin.local.citybox.com ws.local.citybox.com city.local.citybox.com
```

---

## 4. Índice de AGENTS.md (hierarquia)

> Sempre que entrar num módulo, abra o `AGENTS.md` correspondente **primeiro**.

### Apps
| Módulo | AGENTS.md | Resumo |
| ------ | --------- | ------ |
| ERP (conjunto) | [`apps/erp/AGENTS.md`](apps/erp/AGENTS.md) | Meta-AGENTS do par web+api — backoffice de comércio do lojista. Sucessor do antigo shell multi-vertical (removido em 2026-07-31). |
| ERP (web) | [`apps/erp/web/AGENTS.md`](apps/erp/web/AGENTS.md) | Next.js de backoffice comércio com `@citybox/ui`. **Login Keycloak (BFF + PKCE)** e escopo por empresa/unidade; Produtos e Categorias integrados; resto mock. Porta `3107`. |
| ERP (api) | [`apps/erp/api/AGENTS.md`](apps/erp/api/AGENTS.md) | NestJS Clean Architecture (réplica de `food/api`). **Multi-empresa** (Organization → Branch; autorização no banco, não no Keycloak — ver §5.10 do módulo). Módulos `tenancy`, `catalog` (produto da empresa com vínculo por unidade) e `suppliers`. Porta `3114`. |
| PDV (PWA) | [`apps/pdv/frontend/AGENTS.md`](apps/pdv/frontend/AGENTS.md) | Frontend PWA de ponto de venda (food + varejo). Next.js 16 + Serwist. Porta `3109`. |
| imoveis-web | [`apps/imoveis/web/AGENTS.md`](apps/imoveis/web/AGENTS.md) | 🟢 Frontend da vertical de imóveis. Next.js 16 + `@citybox/mui`; dashboard + leads + imóveis + agenda + negócios/financeiro + busca FTS + lembretes + settings (sistema/notificações/perfil) via **imoveis-api**; privacidade/usuários/integrações ainda mock. Porta `3111`. |
| imoveis-api | [`apps/imoveis/api/AGENTS.md`](apps/imoveis/api/AGENTS.md) | 🟢 API NestJS da vertical de imóveis — módulos **leads** + **properties** + **appointments** + **transactions** + **finance** + **dashboard** + **search** (FTS) + **reminders** + **settings** + **store-setup** (`citybox.store.*` → OWNER); schema `imoveis`. Porta `3112`. |
| keycloak-theme | [`infra/keycloak/theme/AGENTS.md`](infra/keycloak/theme/AGENTS.md) | Tema de login do Keycloak (Vite + Keycloakify). |
| marketplace-api | [`apps/marketplace/api/AGENTS.md`](apps/marketplace/api/AGENTS.md) | API transacional core: catálogo, pedidos, checkout, inventário, outbox. NestJS, multi-schema. |
| marketplace-bff | [`apps/marketplace/bff/AGENTS.md`](apps/marketplace/bff/AGENTS.md) | 🟢 BFF do app consumidor — implementa o contrato `docs/openapi.yaml` (auth Keycloak mediada, catálogo, carrinho/checkout/pedidos, conta, engajamento); schema Postgres `consumer` próprio; Redis + Typesense. Em produção em `citybox.com.br/api`. |
| admin (conjunto) | [`apps/admin/AGENTS.md`](apps/admin/AGENTS.md) | Meta-AGENTS do par api+web (operação da plataforma). |
| admin-api | [`apps/admin/api/AGENTS.md`](apps/admin/api/AGENTS.md) | API de operação: onboarding municipal, clientes, lojas, usuários internos. Clean Architecture. |
| admin-web | [`apps/admin/web/AGENTS.md`](apps/admin/web/AGENTS.md) | Painel web de operadores da plataforma. Next.js 16. |
| realtime-gateway | [`apps/realtime-gateway/AGENTS.md`](apps/realtime-gateway/AGENTS.md) | WebSocket (Socket.IO): bridge RabbitMQ→WS, rooms por loja, replay Redis. |
| workers | [`apps/workers/AGENTS.md`](apps/workers/AGENTS.md) | Consumidores RabbitMQ; projeção em read models (Postgres tenant + Typesense), outbox relay. |

### Verticais

> ⚠️ **Esta tabela lista as apps de vertical que existem em código — não é o catálogo
> de verticais cadastráveis no admin.** Desde 2026-07-30 o admin só oferece **duas**:
> `Comércio` (slug `comercio` → `apps/erp`, atende **food e varejo no mesmo
> sistema**) e `Clínica` (slug `clinic` → `apps/verticals/clinica`). As apps `food` e
> `varejo` abaixo continuam no repositório, mas **não recebem mais evento de loja**:
> `admin-api` não emite `vertical: 'Food'`/`'Varejo'`. **Imóveis** está no catálogo
> e a `imoveis-api` consome `citybox.store.*` (fila `imoveis.store-setup`) + M2M
> owner (`IMOVEIS_API_URL` no admin).

| Vertical      | AGENTS.md                                                                      | Status                                                                                                                                                                                                                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| food (piloto) | [`apps/verticals/food/AGENTS.md`](apps/verticals/food/AGENTS.md)               | 🟢 Backend de cardápio implementado. Frontend no ERP (módulo food).                                                                                                                                                                                                                                                                      |
| clinica       | [`apps/verticals/clinica/api/AGENTS.md`](apps/verticals/clinica/api/AGENTS.md) | 🟡 Backend config + pacientes + agenda + prontuário/procedimentos + estoque + financeiro/comissões + vendas/CRM + **marketing `form_lead` + `aniversario` WhatsApp** + **WhatsApp Baileys MVP** (`main-whatsapp`) + **vertente nutrição** (`nutrition-init`, anamnese por modelo); ERP integrado via `clinicaFetch`/BFF público |
| clinica (api)  | [`apps/verticals/clinica/api/AGENTS.md`](apps/verticals/clinica/api/AGENTS.md) | 🟡 Backend + **autorização CASL** (`@citybox/clinica-permissions`) |
| clinica (web)  | [`apps/verticals/clinica/web/AGENTS.md`](apps/verticals/clinica/web/AGENTS.md) | 🟢 Frontend dedicado (:3113) + gates CASL via `@citybox/clinica-permissions` |
| clinica (permissions) | [`apps/verticals/clinica/permissions/AGENTS.md`](apps/verticals/clinica/permissions/AGENTS.md) | 🟢 Package CASL compartilhado — única fonte de verdade de permissões da vertical |
| beautiful      | [`apps/verticals/beautiful/AGENTS.md`](apps/verticals/beautiful/AGENTS.md)     | 🟡 Membership + store-setup + **CASL** (`@citybox/beautiful-permissions`): Next `@citybox/mui` (:3115) + Nest schema `beautiful` (:3173); no catálogo admin (`Beautiful`) |
| beautiful (permissions) | [`apps/verticals/beautiful/permissions/AGENTS.md`](apps/verticals/beautiful/permissions/AGENTS.md) | 🟢 Package CASL compartilhado — catálogo / presets / `defineAbilityFor` |
| varejo        | [`apps/verticals/varejo/AGENTS.md`](apps/verticals/varejo/AGENTS.md)           | 🟡 Backend de catálogo (produtos e store setup). Frontend no ERP (módulo varejo).                                                                                                                                                                                                                                                         |

### Services

| Service     | AGENTS.md                                                          | Status                                                                                                                                             |
| ----------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| payment-api | [`services/payment-api/AGENTS.md`](services/payment-api/AGENTS.md) | 🔴 **Será REFEITO** — não segue os padrões da plataforma; reestruturação completa planejada. Não adotar/evoluir; código atual é legado/referência. |
| fiscal-api  | [`services/fiscal-api/AGENTS.md`](services/fiscal-api/AGENTS.md)   | 🟢 Emissão de documentos fiscais, **funcionando contra os órgãos reais em homologação**: NF-e via SEFAZ-BA e NFS-e pelo Padrão Nacional (Ilhéus/BA), com certificado A1 ICP-Brasil, cancelamento e substituição. Documento auxiliar impresso (**DANFE** e **DANFSE**) em `GET /v1/nfe/:id/danfe` e `GET /v1/nfse/:id/danfse`. 🟡 **Cupom fiscal (NFC-e, modelo 65)** em `/v1/nfce` — código completo, mas **nenhum cupom transmitido à SEFAZ ainda**; exige CSC cadastrado e credenciamento próprio para o modelo 65. Produção é recusada por construção — os endpoints de produção não têm valor padrão. Clean Architecture por módulo (segue food/clinica, não o padrão flat de payment-api); schema Prisma próprio `fiscal` no banco `citybox`. Porta `3116`. |

### Packages

| Package              | AGENTS.md                                                      | Resumo                                                     |
| -------------------- | -------------------------------------------------------------- | ---------------------------------------------------------- |
| `@citybox/ui`        | [`packages/ui/AGENTS.md`](packages/ui/AGENTS.md)               | Design system React (atomic design, Tailwind v4, OKLCH).   |
| `@citybox/mui`       | [`packages/mui/AGENTS.md`](packages/mui/AGENTS.md)             | Design system MUI (atomic design; tema pluggable por app). |
| `@citybox/messaging` | [`packages/messaging/AGENTS.md`](packages/messaging/AGENTS.md) | Wrapper RabbitMQ/AMQP (`RabbitBus`, envelope CloudEvents) + contratos tipados dos eventos de plataforma. |
| `@citybox/nest-common` | [`packages/nest-common/AGENTS.md`](packages/nest-common/AGENTS.md) | Provisionamento Keycloak compartilhado pelas verticais NestJS. |

> Estes são **todos** os packages que existem. `packages/{events,contracts,search,marketplace-projection}` já foram documentados por engano em versões anteriores e **não existem** — não crie import para eles.

### Infra

| Escopo               | AGENTS.md                            | Resumo                                                                                                       |
| -------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Infraestrutura local | [`infra/AGENTS.md`](infra/AGENTS.md) | Docker Compose por serviço: Postgres, Redis, RabbitMQ, Keycloak, Typesense, MinIO, Unleash, Metabase, Nginx. |

### Pendências de documentação

> Módulos que existem em código mas **ainda não têm `AGENTS.md`** — criar ao próximo toque relevante (ver seção 7.4):

- _(nenhuma no momento)_

---

## 5. Comandos da raiz

> Onboarding humano (Spec Kit, arquitetura FE/BE, `dev:pick`, infra): ver [`README.md`](README.md).

```bash
# Dev (Turborepo, por conjunto)
pnpm dev              # admin-api + admin-web + erp-web + erp-api + food-api + clinica-api
pnpm run dev:pick     # menu / args — sobe só os pacotes escolhidos
pnpm dev:food         # admin-api + erp-web + food-api
pnpm dev:varejo       # admin-api + erp-web + varejo-api
pnpm dev:clinica      # admin-api + clinica-api + clinica-web (app dedicado, :3113)
pnpm dev:comercio     # admin-api + erp-api + erp-web (:3107 + :3114)
pnpm dev:imoveis      # imoveis-api (3112) + imoveis-web (3111)
pnpm dev:beautiful    # beautiful-api (3173) + beautiful-web (3115)

# Qualidade (rodam em todo o workspace, --continue não para no 1º erro)
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:playwright  # E2E (@citybox/e2e-ui)

# Infra local (Docker)
pnpm infra:up         # serviços essenciais (+ fiscal-api :3116 — app Node, exceção; ver infra/AGENTS.md §3)
pnpm infra:up:full    # todos
pnpm infra:up <nome>  # um serviço isolado (ex.: pnpm infra:up fiscal-api)
pnpm infra:down
pnpm infra:status

# Reset multi-realm (destrutivo): Keycloak + DB citybox + usuário admin-web
pnpm reset:multirealm -- --yes
# VPS: pnpm reset:multirealm -- --yes --target=prod

# Banco (admin / food)
pnpm db:migrate:admin:dev
pnpm db:generate:admin
pnpm db:migrate:food:deploy

# Deploy produção aplopes
pnpm deploy:prod                 # full (infra + 6 realms Keycloak + admin + erp + fiscal + clinica + imoveis)
pnpm deploy:prod:erp             # parcial: erp-api + erp-web
pnpm deploy:prod:clinic          # parcial: clinica-api (+worker) + clinica-web (:3113) + ERP
pnpm deploy:prod:imoveis-admin-clinica  # parcial: admin-api+web + clinica-api+worker+web + imoveis-api+web
#   flags imoveis-admin-clinica: -- --admin-only | --clinica-only | --imoveis-only | --api-only | --web-only | --skip-migrations | --skip-build | --no-cache
#   flags deploy:prod:clinic: -- --api-only | -- --web-only | -- --erp-only | -- --skip-migrations | -- --skip-build | -- --no-cache
#   food-api / varejo-api: fora do deploy de produção (código legado no monorepo)

# Outros
pnpm keycloak-theme:build
pnpm harness:sync-skills   # recria symlinks de skills do Claude (.cursor/skills → .claude/skills)
```

Para rodar um único pacote: `turbo run dev --filter=@citybox/<pacote>` ou
`pnpm --filter @citybox/<pacote> <script>`.

---

## 6. Onde ficam os schemas Prisma

Não há um pacote `database` central — cada app é dono do seu schema:

| App                          | Schema                                | Âmbito            |
| ---------------------------- | ------------------------------------- | ----------------- |
| `apps/admin/api`             | `prisma/schema.prisma`                | platform (single) |
| `apps/imoveis/api`           | `prisma/schema.prisma`                | imoveis (single)  |
| `apps/erp/api`               | `prisma/schema.prisma`                | erp (single) — banco `citybox_platform` |
| `apps/verticals/food/api`    | `prisma/schema.prisma`                | food (single)     |
| `apps/verticals/clinica/api` | `prisma/schema.prisma`                | clinica (single)  |
| `apps/verticals/beautiful/api` | `prisma/schema.prisma`              | beautiful (single) |
| `apps/verticals/varejo/api`  | `prisma/schema.prisma`                | varejo (single)   |
| `apps/marketplace/api`       | `prisma/platform/` + `prisma/tenant/` | multi-schema      |
| `apps/marketplace/bff`       | `prisma/consumer/schema.prisma`       | consumer (single) |
| `apps/realtime-gateway`      | `prisma/platform/schema.prisma`       | platform          |
| `apps/workers`               | `prisma/platform/` + `prisma/tenant/` | platform + tenant |
| `services/payment-api`       | `prisma/schema.prisma`                | payment           |

Ao tocar qualquer schema, valide com o agente `database-reviewer` e atualize o `AGENTS.md`
do app dono do schema.

---

## 7. Política de manutenção dos AGENTS.md (LER)

Os `AGENTS.md` são **docs-as-code**: vivem junto do código e devem ser atualizados na
**mesma unidade de trabalho** que altera o código. Documentação desatualizada é considerada
defeito, não pendência.

### 7.1 Regra dos dois níveis

1. **Sempre** atualize o `AGENTS.md` do **módulo** onde o código mudou.
2. **Adicionalmente**, atualize **este `AGENTS.md` raiz** quando a mudança for **estrutural/global**
   (ver gatilhos em 7.2).

### 7.2 Gatilhos — o que mudou → o que atualizar

| Mudança                                                    | Atualize o AGENTS.md do módulo                           | Atualize também a raiz?                                    |
| ---------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------- |
| Nova feature / módulo / endpoint / tela                    | ✅ seção "Módulos Implementados" / "Módulos e Endpoints" | Não (salvo se mudar o propósito do app)                    |
| Mudança de stack/dependência relevante                     | ✅ seção "Stack e Versões"                               | Só se afetar a stack global (seção 2)                      |
| Nova/alterada variável de ambiente                         | ✅ seção "Variáveis de Ambiente"                         | Não                                                        |
| Nova restrição/armadilha (build/runtime)                   | ✅ seção "Restrições Críticas"                           | Não                                                        |
| Mudança de **porta**                                       | ✅ seção "Identidade"                                    | ✅ **seção 3** (mapa de portas)                            |
| Mudança no **schema Prisma**                               | ✅ módulo dono                                           | ✅ **seção 6** se mudar a estratégia (single↔multi-schema) |
| **Novo app / package / serviço / vertical**                | ✅ criar o AGENTS.md (ver 7.4)                           | ✅ **seção 4** (índice) + seção 3 (porta)                  |
| Remoção de app/package                                     | ✅ remover/arquivar                                      | ✅ **seção 4**                                             |
| Mudança de infra (novo serviço Docker, porta, dependência) | ✅ `infra/AGENTS.md`                                     | ✅ se afetar portas/serviços globais                       |
| Mudança em comando/script da raiz                          | —                                                        | ✅ **seção 5**                                             |
| Decisão de arquitetura não-óbvia                           | ✅ seção "Decisões de Arquitetura" + "Histórico"         | Só se cross-cutting                                        |

> Regra prática: **se um agente futuro precisaria saber disso para não errar, documente.**

### 7.3 Como atualizar um AGENTS.md

- Atualize **apenas as seções afetadas**; nunca remova seções existentes.
- Atualize o campo **"Última atualização deste arquivo"** na seção 1 (Identidade).
- Registre mudanças **estruturais** (não features triviais) na seção "Histórico de Mudanças Estruturais".
- Mantenha o documento factual: porta, versão, caminho e nome de pacote devem bater com o código.

### 7.4 Criar um novo AGENTS.md

Ao adicionar um novo app/package/serviço/vertical:

1. Crie `AGENTS.md` na raiz do módulo seguindo o **template de 12 seções** já usado
   (Identidade · Posição no Monorepo · Stack e Versões · Estrutura de Pastas ·
   Restrições Críticas · Padrões de Código · Variáveis de Ambiente · Scripts ·
   Módulos Implementados · Decisões de Arquitetura · Contexto para a IA ·
   Histórico de Mudanças Estruturais). Use um `AGENTS.md` existente de tipo equivalente
   (NestJS API → `apps/admin/api/AGENTS.md`; Next.js → `apps/erp/web/AGENTS.md`;
   package → `packages/messaging/AGENTS.md`) como base.
2. Inclua o cabeçalho-padrão de "Para agentes de IA" com a política de manutenção.
3. Registre o módulo na **seção 4** (índice) e na **seção 3** (porta) deste arquivo.

### 7.5 Checklist antes do commit/PR

- [ ] `AGENTS.md` do(s) módulo(s) tocado(s) reflete o estado atual do código.
- [ ] Se houve mudança estrutural/global, a raiz foi atualizada (seções 3/4/5/6 conforme 7.2).
- [ ] "Última atualização" e "Histórico" ajustados quando aplicável.
- [ ] Nomenclatura mantida: o arquivo se chama **`AGENTS.md`** (plural) em todos os níveis.

---

## 8. Convenções e processo

- Padrões de código, design system, fluxo `/feature` e `/bugfix`, gates obrigatórios
  (`database-reviewer`, `react-reviewer`, etc.) e harness dual Cursor + Claude Code estão
  documentados em **[`CLAUDE.md`](CLAUDE.md)** e nas regras ECC em `.claude/rules/ecc/`.
- Instruções específicas do harness ECC (agents, skills, política de manutenção destes
  arquivos do ponto de vista do agente) estão em **[`.claude/AGENTS.md`](.claude/AGENTS.md)**.
- **Nunca commitar sem autorização explícita** do usuário.

### 8.0 Spec Kit (specs por escopo)

Spec-Driven Development via [Spec Kit](https://github.com/github/spec-kit): tooling em
`.specify/` (raiz única). Artefatos de feature em **`specs/<escopo>/<NNN>-<nome>/`** —
nunca soltos em `specs/`. Catálogo e regras: [`specs/README.md`](specs/README.md) e
[`.specify/scopes.json`](.specify/scopes.json). Criar feature com
`--scope` obrigatório (`create-new-feature.sh` ou `/speckit-specify`).

### 8.1 Listagens tabulares — busca e paginação **sempre no backend**

> Política transversal (ERP, BFF, APIs Nest). Violação comum: carregar a coleção inteira e
> filtrar/paginar com `.filter()` / `.slice()` no React.

**Backend (obrigatório):**

- Endpoints `GET` de listagem expõem query params: `page`, `perPage`, `search` (quando aplicável),
  `sortBy`, `sortOrder`.
- Repositório aplica `skip`/`take`, `WHERE` de busca e `ORDER BY` no banco — nunca retornar a
  tabela inteira para o cliente paginar.
- Resposta envelope: `{ data: T[], meta: { total, page, perPage, totalPages } }` (padrão food /
  pacientes / orçamentos na `clinica-api`).

**Frontend (obrigatório):**

- Estado de UI (`search`, `page`, `perPage`, `sort`) → query params na requisição (debounce **400ms**
  na busca via `useDebouncedSearch`; **nunca** passar o valor do input direto para a query).
- Tabela renderiza **somente** `data` da página atual; totais vêm de `meta`.
- **`DataTable` com paginação externa:** passar `manualPagination`, `pageIndex`, `pageCount` e `totalRowCount` — sem isso o TanStack Table fatia no cliente com `pageSize` fixo (10) e ignora `perPage` da API.
- **Proibido:** `filter*`, `search*`, `paginate*` client-side sobre listas vindas de API;
  **proibido:** `useMemo(() => items.slice(...))` para paginação de dados persistidos.

**Referências implementadas:** `GET /v1/patients`, `GET /v1/patients/:id/budgets`, `GET /v1/patients/:id/anamneses`, `GET /v1/patients/:id/financial-entries`, `GET /v1/patients/:id/contracts|prescriptions|certificates`, `GET /v1/stock-products`, `GET /v1/stock-movements` (`clinica-api`);
`patients-table.tsx`, `patient-budgets-table.tsx`, `patient-anamneses-table.tsx`, `patient-financial-table.tsx`, `patient-documents-tab.tsx`, `stock-table`, `withdrawal-table` (`@citybox/erp` — tabelas server-side com `manualPagination`).

---

## 9. Histórico de Mudanças Estruturais

> Registro de mudanças que afetam o contexto da IA — não é changelog de features.

| Data       | Mudança | Impacto |
| ---------- | ---------------------------------------------------- | -------------------------------- |
| 2026-08-14 | **Achado — merge de `main` em `feat/fiscal-api` (`a8041435b`) chegou parcialmente quebrado, sem `<<<<<<<` sobrando na maior parte, e sem avisar:** (1) `authenticated-user.ts` tinha marcador de conflito literal não resolvido (`azp`/`applyActingSub` do BUG-01 vs. `clientId` do refactor M2M) — build falhava; resolvido mantendo os dois campos, ambos usados por consumidores diferentes (`TrustedSystemCompanyAccessPolicy` lê `clientId`, `applyActingSub` lê `azp`). (2) O refactor `ee698de21` apagou `use-fiscal-company.ts` + `findFiscalCompanyByCnpjApi` (migrou "Emitido" do facilita-nfe pro padrão erp-api-resolve-companyId) mas **não migrou as outras 6 telas fiscais** (certificados, séries, NFS-e, tipo de NF do PDV, regime do Emitente) que ainda dependem desse hook — restaurados como estavam; essas 6 telas seguem no padrão anterior (proxy + `fiscal-tenant-guard.ts`, já revisado por segurança em 2026-08-13), não no novo. (3) **Mais grave:** os bancos `fiscal` e `erp` do Postgres estavam com a cadeia de migrations **travada em ~2026-08-08/13**, faltando 3 migrations em `fiscal` e 8 em `erp` (provavelmente de um `pnpm reset:multirealm` ou `deploy:prod` rodado por outra sessão/processo entre migrations, sem `migrate deploy` de acompanhamento) — código e Prisma Client já esperavam colunas/tabelas que não existiam na DB real (`fiscal.companies.inutilization_justification`, `erp.memberships.pdv_code`, etc.); teria causado erro 500 em produção na primeira leitura/escrita dessas colunas. Corrigido com `prisma migrate deploy` nos dois bancos antes do redeploy. **Recomendação para sessões futuras:** depois de qualquer `reset:multirealm`/`deploy:prod`/reset manual de banco, rodar `prisma migrate status` (ou `migrate deploy`) em cada schema tocado antes de assumir que o schema está em dia — `git status` limpo e containers "healthy" não garantem isso | `services/fiscal-api/src/shared/infra/http/auth/authenticated-user.ts`; `apps/erp/web/src/features/facilita-nfe/{hooks/use-fiscal-company.ts,api/facilita-nfe.service.ts}`; `apps/erp/web/AGENTS.md` |
| 2026-08-14 | **Achado (spec `erp/023`, N2) — `deploy:prod:erp`/`scripts/deploy/aplopes-erp.sh` não inclui `fiscal-api`**, mesmo `erp-web` dependendo dela (`FISCAL_API_URL`, `depends_on: fiscal-api` no compose) desde a spec `009-facilita-nfe-screen`: um deploy de `erp-web` sozinho pelo script "certo" fica com o backend fiscal desatualizado sem nenhum aviso — foi exatamente o que aconteceu na sessão da spec `022` (rebuildou fiscal-api+erp-web via `docker compose` manual, esqueceu `erp-api`, e o script `deploy:prod:erp` não teria avisado porque nem builda `fiscal-api`). **Não corrigido nesta sessão** (mudar o script de deploy de produção sem testar ao vivo é risco maior que o benefício aqui) — fica registrado como gate pendente: `scripts/deploy/aplopes-erp.sh` deveria buildar+subir `fiscal-api` junto (ou pelo menos falhar o health-check se ela estiver desatualizada/fora do ar), e qualquer sessão futura que rebuildar `erp-web`/`erp-api` manualmente deve lembrar de subir `fiscal-api` junto se algo nela também mudou na mesma sessão | `scripts/deploy/aplopes-erp.sh`; `services/fiscal-api/AGENTS.md`; `apps/erp/web/AGENTS.md` |
| 2026-08-14 | **`pnpm reset:multirealm`:** reset destrutivo Keycloak + DB `citybox` + usuário `platform_admin` do admin-web (`scripts/dev/reset-multirealm.sh`) | Onboarding de devs; imprime checklist de `.env` ao final |
| 2026-08-14 | **Deploy multi-realm + reset validado:** `deploy:prod` sincroniza seis realms, usa clients por sistema e aplica migrations fresh de `platform`, `erp`, `clinica`, `imoveis`, `beautiful` e `fiscal`; fiscal-api entra no build/up/health do full | Produção deixa `citybox-dev`; fresh migration chain testada em banco temporário |
| 2026-08-12 | **`deploy:prod` sem food/varejo + com imóveis:** full sobe admin + erp + clínica + imóveis; migrations/seeds/health alinhados; containers legados food/varejo são parados | Índice §5; `scripts/deploy/*` |
| 2026-08-11 | **Beautiful CASL (`@citybox/beautiful-permissions`):** PermissionGuard + Equipe checkboxes + nav/`Can` | Índice §4 beautiful permissions |
| 2026-08-10 | **Beautiful no catálogo admin + store-setup:** `StoreVertical='Beautiful'`; fila `beautiful.store-setup`; M2M owner; `BEAUTIFUL_API_URL` | Índice §4; admin + beautiful AGENTS |
| 2026-08-09 | **`fiscal-api` ganha cupom fiscal eletrônico** (`specs/005-nfce-cupom-fiscal`): NFC-e modelo 65 em `/v1/nfce` (emitir, consultar, DANFCE em bobina e A4, cancelar em **30 min** — não 24h —, inutilizar), CSC cifrado no Emitente e fila **persistente** de contingência. Migration `20260808200000_nfce_cupom_fiscal`. Reusa NF-e onde o documento é o mesmo (XSD, webservice, certificado, consulta, cancelamento); código próprio só onde a NFC-e difere. 🟡 **Nenhum cupom transmitido ao órgão** — o hash do QR Code e a contingência não foram exercitados contra a SEFAZ. ⚠️ Dois achados que extrapolam a feature: `mod = '55'` estava **fixo** no envelope de inutilização (inutilizar faixa de cupom teria queimado a faixa de NF-e junto ao fisco), e `POST /v1/nfe` segue aceitando `companyId` no corpo **sem checagem de política** — a rota de NFC-e foi feita com `CompanyAccessPolicy`, a de NF-e não foi alterada por ser mudança de contrato em caminho já em uso | `services/fiscal-api/AGENTS.md` (seções 4/5/8); Índice §4 |
| 2026-08-08 | **`fiscal-api` ganha documento auxiliar impresso** (`specs/004-danfe-documento-auxiliar`): `GET /v1/nfe/:id/danfe` e `GET /v1/nfse/:id/danfse` geram o PDF a partir do **XML autorizado** — nada persistido, sem migration. DANFE via biblioteca MIT que implementa o leiaute regulado; DANFSE próprio (as opções de mercado não têm repositório auditável). Marca d'água em homologação e marca Citybox no rodapé, ambas como estágios independentes do renderizador. ⚠️ Estas duas rotas **verificam o emitente pelo `sub` do JWT** (via `platform.store_members`), diferente das rotas de XML, que seguem com o header não verificado do v1 — divergência deliberada, o produto delas sai da plataforma | `services/fiscal-api/AGENTS.md` (seções 4/5); Índice §4 |
| 2026-08-07 | **Imóveis store-setup:** consumer `imoveis.store-setup` + M2M owner + `IMOVEIS_API_URL` no admin; binding RabbitMQ | Fecha gap PROVISIONING / Gerar senha |
| 2026-08-05 | **`fiscal-api` sobe com `pnpm infra:up`**: novo `infra/fiscal-api/docker-compose.yml` + `.env.example`, e `fiscal-api` no **fim** de `CORE_SERVICES` (`infra/scripts/up.sh`). Abre **exceção explícita** à separação infra/app (o lugar canônico de app Node segue sendo `infra/deploy/docker-compose.apps.yml`) — decisão do usuário; não replicar para outros apps sem a mesma decisão. `services/fiscal-api/Dockerfile` corrigido com `apk add python3 make g++` no estágio `deps` (o build falhava em `libxmljs2`). ⚠️ Validado só por `docker compose config` — build/boot não executados (sem acesso ao socket do Docker no ambiente) | Índice §5 (`infra:up`); `infra/AGENTS.md` §3/§5.7/§12; `services/fiscal-api/AGENTS.md` §6/§8 |
| 2026-08-05 | **Spec Kit monorepo:** specs por escopo em `specs/<escopo>/`; `--scope` obrigatório; `001-store-billing-unit` → `specs/_platform/` | `.specify/scopes.json`, `specs/README.md`, §8.0 |
| 2026-08-04 | **Novo serviço `fiscal-api`** (`services/fiscal-api`, `@citybox/fiscal-api`, porta `3116`): microserviço standalone de emissão de documentos fiscais (NF-e/NFS-e), Fase 1 (Setup) do `specs/002-fiscal-api/tasks.md` concluída — apenas scaffold, sem módulos de negócio ainda. Schema Prisma próprio `fiscal` no banco `citybox` compartilhado (não um banco dedicado). Glob `"services/*"` adicionado ao `pnpm-workspace.yaml` (o glob preexistente `apps/services/*` é morto/não usado) | Índice §3/§4; `services/fiscal-api/AGENTS.md`; `infra/AGENTS.md` (bucket MinIO `fiscal`) |
| 2026-08-03 | Vertical **Beautiful** scaffold: `apps/verticals/beautiful/{web,api}` — Next `@citybox/mui` (:3115) + Nest Clean Arch schema `beautiful` (:3173), sem auth | Índice §3/§4/§6; `pnpm dev:beautiful` |
| 2026-08-03 | **Permissões CASL** como única fonte de verdade da vertical Clínica (`@citybox/clinica-permissions`); removidas strings legadas `store.clinic.*` | Índice §4 clinica permissions; api/web AGENTS |
| 2026-07-31 | **Rename `apps/platform` → `apps/admin`:** sub-apps `api/` (inalterado) e `admin/` → `web/`. Pacote `@citybox/platform-api` → `@citybox/admin-api` (`@citybox/admin-web` já seguia o padrão); portas (3103/3108), schema Postgres (`platform`) e clients Keycloak (`citybox-admin`/`citybox-core-admin`) mantidos sem alteração; scripts `db:migrate:platform:*`/`db:generate:platform` da raiz renomeados para `db:migrate:admin:*`/`db:generate:admin` | Ver `apps/admin/AGENTS.md` §9, `apps/admin/api/AGENTS.md` §12, `apps/admin/web/AGENTS.md` §12; mesmo padrão do rename `apps/erp-comercio` → `apps/erp` (linha abaixo) |
| 2026-07-31 | **Remoção do `apps/erp` legado (shell multi-vertical, :3107) + rename `apps/erp-comercio` → `apps/erp`:** conjunto web+api assume o nome/porta do legado removido. Pacotes `@citybox/erp-comercio-web`/`-api` → `@citybox/erp-web`/`@citybox/erp-api`; portas 3110/3111 → 3107/3114 (evita a colisão pré-existente entre a antiga 3111 e `imoveis-web`); client Keycloak `citybox-backoffice` (do legado) reaproveitado pelo `erp-web`, `citybox-erp-comercio` aposentado; infra de deploy de produção (Dockerfile, docker-compose, nginx, scripts) migrada do legado para o conjunto novo | Ver `apps/erp/AGENTS.md` §9, `apps/erp/web/AGENTS.md` §12, `apps/erp/api/AGENTS.md` §12; identificadores internos do código (`comercioFetch`, `/api/proxy/comercio`, etc.) não foram renomeados |
| 2026-07-30 | **Marketing Aniversariantes WhatsApp (clínica):** tipo `aniversario` + dispatch 1 msg / 5 min a partir 07:00 BRT; lista de mensagens; UX dashboard Conversar/cashflow | Ver `clinica-api` + ERP clinic AGENTS + wiki-erp-clinic |
| 2026-07-31 | **imoveis settings:** models `StoreSettings`/`AgentProfile`/`AgentLegalDocument` (migration `add_settings`) + módulo `settings` na `imoveis-api` — `/v1/settings/store` e `/v1/settings/profile/:agentId` (foto e documentos legais em MinIO); web: forms Listify + wire sistema/notificações/perfil | Ver `apps/imoveis/api` + `apps/imoveis/web` AGENTS |
| 2026-07-30 | **imoveis search FTS + reminders:** `search_vector` + `GET /api/v1/search` + `GET /api/v1/reminders`; web busca/header/leads | Ver `apps/imoveis/api` + `apps/imoveis/web` AGENTS |
| 2026-07-30 | **imoveis dashboard:** `GET /api/v1/dashboard/overview` (agregação KPIs/chart/previews/reminders; receita = finance/summary); web `dashboard-service` → API | Ver `apps/imoveis/api` + `apps/imoveis/web` AGENTS |
| 2026-07-30 | **imoveis transactions + finance:** schema Prisma `Transaction` (+ activity/commission-config/expenses); HTTP `/api/v1/transactions*` + `/api/v1/finance*` ; web Negócios/Financeiro → API real (sai do localStorage) | Ver `apps/imoveis/api` + `apps/imoveis/web` AGENTS |
| 2026-07-30 | **Catálogo de verticais reduzido a duas:** `StoreVertical = 'Comércio' \| 'Clínica'`. `Food`+`Varejo` fundem em `Comércio` (slug `comercio`, role `vertical.comercio.view`); `Educação` e `Serviços` saem. Alcança `platform-api` (entity/catálogos/DTO/validator/permissions), `admin-web` (tipos, schemas, seletores, filtros, mocks), `@citybox/messaging` (`StorePlatformVertical`), `@citybox/ui` (`VERTICAL_STYLES`), `erp-comercio-api` (`HANDLED_VERTICALS = ['Comércio']`) e o realm Keycloak (só `vertical.comercio.view` e `vertical.clinic.view`) | Uma vertical por **sistema**, não por ramo. `Store.vertical`/`Plan.vertical` são `String` no Prisma — **sem migration**. `apps/verticals/food/api` vira código morto (fila sem evento) mas **não foi removida**. `Imóveis` fica fora até ter tenancy + consumidor próprios |
| 2026-07-29 | **WhatsApp Clínica Baileys MVP:** processo `main-whatsapp` + filas RabbitMQ + ERP settings/agenda/ficha | Ver `clinica-api` + ERP clinic AGENTS |
| 2026-08-03 | **clinica-web em produção (clinica.aplopes.com):** serviço `web` no compose da vertical; nginx host → :3113; `CLINICA_ORIGIN` no env + sync-realm Keycloak | Subdomínio deixa o CRM Odonto legado e passa a servir `@citybox/clinica-web` |
| 2026-07-29 | **Frontend da clínica desacoplado do ERP:** novo `@citybox/clinica-web` (`apps/verticals/clinica/web`, Next.js 16, porta 3113) com auth Keycloak/PKCE + BFF (`/api/auth/*`, `/api/proxy/{clinica,platform}`) próprios. Rotas do backoffice migradas de `/clinic/*` para a **raiz** (`/`, `/pacientes`, `/agenda`, …); rotas públicas (`/campanha/[clinic]/[slug]`, `/public/clinic/anamnese/[token]`) e caminhos `/api/*` inalterados. Workspace glob `apps/verticals/*/web`; redirect URIs 3113 no realm. `apps/erp` **não foi alterado** — módulo `clinic` segue funcionando lá até remoção em passo separado | Ver [`apps/verticals/clinica/web/AGENTS.md`](apps/verticals/clinica/web/AGENTS.md) |
| 2026-07-29 | **imoveis appointments (agenda):** schema Prisma `Appointment` + HTTP `/api/v1/appointments`; web `calendar-service` → API real (sai do `imoveis.calendar.v2`) | Ver `apps/imoveis/api` + `apps/imoveis/web` AGENTS |
| 2026-07-29 | **imoveis fotos + documentos em MinIO:** `StorageModule`, endpoints multipart `…/photos` e `…/documents` (object key + `mime_type` no Prisma); `documents` fora do payload de create/update; web envia arquivos no save e lê via blob autenticado | Ver `apps/imoveis/api` + `apps/imoveis/web` AGENTS |
| 2026-07-29 | **imoveis-api properties + web:** schema Prisma `Property` (+ photos/documents/activeLeads); HTTP `/api/v1/properties` + sync catálogo; web `properties-service` → API real | Ver `apps/imoveis/api` + `apps/imoveis/web` AGENTS |
| 2026-07-28 | **imoveis-api leads + web:** schema Prisma `Lead` + relações (agents/properties/documents/activities); HTTP `/api/v1/leads`; web `leads-service` → API real | Ver `apps/imoveis/api` + `apps/imoveis/web` AGENTS |
| 2026-07-28 | **Criação `@citybox/imoveis-api`:** scaffold NestJS completo com shared/core, shared/infra (Prisma, Keycloak JWT, guards, decorators, exception filter), módulo `example` em 3 camadas (domain/application/infrastructure), schema Prisma `imoveis`, porta 3112 | Nova API da vertical imóveis pronta para implementação |
| 2026-07-28 | **Deploy parcial clínica:** `pnpm deploy:prod:clinic` (API+worker + ERP; `--api-only`/`--erp-only`) | Iteração sem `deploy:prod` full |
| 2026-07-28 | Deploy clinica: `clinica_api_worker` no compose + health; bind `clinic.store-setup` | Seeds first-contact passam a rodar ao criar clínica no admin |
| 2026-07-27 | **store-setup clínica first-contact:** worker `clinic.store-setup` + seed equipe Keycloak no create de loja Clínica; template v3 (Particular, agenda wall-clock, `store_members.id`) | Ver `clinica-api` + `platform-api` AGENTS |
| 2026-07-26 | **Marketplace consumidor live:** BFF reescrito para o contrato `docs/openapi.yaml` (auth Keycloak DAG, catálogo/carrinho/checkout/pedidos/conta/engajamento; schema Postgres `consumer`; carrinho `x-session-id` removido); web/iOS/Android ganharam modo live (web `VITE_API_MODE=live` + `/api` same-origin; iOS `ApiClient` + Keychain; Android `data/api`); deploy em `citybox.com.br` (web) + `citybox.com.br/api` (BFF). | Ver `apps/marketplace/bff/AGENTS.md` (reescrito) |
| 2026-07-23 | Otimização de Consultas de Banco no Dashboard (platform-api) | Otimização do caso de uso do Dashboard para reduzir consultas redundantes no Postgres. Agrupados contadores de clientes e lojas via agregadores (`groupBy`), e agrupados contadores mensais em duas queries em lote, economizando 19 queries redundantes. |
| 2026-07-23 | Integração de Dashboard e Auditoria (platform-api + admin-web) | Conexão do backend e frontend para o Dashboard de operação (/v1/dashboard/summary) e Auditoria global (/v1/platform/audit). Implementados use cases, rotas, presenters, testes unitários, hooks do React Query, sincronismo de filtros por URL e busca com debounce. |
| 2026-07-27 | Pacote **`@citybox/mui`** (`packages/mui`): design system MUI em atomic design com tema pluggable (`createAppTheme` + `CityboxMuiProvider`) — cada frontend define o próprio tema | Índice §4 Packages; complementar a `@citybox/ui` (Tailwind/shadcn); sem consumidor ainda |
| 2026-07-27 | **Catálogo do ERP Comércio passa a ser por empresa, com vínculo por unidade:** `Product`/`ProductCategory`/`UnitOfMeasure` migram de `storeId` para `organizationId`; novos models `ProductBranch`, `Supplier`, `SupplierBranch`, `ProductSupplier`; módulo `suppliers` na API; o header `X-Store-Id` deixa de existir | Um produto agora pertence à empresa e opera em N unidades; SKU passa a ser único na empresa. O banco de dev foi **resetado** e o `db:seed` do erp-comercio virou o provisionador do ambiente (organização, unidades, responsável, catálogo e fornecedores) |
| 2026-07-27 | **ERP Comércio ganha login Keycloak:** client `citybox-erp-comercio` no realm (`infra/keycloak`), BFF de sessão no `erp-comercio-web` (PKCE + cookies httpOnly), `src/proxy.ts` protegendo as rotas e seletor de empresa/unidade sobre a API | O app na porta 3110 deixa de ser aberto e o **dev-bypass do proxy foi removido**. `sync-realm.mjs` provisiona o client novo; envs de Keycloak no `.env.example` do web |
| 2026-07-27 | **ERP Comércio vira multi-empresa:** módulo `tenancy` na `erp-comercio-api` (models `Organization`/`Branch`/`User`/`Membership`/`BranchAccess` no schema **`erp`**, 14 rotas, contexto de tenant por `AsyncLocalStorage`, filtro global por organização na camada Prisma, `KeycloakAdminService` com senha provisória) | **Separação firmada: Keycloak autentica, banco do ERP autoriza** — papel de ERP não vira role de Keycloak. Rotas de negócio da `erp-comercio-api` passam a exigir `X-Organization-Id`; o `catalog` segue em `X-Store-Id` até fase própria de migração. Novas envs `KEYCLOAK_ADMIN_CLIENT_ID/SECRET`. Detalhes em `apps/erp-comercio/api/AGENTS.md` §5.10 |
| 2026-07-27 | **Módulo Produtos ponta a ponta no ERP Comércio:** `catalog` na `erp-comercio-api` (models `Product`/`ProductCategory`/`UnitOfMeasure` no schema **`erp`**, 9 rotas store-scoped, 42 testes, seed) + integração no `erp-comercio-web` (proxy `/api/proxy/comercio`, **@tanstack/react-query** + **zustand**) | Primeira feature do ERP Comércio fora do mock. `erp-comercio-web` ganha React Query e Zustand; schema Postgres do app é `erp` (não `erp_comercio`) no banco `citybox_platform`. Plano: `.claude/plans/erp-comercio-produtos.plan.md` |
| 2026-07-26 | `apps/erp-comercio/api` criada: scaffold NestJS Clean Architecture (réplica de `apps/verticals/food/api` — `shared/core`+`domain`+`infra`, Prisma 7 schema `erp_comercio` sem models, guards Keycloak globais); pacote `@citybox/erp-comercio-api`, porta **3111** | Índice §3/§4/§6; conjunto `apps/erp-comercio` (web+api) completo estruturalmente; zero módulos de negócio, sem integração com o `web/` ainda |
| 2026-07-26 | Reestruturação **`apps/erp-comercio`** → **`apps/erp-comercio/web`**; pacote renomeado `@citybox/erp-comercio` → `@citybox/erp-comercio-web`; `pnpm-workspace.yaml` ganha `apps/erp-comercio/*` | Prepara o diretório para acomodar também `apps/erp-comercio/api`; índice §3/§4 atualizados |
| 2026-07-22 | App **`@citybox/erp-comercio`** (`apps/erp-comercio`, porta **3110**): scaffold Next + `@citybox/ui` | Índice §3/§4; DS integrado; domínio/auth ainda pendentes |
| 2026-07-16 | Cobrança avulsa no Asaas via `CreateManualInvoiceUseCase` | Faturas manuais agora são registradas no Asaas via `paymentGateway.createInvoice()` quando o cliente possui `gatewayCustomerId`. Mapeamento de status gateway→local (PAID/_OVERDUE/CANCELLED/REFUNDED). `InvoicesModule` importa `PaymentGatewayModule`. `Invoice` ganha `setGatewayPaymentId()`|
| 2026-07-16 | Integração Asaas & Provisionamento Assíncrono | Novo módulo `payment-gateway` com provedor Asaas e endpoint de Webhook. Adicionado `ClientCreatedListener` e evento `client.created` para provisionar clientes/assinaturas no Asaas assincronamente. Campos de Stripe renomeados para genéricos (`gatewayCustomerId`/`gatewaySubscriptionId`/`gatewayPaymentId`). |
| 2026-07-16 | **Marketing ponta a ponta:** formulário público/views/submissões, duplicidade, CRM, status por limite/período, URLs externas e QR Code | `clinica-api` + ERP clinic |
| 2026-07-16 | **Marketing — ERP integrado (`form_lead`):** `campaigns.api.service` + hooks | ERP `features/clinic/marketing` + `clinica-api` |
| 2026-07-16 | **Marketing — Formulário de Leads (`form_lead`):** model `Campaign` + Zod content + `POST/GET/PATCH status` `/v1/campaigns`; migration manual; ERP ainda mock | `clinica-api` `modules/marketing/campaigns` |
| 2026-07-16 | **Marketing — Tipo da campanha:** enums Prisma + catálogo + `GET /v1/campaign-types` (migration manual; configs por tipo = fases futuras) | `clinica-api` `modules/marketing` |
| 2026-07-15 | CLIN-062 Comissões: motors debit/approve/finalize; migration única `20260715165240_add_commissions` (source refs); histórico agregado; regras identidade Equipe                                                                                      | clinica-api + ERP clinic                                                                                                                                                                                                                                   |
| 2026-07-15 | Implementação da Fatura Manual (platform-api + admin-web)                                                                                                                                                                                           | Finalizada a implementação de geração de faturas manuais na platform-api (POST /v1/invoices/manual) com vencimento para o próximo mês e integrada no frontend admin-web.                                                                                   |
| 2026-07-14 | ERP CLIN-061: Transações via `v1/financial/entries` + `by-payment-method`                                                                                                                                                                           | CLIN-061 Transações API                                                                                                                                                                                                                                    |
| 2026-07-13 | ERP CLIN-061: fluxo de caixa + config contas/categorias via `v1/financial/*`; ficha receive usa mesmas contas; UX sheets/category select/header ficha                                                                                               | CLIN-061 (Transações completadas 2026-07-14)                                                                                                                                                                                                               |
| 2026-07-14 | Rota de Detalhamento de Membro (GET /v1/clients/members/:id)                                                                                                                                                                                        | Criado o endpoint de detalhes do membro no backend (`platform-api`) e integrado no frontend (`admin-web`) para exibição de dados ricos do membro e suas lojas.                                                                                             |
| 2026-07-14 | Rota de atribuição de membros em lote (PATCH /v1/clients/members/:id/assignments)                                                                                                                                                                   | Desenvolvido endpoint em platform-api e integrado em admin-web para atualização atômica de remoções, edições e adições de lojas e cargos.                                                                                                                  |
| 2026-07-14 | Rota de criação de membro (POST /v1/clients/:id/members)                                                                                                                                                                                            | Desenvolvido endpoint na api e integrado no painel de operadores para cadastrar um membro e associá-lo a várias lojas em lote.                                                                                                                             |
| 2026-07-14 | Componente de Visualização/Edição de Detalhes de Membro                                                                                                                                                                                             | Adicionado o componente `MemberDetailSheet` na aba de usuários de detalhes de cliente. Suporta visualizar e editar (com chaves de acesso a lojas e cargo por loja) e salva alterações atualizando o cache local do React Query.                            |
| 2026-07-14 | Faturas antecipadas na cobrança (platform-api)                                                                                                                                                                                                      | Novo utilitário `generateUpfrontInvoices()` que gera 12 faturas mensais ou 1 fatura anual no cadastro/atualização de plano. Sem geração automática recorrente. Afeta `CreateClientUseCase` e `UpdateClientUseCase`.                                        |
| 2026-07-13 | ERP CLIN-061: fluxo de caixa + config contas/categorias via `v1/financial/*`; ficha receive usa mesmas contas; UX sheets/category select/header ficha                                                                                               | CLIN-061 parcial (transações UI placeholder)                                                                                                                                                                                                               |
| 2026-07-13 | **Ledger unificado clínica:** `FinancialEntry` + `v1/financial/*`; ficha usa a mesma tabela; migration pelo operador                                                                                                                                | `clinica-api` módulo `financial`; ERP caixa integrado                                                                                                                                                                                                      |
| 2026-07-13 | **Vendas CRM:** API sales + ERP; `sortOrder`/`reorder`; Agendada/Perdida fixas; período custom dia civil BRT; wiki `25-crm-funil-vendas` atualizada                                                                                                 | `clinica-api` `sales`, `features/clinic/vendas`, wiki-erp-clinic                                                                                                                                                                                           |
| 2026-07-13 | **Vendas CRM:** backend `sales` na clinica-api + integração ERP (`sales.api.service.ts`); mock removido                                                                                                                                             | `clinica-api` módulo `sales`, `features/clinic/vendas`                                                                                                                                                                                                     |
| 2026-07-10 | Refatoração de equipe e vinculação múltipla de lojas (Batch)                                                                                                                                                                                        | Migração para N:N de Store/Member na `platform-api` + proteção de e-mails. Novo fluxo com abas (Usuário existente/Novo), multi-seleção de operadores com cargos/permissões individuais e endpoint POST de vinculação em lote na API.                       |
| 2026-07-10 | Config clínica: soft-delete equipe (platform `StoreMember`); deletes 409 planos/anamneses/contratos; categorias paciente/agendamento sem sync; seed anamnese ~15; `planStatus` na ficha Sobre; overlap test sequencial (EXCLUDE DB pendente no ADR) | `platform-api`, `clinica-api`, `features/clinic/modules/settings` + wiki clinic                                                                                                                                                                            |
| 2026-07-09 | Migração de Status de Loja                                                                                                                                                                                                                          | Atualização das referências de status de loja no frontend (`admin-web`) para suportar o novo enum `StoreStatus` (`IN_SETUP`, `TRAINING`, `PRODUCTION`, `BLOCKED`, `OFFLINE`) em substituição aos valores antigos (`ativa`, `bloqueada`, `em_implantacao`). |
| 2026-07-09 | **Estoque ERP + API:** integração `clinicaFetch`; paginação/busca/ordenação server-side; histórico retiradas com filtro de data (dia civil); tabelas com `erpDataTableStyleProps`                                                                   | `features/clinic/estoque`, `clinica-api` módulo `stock`                                                                                                                                                                                                    |
| 2026-07-09 | **Agenda — compromissos bloqueiam consultas** (API + ERP); fuso wall-clock (`parseClinicDateTime` / `clinic-datetime.ts`); alertas retorno ficha+agenda; `returnAlertId` remove alerta ao agendar                                                   | `clinica-api` scheduling + `features/clinic/agenda`                                                                                                                                                                                                        |
| 2026-07-08 | Otimização na aba de Assinaturas (Junção/Join de tabelas no backend)                                                                                                                                                                                | A listagem de assinaturas no admin-web agora consome dados do plano e cliente agregados em uma única requisição HTTP para a API de assinaturas, eliminando consultas em lote paralelas no frontend.                                                        |
| 2026-07-08 | Módulo de invoices na platform-api com CRUD, KPIs e job de faturamento                                                                                                                                                                              | Mudança no Prisma schema (tabelas `invoices` e `InvoiceStatus` enum), com novos endpoints e testes unitários.                                                                                                                                              |
| 2026-07-08 | **CLIN-021 refinamentos:** datas locais no ERP (`local-date.ts`); modal slots manhã/tarde; espelhamento appointment-categories ← patient-categories; UX sheet compromisso/consulta                                                                  | `features/clinic/agenda`                                                                                                                                                                                                                                   |
| 2026-07-08 | **CLIN-020:** `available-slots` step = `durationMin`; sync categorias de agendamento no GET                                                                                                                                                         | `clinica-api` scheduling                                                                                                                                                                                                                                   |
| 2026-07-07 | **CLIN-021:** ERP agenda integrada (`agenda/api/*` → `clinicaFetch`; mock removido)                                                                                                                                                                 | `features/clinic/agenda`, hooks com `useStore()`                                                                                                                                                                                                           |
| 2026-07-07 | **CLIN-020:** backend agenda na `clinica-api` (`scheduling`: appointments, categories, internal-events, fit-ins, return-alerts, available-slots; EXCLUDE anti-overlap)                                                                              | ERP integração agenda = CLIN-021                                                                                                                                                                                                                           |
| 2026-07-07 | Backend + ERP **Arquivos do paciente** (`patient-files`): drive store-scoped, upload MinIO multipart, migration `20260707144451_add_patient_files`; ERP via `patient-files.service` + React Query; busca server-side §8.1                           | `clinica-api` submódulo + aba `/arquivos`; wiki `24-arquivos-paciente`                                                                                                                                                                                     |
| 2026-07-07 | ERP: integração aba **Financeiro da ficha** (CLIN-061); `manualPagination` nas tabelas server-side (orçamentos, anamnese, financeiro); badge "Em breve" removido da aba Financeiro                                                                  | `patient-financial-entries.service`, `patient-*-table.tsx`, `patient-detail-tabs.ts`                                                                                                                                                                       |
| 2026-07-07 | Backend **financeiro da ficha** (`patient-financial-entries`): CRUD store-scoped, receive, geração idempotente na approve de orçamento; schema Prisma (migration manual)                                                                            | `clinica-api` submódulo; ERP integração = CLIN-061                                                                                                                                                                                                         |
| 2026-07-06 | ERP integrado com **Documentos do paciente** (contratos, receituários, atestados); mock store removido; PDFs via `patient-pdf-shared`; histórico sem busca                                                                                          | `patient-\*-emissions                                                                                                                                                                                                                                      | prescriptions | certificates.service`, `use-patient-documents-queries`, `build-patient-prescription-pdf.ts`, `build-patient-certificate-pdf.ts` |
| 2026-07-06 | Backend + ERP **Anamnese preenchida** (`patient-anamneses`): CRUD store-scoped, rotas públicas `@Public()`, integração ERP (debounce 400ms, listagem server-side §8.1)                                                                              | `clinica-api` submódulo + BFF ERP; mock `patient-anamnesis-mock-store` removido                                                                                                                                                                            |
| 2026-07-06 | Comandas Fase 1 na food-api + ERP (GET/POST `/v1/comandas`, itens, confirm-payment); gaveta Novo Pedido E2E FoodOrder + Comanda                                                                                                                     | Schema `Comanda`/`ComandaItem`; `comanda-store` substituído por React Query no ERP                                                                                                                                                                         |
| 2026-07-06 | Modelo unificado food: comanda agrupa pedidos (`Order.comandaId`); KDS e Gestão leem pool único                                                                                                                                                     | Migration `order_comanda_id`; script `migrate:comanda-items`                                                                                                                                                                                               |
| 2026-07-03 | CLIN-041 ERP: PDF orçamento, listagem budgets server-side, debounce 400ms, política §8.1 reforçada                                                                                                                                                  | `patient-budgets-tab`, `build-patient-budget-pdf.ts`, `use-debounced-search.ts`                                                                                                                                                                            |
| 2026-07-03 | Política §8.1: busca/paginação/ordenação de listagens sempre no backend                                                                                                                                                                             | Evita regressão client-side (orçamentos corrigidos jul/2026); debounce 400ms; referências pacientes + budgets                                                                                                                                              |
| 2026-07-15 | CLIN-062 Comissões: motors debit/approve/finalize; migration única `20260715165240_add_commissions` (source refs); histórico agregado; regras identidade Equipe                                                                                      | clinica-api + ERP clinic |
| 2026-07-15 | Implementação da Fatura Manual (platform-api + admin-web) | Finalizada a implementação de geração de faturas manuais na platform-api (POST /v1/invoices/manual) com vencimento para o próximo mês e integrada no frontend admin-web. |
| 2026-07-14 | ERP CLIN-061: Transações via `v1/financial/entries` + `by-payment-method` | CLIN-061 Transações API |
| 2026-07-13 | ERP CLIN-061: fluxo de caixa + config contas/categorias via `v1/financial/*`; ficha receive usa mesmas contas; UX sheets/category select/header ficha | CLIN-061 (Transações completadas 2026-07-14) |
| 2026-07-14 | Rota de Detalhamento de Membro (GET /v1/clients/members/:id) | Criado o endpoint de detalhes do membro no backend (`platform-api`) e integrado no frontend (`admin-web`) para exibição de dados ricos do membro e suas lojas. |
| 2026-07-14 | Rota de atribuição de membros em lote (PATCH /v1/clients/members/:id/assignments) | Desenvolvido endpoint em platform-api e integrado em admin-web para atualização atômica de remoções, edições e adições de lojas e cargos. |
| 2026-07-14 | Rota de criação de membro (POST /v1/clients/:id/members) | Desenvolvido endpoint na api e integrado no painel de operadores para cadastrar um membro e associá-lo a várias lojas em lote. |
| 2026-07-14 | Componente de Visualização/Edição de Detalhes de Membro | Adicionado o componente `MemberDetailSheet` na aba de usuários de detalhes de cliente. Suporta visualizar e editar (com chaves de acesso a lojas e cargo por loja) e salva alterações atualizando o cache local do React Query. |
| 2026-07-14 | Faturas antecipadas na cobrança (platform-api) | Novo utilitário `generateUpfrontInvoices()` que gera 12 faturas mensais ou 1 fatura anual no cadastro/atualização de plano. Sem geração automática recorrente. Afeta `CreateClientUseCase` e `UpdateClientUseCase`. |
| 2026-07-13 | ERP CLIN-061: fluxo de caixa + config contas/categorias via `v1/financial/*`; ficha receive usa mesmas contas; UX sheets/category select/header ficha | CLIN-061 parcial (transações UI placeholder) |
| 2026-07-13 | **Ledger unificado clínica:** `FinancialEntry` + `v1/financial/*`; ficha usa a mesma tabela; migration pelo operador | `clinica-api` módulo `financial`; ERP caixa integrado |
| 2026-07-13 | **Vendas CRM:** API sales + ERP; `sortOrder`/`reorder`; Agendada/Perdida fixas; período custom dia civil BRT; wiki `25-crm-funil-vendas` atualizada | `clinica-api` `sales`, `features/clinic/vendas`, wiki-erp-clinic |
| 2026-07-13 | **Vendas CRM:** backend `sales` na clinica-api + integração ERP (`sales.api.service.ts`); mock removido | `clinica-api` módulo `sales`, `features/clinic/vendas` |
| 2026-07-10 | Refatoração de equipe e vinculação múltipla de lojas (Batch) | Migração para N:N de Store/Member na `platform-api` + proteção de e-mails. Novo fluxo com abas (Usuário existente/Novo), multi-seleção de operadores com cargos/permissões individuais e endpoint POST de vinculação em lote na API. |
| 2026-07-10 | Config clínica: soft-delete equipe (platform `StoreMember`); deletes 409 planos/anamneses/contratos; categorias paciente/agendamento sem sync; seed anamnese ~15; `planStatus` na ficha Sobre; overlap test sequencial (EXCLUDE DB pendente no ADR) | `platform-api`, `clinica-api`, `features/clinic/modules/settings` + wiki clinic |
| 2026-07-09 | Migração de Status de Loja | Atualização das referências de status de loja no frontend (`admin-web`) para suportar o novo enum `StoreStatus` (`IN_SETUP`, `TRAINING`, `PRODUCTION`, `BLOCKED`, `OFFLINE`) em substituição aos valores antigos (`ativa`, `bloqueada`, `em_implantacao`). |
| 2026-07-09 | **Estoque ERP + API:** integração `clinicaFetch`; paginação/busca/ordenação server-side; histórico retiradas com filtro de data (dia civil); tabelas com `erpDataTableStyleProps` | `features/clinic/estoque`, `clinica-api` módulo `stock` |
| 2026-07-09 | **Agenda — compromissos bloqueiam consultas** (API + ERP); fuso wall-clock (`parseClinicDateTime` / `clinic-datetime.ts`); alertas retorno ficha+agenda; `returnAlertId` remove alerta ao agendar | `clinica-api` scheduling + `features/clinic/agenda` |
| 2026-07-08 | Otimização na aba de Assinaturas (Junção/Join de tabelas no backend) | A listagem de assinaturas no admin-web agora consome dados do plano e cliente agregados em uma única requisição HTTP para a API de assinaturas, eliminando consultas em lote paralelas no frontend. |
| 2026-07-08 | Módulo de invoices na platform-api com CRUD, KPIs e job de faturamento | Mudança no Prisma schema (tabelas `invoices` e `InvoiceStatus` enum), com novos endpoints e testes unitários. |
| 2026-07-08 | **CLIN-021 refinamentos:** datas locais no ERP (`local-date.ts`); modal slots manhã/tarde; espelhamento appointment-categories ← patient-categories; UX sheet compromisso/consulta | `features/clinic/agenda` |
| 2026-07-08 | **CLIN-020:** `available-slots` step = `durationMin`; sync categorias de agendamento no GET | `clinica-api` scheduling |
| 2026-07-07 | **CLIN-021:** ERP agenda integrada (`agenda/api/*` → `clinicaFetch`; mock removido) | `features/clinic/agenda`, hooks com `useStore()` |
| 2026-07-07 | **CLIN-020:** backend agenda na `clinica-api` (`scheduling`: appointments, categories, internal-events, fit-ins, return-alerts, available-slots; EXCLUDE anti-overlap) | ERP integração agenda = CLIN-021 |
| 2026-07-07 | Backend + ERP **Arquivos do paciente** (`patient-files`): drive store-scoped, upload MinIO multipart, migration `20260707144451_add_patient_files`; ERP via `patient-files.service` + React Query; busca server-side §8.1 | `clinica-api` submódulo + aba `/arquivos`; wiki `24-arquivos-paciente` |
| 2026-07-07 | ERP: integração aba **Financeiro da ficha** (CLIN-061); `manualPagination` nas tabelas server-side (orçamentos, anamnese, financeiro); badge "Em breve" removido da aba Financeiro | `patient-financial-entries.service`, `patient-*-table.tsx`, `patient-detail-tabs.ts` |
| 2026-07-07 | Backend **financeiro da ficha** (`patient-financial-entries`): CRUD store-scoped, receive, geração idempotente na approve de orçamento; schema Prisma (migration manual) | `clinica-api` submódulo; ERP integração = CLIN-061 |
| 2026-07-06 | ERP integrado com **Documentos do paciente** (contratos, receituários, atestados); mock store removido; PDFs via `patient-pdf-shared`; histórico sem busca | `patient-\*-emissions | prescriptions | certificates.service`, `use-patient-documents-queries`, `build-patient-prescription-pdf.ts`, `build-patient-certificate-pdf.ts` |
| 2026-07-06 | Backend + ERP **Anamnese preenchida** (`patient-anamneses`): CRUD store-scoped, rotas públicas `@Public()`, integração ERP (debounce 400ms, listagem server-side §8.1) | `clinica-api` submódulo + BFF ERP; mock `patient-anamnesis-mock-store` removido |
| 2026-07-06 | Comandas Fase 1 na food-api + ERP (GET/POST `/v1/comandas`, itens, confirm-payment); gaveta Novo Pedido E2E FoodOrder + Comanda | Schema `Comanda`/`ComandaItem`; `comanda-store` substituído por React Query no ERP |
| 2026-07-06 | Modelo unificado food: comanda agrupa pedidos (`Order.comandaId`); KDS e Gestão leem pool único | Migration `order_comanda_id`; script `migrate:comanda-items` |
| 2026-07-03 | CLIN-041 ERP: PDF orçamento, listagem budgets server-side, debounce 400ms, política §8.1 reforçada | `patient-budgets-tab`, `build-patient-budget-pdf.ts`, `use-debounced-search.ts` |
| 2026-07-03 | Política §8.1: busca/paginação/ordenação de listagens sempre no backend | Evita regressão client-side (orçamentos corrigidos jul/2026); debounce 400ms; referências pacientes + budgets |
| 2026-07-06 | CLIN-041: `PATCH …/treatments/:id/finalize` na clinica-api + ERP (evolução atômica + status completed); tabelas settings com headers alinhados (`erpDataTableStyleProps`) | `FinalizePatientTreatmentUseCase`, `patient-treatment-finalize-sheet`; financeiro approve e imagens evolução = Fase 2 |
| 2026-07-03 | CLIN-041 Fase 1: orçamentos/tratamentos/evoluções na clinica-api + ERP (approve materializa tratamentos; financeiro na approve = Fase 2 CLIN-060) | Schema Prisma + submódulos; migration manual pelo operador |
| 2026-07-03 | Backend + integração ERP Pacientes (`feat/clinic/create-backend-patient`): `clinica-api` CRUD pacientes/categorias/foto; ERP via `clinicaFetch` | Índice clinica atualizado; wiki clinic § Pacientes e § Config Categoria |
| 2026-07-01 | ERP: módulo Pacientes mock na vertical clinic (`feat/clinic/create-screen-patient`) | UI ficha multi-aba; backend e integração em 2026-07-03 |
| 2026-06-26 | Raiz reescrita como índice real do monorepo; nomenclatura padronizada para `AGENTS.md` (plural) em todos os níveis; adicionada política de manutenção (seção 7). | Substitui template antigo (incorreto) de módulo. |
| 2026-06-29 | Criado `services/payment-api/AGENTS.md`; adicionada subseção **Services** na seção 4 e removida a pendência correspondente. | Payment API documentada (status: implementada, não integrada/validada). |
| 2026-06-29 | Payment API marcada como **🔴 SERÁ REFEITA** (reestruturação completa — não segue os padrões da plataforma). | Bloqueia adoção/evolução do serviço; código atual vira legado/referência. |
| 2026-07-02 | Sistema de Assinaturas e Preços por Plano (`subscriptions` e `plan_prices`) na `platform-api` | Mudança no Prisma schema (tabelas `subscriptions` e `plan_prices`), com refatoração das entidades `Client` e `Plan` e novos tipos de dados no front. |
| 2026-07-22 | Integração de Dados Reais no Gateway Financeiro | Conectada a página de Gateway (/financeiro/gateway) à API do backend (substituindo mocks em mock-webhook-logs e gateway-stats com os hooks useGatewayEvents e useGatewayStats, usando paginação manual no DataTable). |
