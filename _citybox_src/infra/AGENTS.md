# AGENTS.md — Infra (Docker compartilhada)

> **Para agentes de IA:** Este arquivo é a fonte de verdade sobre a pasta `infra/`.
> Leia-o integralmente antes de qualquer ação. Ao modificar serviços/compose/scripts
> aqui, atualize as seções relevantes deste arquivo na mesma operação. Nunca remova
> seções — apenas atualize ou adicione.

---

## 1. Identidade do Módulo

| Campo            | Valor                                                  |
| ---------------- | ------------------------------------------------------ |
| **Nome**         | `infra/` — infraestrutura Docker compartilhada          |
| **Tipo**         | Orquestração de serviços de apoio (Docker Compose por serviço) |
| **Responsável**  | Bruno Lopes — Aplopes Tecnologia                       |
| **Status**       | 🟢 Em uso (dev local + base de produção)               |
| **Rede Docker**  | `citybox-platform` (external)                          |
| **Última atualização deste arquivo** | 2026-08-18                       |

**Propósito em uma linha:**
Provê toda a **infraestrutura de apoio** da plataforma CityBox — Postgres,
Redis, RabbitMQ, Typesense, Keycloak, Unleash, MinIO, Metabase e Nginx — cada um
como serviço Docker isolado, orquestrados por scripts e ligados pela rede
`citybox-platform`.

> ⚠️ **README desatualizado:** `infra/README.md` ainda chama a pasta de "services/"
> e mistura a antiga **vertical Serviços** (que foi movida para `verticals/services/`).
> Hoje esta pasta é **apenas infra**. Use ESTE arquivo como referência atual.

---

## 2. Posição no Monorepo

```
citybox/
├── apps/            ← serviços de aplicação (NestJS/Next.js) que CONSOMEM esta infra
├── packages/
├── infra/           ← VOCÊ ESTÁ AQUI (infra Docker compartilhada)
│   ├── postgres/ · postgres-replica/ · redis/ · rabbitmq/ · typesense/
│   ├── keycloak/ · unleash/ · minio/ · metabase/ · nginx/
│   ├── deploy/      ← compose para deploy dos APPS Node em container
│   ├── service-dev/ ← Postgres dedicado p/ a vertical Serviços (dev)
│   ├── scripts/     ← up.sh / down.sh / status.sh (orquestram todos os serviços)
│   ├── platform-apps.env (+ plataform-apps.env)  ← env consolidado p/ rodar apps locais
│   └── README.md
└── AGENTS.md        ← contexto raiz (modelo deste arquivo)
```

**Consumido por:** todos os apps do monorepo (marketplace, platform, erp,
verticais…) — via `DATABASE_URL`, `KEYCLOAK_ISSUER`, `REDIS_URL`, `RABBITMQ_URL`,
`MINIO_*`, `TYPESENSE_*`, etc., apontando para os serviços desta pasta.

**Relação com ADRs:** Postgres (B-01) · Redis cache/carrinho (C-04) · RabbitMQ
event bus (B-09) · Typesense busca (C-01) · Keycloak SSO (C-07) · Metabase BI
(C-08) · schemas lazy por vertical (C-15) · TLS/Certbot (C-11, C-14).

---

## 3. Serviços e Portas

### Core (sobem com `infra:up`)
| Serviço | Pasta | Portas (host) | Uso |
|---------|-------|---------------|-----|
| **PostgreSQL** | `postgres/` | `15433` | Banco transacional dev (`citybox_platform`, schemas por vertical) |
| **Redis** | `redis/` | `16379` | Cache e carrinho |
| **RabbitMQ** | `rabbitmq/` | `5672`, `15672` (mgmt) | Event bus (outbox → workers) |
| **Typesense** | `typesense/` | `8108` | Busca |
| **MinIO** | `minio/` | `9000`, `9001` (console) | Object storage (ex.: imagens food) |
| **Keycloak** | `keycloak/` | `8080` | SSO / Identity — realms `citybox-{admin,erp,clinica,beautiful,imoveis,marketplace}` |
| **Nginx** | `nginx/` | `8088` | Borda HTTP dev (subdomínios `*.local.citybox.com`) |
| **fiscal-api** ⚠️ | `fiscal-api/` | `3116` | **App Node, não infra** — `@citybox/fiscal-api` (NF-e/NFS-e). Ver 5.7 |

