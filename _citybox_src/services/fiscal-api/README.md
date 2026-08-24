# Fiscal API — `@citybox/fiscal-api`

Microserviço NestJS **independente** de emissão de documentos fiscais da Citybox: NF-e (via SEFAZ-BA) e NFS-e (Padrão Nacional, piloto Ilhéus/BA). Consumidores (`erp-api`, PDV, marketplace) **nunca** falam com a SEFAZ ou com o município diretamente.

> **Fonte de verdade deste módulo é o [`AGENTS.md`](./AGENTS.md)** — stack, restrições, decisões de arquitetura e histórico. Este README é a porta de entrada; em caso de divergência, o `AGENTS.md` prevalece.

## Papel no projeto

- Emite, consulta, cancela, corrige e inutiliza documentos fiscais em nome dos **Emitentes** (Lojas) do CityBox.
- Guarda os **certificados digitais A1** (`.pfx`) criptografados e assina o XML (XMLDSig) por Emitente.
- Persiste o ciclo de vida completo do documento (`FiscalDocument`, `FiscalEvent`, `ProviderRequest`) e arquiva o XML autorizado.
- **v1 restrito a chamadas síncronas de sistemas internos** (FR-015/FR-016) — sem onboarding self-service de clientes externos.

**Porta dev:** `3116` · **Banco:** PostgreSQL compartilhado `citybox` (porta host `15433`), **schema próprio `fiscal`** — não um banco dedicado como o `payment-api`.

## Desenvolvimento local

```bash
# 0. Toolchain C++ — OBRIGATÓRIO, ver "Pré-requisito de build nativo" abaixo
sudo apt install -y build-essential      # Debian/Ubuntu

# 1. Infra compartilhada (Postgres :15433, MinIO :9000, Keycloak :8080)
pnpm infra:up

# 2. Env (idempotente — NUNCA sobrescreve um .env existente)
pnpm setup:env

# 3. Migrations
pnpm --filter @citybox/fiscal-api db:generate
pnpm --filter @citybox/fiscal-api db:migrate:deploy

# 4. API
pnpm --filter @citybox/fiscal-api dev
# GET    http://localhost:3116/api/health
# GET    http://localhost:3116/api/health/ready
# Swagger http://localhost:3116/api/v1/docs
```

### Em container (junto com a infra)

Desde 2026-08-05 o serviço também sobe com a stack local — compose em [`infra/fiscal-api/`](../../infra/fiscal-api/), container `citybox_fiscal_api` na rede `citybox-platform`:

```bash
pnpm infra:up                # infra + fiscal-api (fiscal-api é o último da fila)
pnpm infra:up fiscal-api     # só o fiscal-api
```

⚠️ **Escolha um dos dois modos** — host (`pnpm --filter … dev`) e container publicam ambos em `127.0.0.1:3116` e conflitam. Os `.env` são independentes: `services/fiscal-api/.env` (host, `127.0.0.1`) vs `infra/fiscal-api/.env` (container, hostnames de container).

O container **não aplica migrations** — rodar `db:migrate:deploy` antes, como no fluxo do host.

### Pré-requisito de build nativo

`libxmljs2` (validação XSD + parsing de resposta SOAP) compila via `node-gyp`. Sem toolchain C++ o `pnpm install` falha no final, ~14 suítes de teste quebram e **o serviço não sobe** — `xsd-validator.ts` é importado na cadeia de módulos, então o boot morre em `Could not locate the bindings file`. Não é opcional.

### Bootstrap do banco `citybox`

Os scripts de `infra/postgres/init/` só rodam na **criação do cluster**, contra o `POSTGRES_DB` inicial (`campinas_dev`). Um banco `citybox` criado depois — inclusive via `bootstrap-tenant-db.sh`, que não cobre isso — fica **sem `pgcrypto` e sem `citybox_uuid_v7()`**. Como todo `id` do schema usa `DEFAULT citybox_uuid_v7()`, a migration falha no primeiro `CREATE TABLE`, deixando os enums órfãos e o registro em estado `failed`.

Verificar e, se faltar, aplicar uma vez no banco `citybox`:

```sql
-- infra/postgres/init/01-extensions.sql + 02-citybox-uuid-v7.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_bytes(), exigido pela função
-- ...depois o corpo de 02-citybox-uuid-v7.sql (CREATE OR REPLACE FUNCTION citybox_uuid_v7)
```

Se a migration já falhou antes desse bootstrap, limpe o resíduo antes de reaplicar:

```bash
# 1. dropar os 6 enums órfãos do schema fiscal (DocumentType, ProviderType, Environment,
#    FiscalDocumentStatus, CertificateStatus, FiscalEventType)
# 2. reverter o registro da migration
pnpm --filter @citybox/fiscal-api exec prisma migrate resolve \
  --rolled-back 20260804181347_init --config prisma.config.ts
# 3. reaplicar
pnpm --filter @citybox/fiscal-api db:migrate:deploy
```

### Credenciais do Postgres

O `.env.example` traz `aplopes:aplopes`, mas o container de `infra/postgres` sobe com `POSTGRES_USER=citybox` / `POSTGRES_PASSWORD=citybox`. Se o `DATABASE_URL` não autenticar, é essa a divergência (mesma situação nos `.env.example` de food-api e clinica-api).