> ⚠️ **`fiscal-api` é a exceção à separação infra/app** deste diretório. Foi colocado
> aqui por decisão explícita (2026-08-05) para subir junto com `pnpm infra:up`; o lugar
> "canônico" de app Node continua sendo `deploy/docker-compose.apps.yml`. Fica por
> **último** em `CORE_SERVICES` de propósito — `up.sh` usa `set -euo pipefail`, então
> uma falha de build dele não impede a infra real (postgres…nginx) de já ter subido.
> Não replicar esse padrão para outros apps sem a mesma decisão explícita.

### Extras (só com `infra:up:full`)
| Serviço | Pasta | Portas | Uso |
|---------|-------|--------|-----|
| **Postgres réplica** | `postgres-replica/` | `15434` | Réplica de leitura para BI |
| **Unleash** | `unleash/` | `4242` | Feature flags |
| **Metabase** | `metabase/` | `13002` | BI / DRE (lê schema `public` da réplica) |
| **Mailpit** | `mailpit/` | `1025` (SMTP), `8025` (UI) | Caixa de e-mail local (dev); `pnpm infra:up:mailpit` |

### Outros diretórios
| Pasta | Papel |
|-------|-------|
| `deploy/` | `docker-compose.apps.yml` — sobe **os apps Node** em container (`citybox-marketplace-api`, `citybox-workers`, `citybox-platform-api`, `citybox-platform-web`) na rede `citybox-platform` |
| `service-dev/` | Postgres dedicado de dev para a vertical **Serviços** |
| `scripts/` | `up.sh`, `down.sh`, `status.sh` (orquestram a stack) |

---

## 4. Estrutura de Pastas

Cada serviço é **autocontido**: tem seu próprio `docker-compose.yml`, `.env`
(quando aplicável), `README.md` e, às vezes, `scripts/`, `init/`, `conf.d/`.
**Não há um compose único** — a orquestração é feita pelos scripts em `scripts/`.

```
infra/
├── scripts/
│   ├── up.sh         ← sobe serviços: core | full | <serviço> (copia .env.example→.env se faltar)
│   ├── down.sh       ← derruba: core | full | <serviço>
│   ├── status.sh     ← lista containers citybox_* e a rede citybox-platform
│   └── README.md     ← (desatualizado — fala da vertical Serviços)
├── postgres/         docker-compose.yml · .env · init/ · scripts/ · README.md
├── postgres-replica/ docker-compose.yml · README.md
├── redis/            docker-compose.yml · .env · README.md
├── rabbitmq/         docker-compose.yml · .env · config/ · scripts/ · README.md
├── typesense/        docker-compose.yml · .env · README.md
├── minio/            docker-compose.yml · .env · README.md
├── keycloak/         docker-compose.yml · docker-compose.prod.yml · Dockerfile · .env
│                     ├── import/   ← um realm por sistema (ADR C-16): citybox-{admin,erp,clinica,beautiful,imoveis,marketplace}-realm.json (+ citybox-dev legado)
│                     ├── theme/    ← @citybox/keycloak-theme (Keycloakify + @citybox/mui) — movido de apps/keycloak-theme em 2026-08-14; ver theme/AGENTS.md
│                     ├── themes/   ← tema(s) FTL legados
│                     └── scripts/  ← sync-realm.mjs (aplica realms) · build-theme.sh (rebuilda imagem c/ tema)
├── unleash/          docker-compose.yml · README.md
├── metabase/         docker-compose.yml · scripts/ · README.md
├── nginx/            docker-compose.yml · docker-compose.certbot.yml · .env
│                     ├── conf.d/ · snippets/ · host/ · scripts/
├── fiscal-api/       docker-compose.yml · .env  ← ⚠️ APP Node, não infra (ver 3 e 5.7)
│                     build: services/fiscal-api/Dockerfile, contexto = raiz do monorepo
├── service-dev/      docker-compose.yml · postgres/ · scripts/ · README.md
├── deploy/
│   └── docker-compose.apps.yml   ← apps Node em container (rede citybox-platform external)
├── platform-apps.env             ← env consolidado p/ rodar apps locais apontando p/ esta infra
├── plataform-apps.env            ← ⚠️ duplicata com typo no nome (ver 5.5)
└── README.md
```

---

## 5. Restrições Críticas

> ⚠️ Ignorar isto quebra a subida da stack ou a conexão entre serviços/apps.

### 5.1 Rede Docker `citybox-platform` é **external**
```yaml
# Todos os composes (serviços e deploy/apps) usam:
networks:
  citybox-platform:
    external: true
# A rede precisa EXISTIR antes. Se não existir:
#   docker network create citybox-platform
# (status.sh avisa se a rede não foi criada.)
```

### 5.2 Um compose **por serviço** — orquestrar pelos scripts
```bash
# NÃO existe um docker-compose.yml único na raiz de infra/.
# Subir/derrubar sempre via scripts (que iteram serviço a serviço):
pnpm run infra:up        # core
pnpm run infra:up:full   # core + extras
pnpm run infra:down
```

### 5.3 `up.sh` cria `.env` a partir de `.env.example` se faltar
```
Vários serviços têm .env COMMITADO (dev). Não versionar segredos reais de produção aqui.
```

### 5.4 Portas fixas (não remapear sem avisar os apps)
```
Os apps esperam estas portas (ex.: Postgres 15433, Keycloak 8080, MinIO 9000).
Mudar a porta de um serviço exige atualizar os .env dos apps e o platform-apps.env.
```

### 5.5 Há um arquivo de env **duplicado com typo**
```
platform-apps.env   ← correto
plataform-apps.env  ← typo (mantido por compatibilidade). Ao editar env de apps,
                      conferir qual está realmente sendo carregado e evitar divergência.
```

### 5.6 Nginx do backoffice precisa de `client_max_body_size`
```
Default do nginx = 1m. Uploads da clínica (logo ≤4 MB, fotos) passam pelo
proxy do ERP (:3107).

Em produção aplopes o vhost ativo é:
  /etc/nginx/sites-available/backoffice.aplopes.com.conf
  /etc/nginx/sites-available/backoffice.aplopes.com.ssl.conf
(não o template citybox.com em infra/nginx/host/).

Usar `client_max_body_size 5m;` — senão o browser recebe 413 em uploads >1 MB
(ex.: JPG de 2 MB) mesmo com limite de negócio de 4 MB na API/ERP.
```

### 5.6.1 Nginx dev monta **só** `conf.d/dev-local.conf` (não a pasta inteira)

```
infra/nginx/docker-compose.yml monta APENAS ./conf.d/dev-local.conf.
Montar ./conf.d inteira quebra o dev: prod-citybox.conf faz
`include /etc/letsencrypt/options-ssl-nginx.conf`, que não existe fora da VPS —
o nginx morre no boot com [emerg] e entra em restart loop.

Produção continua com a pasta inteira: docker-compose.certbot.yml (override)
monta ./conf.d + os volumes certbot_www/certbot_certs. Ao adicionar um vhost de
dev novo, incluir o bind dele no compose base também.
```

### 5.6.2 `network_mode: host` do nginx **não funciona no Docker Desktop (Windows/macOS)**

```
O compose do nginx usa network_mode: host (upstreams em 127.0.0.1 = apps no host).
Isso só funciona em Docker Engine Linux. No Docker Desktop, host networking depende
da flag hostNetworkingEnabled (desligada por padrão) e ainda assim é limitada.

Sintoma: container `citybox_nginx` fica Up (healthy) — o healthcheck roda DENTRO
dele — mas :8088 não escuta no host e os domínios *.local.citybox.com não abrem.
Em dev no Windows, acessar os apps direto pelas portas (3107, 3114, 3108…).
```

### 5.6 `deploy/` é para rodar os APPS em container (não a infra)
```
deploy/docker-compose.apps.yml usa imagens citybox-*:latest (build dos apps) e
depende da infra já no ar + da rede citybox-platform. É deploy de aplicação, não de infra.
```

### 5.7 `fiscal-api/` exige toolchain C++ na imagem (libxmljs2)