### Variáveis obrigatórias

Todas comentadas em [`.env.example`](./.env.example). As que não têm default utilizável:

| Variável | Notas |
|----------|-------|
| `DATABASE_URL` | `postgresql://…/citybox?schema=fiscal` |
| `FISCAL_CERT_ENCRYPTION_KEY` | AES-256-GCM, 32 bytes base64. **Nunca reaproveitar entre ambientes.** Gerar: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `KEYCLOAK_ISSUER` | Realm `citybox-dev`, mesmo dos demais apps |
| `MINIO_*` | Bucket dedicado `fiscal`; usar a instância canônica [`infra/minio`](../../infra/minio/) na porta **9000** — não a 9002 dos `.env.example` de food/clinica |
| `SEFAZ_BA_NFE_HOMOLOGATION_ENDPOINT` | v1 só opera em homologação; deixar o endpoint de produção vazio é intencional |

## Rotas

Prefixo global `api`. Todas exigem JWT Keycloak (`AuthGuard` + `PermissionGuard`); em dev há bypass via `AUTH_DEV_BYPASS=true`.

| Recurso | Rotas |
|---------|-------|
| **Emitentes** | `POST` · `GET` · `GET /:id` · `PATCH /:id` — `/api/v1/companies` |
| **Certificados** | `POST` · `GET` — `/api/v1/companies/:companyId/certificates`<br>`PATCH /api/v1/certificates/:id/activate` · `GET /api/v1/certificates/:id/status` |
| **NF-e** | `POST` · `GET /:id` · `GET /:id/xml` · `POST /:id/cancel` · `POST /:id/correction-letter` · `POST /inutilize` — `/api/v1/nfe` |
| **NFS-e** | `POST` · `GET /:id` · `GET /:id/xml` · `POST /:id/cancel` — `/api/v1/nfse` |
| **Consulta genérica** | `GET` · `GET /:id` · `GET /:id/events` — `/api/v1/fiscal-documents` |
| **Health** | `GET /api/health` · `GET /api/health/ready` |

Carta de correção e inutilização são **exclusivas de NF-e por design legal** — não existem no Padrão Nacional de NFS-e.

## Estado

| Escopo | Estado |
|--------|--------|
| Foundational — schema `fiscal`, guards, MinIO, XML/assinatura/SOAP | ✅ completo |
| US1 — NF-e: emissão + consulta (SEFAZ-BA real, homologação) | ✅ completo |
| US2 — NFS-e: emissão + consulta (lado da API) | ⚠️ completo, **transmissão bloqueada** |
| US3 — certificados: upload/ativação/status/lista | ✅ completo |
| US4 — ciclo de vida: cancelar, carta de correção, inutilizar | ✅ completo |

**Bloqueio conhecido (dependência externa, não backlog):** `IlheusMetropolisNfseProvider` é um stub deliberado — o protocolo de transporte do MetropolisWeb/POLIS de Ilhéus/BA nunca foi confirmado pelo município. `POST /api/v1/nfse` constrói, assina e valida a DPS com sucesso, mas falha (500) ao transmitir.

**Antes do primeiro teste real em homologação**, leia as ressalvas no topo do [`AGENTS.md`](./AGENTS.md): os WSDLs em `resources/wsdl/nfe/` são de autoria própria (best-effort, sem cross-check contra o WSDL oficial), o XML de evento/inutilização não foi validado contra XSD oficial, e o XSD publicado da DPS tem um bug de `pattern` corrigido só na cópia local.

## Estrutura

Clean Architecture por módulo (`domain/` → `application/` → `infrastructure/`), igual a `food-api`/`clinica-api` — **não** o padrão flat do `payment-api`.

```
services/fiscal-api/
├── prisma/schema.prisma      # schema `fiscal` (Company, Certificate, FiscalDocument, FiscalEvent, …)
├── resources/
│   ├── wsdl/nfe/             # 4 WSDLs SEFAZ-BA (autoria própria — ver ressalva)
│   └── xsd/{nfe,nfse}/       # XSDs oficiais NF-e 4.00 e DPS Padrão Nacional v1.01
└── src/
    ├── modules/              # companies · certificates · nfe · nfse · fiscal-documents · providers
    └── shared/infra/         # prisma · keycloak · storage · fiscal-xml · fiscal-signature · fiscal-soap
```

## Comandos

```bash
pnpm --filter @citybox/fiscal-api dev
pnpm --filter @citybox/fiscal-api test              # unit — fakes em memória
pnpm --filter @citybox/fiscal-api test:integration  # Postgres real, gated por DATABASE_URL
pnpm --filter @citybox/fiscal-api build && pnpm --filter @citybox/fiscal-api lint && pnpm --filter @citybox/fiscal-api typecheck
```

## Referências

- [`AGENTS.md`](./AGENTS.md) — fonte de verdade do módulo
- [`specs/002-fiscal-api/`](../../specs/002-fiscal-api/) — spec, plan, research, data-model, contracts, tasks
- [`AGENTS.md` raiz](../../AGENTS.md) — mapa de portas e índice do monorepo
- [`packages/docs/fiscal/api_fiscal_completa.md`](../../packages/docs/fiscal/api_fiscal_completa.md) — arquitetura fiscal de referência (mais ampla que o v1)