`services/fiscal-api/Dockerfile` **precisa** de `apk add python3 make g++` no estágio
`deps`. `libxmljs2` (validação XSD + parsing de resposta SOAP) compila um addon nativo
via node-gyp; ele vendoriza o próprio libxml2 em `vendor/libxml`, então **não** precisa
de `libxml2-dev` — só do toolchain. Sem isso o `pnpm install` do build falha com
`gyp ERR! stack Error: not found: make` e **o serviço nem sobe**: `xsd-validator.ts`
está na cadeia de imports dos módulos, então o erro acontece no boot, não sob demanda.
O toolchain fica confinado ao estágio `deps` — o `runner` recebe só o `node_modules`
já compilado.

Dependências de runtime: `citybox_postgres` (schema `fiscal` no banco `citybox`,
**migration precisa estar aplicada**), `citybox_minio` (bucket `fiscal`, criado pelo
init do MinIO) e `citybox_keycloak`. Como cada serviço é um compose independente, não
há `depends_on` entre eles — o `restart: unless-stopped` cobre a corrida de boot.

**Acesso externo ao Swagger (2026-08-10):** por padrão a porta 3116 só escuta em
`127.0.0.1` na VPS (bind explícito no compose, de propósito — ver comentário em
`infra/fiscal-api/docker-compose.yml`) e não há vhost de domínio dedicado para ela.

**Solução ativa:** `https://api.aplopes.com/fiscal/api/v1/docs` — vhost real da VPS
(`/etc/nginx/sites-available/api.aplopes.com.conf`, **não** rastreado neste repo — os
templates em `infra/nginx/host/` usam domínio `citybox.com`, divergente do `aplopes.com`
real; ver nota no topo desta seção sobre vhosts reais viverem só no host). Novo
`location /fiscal/api/` nesse arquivo, mesmo padrão de `/food/api/`/`/clinica/api/` já
existentes ali: proxy para `127.0.0.1:3121` (porta publicada pelo container
`aplopes_fiscal_api` no compose real, `services/platform/docker-compose.yml` — ver bug
de porta corrigido abaixo). HTTPS de verdade, certificado já emitido, porta 443 já
liberada — sem depender de firewall/porta nova.

**Tentativa abandonada:** um vhost `infra/nginx/host/fiscal-api-public.conf` (porta
pública dedicada, inicialmente 3117, depois 8116, sem TLS) chegou a ser criado e ativado,
mas a porta nova nunca ficou alcançável de fora mesmo com `ufw`/`iptables` liberando —
indício de firewall de borda do provedor de nuvem, fora do alcance desta VPS. Removido
(`sites-enabled` + regra `ufw`) em favor da solução via `api.aplopes.com` acima; o
arquivo `infra/nginx/host/fiscal-api-public.conf` continua no repo só como referência de
como expor por IP:porta caso a porta nova algum dia seja liberada no provedor.

**Bug real corrigido no compose de produção (2026-08-10):** `services/platform/docker-compose.yml`
publicava `fiscal-api` como `127.0.0.1:3121:3121` — a app escuta em `3116` **dentro** do
container (`PORT: 3116`), então nada respondia na porta publicada (connection reset).
Corrigido para `127.0.0.1:3121:3116` + `docker compose up -d --no-deps fiscal-api` para
recriar o container com o mapeamento certo.

**Dependência ERP ↔ fiscal (2026-08-14):** `erp-api` e `erp-web` usam
`depends_on: fiscal-api: condition: service_started` (não `service_healthy`). Fiscal é
auxiliar — falha de boot não pode impedir o ERP de subir; o adapter HTTP trata
indisponibilidade em runtime. Secrets Keycloak no compose usam
`${VAR:?mensagem}` para falhar o `docker compose` se o secret estiver ausente (evita
container “healthy” com auth quebrada). `KEYCLOAK_REALMS` em `platform-apps.env` lista
os seis realms e impede o sync de recriar o legado `citybox-dev`.

### 5.8 `.env` com CRLF quebra scripts que fazem `source` (ex.: `reset:multirealm`)
```
Docker Compose ignora CR; bash `source` não. POSTGRES_USER=citybox<CR> vira
`psql -U` com role "citybox^M" → FATAL: role "citybox" does not exist (no
terminal a linha parece erro de socket Unix por causa do CR).
`.gitattributes` já força LF em *.env / *.env.example. reset-multirealm.sh
stripa CR ao carregar o arquivo. Se o DROP falhar de novo:
  sed -i 's/\r$//' infra/postgres/.env
```

---

## 6. Padrão de um Serviço

Ao adicionar/editar um serviço de infra, siga o padrão dos existentes:

```
infra/<servico>/
├── docker-compose.yml     ← define o container; usa a rede externa citybox-platform; nome citybox_<servico>
├── .env (+ .env.example)  ← variáveis do serviço (porta, credenciais dev)
├── README.md              ← propósito, porta(s), como subir, credenciais dev
├── init/ | conf.d/ | config/ | scripts/   ← inicialização/config quando necessário
```
- Container nomeado `citybox_<servico>` (o `status.sh` filtra por `citybox_`).
- Conectar à rede `citybox-platform` (external).
- Expor a porta no host conforme a tabela da seção 3.
- Adicionar o serviço a `scripts/up.sh`/`down.sh` (lista `CORE_SERVICES` ou `EXTRA_SERVICES`) se deve subir com a stack.

---

## 7. Variáveis de Ambiente

- **Por serviço:** cada pasta tem seu `.env` (ex.: `postgres/.env`, `keycloak/.env`, `minio/.env`).
- **Consolidado para apps:** `platform-apps.env` reúne as URLs/credenciais que os **apps** usam para falar com a infra Docker local:

| Grupo | Variáveis (exemplos) |
|-------|----------------------|
| Banco | `PLATFORM_DATABASE_URL`, `TENANT_DATABASE_URL` (Postgres :15433) |
| Keycloak | issuers `KEYCLOAK_*_ISSUER`, `KEYCLOAK_REALMS` (6 sistemas), secrets `KEYCLOAK_*_WEB/PROVISIONING/M2M_*_SECRET`, `KEYCLOAK_INVITE_REDIRECT_URI`, origins `ADMIN/BACKOFFICE/CLINICA/…` |
| APIs | `CORE_API_URL`, `FOOD_API_URL`, `ADMIN_API_URL` |
| Mensageria/Cache | `RABBITMQ_URL`, `REDIS_URL` |
| Busca | `TYPESENSE_HOST/PORT/PROTOCOL/API_KEY` |
| Storage | `MINIO_ENDPOINT/ACCESS_KEY/SECRET_KEY` |

> Regra de ouro: as portas/credenciais em `platform-apps.env` **devem casar** com os
> `.env` dos serviços de infra (mesma porta, mesma senha). Divergência = app não conecta.

---

## 8. Scripts / Comandos

```bash
# Subir/derrubar a stack (a partir da raiz do monorepo)
pnpm run infra:up            # core: postgres, redis, rabbitmq, typesense, minio, keycloak, nginx
pnpm run infra:up:full       # core + extras (postgres-replica, unleash, metabase)
pnpm run infra:down          # derruba core
pnpm run infra:status        # containers citybox_* + rede citybox-platform

# Serviço único
pnpm run infra:up:postgres   # (idem: redis, rabbitmq, keycloak, typesense, minio…)
# Forma genérica:  bash infra/scripts/up.sh <servico>   |   down.sh <servico>

# Reset multi-realm (destrutivo) — Keycloak do zero + DROP citybox + admin-web user
pnpm reset:multirealm -- --yes
# Ver scripts/dev/reset-multirealm.sh (--help). No fim imprime checklist de .env.

# Deploy dos APPS em container (infra já no ar)
docker compose -f infra/deploy/docker-compose.apps.yml up -d
```

`up.sh <profile>`: `core` (default) | `full` | `<nome-do-serviço>`.
Os scripts usam `docker compose -f <servico>/docker-compose.yml` por serviço.

### Borda dev (Nginx :8088)
`/etc/hosts` deve conter:
```
127.0.0.1 city.local.citybox.com api.local.citybox.com app.local.citybox.com admin.local.citybox.com ws.local.citybox.com
```

---

## 9. Inventário de Serviços (detalhe)

| Serviço | Imagem/Build | Notas operacionais |
|---------|--------------|--------------------|
| **Postgres** | postgres | Banco transacional; `init/` cria roles/DBs; schemas por vertical (lazy, C-15) |
| **Postgres réplica** | postgres | Read-replica p/ BI; Metabase lê **schema `public`**, não os schemas verticais |
| **Redis** | redis | Cache e carrinho |
| **RabbitMQ** | rabbitmq | Event bus; UI `:15672`; user/vhost padrão `citybox`/`citybox` (`ensure-user.sh` roda no `infra:up`); filas `food.store-setup`, `clinic.store-setup`, `erp-comercio.store-setup`, `imoveis.store-setup` ← `citybox.store.#`; filas `clinic.whatsapp-send` ← `citybox.clinic.whatsapp.send.#` e `clinic.whatsapp-session` ← `citybox.clinic.whatsapp.session.#` (bindings em `infra/rabbitmq/scripts/sync-bindings.sh`) |
| **Typesense** | typesense | Índice de busca |
| **MinIO** | minio | S3-compatível; console em `:9001`; buckets `citybox-food` (vertical food), `erp` (ERP Comércio — `{orgId}/catalogo/products/…`), `citybox-imoveis` (vertical imóveis), `fiscal` (`services/fiscal-api` — XML autorizado + certificados `.pfx` criptografados, keys `{companyId}/...`; ver `services/fiscal-api/AGENTS.md`)  e `citybox-beautiful`|
| **Keycloak** | **Dockerfile próprio** | Build com tema; `import/` mantém seis definições, uma por sistema. `sync-realm.sh`/`sync-realm.mjs` aplica os realms em execução de forma idempotente/aditiva e exige secrets próprios por client em produção. O realm `citybox-dev` permanece apenas como rollback temporário. |
| **Unleash** | unleash | Feature flags |
| **Metabase** | metabase | BI/DRE sobre a réplica |
| **Nginx** | nginx 1.27 | Borda dev `:8088` (subdomínios `*.local`) + prod (TLS/Certbot via `docker-compose.certbot.yml`) |
| **deploy/apps** | `citybox-*:latest` | marketplace-api, workers, platform-api, platform-web em container |

---

## 10. Decisões de Arquitetura

| Decisão | Motivo |
|---------|--------|
| Um `docker-compose.yml` **por serviço** + scripts orquestradores | Subir/derrubar serviços isoladamente; baixo acoplamento |
| Rede **`citybox-platform` external** compartilhada | Apps (host ou container) e infra se enxergam por nome de serviço |
| Perfis **core vs full** | Dev rápido sobe só o essencial; BI/flags só quando necessário |
| **Réplica** dedicada para BI | Analytics não pesa no banco transacional; Metabase lê só `public` |
| Keycloak com **Dockerfile + sync de realms por sistema** | Imagem reproduzível com tema; sessões, clients e unicidade de e-mail isolados por sistema |
| `platform-apps.env` consolidado | Ponto único de configuração dos apps apontando para a infra local |

---

## 11. Contexto para a IA

### O que NÃO fazer
- Não criar um `docker-compose.yml` único na raiz de `infra/` — manter **um por serviço** + scripts.
- Não esquecer a rede `citybox-platform` (external) em composes novos; criá-la se não existir.
- Não remapear portas sem atualizar os `.env` dos apps e `platform-apps.env`.
- Não commitar segredos de **produção** nos `.env` (os commitados são valores de **dev**).
- Não confiar no `README.md`/`scripts/README.md` da pasta para o estado atual (são legado da antiga "services/"); usar ESTE arquivo.
- Não confundir `deploy/` (apps em container) com a infra de apoio.
- Não duplicar config entre `platform-apps.env` e `plataform-apps.env` (typo) — preferir o correto.

### Ao adicionar um novo serviço de infra
1. Criar `infra/<servico>/` com `docker-compose.yml` (rede external, container `citybox_<servico>`), `.env(.example)` e `README.md`.
2. Expor a porta no host e registrá-la na seção 3 deste arquivo.
3. Adicionar o serviço em `scripts/up.sh`/`down.sh` (`CORE_SERVICES` ou `EXTRA_SERVICES`) se deve subir com a stack.
4. Se algum app o consome, adicionar as variáveis em `platform-apps.env` e nos `.env` dos apps.
5. Atualizar as seções 3, 4 e 9 deste arquivo.

### Fluxo típico de dev
1. `docker network create citybox-platform` (se ainda não existir).
2. `pnpm run infra:up` (ou `:full`) → infra no ar.
3. Apps locais leem `platform-apps.env` (ou seus `.env`) apontando para as portas acima.
4. `pnpm run infra:status` para conferir; `pnpm run infra:down` ao final.

---

## 12. Histórico de Mudanças Estruturais

> Não é changelog de features — registra mudanças que afetam o contexto da IA.

| Data       | Mudança                                              | Impacto                          |
| ---------- | ---------------------------------------------------- | -------------------------------- |
| 2026-08-18 | **`reset:multirealm` + CRLF em `infra/postgres/.env`:** `source` do bash preservava CR no `POSTGRES_USER`; o script agora stripa CR ao carregar dotenv | DROP DATABASE deixava de autenticar no `psql` do container |
| 2026-08-14 | **`pnpm reset:multirealm`:** script `scripts/dev/reset-multirealm.sh` reseta Keycloak + DB `citybox` + cria `platform_admin` do admin-web; `reset-production.sh` redireciona | Onboarding de devs / fresh local ou VPS |
| 2026-08-14 | **Compose prod:** `fiscal-api` como `service_started` (não health-block do ERP); secrets Keycloak com `${VAR:?…}`; `KEYCLOAK_REALMS` no env | Evita cascata ERP↔fiscal e auth “healthy” sem secret; sync não recria `citybox-dev` |
| 2026-08-14 | **Keycloak realm por sistema em produção:** seis realms sincronizados por `sync-realm.mjs`; 16 secrets independentes; `--import-realm` não é usado | Issuer/azp explícitos e sessões/e-mails isolados por sistema |
| 2026-08-05 | **`infra/fiscal-api/` criado e adicionado ao fim de `CORE_SERVICES`** (`up.sh`) — decisão explícita do usuário de subir o app junto com `pnpm infra:up`, abrindo exceção à separação infra/app. `services/fiscal-api/Dockerfile` ganhou `apk add python3 make g++` no estágio `deps` (libxmljs2) | `pnpm infra:up` passa a buildar/subir o `fiscal-api` (:3116). Ver 3, 5.7 |
| 2026-08-04 | Bucket MinIO `fiscal` provisionado no `minio-init` (keys `{companyId}/...`) | Consumido por `services/fiscal-api` (XML autorizado + certificados `.pfx` criptografados) |
| 2026-07-28 | Backoffice nginx: `client_max_body_size 5m` (logo/fotos clínica via ERP proxy) | Evita 413 em uploads >1 MB |
| 2026-08-12 | Redirects Keycloak `citybox-backoffice`: inclui `IMOVEIS_ORIGIN` (`imoveis.aplopes.com`) + `:3111` local no `sync-realm.mjs` / realm JSON | Login SSO imóveis (mesmo client do ERP/clínica) |
| 2026-07-29 | Filas WhatsApp clínica: `clinic.whatsapp-send` + `clinic.whatsapp-session` no `sync-bindings.sh` | Processo `main-whatsapp` da clinica-api |
| 2026-07-28 | Deploy clinica: serviço `clinica_api_worker` + fila `clinic.store-setup` no `sync-bindings.sh` | Worker first-contact passa a subir no `deploy:prod` (antes só food tinha worker) |
| 2026-07-27 | Filas RabbitMQ documentadas: `clinic.store-setup` além de `food.store-setup` | Worker first-contact da clinica-api |
| 2026-07-27 | Bucket MinIO `erp` provisionado no `minio-init` (layout `{organizationId}/catalogo/products/…`) | Consumido por `erp-comercio-api` (imagens de produto) |
| 2026-06-25 | Arquivo `AGENTS.md` (infra) criado                    | —                                |
| —          | Vertical "Serviços" movida p/ `verticals/services/`  | `infra/` virou só infra (README antigo não reflete) |
