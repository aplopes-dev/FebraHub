# AGENTS.md — Fiscal API

> **Para agentes de IA:** Este arquivo é a fonte de verdade sobre este módulo.
> Leia-o integralmente antes de qualquer ação. Ao modificar código neste módulo,
> atualize as seções relevantes deste arquivo na mesma operação. Nunca remova
> seções — apenas atualize ou adicione.

---

## 🟢 STATUS ATUAL — as 4 user stories (US1–US4) completas

> **Além da spec 002**, o serviço ganhou: documento auxiliar impresso
> (DANFE/DANFSE, spec 004, 🟢 entregue e commitado) e **cupom fiscal
> eletrônico** (NFC-e modelo 65, spec 005, 🟡 código completo mas **nunca
> transmitido à SEFAZ**). Ver as seções próprias na §5.


> Fases 1 (Setup), 2 (Foundational), 3 (US1 — NF-e, **completa**, T029–T040),
> 4 (US2 — NFS-e, **completa**, T041–T049), 5 (US3 — certificados,
> **completa**, T050–T056) e 6 (US4 — ciclo de vida pós-emissão, **completa**,
> T057–T070) de `specs/002-fiscal-api/tasks.md` concluídas. NF-e e NFS-e têm
> emissão + consulta + cancelamento; NF-e adicionalmente tem carta de
> correção e inutilização (FR-005/FR-006 são exclusivos de NF-e por design
> legal). A única transmissão real ainda bloqueada é NFS-e via
> `IlheusMetropolisNfseProvider` (protocolo municipal de Ilhéus/BA não
> confirmado — mesma ressalva desde US2, não é uma tarefa pendente, é uma
> dependência externa fora do controle deste projeto).
>
> **O que já existe e funciona**: schema Prisma completo + migrations
> aplicadas, `PrismaModule`, guards Keycloak (`AuthGuard`/`PermissionGuard`),
> `ObjectStorage`/MinIO, `FiscalProviderFactory` (Strategy Pattern,
> `SEFAZ_BA_NFE` e `ILHEUS_METROPOLIS_NFSE` registrados), toolkit de XML
> (`xmlbuilder2`/`libxmljs2`), toolkit de assinatura digital
> (`pkcs12-parser.ts`, `xml-signer.ts` com perfis de algoritmo configuráveis,
> `cert-encryption.ts`), cliente SOAP genérico (`shared/infra/fiscal-soap/` —
> TLS mútuo, timeout, retry com backoff), filtro global de erros (mapeamento
> "Conflict"/"Overlap" → 409), módulo `companies` completo (CRUD via API),
> `fiscal-documents` (consulta genérica + `Customer` find-or-create +
> `FiscalSequence`/`ProviderRequest`), healthcheck, Swagger em
> `/api/v1/docs`, **módulo `nfe` completo, ponta a ponta com a SEFAZ-BA real
> (homologação), incluindo todo o ciclo de vida pós-emissão**: `buildNfeXml()`,
> `IssueNfeUseCase`/`ConsultNfeUseCase`/`GetNfeXmlUseCase`/`CancelNfeUseCase`/
> `CorrectionLetterNfeUseCase`/`InutilizeNfeUseCase`, `SefazBaNfeProvider`
> (`issue`/`consult`/`cancel`/`correctionLetter`/`inutilize`, todas via SOAP
> real), rotas `POST/GET /api/v1/nfe`, `GET /api/v1/nfe/{id}/xml`,
> `POST /api/v1/nfe/{id}/cancel`, `POST /api/v1/nfe/{id}/correction-letter`,
> `POST /api/v1/nfe/inutilize`, **módulo `nfse` completo do lado da API
> (emissão/consulta/cancelamento), exceto transmissão real**: `buildDpsXml()`
> (gera a DPS — Declaração de Prestação de Serviços, Padrão Nacional v1.01 —
> que valida contra o XSD oficial), `IssueNfseUseCase`/`CancelNfseUseCase`
> (+ `ConsultNfeUseCase`/`GetNfeXmlUseCase` reaproveitados),
> `IlheusMetropolisNfseProvider` (stub deliberado — ver ressalva abaixo),
> rotas `POST/GET /api/v1/nfse`, `GET /api/v1/nfse/{id}/xml`,
> `POST /api/v1/nfse/{id}/cancel`, e **módulo `certificates` completo**:
> `UploadCertificateUseCase` (valida PKCS#12 real via `parsePkcs12` + CNPJ do
> Emitente + magic bytes via `Pkcs12FileValidator`), `ActivateCertificateUseCase`,
> `GetCertificateStatusUseCase`, `ListCertificatesUseCase`, rotas
> `POST/GET /api/v1/companies/{companyId}/certificates`,
> `PATCH /api/v1/certificates/{id}/activate`,
> `GET /api/v1/certificates/{id}/status` — resposta HTTP nunca inclui
> `encryptedPassword`/`encryptedPfxObjectKey` (FR-007, com teste de
> regressão dedicado). `pnpm build`/`lint`/`typecheck`/`test` verdes
> (145/145 testes); serviço testado subindo e respondendo (boot real com
> Postgres conectado, migrations aplicadas, todas as rotas de NF-e/NFS-e
> mapeadas incluindo `cancel`/`correction-letter`/`inutilize`), com o grafo
> de DI completo resolvendo em runtime (`pnpm --filter @citybox/fiscal-api dev`).
>
> **⚠️ Ressalva sobre o binding SOAP da NF-e**: `resources/wsdl/nfe/*.wsdl`
> são de **autoria própria** (best-effort) — não foram baixados do WSDL oficial
> (sem acesso de rede a `hnfe.sefaz.ba.gov.br` neste ambiente de
> desenvolvimento; WebFetch falha com "unable to get local issuer certificate",
> a cadeia de CA raiz ICP-Brasil não está na trust store padrão). Os
> **endpoints** (URLs) foram confirmados pelo usuário (ver
> `specs/002-fiscal-api/contracts/NFe/NF-e versão 4.0_ambientes.txt`), mas o
> binding SOAP exato (nomes de operação, `SOAPAction`) modela o padrão nacional
> documentado (`nfeDadosMsg`/`nfeResultMsg`), sem cross-check contra o WSDL
> real. **Confirmar contra o WSDL oficial antes do primeiro teste real em
> homologação** — ver cabeçalho de cada arquivo `.wsdl` (4 no total:
> `NFeAutorizacao4`, `NFeConsultaProtocolo4`, `NFeRecepcaoEvento4`,
> `NFeInutilizacao4`). Nenhuma chamada de rede real foi feita nesta
> implementação (todos os testes usam WSDL real + transporte HTTP mockado).
>
> **⚠️ Ressalva adicional sobre o XML de evento/inutilização (US4)**: além do
> binding SOAP acima, a estrutura do próprio XML de negócio do evento
> (`envEvento`/`evento`/`infEvento`/`detEvento`) e de inutilização
> (`inutNFe`/`infInut` — `nfe-soap-envelope.ts`) **também não foi verificada
> contra um XSD oficial**: `specs/002-fiscal-api/contracts/NFe/` só contém o
> pacote núcleo da NF-e (leiauteNFe/nfe/tiposBasico/xmldsig), sem os XSDs de
> evento/inutilização. Decisão explícita do usuário (AskUserQuestion,
> 2026-08-05, para o XML de evento — repetida sem nova pergunta para o XML de
> inutilização por ser a mesma categoria de decisão já confirmada 3x
> consecutivas nesta sessão): prosseguir best-effort, reproduzindo de memória
> o leiaute nacional estável e disclosed no código. Confirmar antes do
> primeiro teste real.
>
> **⚠️ Ressalva sobre a NFS-e (US2)**: o XSD oficial da DPS (Padrão Nacional
> v1.01, `resources/xsd/nfse/`) foi fornecido pelo usuário e **tem um bug
> real corrigido localmente** — o padrão `TSSerieDPS` (campo `<serie>`) usa
> `^`/`$` como se fossem âncoras de regex (convenção JS/Perl), mas no dialeto
> XML Schema esses caracteres são LITERAIS, tornando o padrão publicado
> insatisfazível por qualquer valor real. Corrigido só na cópia local
> (`resources/xsd/nfse/tiposSimples_v1.01.xsd`, comentário XML documentando o
> bug e como reverter quando o governo publicar uma versão corrigida) —
> decisão aprovada explicitamente pelo usuário. Além disso, o **transporte**
> até o município (SOAP vs REST, autenticação, endpoints) segue **totalmente
> não confirmado** — `IlheusMetropolisNfseProvider` é um stub deliberado
> (`issue`/`consult`/`cancel` lançam `IlheusMetropolisNotImplementedError`;
> `correctionLetter`/`inutilize` rejeitam com erros "não aplicável", já que
> nenhum dos dois existe no Padrão Nacional de NFS-e), diferente de
> `SefazBaNfeProvider` onde ao menos os endpoints eram conhecidos. Uma
> chamada real a `POST /api/v1/nfse` ou `POST /api/v1/nfse/{id}/cancel` hoje
> constrói/assina/valida a DPS ou valida prazo/status com sucesso, mas falha
> ao tentar transmitir (500). Ver `IlheusMetropolisNfseProvider` e
> research.md §7 para o detalhe completo.
>
> **O que NÃO existe ainda**: transmissão real de NFS-e ao município de
> Ilhéus (`IlheusMetropolisNfseProvider` continua stub para `issue`/`consult`/
> `cancel`) — não é uma tarefa do backlog, é uma dependência externa (manual
> técnico do MetropolisWeb/POLIS) fora do controle deste projeto. Progresso
> granular por tarefa: `specs/002-fiscal-api/tasks.md` (checkboxes `[X]` —
> todas marcadas, T057–T070 100% completas).
>
> **Decisão de schema para T065 (inutilização, AskUserQuestion 2026-08-05)**:
> `FiscalEvent.fiscalDocumentId` virou nullable (era `String` NOT NULL) +
> ganhou `companyId`/`series`/`numberRangeStart`/`numberRangeEnd` (todas
> nullable, só preenchidas para `eventType=INUTILIZATION`) — migration
> `20260805012847_fiscal_event_inutilization_fields`, escrita manualmente
> (`prisma migrate dev`/`--create-only` falham neste ambiente: a shadow
> database que o Prisma cria on-the-fly não tem `public.citybox_uuid_v7()`,
> criada só via `infra/postgres/init/02-citybox-uuid-v7.sql` na inicialização
> do container, não replicada pela shadow DB do Prisma). Aplicada com
> `prisma migrate deploy` (não usa shadow DB) e verificada com
> `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script --exit-code`
> (diff vazio, zero drift confirmado). Mantém a tabela genérica única
> (research.md §3) em vez de uma tabela `FiscalNumberInutilization` separada
> — opção escolhida explicitamente pelo usuário entre 3 alternativas
> apresentadas.
>
> **⚠️ Decisão de segurança registrada (FR-014, `/speckit-analyze` 2026-08-04)**:
> autorização hoje é só por role/sistema chamador (`PermissionGuard` +
> `INTERNAL_CLIENT_IDS`), **sem** checagem por Emitente em cada requisição —
> qualquer sistema interno autorizado (ERP/PDV/marketplace) pode, tecnicamente,
> ler/baixar o XML de **qualquer** Emitente pela API, não só o seu. Decisão
> explícita (não um bug esquecido): v1 confia que cada sistema chamador já
> controla o acesso por Loja/Emitente antes de chamar a fiscal-api — ver
> raciocínio completo e o gatilho para revisitar em
> [research.md §8](../../specs/002-fiscal-api/research.md#8-autenticação-e-autorização-v1--só-clientes-internos-per-fr-015).
> O decorator `@CompanyId()` existe mas está deliberadamente não-usado — não é
> dead code por descuido.

---

## 1. Identidade do Módulo

| Campo | Valor |
| --- | --- |
| **Nome** | `services/fiscal-api` · pacote `@citybox/fiscal-api` |
| **Tipo** | Microserviço NestJS (backend) · emissão de documentos fiscais (NF-e, NFS-e) |
| **Status** | 🟢 US1–US4 completas (T001–T070) — transmissão real de NFS-e ao município de Ilhéus segue bloqueada por protocolo não confirmado (dependência externa, não pendência) — ver aviso acima |
| **Porta** | `3116` |
| **Banco** | PostgreSQL compartilhado `citybox` (porta host `15433`), schema próprio `fiscal` |
| **Última atualização deste arquivo** | 2026-08-16 (spec erp/030-proxy-documentos-pagamento-real, B3 — `dps-xml.builder.ts` calculava `pAliq` da DPS como `(issRate * 100).toFixed(2)`, tratando `issRate` como fração (0–1); o erp-api sempre enviou esse valor já em percentual (0–100, `group.issqnRate`, mesma convenção de ICMS/IPI/PIS-COFINS, validado e exibido como percentual em toda a cadeia do erp-api/erp-web) — o `* 100` multiplicava de novo, gerando `pAliq` 100x maior que o real toda vez que a nota tinha retenção de ISS (`issWithheld`). Achado ao investigar por que um grupo de ISSQN mostrava "0.05%" na tela de emissão quando a intenção era 5% — a exibição estava correta (é percentual mesmo), o cálculo do XML que multiplicava errado. Corrigido: `pAliq: input.service.issRate.toFixed(2)`, sem o `* 100`. Fixtures de teste (`issue-nfse-test-context.ts`, `dps-xml.builder.spec.ts`, `nfse-leiaute-version.spec.ts`) ajustadas de `issRate: 0.05` pra `issRate: 5` (percentual) — os `expect` de `pAliq` numérico (`5.00`) não mudaram, só a premissa do dado de entrada. Anterior: spec erp/029-pagamento-nfe-edicao-cliente-downloads, B1 — `POST /v1/nfe` ganha `payments?: {method, amount, description?}[]` opcional (`IssueNfePaymentBodyDto` no DTO HTTP + `IssueNfePaymentDto` no tipo da camada de aplicação — os dois declarados independentemente, mesmo padrão pré-existente de `IssueNfeDto` neste módulo, sem mapper explícito) — o builder XML (`nfe-xml.builder.ts`) já suportava múltiplos `payments[]` desde a NFC-e (um `detPag` por entrada); esta spec só estende a rota genérica de NF-e a aceitar o mesmo shape, usado agora pela erp-api pra mandar o `tPag` real de cada pagamento do pedido (em vez do `99` fixo — ver `apps/erp/api/AGENTS.md`). Quando `payments` vem vazio/ausente, cai no comportamento legado de 1 `detPag` só (`paymentMethodCode`) — não regride quem ainda não manda o campo novo. 2 testes novos em `issue-nfe.use-case.spec.ts`: N `detPag` quando `payments` vem preenchido, 1 `detPag` (legado) quando ausente. Anterior: spec erp/026-emissao-nfe-vendas — contrato `POST /v1/nfe` ganha campos por item: `icmsAliquota`, `origem`, `pis`, `cofins`, `ipi` — o builder XML (`nfe/infrastructure/xml/nfe-xml.builder.ts`) já suportava esses campos desde as specs 015/016/019, mas o DTO HTTP e o validador zod (`nfe-item.zod.validator.ts`) só carregavam `cst`/`csosn`; agora chegam ao XML de verdade. **FR-004 (revalidação)**: `pis`/`cofins`/`ipi` ganham allow-list de CST + limite de alíquota 0–100; **achado do security-reviewer nesta mesma sessão** — `cst`/`csosn` de ICMS não tinham NENHUMA validação (iam direto pro XML via `ICMSSN${item.csosn}`/`CST: item.cst`), o tributo de maior peso fiscal na nota ficando sem a defesa em profundidade que os demais já ganhavam; corrigido com allow-list da tabela oficial SEFAZ (`ICMS_CST_SUPPORTED`/`ICMS_CSOSN_SUPPORTED`, mais ampla que o subconjunto que o cadastro de Grupo de ICMS da erp-api oferece hoje) + rejeição de item com `cst` e `csosn` preenchidos ao mesmo tempo (ambíguo — o builder descartava um dos dois em silêncio). Novo `application/mappers/nfe-item-input.mapper.ts` traduz `NfeItemDto` (domínio, `cst`/`csosn` soltos) → `NfeItemInput` (builder, union literal) — usado tanto por `issue-nfe.use-case.ts` quanto por `issue-nfce.use-case.ts` (mesmo validador/mapper, os dois documentos compartilham o shape de item). Zero migration — os campos vivem só no payload da chamada síncrona. Anterior: achado pós-teste manual em `api.aplopes.com` — `resources/ca/icp-brasil.pem` nunca existiu no repo, causando 503 em toda emissão real; instalado, ver §"Cadeia ICP-Brasil" abaixo. Anterior: `specs/erp/024-fiscal-exclusoes`, Parte B — `Company` ganha `clearCsc()` (zera `cscId`+`cscTokenEncrypted` juntos, idempotente), `ClearCscUseCase` (molde de `SetCscUseCase`: `CompanyAccessPolicy` primeiro, 404 não 403) e `DELETE v1/companies/:id/csc` (`fiscal.companies.manage`). O bloqueio "não remover com o PDV em Modelo 65" **não mora aqui** — mora no proxy `erp-web`, que consulta a erp-api antes de repassar (ver `apps/erp/web/AGENTS.md`); esta rota, isolada, sempre remove. ⚠️ **Achado no lint desta feature, não introduzido por ela**: `AuthGuard` importava `applyActingSub` (BUG-01) mas nunca chamava — o merge de `main` que trouxe o refactor M2M por vertical (`ee698de21`) perdeu essa linha ao resolver conflito. `X-Acting-Sub` estava sendo recebido pelo proxy e ignorado pela fiscal-api desde então; qualquer chamada de série/sequência via token de serviço caía em `sub: 'unknown'` (negada pela `CompanyAccessPolicy`, fail-closed — não era um buraco de segurança, mas quebrava a funcionalidade). Corrigido: `AuthGuard` volta a ler `X-Acting-Sub` e aplicar via `applyActingSub`. Anterior: N1 — re-teste achou as 4 rotas de escrita de `fiscal-sequences` (criar/ajustar número/ativar-desativar/excluir) devolvendo 403 pra todo mundo que não fosse `platform_admin`: exigiam `fiscal.sequences.manage`, string ausente do mapa de permissões (`shared/infra/http/decorators/permissions.ts`) — `fiscal_operator` nunca a tinha. Corrigido adicionando a permissão a `FISCAL_PERMISSIONS` e trocando a lista duplicada de `fiscal_operator` por `[...FISCAL_PERMISSIONS]` (elimina o drift que causou o bug). Novo teste `permissions.exhaustive.spec.ts` varre todo `@RequirePermission(...)` do código-fonte e afirma que cada string é concedida a algum papel — achou uma SEGUNDA fantasma (`fiscal.documents.read` em `list-nfse-events.route.ts`, corrigida para `.view`) antes mesmo de terminar de escrever o teste. N6 — `Company` ganhou `inutilizationJustification`/`cancellationJustification` (15–255 caracteres ou `null`, migration `20260814050000_company_default_justifications`, escrita à mão pelo mesmo motivo de sempre — shadow DB sem `citybox_uuid_v7()`) — persistidos e validados, mas **não** usados automaticamente em inutilizar/cancelar (limitação declarada: não existe tela em `erp-web` que chame essas rotas ainda). Anterior: `specs/erp/022-fiscal-acesso-scroll-ux` BUG-01 **persistia** — re-teste como lojista comum criado direto no ERP achou 404 em Séries/CSC de novo: `StoreMembershipCompanyAccessPolicy` só resolvia `platform.store_members`, e todo lojista onboardado por Configurações › Usuários do ERP nunca ganha linha lá. Query `UNION` ganhou o braço `erp.memberships` (fail-closed sem `erp.organizations` correspondente; `o.status='ACTIVE' AND o.deleted_at IS NULL` — achado do security-reviewer no diff, suspensão/soft-delete da org agora também bloqueia). §emissão, bloco 3, tem o detalhe completo. Anterior: `specs/erp/021-correcoes-fiscal` BUG-01/BUG-02 — `AuthGuard` aceita `X-Acting-Sub` só de tokens do client `citybox-fiscal-service` (`applyActingSub`, `shared/infra/http/auth/authenticated-user.ts`), corrigindo a `StoreMembershipCompanyAccessPolicy` que negava tudo pro service account (404 `CompanyNotFoundError` na aba Séries e no `PUT /csc`); `Company.update()` passa a ignorar chaves `undefined` do `UpdateCompanyDto` (`useDefineForClassFields`/ES2023 fazia `PATCH` parcial apagar campos não enviados e cair em 422 sempre))) |
| **Última atualização deste arquivo** | 2026-08-14 (deploy multi-realm) |

**Propósito em uma linha:** microserviço independente responsável pela emissão, consulta, cancelamento e correção de NF-e (via SEFAZ-BA) e NFS-e (Padrão Nacional, piloto Ilhéus/BA) em nome dos Emitentes (Lojas) do CityBox — v1 restrito a chamadas síncronas de sistemas internos (ERP/PDV/marketplace).

---

## 2. Posição no Monorepo

```
citybox/
├── apps/
│   ├── erp/api                    ← consumidor interno (v1) via chamada síncrona
│   └── verticals/{food,clinica}/api
├── services/
│   ├── payment-api                ← outro microserviço standalone (🔴 será refeito — não copiar padrões internos)
│   └── fiscal-api/                ← VOCÊ ESTÁ AQUI (@citybox/fiscal-api · :3116)
└── AGENTS.md                      ← contexto raiz (índice do monorepo)
```

**Importante**: serviço autocontido, com schema Prisma próprio (`fiscal`) no banco `citybox` compartilhado com food-api/clinica-api (mesma instância, schema isolado — **não** um banco dedicado como `payment-api`, ver [research.md §4](../../specs/002-fiscal-api/research.md#4-persistência)).

**Depende de (infra externa)**:
- **PostgreSQL** compartilhado `citybox` (schema `fiscal`, via `DATABASE_URL`)
- **MinIO** — bucket dedicado `fiscal` (XML autorizado + certificados `.pfx` criptografados)
- **Keycloak** — verificação local de JWT (sem chamada ao Admin API), mesmo padrão de food-api/clinica-api
- **SEFAZ-BA** (NF-e) — webservices SOAP, homologação em `hnfe.sefaz.ba.gov.br` (integrado — `SefazBaNfeProvider`; ver ressalva sobre o WSDL best-effort no aviso de status acima)
- **MetropolisWeb/POLIS Ilhéus** (NFS-e) — protocolo exato **ainda não confirmado** com o município (ver research.md §7)

**Consumido por (v1 — só clientes internos, FR-015 do spec)**: `apps/erp/api` e demais sistemas internos do CityBox, via chamada síncrona de API (FR-016) — sem onboarding self-service de clientes externos neste v1.

---

## 3. Stack e Convenções

Documentado integralmente em [`specs/002-fiscal-api/plan.md`](../../specs/002-fiscal-api/plan.md) (Technical Context) e [`specs/002-fiscal-api/research.md`](../../specs/002-fiscal-api/research.md). Resumo:

- **Framework**: NestJS 11.1.24 (via `catalog:` do `pnpm-workspace.yaml`), TypeScript `^5.7.3`, Node.js 24 (`node:24-alpine`)
- **ORM**: Prisma 7.8.0 + `@prisma/adapter-pg`, schema em `prisma/schema.prisma` (`datasource.schemas = ["fiscal"]`), todo `id` com `citybox_uuid_v7()` como default (Constitution V)
- **Arquitetura**: Clean Architecture por módulo (`domain/` → `application/` → `infrastructure/`), igual a `apps/verticals/food/api`/`apps/verticals/clinica/api` — **não** o padrão flat de `services/payment-api`
- **Validação**: `class-validator`/`class-transformer` nos DTOs HTTP, `zod` nos validadores de domínio
- **Auth**: verificação local de JWT Keycloak via `jose` (sem chamada ao Admin API) — guards em `src/shared/infra/http/guards/`
- **Storage**: `minio` (SDK oficial) via interface `ObjectStorage` — mesmo padrão de `erp-api`/`imoveis-api`/`clinica-api`/`food-api`
- **Bibliotecas específicas do domínio fiscal** (nenhuma existia no monorepo antes deste serviço): `xmlbuilder2` (build XML), `libxmljs2` (validação XSD + extração de XML embutido em resposta SOAP), `xml-crypto` (assinatura XMLDSig), `node-forge` (parse de certificado PKCS#12/.pfx), `soap` (cliente SOAP para a SEFAZ-BA, `shared/infra/fiscal-soap/`)
- **Testes**: Jest (`ts-jest`) — projeto `unit` (`src/**/*.spec.ts` + `*.contract.spec.ts`, providers/repositórios fake) e projeto `integration` (`tests/integration/**/*.integration.spec.ts`, Postgres real). Cobertura mínima **80%** (política do monorepo)

---

## 4. Variáveis de Ambiente

Ver [`.env.example`](.env.example) — cada variável comentada com sua origem/uso. Destaques:

| Variável | Obrigatória | Notas |
| --- | --- | --- |
| `DATABASE_URL` | sim | `postgresql://...citybox?schema=fiscal` |
| `MINIO_ENDPOINT`/`MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY`/`MINIO_BUCKET` | sim (produção) | Bucket `fiscal`; apontar para a instância canônica de `infra/minio` (porta 9000) — **não** a porta 9002 usada (parece legada) por food/clinica |
| `KEYCLOAK_ALLOWED_ISSUERS` | sim | CSV de issuers aceitos; produção recebe M2M do realm `citybox-erp` |
| `KEYCLOAK_ALLOWED_AZP` | sim | CSV de clients aceitos; produção: `fiscal-m2m` |
| `FISCAL_CERT_ENCRYPTION_KEY` | sim | AES-256-GCM, 32 bytes em base64 — nunca reaproveitar entre ambientes |
| `SEFAZ_BA_NFE_HOMOLOGATION_ENDPOINT` | sim (dev) | Só homologação neste v1 — nenhuma transmissão em produção |
| `SEFAZ_BA_NFE_PRODUCTION_ENDPOINT` | não (v1) | Deixar vazio intencionalmente — habilitar produção é decisão explícita fora do escopo desta entrega |
| `SEFAZ_BA_NFE_AUTORIZACAO_WSDL_PATH` / `SEFAZ_BA_NFE_CONSULTA_WSDL_PATH` | não | Sobrescreve o caminho dos WSDLs locais (`resources/wsdl/nfe/*.wsdl`, autoria própria — ver aviso de status) |
| `SEFAZ_CA_BUNDLE_PATH` | não | Sobrescreve o caminho da cadeia ICP-Brasil (`resources/ca/icp-brasil.pem`). **⚠️ Certificados de CA vencem** — ver "Cadeia ICP-Brasil" abaixo |
| `SEFIN_NACIONAL_HOMOLOGATION_ENDPOINT` | não | Default `https://sefin.producaorestrita.nfse.gov.br/SefinNacional`. Emissão de NFS-e pelo Padrão Nacional |
| `SEFIN_NACIONAL_PRODUCTION_ENDPOINT` | **deliberadamente sem default** | Sem ela, `resolveSefinEndpoint` **recusa** PRODUCTION. Emitir em produção cria documento com valor legal — decisão de negócio, não configuração. Travado por `production-guard.spec.ts` |
| `NFSE_PARAMETRIZACAO_HOMOLOGATION_ENDPOINT` | não | Default `https://adn.producaorestrita.nfse.gov.br/parametrizacao`. API de parametrização municipal (prazos de cancelamento/substituição) — hospedada no **ADN**, separada do SEFIN |
| `NFSE_PARAMETRIZACAO_PRODUCTION_ENDPOINT` | **deliberadamente sem default** | Mesma recusa estrutural acima |
| `SEFIN_EVENT_PAYLOAD_FIELD` | não | Default `pedidoRegistroEventoXmlGZipB64`. 🚩 **Nome não confirmado** — existe como env justamente para ser corrigido sem alterar código quando o Manual de Orientação ao Contribuinte confirmar |
| `NFSE_DPS_XSD_PATH` / `NFSE_PED_REG_EVENTO_XSD_PATH` | não | Sobrescrevem o caminho dos XSD oficiais. **⚠️ Leiaute vencido derruba emissão** — ver "Leiaute da NFS-e Padrão Nacional" abaixo |
| `NFSE_ILHEUS_METROPOLIS_*` | 🔴 **obsoleta** | O provider municipal foi superado pelo Padrão Nacional (Decreto Municipal nº 220/2026). Remoção do código é T014, ainda pendente |

### `SEFIN_NACIONAL_DANFSE_ENDPOINT` (spec 004, opcional)

Endpoint do DANFSE gerado pelo próprio órgão. **Vazio é a situação normal
hoje**: verificado em 2026-08-07 que produção restrita responde `501`. Sem a
variável o sistema nem tenta a chamada e gera o DANFSE localmente — a API
oficial é *preferida*, não *necessária* (FR-002a). Quando o órgão publicar o
serviço, basta preencher: o código já prefere a fonte oficial e registra a
origem no header `X-Document-Origin`.

### Cupom fiscal — NFC-e (spec 005)

🔴 **A NFC-e precisa de endpoint PRÓPRIO** — descoberto no E2E de 2026-08-09.

O certificado A1 é o mesmo da NF-e; **o webservice não é**. Enviar modelo 65 ao
endpoint de NF-e devolve `Rejeição 702 — NFC-e não é aceita pela UF do Emitente`.
A Bahia é autorizadora própria para NFC-e (não usa SVRS), com URL separada por
modelo. **A URL correta ainda não é conhecida**: está no Manual de Configuração
do Programa Emissor NFC-e da SEFAZ-BA, e o site não abre por ferramenta
automatizada (falha de cadeia de certificado). Sondar não resolve — `/webservices/`
responde `403` para qualquer caminho.

| Variável | Sem valor padrão? | Efeito de faltar |
| --- | --- | --- |
| `NFCE_QRCODE_URL_<UF>_<AMBIENTE>` | **Sim** | Emissão recusada com 424 |
| `NFCE_CHAVE_URL_<UF>_<AMBIENTE>` | **Sim** | Idem |
| `NFCE_CONSUMER_LIMIT_<UF>` | Não (R$ 10.000) | Usa o padrão — **confirme antes de produção** |
| `NFCE_CONTINGENCY_DEADLINE_HOURS` | Não (24) | Idem |
| `NFCE_CONTINGENCY_DRAIN` | Não (`off`) | Dreno automático desligado |

As duas primeiras não têm padrão de propósito: URL de consulta é **estadual**, e
apontar para o estado errado produz cupom autorizado com QR Code que leva a
lugar nenhum — falha que só aparece quando um consumidor tenta consultar. Mesmo
princípio de `SEFAZ_BA_NFE_PRODUCTION_ENDPOINT`.

⚠️ `NFCE_CONTINGENCY_DRAIN=on` só é seguro com **uma** instância da API: o
agendador usa `setInterval`, que roda em todo processo, e a fila ainda não tem
reivindicação atômica.

Valor inválido em qualquer das numéricas **cai no padrão**, nunca em `NaN`: um
`NaN` faria toda comparação ser falsa, e o limite/alarme desapareceria em
silêncio.

### Status dos órgãos fiscais (spec fiscal/001)

`GET /api/v1/sefaz-status` — consulta "o órgão está atendendo?" para NF-e, NFC-e e
NFS-e, separada de qualquer emissão. Distingue **`DOWN`** (o órgão respondeu que
está fora) de **`UNREACHABLE`** (não obtivemos resposta — pode ser rede/certificado
local), a distinção que dá razão à feature. Não consome numeração nem cria
documento. Só HOMOLOGATION; PRODUCTION recusado com 424 antes de qualquer contato.

- **Rota**: `GET /v1/sefaz-status` (header `X-Company-Id`, `@RequirePermission('fiscal.documents.view')`, `CompanyAccessPolicy` → 404 cross-tenant). Query opcional `models=NFE,NFCE,NFSE` (ausente = os três) e `environment`.
- **Tabela**: `fiscal.sefaz_status_check` (append-only) — serve de cache (FR-007) e auditoria (FR-013) ao mesmo tempo. Serializada por `pg_advisory_xact_lock` por `(empresa, modelo, ambiente)`: N consultas simultâneas ⇒ **1** contato ao órgão (provado por mutation testing — ver `tests/integration/window-lock.concurrency.integration.spec.ts`).
- **Endpoints de status** (operação `NFeStatusServico4`, roteada por modelo — confirmados no portal DFe do SVRS e na lista da Fazenda, 2026-08-12): NF-e → `hnfe.sefaz.ba.gov.br/webservices/NFeStatusServico4/NFeStatusServico4.asmx`; NFC-e → `nfce-homologacao.svrs.rs.gov.br/ws/NfeStatusServico/NFeStatusServico4.asmx`.
- **NFS-e → `UNVERIFIABLE`**: o Sistema Nacional não tem operação de disponibilidade confirmada (doc exige certificado até para ser lida). Retorna `não verificável` com a razão, em vez de sondagem sintética que consumiria cota. Vira contato real quando a operação for confirmada — sem mudar o contrato.

| Variável | Sem valor padrão? | Efeito de faltar |
| --- | --- | --- |
| `SEFAZ_STATUS_MIN_INTERVAL_SECONDS` | Não (180) | Usa 3 min entre contatos reais por empresa/modelo/ambiente. Valor inválido cai no padrão. **Confirmar o piso real por órgão antes de produção** — exceder pode bloquear o CNPJ. |

### Cadeia ICP-Brasil (`resources/ca/icp-brasil.pem`)

Material criptográfico **versionado no repositório**, necessário para validar o certificado
apresentado pelo **servidor** da SEFAZ — não confundir com o certificado A1 do Emitente, que é a
credencial do cliente no TLS mútuo. O bundle padrão do Node é a lista de raízes da Mozilla, que
não inclui a ICP-Brasil, e o servidor da SEFAZ envia apenas a folha e a intermediária.

⚠️ **Achado 2026-08-14 — o arquivo nunca existiu de verdade neste repositório**, apesar desta
seção descrevê-lo como versionado. Um teste manual em produção (`api.aplopes.com`) reportou os
três órgãos (SEFAZ-BA, SVRS, Sefin Nacional) como fora do ar (`UNREACHABLE`, 503 em toda emissão) e
concluiu, razoavelmente pela mensagem de erro, que era queda simultânea do lado deles. Não era:
`resources/ca/` não existia nem no repo nem no container (`ls` confirmou), e o log interno do
processo (não exposto ao chamador) mostrava a causa real —
`SefazCaBundleNotFoundError`/`SefinUnavailableError` embrulhando "Bundle de CA da ICP-Brasil não
encontrado". Verificado que **não era rede**: DNS resolve os três hosts, TCP:443 conecta nos três a
partir do próprio container, egress genérico funciona — só faltava este arquivo local. Buscados os
dois certificados nas fontes oficiais (tabela abaixo, mesmas origens já documentadas aqui) e
instalados; os 14 testes que já falhavam por este motivo (`sefaz-ca-bundle.spec.ts`,
`sefin-http-client.spec.ts`) passam agora. Adicionalmente: `sefaz-soap-client.ts`/
`sefin-http-client.ts` não embrulham mais `SefazCaBundleNotFoundError` em
`SefazUnavailableError`/`SefinUnavailableError`, e `SefazBaStatusProbe` passa a devolver
`LOCAL_ERROR` (não `UNREACHABLE`) quando a causa é esta — para que esse diagnóstico não se repita.

Origem de cada certificado (extensão AIA da própria cadeia, não fonte de terceiro):

| Certificado | Origem | Válido até |
| --- | --- | --- |
| Autoridade Certificadora Raiz Brasileira v10 | `http://acraiz.icpbrasil.gov.br/ICP-Brasilv10.crt` (repositório oficial do ITI) | **2032-07-01** |
| AC Certisign ICP-Brasil SSL EV G4 | apresentada no handshake por `hnfe.sefaz.ba.gov.br`; AIA aponta `icp-brasil.certisign.com.br` | **2032-07-01** |

**⚠️ CA expirada quebra a emissão em produção sem nenhuma mudança de código.** O teste
`src/shared/infra/fiscal-soap/tests/sefaz-ca-bundle.spec.ts` falha se qualquer certificado do
bundle estiver vencido, transformando o vencimento em falha de CI antecipada em vez de incidente.
Ao renovar, atualizar as datas desta tabela e o cabeçalho do próprio `.pem`.

O bundle é injetado como parâmetro `ca` do `soap.ClientSSLSecurity` — escopado à chamada da SEFAZ
de propósito. `NODE_EXTRA_CA_CERTS` alargaria o trust store do processo inteiro, que também fala
com MinIO e Keycloak.

### Leiaute da NFS-e Padrão Nacional (`resources/xsd/nfse/1.01/`)

Mesma natureza de risco da cadeia acima: **leiaute vencido derruba a emissão em produção sem
nenhuma mudança de código** — o órgão passa a exigir outra versão e nada no repositório muda.

| Item | Valor | Origem |
| --- | --- | --- |
| Versão adotada | **1.01** | `NFSE_LEIAUTE_VERSION` em `src/modules/nfse/infrastructure/xml/nfse-leiaute-version.ts` — constante única, consumida por todos os builders |
| XSD versionados | `resources/xsd/nfse/1.01/` | publicação oficial `NFSe-ESQUEMAS_XSD-v1.01-20260209`, conferida byte-a-byte |
| Versões que os XSD aceitam | `1.00` \| `1.01` | `pattern` de `TVerNFSe` em `tiposSimples_v1.01.xsd` |
| Vigência | **sem data de expiração publicada** pelo órgão | acompanhar as notas técnicas do Sistema Nacional da NFS-e |

**⚠️ Diferença importante em relação à cadeia ICP-Brasil**: o certificado carrega a própria data de
validade, então o teste consegue detectar o vencimento sozinho. O leiaute **não** — não há data no
XSD para verificar. Por isso `nfse-leiaute-version.spec.ts` cobre o que é verificável (a versão
declarada existe, é aceita pelo `pattern` do XSD, e todos os builders emitem a mesma), mas
**não substitui acompanhar as notas técnicas**. Ao adotar versão nova: trocar `NFSE_LEIAUTE_VERSION`,
adicionar `resources/xsd/nfse/<nova>/` e atualizar esta tabela na mesma operação — o teste falha se
as três coisas se separarem.

---

## 5. Módulos (planejado vs. implementado)

Ver a árvore completa planejada em [`specs/002-fiscal-api/plan.md` § Project Structure](../../specs/002-fiscal-api/plan.md#project-structure). Esta seção é atualizada a cada tarefa concluída de `tasks.md`:

| Módulo | User Story | Status |
| --- | --- | --- |
| Prisma schema + migration (`fiscal`) | — | 🟢 Completo |
| `shared/infra` (Prisma, Keycloak guards, MinIO storage, filtro de erros, health) | — | 🟢 Completo |
| `shared/infra/fiscal-xml` (build + validação XSD) | — | 🟢 Completo |
| `shared/infra/fiscal-signature` (PKCS#12, XMLDSig, criptografia da senha) | — | 🟢 Completo (testado: parser + signer + encryption, 12 specs) |
| `shared/infra/fiscal-soap` (cliente SOAP genérico — TLS mútuo, timeout, retry) | — | 🟢 Completo (testado: WSDL real parseado + transporte HTTP mockado, 10 specs) |
| `modules/providers` (`FiscalProviderFactory`) | — | 🟢 Completo — `SEFAZ_BA_NFE` e `ILHEUS_METROPOLIS_NFSE` registrados |
| `modules/providers/sefaz-ba` (`SefazBaNfeProvider` — `issue`/`consult`/`cancel`/`correctionLetter`/`inutilize`, todas reais) | US1/US4 (P1/P4) | 🟢 **100% completo** — testado: envelope/parser (21 specs) + provider (24 specs) |
| `modules/providers/ilheus-metropolis` (`IlheusMetropolisNfseProvider` — stub deliberado; `correctionLetter`/`inutilize` rejeitam como não-aplicável, `cancel` conectado a `CancelNfseUseCase`) | US2/US4 (P2/P4) | 🟡 Stub — transporte municipal não confirmado (research.md §7), dependência externa |
| `modules/companies` (CRUD do Emitente) | — | 🟢 Completo (`POST`/`GET`/`GET :id`/`PATCH`, testado). **2026-08-13 (spec `erp/012`):** o contrato de `PATCH /v1/companies/:id` (`UpdateCompanyInput`/`UpdateCompanyDto`) passou a listar **explicitamente** `accountingOfficeDocument` e `nationalNfseEnabled` (antes só persistiam via `Object.assign`); coberto por teste de use case. Consumido pela aba "Configurações gerais" do erp-web. **2026-08-14 (spec `erp/023`, N6):** `Company` ganhou `inutilizationJustification`/`cancellationJustification` (`string \| null`, 15–255 caracteres quando preenchida — `justificationSchema` compartilhado via `shared/domain/fiscal-justification.constants.ts`, mesma regra de `InutilizeNfeHttpDto`/`CancelNfeHttpDto`; migration `20260814050000_company_default_justifications`). Persistidos e expostos em `GET`/`PATCH /v1/companies/:id` — **não** aplicados automaticamente ao inutilizar/cancelar (`InutilizeNfeUseCase`/`CancelNfeUseCase` etc. inalterados): não há tela em `erp-web` que chame essas rotas ainda, então pré-preencher um formulário inexistente não é requisito executável (limitação declarada no plan.md da 023). 6 testes novos em `company.entity.spec.ts`. |
| `modules/fiscal-documents` (consulta genérica — FR-003) | — | 🟢 Completo (`GET`/`GET :id`/`GET :id/events`/`GET /summary`, testado). **2026-08-10** (spec `009-facilita-nfe-screen`, consumidor: `erp-web` `financas/facilita-nfe`): `GET` ganhou `search` (busca livre por `number`/`series`, `contains` insensitive no Prisma — nome de cliente ficou fora do escopo, `InMemoryFiscalDocumentRepository` não tem join com `Customer`); resposta ganhou `customerName` (join de leitura `findAll`/`findById` → `customer.name`, entidade ganhou `withCustomerName`/`customerName` no mesmo padrão de `withItems`, nunca persistido por `save()`); `documentType` do `@ApiQuery` corrigido para incluir `NFCE` (já era aceito pelo DTO, só a doc Swagger estava desatualizada); novo `GET /v1/fiscal-documents/summary?companyId=&search=&documentType=&sourceSystem=&externalReference=` → `{ data: { total, authorized, cancelled } }` (3× `count()` em paralelo, mesma permissão `fiscal.documents.view`) — registrado **antes** de `GetFiscalDocumentRoute` (`:id`) em `fiscal-documents.module.ts` porque rota literal precisa vir antes de rota dinâmica no Nest, senão "summary" casaria como `:id` |
| `modules/certificates` (upload/ativação/status/lista, testado) | US3 (P3) | 🟢 **100% completo** — `UploadCertificateUseCase` valida PKCS#12 real, CNPJ, magic bytes |
| `modules/nfe` (validadores, `IssueNfeUseCase`/`ConsultNfeUseCase`/`GetNfeXmlUseCase`/`CancelNfeUseCase`/`CorrectionLetterNfeUseCase`/`InutilizeNfeUseCase`, rotas HTTP) | US1/US4 (P1/P4) | 🟢 **100% completo** |
| `modules/nfse` (validadores, `IssueNfseUseCase`/`CancelNfseUseCase`, rotas HTTP) | US2/US4 (P2/P4) | 🟢 **100% completo do lado da API** — transmissão real bloqueada por provider stubado (dependência externa) |
| `modules/sefaz-status` (spec fiscal/001 — `CheckSefazStatusUseCase`, `StatusProbe` SEFAZ+NFS-e, `PrismaStatusCheckRepository` com advisory lock, rota `GET /v1/sefaz-status`) | fiscal/001 | 🟢 **100% completo** — 37 specs (unit + integração); NFS-e retorna `UNVERIFIABLE` até operação de status ser confirmada (R2) |
| `modules/auxiliary-documents` (DANFE + DANFSE — spec 004) | spec 004 | 🟢 **Completo** — `GET /v1/nfe/:id/danfe` e `GET /v1/nfse/:id/danfse`; 83 specs unitários + 16 de integração |
| `modules/nfce` (cupom fiscal — NFC-e modelo 65, spec 005) | spec 005 | 🟡 **Código completo, NÃO validado contra a SEFAZ** — ver seção própria abaixo |
| `modules/fiscal-sequences` (séries/numeração — spec erp/011) | erp/011 | 🟢 **Completo** — 5 rotas CRUD sobre `FiscalSequence` (`GET`/`POST /v1/companies/:companyId/sequences?environment=`, `PATCH /v1/sequences/:id/number`, `PATCH /v1/sequences/:id/active`, `DELETE /v1/sequences/:id`); permissão de escrita **`fiscal.sequences.manage`** (leitura `fiscal.documents.view`); `CompanyAccessPolicy` (404 cross-tenant). ⚠️ **`active` deixou de ser decorativo**: `IssueNfe/Nfce/NfseUseCase.reserveNextNumber` recusa série inativa (`SeriesInactiveError`, 422) — criação sob demanda segue com `active:true` (não-regressão). Série **canonicalizada** ("001"↔"1", `series-format.ts`) para casar com a série da emissão. Editar número **só aumenta** (`SeriesNumberDecreaseError`) e **audita** na tabela nova `fiscal_sequence_number_changes` (migration `20260813120000`). Excluir só com `currentNumber=0` (`SeriesInUseError`); senão desativar. 13 specs (12 unit + 1 emissão-inativa). |
| Ciclo de vida (cancelar/corrigir/inutilizar) | US4 (P4) | 🟢 **100% completo** — NF-e (cancelar/carta de correção/inutilizar) e NFS-e (cancelar) prontos do lado da API |

---

### Documento auxiliar impresso — DANFE / DANFSE (spec 004)

`src/modules/auxiliary-documents/` gera o PDF imprimível de uma nota **já
autorizada**, a partir do **XML autorizado** — nunca dos dados relacionais.

| Rota | Documento | Órgão |
| --- | --- | --- |
| `GET /v1/nfe/:id/danfe` | DANFE (mercadoria) | — a SEFAZ **não** fornece DANFE pronto; o emitente gera |
| `GET /v1/nfse/:id/danfse` | DANFSE (serviço) | API oficial do Sefin **preferida** quando disponível |

**Nada é persistido.** Sem migration, sem tabela, sem coluna — o documento é
projeção do XML e vive o tempo da requisição. É isso que torna a reimpressão
estruturalmente fiel: o renderizador recebe `Buffer` de XML, não a entidade, e
por isso **não consegue** deixar uma mudança de cadastro vazar para a via de uma
nota antiga.

#### Três decisões que não são óbvias no código

1. **DANFE adota biblioteca, DANFSE é próprio.** Divergência deliberada: para o
   DANFE existe `@alexssmusica/node-pdf-nfe` (MIT, mantida) implementando o
   leiaute regulado; para o DANFSE as opções de mercado têm <2k downloads/mês e
   **nenhum repositório público**. Caixa-preta em documento fiscal é pior que
   código sob nosso controle. A porta `AuxiliaryDocumentRenderer` mantém a
   diferença invisível para o use case.

2. **A marca d'água NÃO mora no renderizador.** É um estágio `Buffer → Buffer`
   (`WatermarkStamper`) aplicado ao PDF pronto. Três fontes produzem PDF aqui —
   a lib do DANFE, o nosso DANFSE e a API oficial do Sefin. Um marcador embutido
   no renderizador deixaria o documento do órgão **sem marcação**, quebrando
   FR-005 justamente no caminho preferido. Há teste que estampa um PDF de motor
   de terceiro só para travar essa regressão.

3. **A autorização parte do `sub` do JWT, não do header.** O `X-Company-Id`
   diz *qual* Emitente, mas quem decide se vale é a `CompanyAccessPolicy` —
   e, desde `specs/erp/022` (BUG-01 do re-teste 2026-08-14), por **dois**
   caminhos possíveis em `UNION` (o lojista pode ter sido provisionado pelo
   admin OU criado direto no ERP — os dois nunca ganham linha um no modelo
   do outro):

   ```
   sub (JWT verificado)
     → platform.members.keycloak_sub  → platform.store_members.store_id  ─┐
     → erp.users.keycloak_sub → erp.memberships.organization_id           ├→ fiscal.companies.store_id
       (ms.active) → erp.organizations.platform_store_id                  │  (@unique — 1 loja, 1 Emitente)
       (o.status='ACTIVE' AND o.deleted_at IS NULL) ──────────────────────┘
   ```

   Nasceu de achado de revisão (2026-08-08, **HIGH**): antes, a comparação
   confrontava o banco contra um valor que o próprio solicitante escolhia —
   impedia engano, não impedia ataque. Recusa devolve **404**, nunca 403: um
   403 confirmaria que a nota existe.

   Consequências operacionais:

   - **Consulta crua cruzando schema.** `members`/`store_members`
     (`admin-api`) e `organizations`/`memberships`/`users` (`erp-api`)
     pertencem a outros serviços; modelá-las aqui duplicaria posse
     (Princípio V). O custo é acoplamento sem erro de compilação —
     `company-access-policy.integration.spec.ts` é o alarme.
   - **Falha nega.** Banco fora do ar, schema ausente, ou `platform_store_id`
     malformado em qualquer linha de `erp.organizations` (exceção de cast
     `::uuid` propaga pro `catch`) ⇒ recusa de todo mundo, não bypass —
     achado do security-reviewer no diff (2026-08-14): risco de
     disponibilidade, não de autorização; dado ruim em `erp.organizations`
     não é controlável por quem ataca.
   - **`platform_admin` passa direto**, antes da consulta — mesmo bypass do
     `StoreMembershipGuard` do `admin-api`, e o que mantém o `AUTH_DEV_BYPASS`
     funcionando num banco local sem o schema `platform`.
   - **`ms.active = TRUE` sozinho não bastava** (achado do security-reviewer):
     organização `SUSPENDED`/`INACTIVE`/soft-deletada (`erp.organizations`)
     continuava liberando acesso com vínculo ativo — o próprio erp-api
     (`tenant-context.guard.ts`) já nega isso pros seus usuários. O braço ERP
     da query ganhou `AND o.status = 'ACTIVE' AND o.deleted_at IS NULL`.
   - **`UNION`, não `LEFT JOIN`/`OR`** — cada braço é uma busca independente
     por `sub`; `company` sem `erp.organizations.platform_store_id`
     correspondente simplesmente não produz linha nesse braço (comparação
     com `NULL` nunca é verdadeira), sem `CASE`/`COALESCE` extra.

   ⚠️ `GET /:id/xml` **continua** com a decisão do v1 (header não verificado,
   `company-id.decorator.ts`). Divergência conhecida: as rotas de documento
   auxiliar foram endurecidas porque o produto delas sai da plataforma.

#### Marca Citybox no rodapé — REMOVIDA (spec 029, FR-014)

⚠️ **A marca de fornecedor (logo + legenda "…plataforma Citybox…") foi removida
de DANFE e DANFSE.** A spec 029 reverteu a decisão da spec 004 (FR-011…FR-014):
documento fiscal padronizado não exibe marca de fornecedor concorrendo com a
identidade visual nacional exigida pela NT 008/2026. Foram apagados o
`BrandStamper` (porta `domain/branding.ts`), a impl `citybox-brand.stamper.ts`,
o provider no módulo e o asset `resources/brand/citybox-logotipo.svg`. Os testes
de integração (`get-danfe`/`get-danfse`) agora afirmam a **ausência** da marca.

Permanece **apenas** o `WatermarkStamper` (marca d'água de homologação),
aplicado sobre o PDF pronto **fora** do renderizador — condicional ao ambiente
(só homologação) e independente da origem (também no PDF vindo do órgão). Não há
mais dois estampadores: o pipeline do use-case é `render → (homolog? watermark)`.

⚠️ **Nunca use `pathLogo` da biblioteca de DANFE.** Ela desenha dentro do quadro
"IDENTIFICAÇÃO DO EMITENTE" (`get-dados-emitente.js:66`) — a caixa que declara
quem emitiu a nota. Uma logo nossa ali afirmaria que o Citybox é o emitente num
documento que acompanha mercadoria e vai para fiscalização. O teste
`danfe.renderer.spec.ts` trava isso; aquele slot pertence ao **lojista**.

#### DANFSE v2.0 conforme a NT 008/2026 (spec 029)

O `danfse.renderer.ts` reproduz o **modelo oficial do DANFSe v2.0** (RTC NT-008
v1.02, figura do leiaute). ⚠️ **O modelo NÃO tem grade de células**: os campos
são só rótulo (pequeno, no topo) + valor (abaixo) posicionados em colunas, **sem
moldura por campo nem divisória vertical**. A divisão é só **por tópico** — uma
linha horizontal (`topicLine`) separa cada seção — mais a **célula-título cinza**
da seção e a **moldura externa** (`outerFrame`). Cabeçalho, rodapé e QR são a
exceção emoldurada (3 colunas com divisória via `vLine`). Primitivas em
`danfse-layout.ts`: `fieldsRow` (campos sem moldura; `Cell.title` = título
cinza), `textBlock`, `topicLine`, `vLine`, `outerFrame`, `ensureSpace`. Ordem das
seções (todas parte fixa do modelo):
cabeçalho (identidade nacional / título / município) → CHAVE DE ACESSO + QR +
identificação (nº NFS-e, competência, nº/série da DPS, situação) → PRESTADOR /
FORNECEDOR → TOMADOR / ADQUIRENTE → DESTINATÁRIO DA OPERAÇÃO → INTERMEDIÁRIO DA
OPERAÇÃO → SERVIÇO PRESTADO → TRIBUTAÇÃO MUNICIPAL (ISSQN) → TRIBUTAÇÃO FEDERAL
(EXCETO CBS) → TRIBUTAÇÃO IBS/CBS → VALOR TOTAL DA NFS-e → INFORMAÇÕES
COMPLEMENTARES → rodapé (Nº NFS-e / Chave — os 50 dígitos ficam AQUI, como no
modelo, não sob a barra da chave).

- **Estrutura FIXA do modelo**: todas as seções aparecem sempre, inclusive
  DESTINATÁRIO, INTERMEDIÁRIO e IBS/CBS — mesmo sem dado. ⚠️ Isto **ajusta** a
  FR-005 da spec 029 (que dizia "omitir intermediário quando ausente"): o modelo
  oficial é um template de estrutura fixa, então a seção aparece com **células em
  branco**, não omitida.
- **Células sem dado ficam em branco** (só o rótulo) — nunca `R$ 0,00` para campo
  ausente (spec 029 R3). IBS/CBS (reforma tributária) e DESTINATÁRIO não têm
  fonte no Padrão Nacional 1.01 hoje: saem com rótulos e valores em branco.
- Autenticação por **QR Code** (não código de barras 1D — o modelo v2.0 usa QR).
- **Conferência do leiaute**: o modelo oficial está na figura da NT (RTC NT-008
  v1.02, pág. 25 do PDF). Para rasterizar um PDF gerado e comparar, use `mupdf`
  (WASM, sem binário nativo) num script `.mjs` descartável — não deixá-lo no
  `package.json`.

**Identidade visual nacional** (`resources/brand/nfse-nacional-horizontal.png`,
PNG oficial de gov.br/nfse, ~1920×389): embutida via `image()` no cabeçalho, com
**fallback textual** ("NFS-e / Padrão Nacional") no mesmo slot se o asset faltar.

⚠️ **Asset em `resources/`, lido via `process.cwd()`** — o `nest build` compila
só TS para `dist/`; arquivo não compilável fica em `resources/` (copiado pelo
Dockerfile) e é lido pelo diretório de trabalho, não por `__dirname`.

O `nfse-xml.reader.ts` extrai **todos** os campos da NT do XML autorizado, de
dois níveis: valores calculados (`vBC`/`vISSQN`/`vLiq`/`vTotalRet`) vêm do
`infNFSe > valores`; endereços, intermediário, descontos e retenções federais
(`piscofins`, `vRetCP`, `vRetIRRF`, `vRetCSLL`) da DPS aninhada. Mapa completo
em `specs/erp/029-danfse-nt008-conformidade/data-model.md`. Campo ausente ⇒
`undefined` (o renderizador então omite a linha).

#### Chave de acesso: comprimentos diferentes

| Documento | Dígitos |
| --- | --- |
| NF-e | **44** |
| NFS-e | **50** |

`infrastructure/pdf/barcode.ts` valida os dois e recusa qualquer outro — código
de barras truncado em documento fiscal parece válido até alguém tentar ler.

#### Onde os dados do prestador da NFS-e vivem

A **DPS não pode conter `xNome` do prestador** (o Sefin rejeita com `E0121`,
deduzindo pelo CNPJ). Quem preenche é o **Sefin**, no grupo `emit` do
`infNFSe`. Um leitor que consulte só o `prest` da DPS produz DANFSE sem o nome
de quem prestou o serviço — ver `nfse-xml.reader.ts`.

#### Dependências novas (todas MIT, todas JS puro)

`@alexssmusica/node-pdf-nfe` · `pdf-lib` · `pdfkit` · `bwip-js` · `qrcode`
(+ `@types/pdfkit`, `@types/qrcode` em dev). Nenhuma traz binário nativo — o
que descartou `pdf-parse` e `pdfjs-dist@3` como extratores de teste.

---

---

### Cupom fiscal eletrônico — NFC-e, modelo 65 (spec 005)

`src/modules/nfce/` emite o **cupom fiscal**: o documento do balcão, para venda
presencial a consumidor final.

> 🟡 **Nenhum cupom foi transmitido à SEFAZ ainda.** A suíte está verde e o XML
> valida contra o XSD oficial, mas o algoritmo do QR Code e o caminho de
> contingência **não foram exercitados contra o órgão**. Ver "O que falta
> confirmar" no fim desta seção antes de qualquer uso real.

#### Por que reusa a NF-e em vez de duplicar

NFC-e e NF-e compartilham **o mesmo XSD, o mesmo webservice e o mesmo
certificado** — o que muda é `mod` (65 em vez de 55) dentro do XML. Então:

| Peça | Decisão |
| --- | --- |
| XML | `nfe-xml.builder.ts` parametrizado por `model` e `emissionType` |
| Consulta | `ConsultNfeUseCase` reusado — já era genérico por `FiscalDocument` |
| Cancelamento | `CancelNfeUseCase` reusado — prazo vem de `documentType` |
| Inutilização | `InutilizeNfeUseCase` parametrizado por `documentType` |
| Bobina | Biblioteca já adotada — ela despacha por `ide.mod` |
| Emissão | **Próprio** (`IssueNfceUseCase`): CSC, QR Code, pagamentos e contingência não existem na NF-e |
| A4 | **Próprio** (`DanfceA4Renderer`): o formato não é regulado, não há biblioteca |

Duplicar cancelamento ou consulta daria duas máquinas de estado para manter em
sincronia, e a divergência só apareceria com uma nota presa em estado
inconsistente.

#### Rotas

| Rota | Observação |
| --- | --- |
| `POST /v1/nfce` | Emitente vem do header `X-Company-Id`, validado por `CompanyAccessPolicy` — **não** do corpo, ao contrário de `POST /v1/nfe` |
| `GET /v1/nfce/:id` | |
| `GET /v1/nfce/:id/danfce` | `?formato=a4`; padrão é bobina |
| `POST /v1/nfce/:id/cancel` | Prazo de **30 minutos**, não 24h |
| `POST /v1/nfce/inutilize` | `documentType: 'NFCE'` fixado na rota, não aceito do corpo |
| `PUT /v1/companies/:id/csc` | Cadastro do CSC. Não há endpoint de leitura, e não deve haver |
| `DELETE /v1/companies/:id/csc` | Remove o CSC (spec erp/024, Parte B) — zera `cscId`+`cscTokenEncrypted` juntos, idempotente. Resposta é o Emitente comum (`cscConfigured: false`), nunca ecoa o valor removido |

#### Quatro coisas que não são óbvias

1. **O CSC nunca chega à entidade em claro.** `SetCscUseCase` cifra; a `Company`
   só guarda o cifrado; `readCompanyCsc` é o único ponto que decifra. Como
   `Entity.props` é público, é isso que torna "não vaza em log" estrutural em
   vez de disciplinar.

2. **`infNFeSupl` é inserido DEPOIS de assinar**, por manipulação de texto e não
   por DOM. O grupo fica fora da assinatura, então é legítimo — mas
   reserializar por um parser mudaria espaçamento e quebraria o digest **em
   silêncio**. Ver `insertNfceSupplement`.

3. **Contingência não é retentativa.** `tpEmis` ocupa o dígito 35 da chave, então
   o cupom de contingência é outro documento, com outra chave. Por isso
   "enviamos e não sabemos se chegou" **não** vira contingência: se a original
   foi autorizada, seriam dois documentos fiscais para uma venda. Ver
   `domain/contingency/contingency-decision.ts`.

4. **Numeração isolada.** `fiscal_sequences` é única por
   `(company, documentType, series, environment)`, então `NFCE` ganha sequência
   própria só por existir no enum. Inutilizar a faixa errada é irreversível —
   daí `mod` e a checagem de sobreposição terem deixado de ser fixos em `55`.

#### Migration

`20260808200000_nfce_cupom_fiscal` — valor `NFCE` no enum, colunas de CSC em
`companies`, tabela `nfce_contingency_queue` (FK `ON DELETE RESTRICT`, índice
parcial em `PENDING`, CHECK amarrando `status`/`transmitted_at`).

#### O que falta confirmar antes de produção

| Item | Por quê |
| --- | --- |
| 🔴 **Endpoint de NFC-e da SEFAZ-BA** | **Bloqueia tudo.** Modelo 65 no endpoint de NF-e = rejeição 702. Está no Manual de Configuração do Programa Emissor NFC-e |
| 🔴 **URL curta de `urlChave`** | O XSD limita a **85 caracteres**; o caminho completo da página de consulta tem 87–88 e **não cabe**. A SEFAZ publica uma forma curta |
| Escanear um cupom real de homologação | Os testes travam a **forma** do QR Code contra o XSD; o **hash** só se prova contra o órgão |
| Limite de valor sem identificação (`NFCE_CONSUMER_LIMIT_BA`) | O padrão de R$ 10.000 não é leitura do decreto baiano |
| Prazo de contingência (`NFCE_CONTINGENCY_DEADLINE_HOURS`) | Idem, 24h é o patamar praticado |
| URLs de consulta por UF | Sem valor padrão: a emissão é recusada com 424 até serem configuradas |
| Credenciamento para modelo 65 | Fontes públicas indicam que a **BA não exige** credenciamento prévio (o CSC é pedido direto no portal). Não confirmado na fonte oficial — o site da SEFAZ-BA falha na validação de certificado por ferramenta automatizada |
| Substituição de `xProd` em homologação | O builder só troca o nome do destinatário; o MOC parece exigir também a descrição do primeiro item |
| Reivindicação atômica na fila | Sem ela o dreno automático só é seguro com **uma** instância da API |

---

## 6. Comandos

```bash
pnpm --filter @citybox/fiscal-api dev              # http://localhost:3116, Swagger em /api/v1/docs
pnpm --filter @citybox/fiscal-api db:migrate:dev
pnpm --filter @citybox/fiscal-api test             # unit (fakes em memória)
pnpm --filter @citybox/fiscal-api test:integration # Postgres real, gated por DATABASE_URL
pnpm --filter @citybox/fiscal-api build && pnpm --filter @citybox/fiscal-api lint && pnpm --filter @citybox/fiscal-api typecheck
```

**Em container** (desde 2026-08-05): o serviço sobe junto com a infra via `pnpm infra:up`
— compose em [`infra/fiscal-api/`](../../infra/fiscal-api/), imagem `citybox-fiscal-api:latest`,
container `citybox_fiscal_api` na rede `citybox-platform`. Só o `fiscal-api`:

```bash
pnpm infra:up fiscal-api    # up.sh aceita o nome de um serviço isolado
```

⚠️ Rodar no host (`dev`) e em container ao mesmo tempo **conflita na porta 3116** — os
dois publicam em `127.0.0.1:3116`. Escolher um. Os `.env` são independentes:
`services/fiscal-api/.env` (host) vs `infra/fiscal-api/.env` (container, hostnames de
container em vez de `127.0.0.1`).

⚠️ O build da imagem exige `python3 make g++` no estágio `deps` do Dockerfile — sem isso
o `libxmljs2` não compila e o serviço não sobe (ver `infra/AGENTS.md` 5.7). A migration
do schema `fiscal` **não** é aplicada pelo container: rodar `db:migrate:deploy` antes.

---

## 7. Referências

- Spec: [`specs/002-fiscal-api/spec.md`](../../specs/002-fiscal-api/spec.md)
- Plano técnico: [`specs/002-fiscal-api/plan.md`](../../specs/002-fiscal-api/plan.md)
- Decisões e pesquisa: [`specs/002-fiscal-api/research.md`](../../specs/002-fiscal-api/research.md)
- Modelo de dados: [`specs/002-fiscal-api/data-model.md`](../../specs/002-fiscal-api/data-model.md)
- Contratos de API: [`specs/002-fiscal-api/contracts/`](../../specs/002-fiscal-api/contracts/)
- Tarefas: [`specs/002-fiscal-api/tasks.md`](../../specs/002-fiscal-api/tasks.md)
- Documento de arquitetura fiscal de referência (mais amplo que o v1): [`packages/docs/fiscal/api_fiscal_completa.md`](../../packages/docs/fiscal/api_fiscal_completa.md)

---

## 8. Histórico de Mudanças Estruturais

- **2026-08-14**: deploy full passa a aplicar migrations do schema `fiscal`, rebuildar/subir `fiscal-api` e validar o health no host `127.0.0.1:3121`; autenticação aceita somente issuer `citybox-erp` e `azp=fiscal-m2m`.
- **2026-08-10**: **`GET /v1/fiscal-documents` ganha `search` + `customerName`; novo `GET /v1/fiscal-documents/summary`** (spec `009-facilita-nfe-screen`, consumidor: tela Facilita NFE do `erp-web`, `financas/facilita-nfe`, aba "Emitido"). Motivado pela Constitution do monorepo (busca/paginação backend-driven) — o consumidor não podia baixar a lista inteira para filtrar/somar no cliente. `search` casa contra `number`/`series` (Prisma `contains` insensitive); nome de cliente ficou fora do escopo (o repositório fake usado no contrato compartilhado Prisma↔in-memory não tem join com `Customer`). `customerName` é um join de leitura só de exibição (`FiscalDocument.withCustomerName`, mesmo padrão de `withItems` — não é uma prop de `FiscalDocumentProps`, nunca persistido por `save()`). `GET /summary` devolve `{ total, authorized, cancelled }` via 3 `count()` em paralelo sobre o mesmo filtro da listagem (sem `status`/paginação) — **não** inclui contagens de manifestação do destinatário (não existem para documento emitido). ⚠️ Registrado **antes** de `GetFiscalDocumentRoute` (`GET /:id`) em `fiscal-documents.module.ts` — rota literal precisa vir antes de rota dinâmica na ordem de `controllers` do Nest.
- **2026-08-09 (noite)**: **E2E real de NFC-e contra a SEFAZ** com o Emitente RR. Três rejeições em sequência, cada uma destravando a seguinte — e as três eram defeitos nossos:
  - 🔴 **`702 — NFC-e não é aceita pela UF do Emitente`.** A premissa de research.md R1 ("mesmo webservice da NF-e, só o modelo muda no XML") está **errada**. O *Manual de Configuração do Programa Emissor NFC-e* da SEFAZ-BA é explícito: **"HOMOLOGAÇÃO NFC-e - SEFAZ VIRTUAL SVRS"** — a Bahia **delega a NFC-e ao SVRS**. O certificado é o mesmo; o destino não. `sefaz-ba-config.ts` ganhou resolução por modelo, com mapa explícito dos caminhos do SVRS (que usam `/ws/`, não `/webservices/`, e variam até na caixa). O modelo é lido **do XML que está sendo enviado**, não por parâmetro, para que destino e conteúdo não possam divergir.
  - 🔴 **`373 — Descrição do primeiro item diferente de NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL`.** Confirma a dúvida que estava registrada em aberto desde T036: o builder só mascarava o **nome do destinatário**. Na NF-e isso basta (as notas desta base são autorizadas assim), mas o cupom normalmente **não tem destinatário**, então o órgão usa a descrição do primeiro item como marcador de teste. Implementado só para modelo 65 — não mexer no que já autoriza.
  - 🟡 **`462 — Código identificador do CSC no QR-Code não cadastrado na SEFAZ`.** Esperado: o E2E usou CSC placeholder. **É o melhor resultado possível sem CSC real** — significa que a SEFAZ leu o QR Code, extraiu o `cIdToken` e foi consultá-lo. Toda a estrutura está provada.
  - 🟡 **`urlChave` limitada a 85 caracteres pelo XSD**, e o caminho completo da página de consulta tem 87–88. A URL oficial de homologação é `http://hinternet.sefaz.ba.gov.br/nfce/consulta` (host **diferente** do QR Code). A validação passou a ocorrer na **leitura da configuração**: antes, uma URL longa dava `422` com o número já queimado; agora dá `424` antes de numerar.
- **2026-08-09 (tarde)**: **primeira execução real do roteiro de NFC-e** (`packages/docs/fiscal/roteiro-teste-nfce-homologacao.md`), com o Docker de volta. Migration aplicada; os **43 testes de integração rodaram pela primeira vez** e acharam dois defeitos:
  - 🔴 **`enqueue` da fila de contingência não serializava.** A `sequence` era calculada por subconsulta dentro do `INSERT`, na crença de que isso bastava. **Não basta**: em `READ COMMITTED` duas transações concorrentes leem o mesmo `MAX` e colidem na unique. No balcão, é venda perdida. Corrigido com `pg_advisory_xact_lock(hashtext(company_id))` — escopo por Emitente, sem gargalo global. **Nenhum teste de unidade pegaria**: o dublê em memória é sequencial e passava.
  - 🟡 **Ordem de validação prejudicava o diagnóstico.** Com CSC ausente, um pagamento incoerente respondia `424 CSC_NOT_CONFIGURED`. Quem integra corrigia o cadastro, tentava de novo e só então via o erro de pagamento. Reordenado: erro do **pedido** (422) antes de dependência de **cadastro** (424).
  - Criada a rota `GET /v1/nfce/:id/xml`, que estava documentada mas **não existia** — é por onde se confere o QR Code.
  - Passos 0 e 10 do roteiro verificados contra a API real: os sete códigos de recusa corretos e **nenhum** avançou a numeração.
- **2026-08-09**: **spec 005 — cupom fiscal eletrônico (NFC-e, modelo 65)**. Módulo `modules/nfce`, migration `20260808200000_nfce_cupom_fiscal`, CSC no Emitente, fila de contingência persistente. 🟡 **Código completo, nenhum cupom transmitido à SEFAZ** — ver a seção "Cupom fiscal eletrônico" para o que falta confirmar. Achados que extrapolam a feature:
  - **O XSD já no repositório traz os regex do QR Code.** Conferir contra ele desmentiu três coisas da pesquisa: a contingência V2 leva apenas o **dia** (não `dhEmi` inteiro), **não tem `vICMS`**, e `cIdToken` **proíbe zeros à esquerda**. Nenhum dos três quebraria a emissão normal — só a contingência, o caminho menos exercitado.
  - **`mod = '55'` estava fixo em `nfe-soap-envelope.ts`** e a checagem de sobreposição consultava sempre `documentType: 'NFE'`. Inutilizar faixa de cupom teria queimado a faixa equivalente de NF-e junto ao fisco. Ambos parametrizados; `model` ficou **sem valor padrão** no contrato, porque foi o padrão silencioso que criou o risco.
  - **`AuxiliaryDocumentsModule` não exportava `CompanyAccessPolicy`**, e a rota de emissão de cupom não subia. `tsc` não valida o grafo do Nest — daí `nfce-module-wiring.spec.ts`, que resolve o container e falha barato.
  - **Espelhos manuais de `'NFE' | 'NFSE'`** em quatro pontos trocados pelo tipo canônico `FiscalDocumentType` (e `Lowercase<...>` nos caminhos de storage), para que o próximo tipo vire erro de compilação.
  - **Pendência conhecida em `POST /v1/nfe`**: aceita `companyId` no corpo **sem checagem de política**, o que permite emitir NF-e por qualquer Emitente. A rota de NFC-e foi feita com `CompanyAccessPolicy`; a de NF-e não foi alterada por ser mudança de contrato em caminho já em uso.

- **2026-08-04**: criação do serviço (Phase 1 — Setup de `tasks.md`): esqueleto de projeto, registro em `pnpm-workspace.yaml`, porta `3116` reservada no `AGENTS.md` raiz, bucket `fiscal` adicionado a `infra/minio`.
- **2026-08-04**: Foundational (Phase 2 de `tasks.md`) concluída exceto T014/T027 (bloqueadas aguardando aprovação para código de assinatura digital/certificado) — schema Prisma completo migrado, `companies` e consulta genérica de `fiscal-documents` funcionais, `build`/`lint`/`typecheck`/`test` verdes, serviço testado subindo e respondendo em runtime.
- **2026-08-04**: T014/T027 aprovadas e implementadas — toolkit de assinatura digital completo (`pkcs12-parser.ts` com `node-forge`, `xml-signer.ts` com `xml-crypto`, `cert-encryption.ts` com AES-256-GCM nativo do Node), 12 testes novos incluindo verificação XMLDSig real contra certificado autoassinado gerado em memória. Foundational 100% concluída (24/24 tarefas). Descoberta técnica registrada: `xml-crypto` v6 zera `getCertFromKeyInfo` para no-op por padrão — verificação requer `publicCert` explícito no construtor do verificador.
- **2026-08-04**: US1 (T029–T037) concluída — módulo `nfe` completo (validadores de domínio, `IssueNfeUseCase`/`ConsultNfeUseCase`/`GetNfeXmlUseCase`, rotas HTTP), exceto `SefazBaNfeProvider` (T038/T039, gated). Mudanças relevantes:
  - **XSD real da NF-e 4.00** integrado em `resources/xsd/nfe/` (5 arquivos, fornecidos pelo usuário — WebFetch nos portais oficiais falhou). `xsd-validator.ts` ganhou a opção `baseUrl` no `libxmljs2.parseXml`, necessária para resolver `xs:include`/`xs:import` entre os arquivos do schema.
  - **`xml-signer.ts` ganhou `XmlSignatureAlgorithmProfile`** (`MODERN` = SHA-256/C14N-exclusivo, default preservado; `NFE_SEFAZ` = SHA-1/RSA-SHA1/C14N legado, exigido pelo `xmldsig-core-schema_v1.01.xsd` oficial da SEFAZ via atributos `fixed=`). O módulo `nfe` usa `NFE_SEFAZ`.
  - **Módulo `Customer` criado** (`domain/entities`, `domain/repositories`, `infrastructure/database/prisma-customer.repository.ts`) — gap do Foundational original (model Prisma existia, mas faltava a camada de domínio/repositório).
  - `NfeModule` registrado em `app.module.ts`; suíte completa em 54/54 testes, `build`/`lint`/`typecheck` limpos.
  - Gap documentado: T029–T033 são testes de caso de uso com fakes em memória (ver nota em `tasks.md`), não testes HTTP/Supertest reais — `supertest` ainda não é dependência do pacote.
- **2026-08-04**: T038/T039/T040 aprovados e implementados — integração SOAP real com a SEFAZ-BA. **US1 (P1, MVP) 100% concluída.** Mudanças relevantes:
  - **`shared/infra/fiscal-soap/`** (novo): cliente SOAP genérico (`sefaz-soap-client.ts`) — TLS mútuo via `soap.ClientSSLSecurity` (gotcha: `string` é tratado como *caminho de arquivo*, exige `Buffer.from(pem)`), timeout configurável, retry com backoff exponencial em falhas transitórias (`soap-retry.ts`), extração de XML embutido em resposta SOAP via `libxmljs2`/XPath (`nfe-soap-response.ts`, reaproveitando o toolkit de XSD).
  - **Descoberta técnica — `node-soap` sempre re-embrulha os args do método** (`objectToDocumentXML` faz `args[name] = params`) — passar `{ nfeDadosMsg: xml }` produzia `<nfeDadosMsg><nfeDadosMsg>...` duplicado (bug pego por teste). Corrigido usando o escape hatch `{ _xml: <envelope pronto> }`, que devolve a string exatamente como fornecida.
  - **`resources/wsdl/nfe/{NFeAutorizacao4,NFeConsultaProtocolo4}.wsdl`** (novos, autoria própria) — ver ressalva detalhada no aviso de status no topo deste arquivo. Endpoints reais (produção + homologação) confirmados pelo usuário em `specs/002-fiscal-api/contracts/NFe/NF-e versão 4.0_ambientes.txt` (WebFetch falhou para todos os portais oficiais — mesmo padrão do bloqueio de XSD, mas com erro de cadeia TLS ICP-Brasil em vez de falha de rede pura).
  - **`modules/providers/sefaz-ba/`** (novo): `SefazBaNfeProvider` (`issue`/`consult` reais via SOAP; `cancel` lança `SefazBaOperationNotImplementedError` — US4), `nfe-soap-envelope.ts` (constrói `enviNFe`/`consSitNFe`, interpreta `retEnviNFe`/`retConsSitNFe` — mapeia os `cStat` estáveis/documentados: 104/105 no lote, 100/110 em `infProt`; qualquer código não mapeado vira `REJECTED`, nunca assume sucesso), `SefazBaModule` (registra o provider no `FiscalProviderFactory` via `onModuleInit`).
  - **`loadCertificateKeyMaterial()` extraído** para `shared/infra/fiscal-signature/certificate-key-loader.ts` (DRY — reaproveitado por `IssueNfeUseCase` e `SefazBaNfeProvider`, que antes duplicariam a lógica de decifragem do `.pfx`).
  - **Gap documentado**: `IssueDocumentResult.status` (contrato `FiscalProvider`) não tem variante `DENIED` — mapeado para `REJECTED` em `issue()` (código original preservado em `errorCode`); `consult()` preserva `DENIED` fielmente. Ampliar o contrato fica para uma evolução futura.
  - `NfeModule` agora importa `SefazBaModule`; suíte completa em 83/83 testes (54 anteriores + 29 novos), `build`/`lint` (0 erros, 1 warning tolerado)/`typecheck` limpos, boot smoke test confirma o grafo de DI completo resolvendo em runtime. Nenhuma chamada de rede real foi feita — todos os testes usam WSDL real parseado + transporte HTTP mockado.
- **2026-08-04**: `/speckit-analyze` rodado sobre `spec.md`/`plan.md`/`tasks.md` + implementação real — 2 achados CRITICAL, 5 MEDIUM/HIGH. Remediação aplicada nesta rodada:
  - **C1 (Constitution — corrigido)**: `SefazBaNfeProvider.cancel()` usava `eslint-disable-next-line` (proibido por "Strict Linting Compliance"). Reescrito sem `async`, retornando `Promise.reject(...)` diretamente — usa `input` na mensagem de erro (sem parâmetro não utilizado) e dispensa `await` (sem `require-await`); zero `eslint-disable` necessário.
  - **I1 (`xmlUrl` — corrigido)**: `toFiscalDocumentResponse()` apontava `xmlUrl` para `/api/v1/fiscal-documents/{id}/xml`, rota que nunca existiu — corrigido para `/api/v1/{nfe|nfse}/{id}/xml` conforme `documentType` (rota NF-e real e testada; NFS-e ainda não existe, mas nenhum documento NFSE pode existir antes de US2 mesmo). Teste de regressão adicionado (`fiscal-document-response.mapper.spec.ts`).
  - **G1 (FR-014, autorização por Emitente — decisão explícita, sem mudança de código)**: nenhuma rota liga `@CompanyId()` a uma checagem de que o chamador só acessa o próprio Emitente — qualquer sistema interno autorizado pode ler/baixar documentos de **qualquer** Emitente (BOLA). Usuário optou por **manter o modelo atual** (autorização só por role/sistema chamador, confiando que ERP/PDV/marketplace já controlam o acesso por Loja/Emitente antes de chamar a fiscal-api) em vez de impor escopo por Emitente em código agora — decisão registrada em [research.md §8](../../specs/002-fiscal-api/research.md#8-autenticação-e-autorização-v1--só-clientes-internos-per-fr-015) e no aviso de status deste arquivo, com o gatilho explícito para revisitar.
  - Achados não resolvidos nesta rodada (menor prioridade, registrados para acompanhamento): I2 (`DENIED` colapsado em `REJECTED` em `issue()`), I3 (`contracts/*.md` documentam envelope `{success,data}`, implementação usa `{data}`), G2 (`ConsultNfeUseCase` não grava `ProviderRequest` — FR-011 parcial), G3/G4 (T029–T033 são testes de caso de uso, não HTTP real; SC-003 "5s" sem asserção de latência).
  - Suíte após remediação: **86/86 testes**, `typecheck`/`lint` (0 erros)/`build` limpos.
- **2026-08-05**: T041–T049 aprovados e implementados — **US2 (P2) concluída, exceto transmissão real** (T048 — stub deliberado). Mudanças relevantes:
  - **XSD oficial da NFS-e Padrão Nacional v1.01** fornecido pelo usuário (`specs/002-fiscal-api/contracts/NFSe/`). Descoberta: os 18 arquivos originais tinham nomes que não batiam com o conteúdo — artefato clássico de duas pastas por versão (`v1.00/`, `v1.01/`) com arquivos de mesmo nome extraídas juntas no mesmo diretório, colidindo. Usuário reorganizou em subpastas corretas; copiados 5 arquivos (`DPS_v1.01.xsd` + cadeia de includes) para `resources/xsd/nfse/`.
  - **Bug real encontrado e corrigido no XSD oficial**: `TSSerieDPS` usa `^0{0,4}\d{1,5}$` como padrão — mas no dialeto XML Schema, `^`/`$` são caracteres LITERAIS (não âncoras como em JS/Perl), tornando o padrão insatisfazível por qualquer valor real (confirmado isoladamente com `libxmljs2` antes de agir). Corrigido só na cópia local, com comentário XML documentando o achado e a correção — aprovado explicitamente pelo usuário.
  - **`dps-xml.builder.ts`** (novo): constrói a DPS (Declaração de Prestação de Serviços — não "RPS", mecanismo legado que o Padrão Nacional substitui) cobrindo os campos exigidos pelo schema para uma prestação de serviço doméstica simples.
  - **DRY**: `ConsultNfeUseCase`/`GetNfeXmlUseCase` (já genéricos por `FiscalDocument`/`document.provider`, sem nada específico de NF-e) exportados de `NfeModule` e reaproveitados diretamente em `NfseModule` — não duplicados como `ConsultNfseUseCase`/`GetNfseXmlUseCase`.
  - **`IlheusMetropolisNfseProvider`** (novo, stub deliberado): diferente de `SefazBaNfeProvider`, aqui nenhum detalhe de transporte (SOAP/REST, autenticação, endpoints) está confirmado — `issue`/`consult`/`cancel` lançam `IlheusMetropolisNotImplementedError` (não um genérico "provider não configurado").
  - Suíte completa: **95/95 testes** (86 anteriores + 9 novos), `typecheck`/`lint` (0 erros, 1 warning pré-existente tolerado)/`build` limpos, boot smoke test confirma `NfseModule`/`IlheusMetropolisModule` resolvendo e as 3 rotas mapeadas.
- **2026-08-05**: T050–T056 aprovados e implementados — **US3 (P3) concluída.** Mudanças relevantes:
  - `Certificate` deixou de ser só-leitura: ganhou `Certificate.create()` (nasce sempre `VALID` — `UploadCertificateUseCase` só chega a criar a entidade depois de PKCS#12/senha/CNPJ/expiração já validados) e `CertificateRepository.save()` (`PrismaCertificateRepository.save()` novo; `InMemoryCertificateRepository.save()` já existia, usado pelos testes de US1/US2 desde o início).
  - **`Pkcs12FileValidator`** (novo, `domain/validators/`): valida assinatura binária (PKCS#12/.pfx é ASN.1 DER, sempre começa com a tag SEQUENCE `0x30`) + extensão, mesma técnica de `DocumentFileValidator` (imoveis-api) — primeira linha de defesa antes do parse criptográfico completo (`parsePkcs12`, T014).
  - **`AppExceptionFilter` ganhou o mapeamento "Conflict" → 409** (além de "Taken"/"Duplicate"/"AlreadyExists"/"Overlap" já existentes) — usado por `CertificateNotValidForActivationConflictError`; reaproveitável por US4 (cancelamento fora do prazo, inutilização de faixa sobreposta).
  - **Decisão de design registrada**: `data-model.md` diz "no máximo um certificado `VALID` por Emitente", mas não há campo `active` dedicado no schema e `findValidByCompanyId` já resolve pela linha `VALID` mais recente (`createdAt desc`) — `UploadCertificateUseCase` não demove certificados `VALID` anteriores ao criar um novo (o sistema tolera múltiplas linhas `VALID` simultâneas); `ActivateCertificateUseCase` não muda `status` (o contrato já exige que o alvo esteja `VALID`, 409 caso contrário) — documentado no use-case, com o gatilho para uma evolução futura (campo `active` dedicado) se o produto precisar forçar um certificado mais antigo sobre um upload mais recente.
  - Suíte completa: **106/106 testes** (95 anteriores + 11 novos), `typecheck`/`lint` (0 erros)/`build` limpos, boot smoke test confirma as 4 rotas de certificados mapeadas (`POST`/`GET /companies/:companyId/certificates`, `PATCH /certificates/:id/activate`, `GET /certificates/:id/status`).
- **2026-08-05**: T057–T059/T063/T064/T066(parcial)/T068(parcial)/T070 implementados — **US4 (P4) parcial: cancelamento + carta de correção de NF-e concluídos**; inutilização (T065) e NFS-e (T067/T069) deferidos. Mudanças relevantes:
  - **`FiscalProvider` ganhou `correctionLetter()`** como método abstrato (`CorrectionLetterInput`/`CorrectionLetterResult` novos) — todo provider precisou implementar: `SefazBaNfeProvider` real (via `NFeRecepcaoEvento4`), `IlheusMetropolisNfseProvider` rejeita com `NfseCorrectionLetterNotApplicableError` (carta de correção não existe no Padrão Nacional de NFS-e — `contracts/nfse-api.md` já documentava isso como fora de escopo), `FakeFiscalProvider` de testes ganhou `correctionLetterResult` configurável igual aos demais métodos.
  - **Decisão de usuário (AskUserQuestion, 2026-08-05)**: `specs/002-fiscal-api/contracts/NFe/` não tem os XSDs de evento (`envEvento`/`evCancNFe`/`evCCeNFe`) — só o pacote núcleo da NF-e. Usuário optou por **prosseguir best-effort**, mesmo padrão já usado para os WSDLs de T038/T039. `nfe-soap-envelope.ts` ganhou `buildNfeEventXml`/`buildEnvEventoXml`/`parseRetEnvEventoXml` (evento assinado com perfil `NFE_SEFAZ`, mesmo perfil de `infNFe`); novo `resources/wsdl/nfe/NFeRecepcaoEvento4.wsdl` (mesma estrutura simplificada `nfeDadosMsg`/`nfeResultMsg`, mesma ressalva de autoria própria) — o endpoint em si é real e confirmado.
  - **Prazo legal de cancelamento**: `fiscal-documents/domain/rules/nfe-cancel-deadline.ts` — 24h a partir de `authorizedAt` (Ajuste SINIEF 07/05), por `FiscalDocumentType` (não hardcoded inline), já cobrindo `NFSE` para quando T067 existir. spec.md deixava o valor exato em aberto ("legislação fiscal vigente") — resolvido com esse default documentado, sem pausa para confirmação por ser detalhe de implementação de baixo risco.
  - **Carta de correção — campo não corrigível**: `nfe/domain/validators/correction-text.validator.ts`, heurística de palavras-chave (valor, quantidade, CNPJ/CPF, datas, tributos, partes, CFOP) rejeitando com `NfeCorrectionFieldNotAllowedError` (422) — não é verificação semântica completa, é um guard-rail para os casos óbvios; resolve o edge case em aberto do spec.md com um default razoável e documentado.
  - **Bloqueio genuíno descoberto para T065 (inutilização)**: `FiscalEvent.fiscalDocumentId` é `String` NOT NULL no schema Prisma, mas `data-model.md` descreve inutilização como não exigindo um `FiscalDocument` existente. Não resolvido nesta entrega — ver aviso de status no topo deste arquivo.
  - `AppExceptionFilter`: nenhuma mudança nova (o mapeamento "Conflict" → 409 de US3 já cobre `NfeCancelDeadlineConflictError`).
  - Suíte completa: **128/128 testes** (106 anteriores + 22 novos), `typecheck`/`lint` (0 erros, 1 warning pré-existente não relacionado)/`build` limpos, boot smoke test real (Postgres conectado) confirma `POST /api/v1/nfe/:id/cancel` e `POST /api/v1/nfe/:id/correction-letter` mapeadas e todo o grafo de DI resolvendo sem erro.
- **2026-08-05 (continuação)**: T060/T065/T066/T068 implementados — **US4 completa para NF-e** (só falta NFS-e, T067/T069, deferido por escopo). Mudanças relevantes:
  - **Decisão de schema (AskUserQuestion — 3 opções apresentadas, usuário escolheu a recomendada)**: `FiscalEvent.fiscalDocumentId` virou nullable + ganhou `companyId`/`series`/`numberRangeStart`/`numberRangeEnd` (todas nullable, só para `eventType=INUTILIZATION`) — migration `20260805012847_fiscal_event_inutilization_fields`. **Escrita manualmente** porque `prisma migrate dev`/`--create-only` falham neste ambiente (erro `P3006`/`42883`: a shadow database que o Prisma cria on-the-fly não tem `public.citybox_uuid_v7()` — essa função só existe porque `infra/postgres/init/02-citybox-uuid-v7.sql` roda na inicialização do container contra o banco `citybox` real, não é replicada para bancos novos criados depois). Aplicada com `prisma migrate deploy` (não usa shadow DB) e confirmada sem drift via `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script --exit-code` (saída vazia, exit 0). `FiscalEvent`/`PrismaFiscalEventRepository` atualizados para os novos campos; 3 call-sites existentes (`CancelNfeUseCase`/`CorrectionLetterNfeUseCase`/um spec do Foundational) ajustados para o novo shape de `FiscalEventProps`.
  - **`FiscalProvider` ganhou `inutilize()`** (`InutilizeDocumentInput`/`InutilizeDocumentResult`) — `SefazBaNfeProvider` real (via novo webservice `NFeInutilizacao4`, sem envelope de lote — troca direta `inutNFe`/`retInutNFe`, diferente de `NFeRecepcaoEvento4`), `IlheusMetropolisNfseProvider` rejeita com `NfseInutilizationNotApplicableError` (FR-006 é exclusivo de NF-e), `FakeFiscalProvider` ganhou `inutilizeResult` configurável. `SefazBaNfeProvider` ganhou `CompanyRepository` como nova dependência (via `CompaniesModule` importado em `SefazBaModule`) — `inutilize()` não parte de um `FiscalDocument` (a faixa nunca foi emitida), carrega `Company`/`Certificate` diretamente por `companyId`.
  - **Decisão explícita, sem nova pergunta ao usuário**: o XML de inutilização (`inutNFe`/`infInut`, `nfe-soap-envelope.ts`) e o WSDL `NFeInutilizacao4.wsdl` seguem best-effort — mesma categoria de decisão já confirmada 3x consecutivas nesta sessão ("Prosseguir best-effort"), aplicada aqui por consistência em vez de repetir a mesma pergunta; disclosed nos comentários do código e nesta entrada do changelog para o usuário poder corrigir se essa leitura estiver errada.
  - **`InutilizeNfeUseCase`** (novo): valida faixa (`numberStart <= numberEnd`, ambos positivos — `NfeInutilizationInvalidRangeError`, 422), checa sobreposição contra `FiscalDocument.authorizedAt !== null` (não contra o `status` atual — um documento já cancelado ainda "usou" aquele número) dentro de `companyId`+`série` (novo filtro `series` em `ListFiscalDocumentsCriteria`, não exposto no filtro público de `GET /fiscal-documents`) com um teto de segurança `MAX_OVERLAP_LOOKUP=5000` (não é expectativa real de volume, é só para nunca virar query ilimitada) em vez de `$queryRaw` — mantém 100% Prisma Client tipado. Sobreposição encontrada → `NfeInutilizationRangeOverlapError` (409, nome com "Overlap" casa com `AppExceptionFilter`).
  - Nova rota `POST /api/v1/nfe/inutilize` (`InutilizeNfeRoute`/`InutilizeNfeHttpDto`).
  - Suíte completa: **141/141 testes** (128 anteriores + 13 novos: 6 `inutilize-nfe.use-case.spec.ts` + 4 em `nfe-soap-envelope.spec.ts` (`buildInutNfeXml`/`parseRetInutNfeXml`) + 3 líquidos em `sefaz-ba-nfe.provider.spec.ts`), `typecheck`/`lint` (0 erros, 1 warning pré-existente não relacionado)/`build` limpos, boot smoke test real (Postgres conectado, migrations aplicadas) confirma `POST /api/v1/nfe/inutilize` mapeada e todo o grafo de DI resolvendo sem erro (incluindo a nova dependência `CompanyRepository` em `SefazBaNfeProvider`).
- **2026-08-05 (continuação, T067/T069)**: **US4 100% completa** — implementado `CancelNfseUseCase` + rota `POST /api/v1/nfse/{id}/cancel`, fechando o ciclo de vida pós-emissão para os dois tipos de documento. Mudanças relevantes:
  - `CancelNfseUseCase` (`modules/nfse/application/use-cases/cancel-nfse/`) é estruturalmente idêntico a `CancelNfeUseCase` — mesma regra de prazo (`fiscal-documents/domain/rules/nfe-cancel-deadline.ts` já cobria `FiscalDocumentType.NFSE` desde T063), mesma persistência de `ProviderRequest`/`FiscalEvent`. **Duplicado deliberadamente em vez de compartilhado** — os dois use-cases têm ~95% de overlap, mas extrair uma base genérica (`CancelFiscalDocumentUseCase`) é um refactor à parte que não foi feito para não misturar duas mudanças numa única entrega (regra "nunca implementar várias funcionalidades de uma vez"); candidato a uma limpeza futura se o padrão se repetir uma terceira vez.
  - Erros de domínio próprios do módulo `nfse` (`NfseDocumentNotAuthorizedError`, `NfseCancelDeadlineConflictError`) em vez de reaproveitar os de `nfe` — mesmo padrão de "cada módulo é dono dos seus erros de domínio" já usado em todo o resto do código (`CertificateNotValidError`, etc.), mesmo quando o texto é quase idêntico.
  - **`IlheusMetropolisNfseProvider.cancel()` não foi alterado** — já era um stub correto desde antes desta sessão. A mudança real é que agora está de fato acionável via `CancelNfseUseCase`/`FiscalProviderFactory`: uma chamada real a `POST /api/v1/nfse/{id}/cancel` hoje passa por toda a validação de prazo/status com sucesso e só falha (500, `IlheusMetropolisNotImplementedError`) na transmissão em si — mesmo comportamento já desenhado para `POST /api/v1/nfse` (emissão) desde US2. T069 fica "tão completo quanto possível sem informação nova sobre o protocolo municipal" — diferente das ressalvas de XML best-effort da SEFAZ-BA (onde existe um padrão nacional público a seguir), aqui não há nenhum padrão a reproduzir: é uma integração proprietária do MetropolisWeb/POLIS sem documentação disponível neste ambiente.
  - Suíte completa: **145/145 testes** (141 anteriores + 4 novos: `cancel-nfse.use-case.spec.ts`), `typecheck`/`lint` (0 erros, 1 warning pré-existente não relacionado)/`build` limpos, boot smoke test real confirma `POST /api/v1/nfse/:id/cancel` mapeada e todo o grafo de DI resolvendo sem erro.
- **2026-08-05 (containerização)**: serviço passa a subir em container junto com a infra local. Mudanças relevantes:
  - **`infra/fiscal-api/docker-compose.yml`** (novo) + `.env.example`, e `fiscal-api` adicionado ao **fim** de `CORE_SERVICES` em `infra/scripts/up.sh` — `pnpm infra:up` agora builda e sobe o serviço (`citybox_fiscal_api`, `citybox-fiscal-api:latest`, rede `citybox-platform`, `127.0.0.1:3116`). Posição no fim é deliberada: `up.sh` usa `set -euo pipefail`, então uma falha de build não impede a infra real de já ter subido. **Abre exceção explícita à separação infra/app** do `CLAUDE.md` (o lugar canônico de app Node é `infra/deploy/docker-compose.apps.yml`) — escolha do usuário entre 3 alternativas apresentadas; não replicar para outros apps sem a mesma decisão.
  - **`Dockerfile` corrigido**: `apk add --no-cache python3 make g++` no estágio `deps`. Sem isso o `pnpm install` da imagem falhava em `libxmljs2` (`gyp ERR! not found: make`) — defeito latente desde a criação do Dockerfile, nunca exercitado porque a imagem nunca tinha sido buildada. `libxmljs2` vendoriza o libxml2 em `vendor/libxml`, então `libxml2-dev` **não** é necessário. Toolchain confinado ao `deps`; o `runner` recebe só o `node_modules` compilado.
  - **Não há `depends_on`** para postgres/minio/keycloak: cada serviço de `infra/` é um compose project independente, então a dependência é coberta por `restart: unless-stopped` + healthcheck (`node -e fetch`, padrão de `infra/deploy/docker-compose.apps.yml`; a imagem `node:24-alpine` não traz curl).
  - **Migration não é aplicada pelo container** — `db:migrate:deploy` continua manual (mesmo padrão dos demais apps do monorepo).
  - ⚠️ **Não verificado em runtime**: `docker compose config` valida, mas o `docker build` e o boot do container não puderam ser executados neste ambiente (usuário sem acesso ao socket do Docker). Confirmar `pnpm infra:up` numa máquina com permissão antes de considerar fechado.
- **2026-08-05 (validação de homologação + correções D1–D4)**: primeira execução manual ponta a ponta contra o stack local (3 cenários de NF-e + 3 de NFS-e). Mudanças relevantes:
  - **`libxmljs2` `^0.35.0` → `^0.37.0`**: a 0.35 só publica prebuilds até ABI 127 (Node 22); em Node 24 (ABI 137) o `prebuild-install` falha e cai no `node-gyp`, que exige toolchain C++. Isso quebrava `pnpm install` no Windows sem Visual Studio e derrubava os shims de `node_modules/.bin` (sintoma: `'prisma' não é reconhecido`). A 0.37 publica `node-v137` para `win32-x64` **e** `linuxmusl-x64` — o segundo importa para o `Dockerfile` (`node:24-alpine`). Atenção: `^0.35.0` **não** cobre 0.37 (caret em `0.x` trava o minor), o range precisou mudar.
  - **Swagger com `addBearerAuth` + `addSecurityRequirements('bearer')`** em `src/main.ts`: nenhuma rota é `@Public` além do health, mas o documento não declarava esquema de segurança — o Swagger UI não oferecia campo de token e toda tentativa pela UI retornava 401. `addSecurityRequirements` aplica ao documento inteiro, evitando repetir `@ApiBearerAuth()` nas 21 classes de rota. Token de dev: `dev-admin` (com `AUTH_DEV_BYPASS=true`).
  - **D2 — itens do documento fiscal nunca eram gravados**: `PrismaFiscalDocumentRepository.toRow` não incluía `items` e o `upsert` não tinha escrita aninhada. O XML saía correto (itens vêm do DTO), mas o banco perdia a composição da nota. Corrigido com `items: { create }` no `create` e `{ deleteMany, create }` no `update`, **só quando a entidade carrega itens** — o fluxo de emissão salva o mesmo documento duas vezes e o segundo save não pode apagar o que o primeiro gravou.
  - **`InMemoryFiscalDocumentRepository` deixou de guardar a entidade por referência**: guardar a instância recebida fazia o fake se comportar como um banco que nunca perde nada, e foi assim que D2 sobreviveu a 145 testes verdes. Agora reconstrói a entidade a cada `save`. Contrato compartilhado em `modules/fiscal-documents/tests/fiscal-document-repository.contract.ts`, exercitado pelas duas implementações (in-memory no projeto `unit`, Prisma no projeto `integration` contra Postgres real).
  - **D3 — idempotência congelava falha transitória**: a checagem devolvia qualquer documento existente sem olhar o status. Como o documento é persistido em `SIGNED` antes de transmitir (necessário porque `SefazBaNfeProvider` recarrega o documento por id), uma indisponibilidade da SEFAZ deixava um `SIGNED` no banco e queimava a chave de idempotência para sempre. Agora o status é classificado: **terminal** (`AUTHORIZED`, `REJECTED`, `DENIED`, `CANCEL_AUTHORIZED`, `CORRECTION_LETTER_AUTHORIZED`, `INUTILIZED`) devolve o existente; **não terminal** retoma a transmissão do mesmo documento, sem reservar novo número. Alinhado à máquina de estados de `specs/002-fiscal-api/data-model.md`, que define `SIGNED` como intermediário.
  - **XML assinado passa a ser gravado ANTES da transmissão** em `{companyId}/nfe/signed/{documentId}.xml` — é o que torna a retomada possível sem re-assinar (re-assinar geraria chave de acesso diferente para um número que a SEFAZ pode já ter recebido). Documentos numerados antes desta mudança não têm esse objeto: a retomada falha explicitamente com `SignedXmlNotFoundError` em vez de reemitir sob a mesma numeração.
  - ⚠️ **Defeito conhecido não corrigido**: `PrismaProviderRequestRepository.save` descarta `requestPayload`/`responsePayload` (mesma família de D2) — o caso de uso monta o payload de auditoria com status/protocolo/erro do órgão fiscal e o repositório não o grava, esvaziando a trilha exigida por FR-011.
- **2026-08-06 (padrão nacional da NFS-e — spec 003, execução parcial)**: Ilhéus aderiu ao Sistema Nacional da NFS-e (Decreto Municipal nº 220/2026), o que **invalida a premissa MetropolisWeb/POLIS** de `specs/002-fiscal-api/research.md` §7. Spec, plano, data-model, contratos e tarefas em [`specs/003-nfse-padrao-nacional/`](../../specs/003-nfse-padrao-nacional/). Mudanças relevantes:
  - **Inventário corrigiu o escopo**: a camada de DPS do módulo `nfse` **já estava construída contra o padrão nacional** (`dps-id.ts`, `dps-xml.builder.ts`, validação contra `DPS_v1.01.xsd`, casos de uso e rotas). O que falta é só a transmissão — hoje apontando para o stub `ILHEUS_METROPOLIS_NFSE`.
  - **Perfil de assinatura confirmado**: o `xmldsig-core-schema.xsd` do padrão nacional tem **zero** atributos `fixed=`, contra **3** no da SEFAZ. O padrão nacional não impõe SHA-1 — `MODERN` (SHA-256) é o correto, e é o que o código já usa.
  - **Área de dados é base64 sobre conteúdo compactado**, não XML cru (regras `E1225`/`E1226` do Anexo I, mais `E1228` sem prefixo de namespace e `E1229` UTF-8). O algoritmo exato não pôde ser confirmado: o Swagger de produção restrita exige certificado de cliente (`496 SSL certificate required`) e o da Sefin responde `403`. Decisão registrada: GZip, isolado atrás de uma função única para que a correção seja de uma linha se estiver errado.
  - **Requisitos do certificado de transmissão** (Anexo I, aba `RN_RECEPCAO_DPS`): X.509 v3, `BasicConstraints` não-AC, `KeyUsage` com autenticação, AC emissora cadastrada na RFB, LCR acessível, não revogado, **raiz ICP-Brasil** e extensão `OtherName` OID `2.16.76.1.3.3` com CNPJ/CPF. Um A1 e-CNPJ legítimo atende todos; autoassinado não.
  - **`IssueNfseUseCase` herdara os dois defeitos já corrigidos no NF-e** — idempotência sem classificação terminal e nenhum `save` antes de transmitir. Não se manifestavam porque o stub lançava antes de qualquer releitura; quebrariam no primeiro provider real. Corrigidos, com testes de regressão.
  - **`isTerminalStatus` extraído** para `modules/fiscal-documents/domain/entities/fiscal-document-status.ts` — NF-e e NFS-e precisam da mesma classificação, e duplicá-la garantiria divergência na primeira mudança da máquina de estados.
  - **`ProviderRequest` passou a persistir a trilha de auditoria**: `requestPayload`/`responsePayload` (e as chaves de XML) existiam no schema e na entidade mas não tinham getters nem escrita no repositório — o payload com status, protocolo e código de erro do órgão fiscal era montado e descartado, esvaziando FR-011. Mesma família de D2.
  - **XSD oficiais v1.01 completos** em `resources/xsd/nfse/1.01/` (antes só um subconjunto na raiz de `xsd/nfse/`), conferidos byte-a-byte contra a publicação vigente `NFSe-ESQUEMAS_XSD-v1.01-20260209`.
  - **Trilha de auditoria (FR-011) completada na emissão, pendente nos eventos**: o cliente SOAP sempre capturou os envelopes brutos (`rawRequestXml`/`rawResponseXml` em `SefazSoapCallResult`), mas o provider os descartava — só `responseBodyXml` era lido. Agora `IssueDocumentResult`, `CancelDocumentResult`, `CorrectionLetterResult` e `InutilizeDocumentResult` carregam os envelopes, o `SefazBaNfeProvider` os repassa em **todas** as operações, e `archiveProviderExchange` (`modules/fiscal-documents/application/`) os grava em `{companyId}/{nfe|nfse}/exchange/{documentId}/{operacao}-{request|response}.xml`, devolvendo as chaves para `ProviderRequest`. Falha de arquivamento não derruba a emissão — a nota pode já estar autorizada, e perder a cópia de auditoria é menos grave que devolver erro para uma emissão que deu certo.
    - ✅ **Estendida aos eventos** (2026-08-07): `CancelNfeUseCase`, `CorrectionLetterNfeUseCase`, `InutilizeNfeUseCase` e `CancelNfseUseCase` recebem `ObjectStorage` e chamam `archiveProviderExchange`, gravando as chaves em `ProviderRequest` **e** em `FiscalEvent` — o evento é o caminho pelo qual a consulta de auditoria chega no XML, e chaves divergentes deixariam o rastro quebrado. Dois detalhes de nomeação: a carta de correção inclui a sequência (`CORRECTION_LETTER-{n}`) porque uma NF-e aceita até 20 CC-e e sem isso a segunda sobrescreveria a primeira; a inutilização não tem `FiscalDocument` (o número nunca virou nota), então usa `serie-{série}-{início}-{fim}` como identificador. `FiscalEvent` também ganhou os getters `requestXmlObjectKey`/`responseXmlObjectKey`: as props já os carregavam, mas sem getter o rastro existia e era inalcançável.
  - **Rota de cancelamento devolve o caminho decidido** (2026-08-07, T028): `POST /api/v1/nfse/{id}/cancel` responde com `path: "DIRECT" | "FISCAL_ANALYSIS"` além do documento. `CancelNfseUseCase` passou a devolver `{ document, path }` — o caminho não é detalhe interno: quem chamou precisa saber se a nota **foi** cancelada ou se o pedido está em julgamento.
    - **Análise fiscal grava `CANCEL_REQUESTED`, não `CANCEL_AUTHORIZED`**, e deixa `cancelledAt` nulo. A nota **continua válida** até o município julgar; marcá-la como cancelada faria o lojista agir sobre uma nota que segue valendo, e apareceria como cancelada em relatório. O status já existia no enum Prisma e nenhum código o usava. Note que `CANCEL_REQUESTED` **não** está em `TERMINAL_STATUSES` — correto: o desfecho ainda não veio.
  - **`CancelNfseUseCase` passou a decidir em vez de recusar** (2026-08-07, T026): antes lançava `NfseCancelDeadlineConflictError` fora do prazo. Agora resolve a parametrização municipal, chama `resolveCancelPath`, monta o evento (`buildEventoXml`), assina sobre `infPedReg` e transmite. `nationalEventCode` reflete o caminho: `e101101` direto, `e101103` análise fiscal.
    - **`NfseCancelDeadlineConflictError` foi REMOVIDA** — virou código morto: o cancelamento de NFS-e nunca mais recusa por prazo. Recusar deixava o operador sem saída (a nota errada seguia válida e não havia caminho nenhum); análise fiscal é o caminho que sempre existe. O equivalente de NF-e (`NfeCancelDeadlineConflictError`) **continua** — lá o prazo é legal e fixo, não parametrizado por município.
    - `CancelPath` (`DIRECT`/`FISCAL_ANALYSIS`) e `EventoKind` (`CANCEL`/`FISCAL_ANALYSIS`) são mapeados no caso de uso em vez de unificados: são vocabulários de camadas diferentes, e colapsá-los amarraria a regra de domínio ao XSD.
    - ⚠️ **Testes unitários não cobrem montagem de DI.** As fixtures constroem os casos de uso com `new`, então 215 testes passaram enquanto o `NfseModule` não provia `MunicipalParametersService` nem `MunicipalParametersRepository` — a aplicação não subia (`UnknownDependenciesException`). Ao adicionar dependência a um caso de uso, **subir a API é parte do gate**, não etapa opcional.
  - **Transmissão de evento implementada** (2026-08-07, T027 parcial): `SefinNacionalNfseProvider.cancel` deixou de ser 501 e faz `POST /nfse/{chave}/eventos`. O XML do pedido chega pronto e assinado via `CancelDocumentInput.signedEventXml` (campo novo, opcional — a SEFAZ-BA não usa): montar e assinar ficam no caso de uso, como na emissão, porque é ele que conhece a parametrização municipal e escolhe entre `e101101` e `e101103`.
    - 🚩 **`SEFIN_EVENT_PAYLOAD_FIELD` é SUPOSIÇÃO, não fato verificado.** `dpsXmlGZipB64` veio do schema `NFSePostRequest` do OpenAPI oficial; o equivalente para evento **não** pôde ser confirmado — o OpenAPI passou a responder 404 nos caminhos conhecidos (`/SefinNacional/swagger/v1/swagger.json`), e um POST de sondagem com corpo vazio em homologação devolveu `HTTP 500` genérico, sem nomear campo obrigatório. O default `pedidoRegistroEventoXmlGZipB64` segue a convenção do campo irmão. **Sobrescrevível por env de propósito**, para ser corrigido sem alterar código assim que o Manual de Orientação ao Contribuinte (indisponível neste ambiente) ou o OpenAPI confirmarem. A codificação (gzip+base64) **é** verificada — vale para toda área de dados do Sistema Nacional (`E1225`/`E1226`/`E1229`, Anexo I).
    - `parseSefinEventResponse` decide aceitação pela **ausência de erro estruturado**, não pela presença de um campo de sucesso. Assimetria deliberada com `parseSefinIssueResponse` (estrito: exige chave E documento): lá o formato é conhecido e tratar resposta incompleta como autorização produziria nota fantasma; aqui, exigir um campo cujo nome não confirmei rejeitaria cancelamentos que deram certo — e nota cancelada no órgão mas ativa aqui é o pior dos dois.
  - 🐛 **`PrismaFiscalEventRepository.save` descartava as chaves de XML** (corrigido 2026-08-07): `toEntity` **lia** `requestXmlObjectKey`/`responseXmlObjectKey` do row, e o bloco `create` nunca os **escrevia**. A trilha de FR-011 que os casos de uso passaram a preencher ia para o banco nula — mesma família de D2 e do defeito já corrigido em `ProviderRequest`.
    - **Nenhum teste de caso de uso pegava**: todos usam o repositório em memória, que guarda a entidade inteira e por construção não pode expor um campo esquecido no mapeamento Prisma. Só teste contra Postgres real expõe esta família — daí `tests/integration/prisma-fiscal-event.repository.integration.spec.ts`, que relê do banco em vez de conferir a entidade devolvida.
    - Lição para o próximo mapeamento: ao adicionar campo em entidade persistida, o `create` do repositório é o ponto que silencia, não o `toEntity` (esse quebra a compilação).
  - **`FiscalEvent` ganhou `nationalEventCode` e `generatorEnvironment`** (2026-08-07): existiam no schema desde a migration do Padrão Nacional e não existiam na entidade. `nationalEventCode` é String (o código é do órgão fiscal e precisa sobreviver à evolução do nosso vocabulário); `generatorEnvironment` é o `ambGer` (1 = sistema do município, 2 = Sefin Nacional, 3 = ADN) e distingue evento que **nós** geramos de evento que apenas lemos. Eventos de NF-e recebem `null` nos dois — não pertencem ao Padrão Nacional da NFS-e.
  - **Decisão cancelamento direto vs. análise fiscal** (2026-08-07, parte de T026): `modules/nfse/domain/rules/nfse-cancel-path.ts` — regra pura que lê o prazo **publicado pelo município** (`MunicipalParameters.cancelDeadlineDays`) e devolve `DIRECT` (evento `e101101`) ou `FISCAL_ANALYSIS` (`e101103`). Quem pede não escolhe entre os dois: pede cancelar, e a regra decide.
    - **Sem prazo publicado → análise fiscal**, nunca um default. Não é o mesmo que recusar: é o caminho que sempre existe. Assumir um prazo arriscaria pedir cancelamento direto fora da janela, que o município recusa — e aí o operador fica sem saída nenhuma. Coberto por teste de mutação (inverter esse ramo quebra exatamente as duas asserções que o cobrem).
    - Contagem em **dias de calendário no fuso de Brasília**, não em múltiplos de 24h: uma nota autorizada às 23h consome o primeiro dia inteiro, e usar o fuso do processo faria o resultado depender de onde o servidor roda.
    - ⏳ **Pendente para fechar T026/T027**: ligar a regra ao `CancelNfseUseCase` (que hoje ainda lança `NfseCancelDeadlineConflictError` fora do prazo, em vez de encaminhar), expor `nationalEventCode`/`generatorEnvironment` na entidade `FiscalEvent` (existem no schema, não na entidade) e implementar a transmissão do evento no `SefinNacionalNfseProvider.cancel` (hoje 501).
  - **Versão do leiaute centralizada e travada por teste** (2026-08-07, T041/T042): `infrastructure/xml/nfse-leiaute-version.ts` guarda `NFSE_LEIAUTE_VERSION = '1.01'`, consumida por **todos** os builders. Antes, DPS e evento declaravam a versão cada um por conta própria — nada impedia que divergissem, e a divergência só apareceria como rejeição do órgão fiscal.
    - `nfse-leiaute-version.spec.ts` falha se (a) o diretório `resources/xsd/nfse/<versão>/` não existir, (b) a versão declarada sair do `pattern` de `TVerNFSe` lido **do próprio XSD**, ou (c) os builders emitirem versões diferentes. Verificado por mutação: declarar `2.00` quebra dois dos três testes. Leiaute vencido derruba emissão em produção **sem nenhuma mudança de código** — o teste é o único aviso que não depende de alguém lembrar.
  - **Cobertura (T045/T046/T033)**: **92.82% stmts / 92.96% linhas / 89.04% funcs / 78.84% branches**.
    - ⚠️ **O número de branches CAIU de 81.63% para 78.84% ao adicionar os testes de linha do tempo** — e a causa não é regressão: a fixture passou a instanciar `SefinNacionalNfseProvider`, trazendo para o denominador um arquivo que está a **31.57% stmts / 0% branches**. A medição anterior era real, mas sobre escopo menor. Ambos os números são honestos; o que mudou foi o que está sendo medido.
    - 🔴 **Lacuna nomeada**: `sefin-nacional-nfse.provider.ts` não tem testes próprios. Suas ramificações (falha de transporte em `issue`/`consult`/`cancel`/`syncEvents`, chave ausente, roteamento `dps/` vs `nfse/`) são exercitadas só indiretamente. É o maior buraco de teste restante no módulo.
    - Onde a cobertura foi ganha, foi no que **valia** — não perseguindo número: `MunicipalParametersService` (regra "cache vencido ainda vale quando a consulta falha"), guardas de recusa de PRODUCTION (`production-guard.spec.ts`, protege uma recusa *estrutural* que um default removeria em silêncio) e `SefazUnavailableError` (trava o comportamento que existe por causa do `[object Object]` do `node-soap`).
  - **Configs de endpoint resolvem env a cada chamada** (2026-08-07): `sefin-nacional-config.ts` e `municipal-parameters-config.ts` liam `process.env` no load do módulo. Agora resolvem por chamada — mesmo padrão de `sefaz-ca-bundle.ts`. Ganho duplo: a env vale mesmo definida depois do import (correto em deploy) e a guarda de produção fica verificável sem `jest.isolateModules` + `require`, que o ESLint proíbe e que quebrava `instanceof` por carregar cópia própria da classe de erro.
  - **Linha do tempo da NFS-e** (2026-08-07, T036/T037): `ListNfseEventsUseCase` + `GET /api/v1/nfse/{id}/events` fundem eventos locais e remotos em ordem cronológica. Cada entrada traz `origin`: `LOCAL` (registramos) ou `REMOTE` (só existe no órgão — tipicamente **evento de ofício do município**). A distinção é para a pessoa que lê: "o município cancelou sua nota" e "você cancelou sua nota" são fatos diferentes.
    - Dedup por `nationalEventCode`, preferindo a entrada LOCAL, que é a mais informativa. Evento remoto sem data ancora em `authorizedAt`, **não** em `now` — `now` faria o evento saltar para o topo a cada consulta.
    - ⚠️ `national-error-codes.ts` **não** serve para descrever eventos: mapeia códigos de **rejeição** (`E0116`), não de evento (`e101101`). Cheguei a usá-lo e removi — cruzar os dois vocabulários produziria texto plausível e errado.
    - `SefinNacionalModule` passou a **exportar** `SefinNacionalNfseProvider`: `syncEvents` é capacidade específica dele e não está em `FiscalProvider`. A alternativa (resolver pela factory + cast) trocaria dependência explícita por escondida.
  - 🐛 **Testes unitários faziam chamada de rede real** (corrigido 2026-08-07): sem parametrização em cache, `MunicipalParametersService` cai no fallback de buscar no ambiente nacional — dentro de teste unitário. Sintoma: um teste de substituição **intermitente** (passava isolado, falhava na suíte cheia) e 25s de execução. Corrigido na raiz: `seedIlheusCompanyWithValidCertificate` agora semeia parametrização por padrão; testes que precisam de "município não publicou X" sobrescrevem. Suíte caiu para ~59s e deixou de depender da rede.
  - **Sincronização de eventos do ambiente nacional** (2026-08-07, T035): `SefinNacionalNfseProvider.syncEvents` lê `GET /nfse/{chave}/eventos`. Existe porque **nem todo evento é nosso** — o município lança eventos de ofício (análise fiscal deferida/indeferida, bloqueios) que nunca passaram por esta API; sem sincronizar, a linha do tempo estaria incompleta exatamente nos casos em que o contribuinte mais precisa dela.
    - **Falha de comunicação devolve lista vazia, não exceção**: uma consulta que quebra porque o órgão está fora do ar é pior que uma linha do tempo temporariamente sem os eventos remotos — os nossos, já no banco, seguem visíveis.
    - Antes do desfecho `accessKey` guarda o `Id` da DPS, que não nomeia uma NFS-e; nesse caso nem chega a chamar (retorna vazio).
    - `parseSefinEventsResponse` é **tolerante na forma, estrito na identidade**: aceita lista na raiz ou sob `eventos`/`Eventos`/`listaEventos`, código como valor (`tipoEvento`) ou como **nome da propriedade** (`{"e101101": {...}}`, espelhando o XML), e com ou sem o prefixo `e`. Mas entrada sem código reconhecível é **descartada** — virar linha vazia na trilha do contribuinte é pior que não aparecer. Filtra por **forma** (`e` + 6 dígitos) e não por lista fechada, para que um código novo apareça como desconhecido em vez de sumir. Data inválida vira `null`, nunca `Invalid Date` (que quebraria a ordenação em silêncio).
    - T034 já estava atendido por **reúso**: as rotas `GET /nfse/{id}` e `/xml` delegam a `ConsultNfeUseCase`/`GetNfeXmlUseCase` — decisão registrada nos próprios arquivos de rota.
  - **`SubstituteNfseUseCase`** (2026-08-07, T031): emite a nota corrigida e registra `e105102` na original, gravando `replacedByDocumentId` no evento.
    - **Ordem forçada pelo leiaute, não por preferência**: a nota nova é emitida ANTES do evento, porque `chSubstituta` exige a chave dela, que só existe depois da autorização. A ordem inversa é impossível.
    - **Consequência assumida e documentada**: se a emissão der certo e o evento falhar, ficam duas notas autorizadas para a mesma operação até reprocessamento. É o menor dos males — o inverso (cancelar por substituição e a emissão falhar) deixaria o serviço prestado **sem nota nenhuma**, que é infração fiscal.
    - Elegibilidade é avaliada **antes** de emitir: descobrir depois que a substituição não era permitida deixaria uma nota extra viva. E se a nota nova não for autorizada, o evento não é registrado e a original permanece válida.
    - `NfseSubstitutionNotAllowedError` carrega o impedimento em `externalCode` (`NFSE_SUBSTITUTION_<BLOCKER>`): a mensagem é para a pessoa, o código é para o ERP reagir de forma diferente a cada caso.
    - Coberto por 6 testes (T029), incluindo as quatro recusas e o caso em que a substituta é rejeitada. Verificado por mutação.
    - 🔍 **Achado**: uma nota REJECTED **mantém** `accessKey` (o `Id` da DPS, atribuído antes da transmissão). Logo `if (!substitute.accessKey)` sozinho NÃO detecta rejeição — a checagem de `status` é que carrega o peso na guarda que impede cancelar a original sem substituta válida. Descoberto por mutação; sem ela a redundância pareceria segura.
    - **Rota `POST /api/v1/nfse/{id}/substitute`** (T032): devolve **as duas** notas (`original` + `substitute`). O DTO valida `reasonCode` contra `TSCodJustSubst` (`01`–`05`/`99`) com mensagem que avisa explicitamente que a tabela de cancelamento (`1`/`2`/`9`) não vale ali — os conjuntos são disjuntos e trocá-los é recusado por schema.
    - ⚠️ **Verificar rota nova pelo Swagger, não pelo boot.** `health 200` não prova registro: um processo antigo segurando a porta responde igual, e o `controllers:` do módulo pode não ter recebido o controller mesmo com build e testes verdes (aconteceu aqui — o padrão de edição não casou com o array em linha única). Checar `GET /api/v1/docs-json` é o que prova.
  - **Regra de elegibilidade da substituição** (2026-08-07, parte de T029/T031): `modules/nfse/domain/rules/nfse-substitution-eligibility.ts` devolve o **primeiro** impedimento (`DEADLINE_EXPIRED`, `CUSTOMER_REQUIRED`, `FISCAL_ANALYSIS_PENDING`, `OFFICIAL_BLOCK`) ou `null`. Enumerado em vez de booleano porque cada recusa exige ação diferente do operador — um `false` não diria qual.
    - **Ordem deliberada**: bloqueios que o operador não resolve sozinho vêm antes dos que ele resolve. Reportar "informe o tomador" para uma nota sob bloqueio de ofício o faria preencher dados e tentar de novo para nada. Coberto por teste de mutação (inverter a ordem quebra a asserção específica).
    - ⚠️ **Assimetria deliberada com `resolveCancelPath`**: lá a falta de parametrização leva ao caminho conservador (análise fiscal); aqui ela **bloqueia**. Não existe caminho alternativo na substituição — ou substitui, ou não. Liberar sem prazo conhecido emitiria uma nota nova que o município pode recusar, deixando **duas notas vivas para a mesma operação**, que é pior que recusar. Também coberto por mutação.
  - **`FiscalEvent.replacedByDocumentId`** (2026-08-07): terceiro campo que existia no schema e não na entidade (depois de `nationalEventCode`/`generatorEnvironment`). Vive no evento e não no documento porque o vínculo **é** o evento — a nota original pode ter outros eventos antes e depois. O teste de integração contra Postgres real passou a assertar os três, já que o `create` do repositório é o ponto que descarta sem quebrar compilação.
  - **Evento de substituição (`e105102`) no builder** (2026-08-07, T030): não é o mesmo formato dos outros dois. Carrega `chSubstituta` (chave da nota que assume o lugar, **obrigatória** — o builder recusa sem ela), tem `xMotivo` **opcional** (`minOccurs=0`, ao contrário de `e101101`/`e101103` onde é exigido) e usa lista de motivos própria `TSCodJustSubst`: códigos de **dois dígitos** (`01`–`05`, `99`) sem interseção com `TSCodJustCanc` (`1`/`2`/`9`). Confundir as duas listas passaria pelo TypeScript e seria recusado por schema.
    - Ordem dos elementos preservada de propósito (`xDesc` → `cMotivo` → `xMotivo` → `chSubstituta`): o XSD usa `xs:sequence`, não `xs:all`.
  - **Builder do Pedido de Registro de Evento** (2026-08-07, T025): `modules/nfse/infrastructure/xml/evento-xml.builder.ts` monta `pedRegEvento` para cancelamento (`e101101`) e solicitação de análise fiscal (`e101103`), validado contra `pedRegEvento_v1.01.xsd`. Não assina — assinar é responsabilidade separada (`signXml` sobre `infPedReg`), mesmo arranjo da DPS.
    - ⚠️ **O XSD diverge de si mesmo no `Id` do pedido.** A anotação de `TSIdPedRegEvt` descreve a composição como `"PRE" + chave(50) + tipo do evento(6) + nPedRegEvento(3)` = 59 dígitos, mas o `pattern` que ele **impõe** é `PRE[0-9]{56}` (maxLength 59, ou seja 3+56). Chave(50) + tipo(6) = 56 fecha exatamente; a composição documentada não cabe. Resolvido a favor do `pattern`, que é o que o parser aplica — e confirmado pela validação real contra o schema. Para comparação, `TSIdEvento` (id atribuído pelo órgão) é consistente: `EVT` + 50 + 6 + 3 = 62 = sua maxLength. Só o id do **pedido** diverge.
    - `verAplic` (`TSVerAplic`) tem máximo de 20 caracteres — o default óbvio `citybox-fiscal-api-1.0` tem 22 e era recusado por schema.
  - **Retomada consulta antes de retransmitir** (2026-08-07, T023): `IssueNfseUseCase.resumeTransmission` retransmitia direto qualquer documento não terminal. O caso perigoso não é a transmissão que falhou — é a que **chegou ao órgão e cuja resposta se perdeu**: retransmitir ali emite uma segunda nota, que é dano fiscal, não erro de aplicação. Agora `findOutcomeAtProvider` consulta primeiro e adota o desfecho existente quando já há NFS-e autorizada.
    - Só `AUTHORIZED` interrompe a retomada. Rejeitada ou inexistente significa que não há nota para duplicar, e transmitir é o certo. **Falha da própria consulta também segue para transmissão** — ficar preso por indisponibilidade da consulta trocaria um risco por uma paralisia garantida.
    - `SefinNacionalNfseProvider.consult` passou a rotear por recurso: `accessKey` com prefixo `DPS` (o `Id` de 45 chars de `dps-id.ts`, guardado antes do desfecho) vai para `GET /dps/{id}`; a chave da NFS-e, devolvida pelo órgão após autorizar, vai para `GET /nfse/{chave}`. Antes chamava sempre `nfse/{accessKey}` — recurso errado para documento pendente.
    - **Sondado contra o serviço real** (2026-08-06, `GET` somente leitura): `GET /dps/{id}` responde `404` com `E2404` ("Não foi gerada uma NFS-e com o identificador informado") quando a DPS não virou nota, e **aceita o id com e sem o prefixo `DPS`** — as duas formas devolvem idêntico, então a escolha do formato não pode dar errado.
  - **Guarda de município virou dado, não código** (2026-08-07, T021/FR-020): `IssueNfseUseCase` recusava emissão comparando `cityCodeIbge` com a constante `SUPPORTED_NFSE_MUNICIPALITIES = ['2913606']`. Agora lê `Company.nationalNfseEnabled` (campo que já existia no schema e não era lido por ninguém) via `company.isEnabledForNationalNfse()`; o validador `nfse-municipality.validator.ts` e o método morto `isEnabledForNfseIlheus()` foram removidos. Um município aderir ao Padrão Nacional deixou de exigir deploy.
    - **Migration de backfill obrigatória** (`20260807030000_backfill_national_nfse_enabled`): a coluna tem `DEFAULT false`, então sem ela toda empresa de Ilhéus já cadastrada — que hoje emite — passaria a receber 422 no primeiro deploy. O backfill marca `true` exatamente onde `city_code_ibge = '2913606'`, reproduzindo a regra anterior: a troca não muda comportamento, só muda onde a decisão mora. Verificado com emissão real em homologação depois da migration (segue chegando ao Sefin).
    - `nationalNfseEnabled` entrou em `CreateCompanyDto`/`UpdateCompanyDto` (opcional, default `false`) — sem isso o flag seria inalcançável pela API e empresas novas ficariam permanentemente bloqueadas. Default conservador de propósito: errar para o lado de não emitir.
  - 🐛 **`nationalNfseEnabled` não chegava ao banco pela API** (corrigido 2026-08-07): o campo existia no schema, na entidade, no DTO de aplicação e no repositório — mas **não** no DTO HTTP de `POST /companies`, e o `CreateCompanyUseCase` monta `Company.create` **campo a campo**, então nem apareceria se o DTO o expusesse. Resultado: toda empresa criada pela API nascia com `false` e recebia 422 na primeira NFS-e, sem causa aparente.
    - Descoberto **executando o roteiro de teste de ponta a ponta**, não por revisão de código: enviei `true` e o banco gravou `false`. Os 265 testes passavam — nenhum exercita a rota HTTP de criação de empresa.
    - Corrigido nos três pontos: DTO HTTP de criação, DTO HTTP de atualização e o `Company.create` do caso de uso. O `UpdateCompanyUseCase` já repassava por spread.
    - **Padrão que se repetiu três vezes nesta feature** (`ProviderRequest`, `FiscalEvent`, agora `Company`): construção campo a campo silencia campo novo. Onde houver montagem manual, adicionar campo exige tocar em **todos** os pontos — e só teste de ponta a ponta pega.
  - 🛡️ **Vazamento entre empresas na idempotência — CORRIGIDO** (2026-08-07, migration `idempotency_scoped_by_company`): a unique era `(sourceSystem, externalReference, documentType, idempotencyKey)` — **sem `companyId`**. A chave é escolhida pelo ERP, e nada impede duas empresas de usarem `PEDIDO-0001`: a segunda recebia de volta o **documento fiscal da primeira**, com chave de acesso, protocolo, valores e itens de outro contribuinte. Violação direta de isolamento de tenant (Constituição V).
    - **Como apareceu**: uma emissão para a empresa `bf81b277…` devolveu um documento de `dd2dd1fd…` — visível porque o `companyId` da resposta não batia com o enviado. O sintoma disfarçado era pior: parecia que uma correção de código "não tinha pegado", quando na verdade a resposta era de outro tenant e de antes da correção.
    - **O fake escondia o bug**: `InMemoryFiscalDocumentRepository.findByIdempotency` também ignorava `companyId`, então os testes unitários não podiam detectá-lo. Alinhado ao Prisma junto com a correção — **fake que diverge do real transforma teste verde em falsa garantia**.
    - A migration só **alarga** a unicidade (mais colunas = menos colisões), então nenhuma linha existente pode violá-la: não há risco de falha por dado legado.
  - 🔴 **Lacunas conhecidas — auditadas em 2026-08-07.** Nenhuma bloqueia homologação; todas bloqueiam produção real.
    - **NF-e — tributação calculada (ICMS + PIS/COFINS + IPI).** Desde a spec erp/016, `ICMS00` (Regime Normal) sai com `orig` real, `vBC`, `pICMS`/`vICMS` calculados sobre a alíquota da UF de destino (resolvida por item pelo emissor, `NfeItemInput.icmsAliquota`/`origem`), e os totais `vBC`/`vICMS` do `ICMSTot` somam os itens — **não mais `0.00` fixo** (fechou o defeito B1). **PIS/COFINS** apurados desde a spec erp/015 (`pPIS`/`vPIS`, `pCOFINS`/`vCOFINS` + totais). **IPI** desde a spec erp/019 (`NfeItemInput.ipi` = `{cst, cEnq, aliquota?}`): `buildIpiXml` emite o grupo `IPI` com `cEnq` + `IPITrib` (CST 50/99, com `vBC`/`pIPI`/`vIPI`) ou `IPINT` (CST 51–55, sem valores), entre ICMS e PIS/COFINS na `xs:sequence`; o total `vIPI` soma os itens tributados (não mais `0.00` fixo) e, por ser "por fora", integra o `vNF`. Sem alíquota/grupo resolvido → fallback `0.00` (não-regressão: produto sem grupo continua emitindo; **item sem `ipi` sai sem o bloco `IPI`**). Para Simples Nacional a nota declara ICMS/PIS/COFINS zerado (`ICMSSN{csosn}` sem alíquota; PIS/COFINS CST 49), o que está **correto** (ICMS no CSOSN, contribuições no DAS) — IPI é federal e vale nos dois regimes. Ainda pendentes (fora de 015/016/019): FCP/ICMS-ST/`cBenef` por UF, CST≠00 (`ICMS10/20/51/60`), IPI em entradas / `vIPIDevol`, e ISSQN em NF-e (serviço sai por NFS-e). ⚠️ **B7**: a rota HTTP `issue-nfe` ainda não repassa `ipi`/`pis`/`cofins` do item (só `cst`/`csosn`) — quando ligar, o DTO HTTP da fiscal-api deve validar CST/`cEnq` por conta própria (não confiar no chamador).
    - **NF-e — `indIEDest: '9'` fixo** (destinatário não contribuinte). Correto para consumidor final PF; **errado para venda a empresa contribuinte de ICMS**, que exigiria `1` + a IE do destinatário. Hoje não há campo para a IE do cliente.
    - **NF-e — `modFrete: '9'` fixo** (sem frete) e sem grupo `transp`/`vol`. Qualquer operação com transportadora ou volumes precisa disso.
    - **NFS-e — sem retenções federais.** A DPS não emite `vRetPIS`/`vRetCOFINS`/`vRetIRRF`/`vRetCSLL`/`vRetINSS`. Serviço tomado por PJ acima dos limites legais exige retenção; sem ela a nota sai incorreta.
    - **NFS-e — `regEspTrib: '0'` e `indTotTrib: '0'` fixos.** Emitente com regime especial (ex.: sociedade de profissionais) precisaria informar o código correto.
    - **Assimetria de operações**: NF-e tem carta de correção e inutilização; NFS-e tem substituição e linha de tempo de eventos. É correto — cada documento tem as operações que seu leiaute prevê —, mas quem integra precisa saber que não são espelhos.
  - 🧹 **Provider municipal de Ilhéus removido** (2026-08-07, T014): `modules/providers/ilheus-metropolis/` era **código morto** — não estava registrado em nenhum módulo desde a adesão de Ilhéus ao Padrão Nacional. Removidos o diretório, o valor `ILHEUS_METROPOLIS_NFSE` do union de domínio e do enum Postgres, e os comentários obsoletos.
    - A migration `drop_ilheus_metropolis_provider` recria o tipo (Postgres não remove valor de enum) e **falha com mensagem clara** se algum ambiente tiver documentos usando o valor — parar e decidir é melhor que migrar dado fiscal por engano.
    - ⚠️ **Armadilha do Prisma**: a primeira tentativa errou o nome do tipo (`FiscalProvider` em vez de `ProviderType`) e o Prisma registrou a migration como **falha**, bloqueando todas as seguintes com `P3009` — mesmo sem nada ter sido alterado. Diagnóstico: rodar o SQL dentro de `BEGIN`/`ROLLBACK` para ver o erro real, e `prisma migrate resolve --rolled-back <nome>` para destravar.
  - ✅ **T044 (quickstart) coberto pelo E2E automatizado**: os cenários 1–5 exigiam A1 real e foram executados contra os órgãos, com verificação de efeito e não de status HTTP. Reprodutível por `packages/docs/fiscal/roteiro-teste-real.md`.
  - 🔄 **Substituição de NFS-e REESCRITA** (2026-08-07, decisão de negócio "deixar o Sefin decidir"): o fluxo anterior estava **conceitualmente errado**. Substituição **não é evento postado** — `POST /nfse/{chave}/eventos` recusa o `e105102` com `E1861` ("não é aceito pelo método POST da API Eventos"). O caminho correto é **emitir uma DPS com bloco `subst`** (`chSubstda` + `cMotivo` + `xMotivo`, entre `cLocEmi` e `prest`), e o Sefin gera o evento de cancelamento sozinho.
    - **Isso eliminou a janela de "duas notas vivas"** que motivou o bloqueio original: não há mais um segundo passo que pode falhar depois da nota nova existir. Ou a DPS com `subst` é autorizada — e o órgão cancela a original — ou nada acontece. O cancelamento compensatório que eu tinha escrito virou desnecessário e foi removido.
    - `resolveSubstitutionBlocker` **deixou de bloquear por prazo ausente**; só bloqueia quando há prazo publicado e vencido. Ilhéus não publica prazo, e o bloqueio tornava o recurso permanentemente indisponível.
    - 🐛 **`accessKey` da NFS-e nunca era persistido** (corrigido): na autorização só `protocol` era atualizado, e `accessKey` mantinha o `Id` da DPS. Quebrava duas coisas em silêncio — a substituição montava `chSubstda` com o id da DPS (`E1235`, pattern de 50 dígitos), e `consult` roteia por `accessKey.startsWith('DPS')`, então **nunca** chegava a consultar `/nfse/{chave}`.
    - **`E0063`**: a DPS de substituição tem de manter competência, tomador e **valor do serviço** da original — substituição corrige outros dados, não o valor. Validado no caso de uso (`VALUE_MISMATCH`) para poupar numeração e devolver erro acionável.
    - **Guarda `MISSING_ACCESS_KEY`**: só se substitui nota efetivamente autorizada; sem chave real o XML sairia inválido por schema.
    - 🐛 **Envelope duplo na rota** (corrigido): `FiscalDocumentPresenter.toHttp` já embrulha em `{data}`, então `POST /nfse/{id}/substitute` devolvia `{original:{data:{…}}, substitute:{data:{…}}}`. O cliente teria de ler `body.original.data.status`, fora do padrão. Agora é envelope único.
    - ⚠️ **Lição de verificação**: o E2E passou como 14/14 com a substituição **falhando** — a asserção só checava HTTP 201, e o caso de uso devolve o par mesmo quando a substituta é recusada. Só conferir o banco revelou. **Asserção de integração tem de olhar o efeito, não o código HTTP.**
  - **Teste E2E contra órgãos reais** (2026-08-07): 14 verificações executadas, **14/14 OK** (o script `scripts/e2e-fiscal.mjs` foi removido a pedido; o roteiro manual equivalente é `packages/docs/fiscal/roteiro-teste-real.md`). Cadastro → certificado → NF-e → NFS-e → idempotência → consulta → XML → linha do tempo → substituição → cancelamento → recusa de produção. Achados que só a execução contra o órgão revelou:
    - 🐛 **`nSeqEvento` com zero à esquerda** (corrigido): a mesma variável servia ao `Id` do evento (onde 2 dígitos é correto) e ao elemento `<nSeqEvento>` (cujo pattern é `[1-9][0-9]?`). **Dois testes afirmavam o formato errado** e por isso não pegaram — o XSD do evento não é validado localmente, só a transmissão real revelou.
    - 🐛 **Cancelamento recusado virava beco sem saída** (corrigido): a recusa marcava o documento `CANCEL_REJECTED`, e o guard de cancelamento exige `AUTHORIZED` — então uma recusa **transitória** (`Chave de acesso inexistente` por propagação) impedia qualquer nova tentativa. Agora a recusa **preserva o status**: a nota segue autorizada no órgão, que é a verdade, e a tentativa fica no `FiscalEvent`/`ProviderRequest`. Vale para NF-e e NFS-e.
    - 🐛 **CNPJ duplicado devolvia 500** (corrigido): a unique do banco estourava sem checagem no caso de uso. Agora `CompanyAlreadyExistsForCnpjError` → 409 legível. Exigiu `findByCnpj` no repositório (interface, Prisma e fake).
    - ⏱️ **Propagação da SEFAZ**: cancelar imediatamente após autorizar devolve `Chave de acesso inexistente`. Com ~60s (3 tentativas de 20s) autoriza. Não é defeito — o E2E retenta.
    - ⚠️ **Limpar o banco NÃO reseta a numeração no órgão fiscal.** Truncar as tabelas locais volta a sequência a 1, mas SEFAZ e Sefin guardam a deles: reemitir números já usados devolve `539` (NF-e) e `E0014` (NFS-e). Avançar `fiscal_sequences.current_number` para além do usado resolve.
    - 🐛 **Requisição PRODUCTION recusada consumia número fiscal** (corrigido): a recusa acontecia na transmissão, **depois** da reserva. Cada tentativa mal configurada queimava um número e deixava um `SIGNED` órfão — numeração fiscal é sequencial e finita, e salto o fisco cobra explicação (ou exige inutilização). Corrigido com `FiscalProvider.assertEnvironmentAvailable`, chamado **antes** da reserva nos dois casos de uso. Os 8 órfãos das execuções anteriores foram removidos.
      - O `FakeFiscalProvider` passou a recusar PRODUCTION também — um fake que aceita o que o real recusa esconde exatamente o bug que o método existe para evitar. Mesma lição da idempotência: **fake que diverge do real transforma teste verde em falsa garantia**.
    - 🔴 **Substituição de NFS-e é inalcançável na prática**: `resolveSubstitutionBlocker` recusa sem prazo publicado, e a parametrização REAL de Ilhéus (`/convenio`) **não publica prazo nenhum** — devolve adesão e crédito. A regra foi escolhida deliberadamente (liberar sem prazo pode deixar duas notas vivas), mas o efeito é que o recurso nunca funciona. **Decisão de negócio pendente**: aceitar prazo configurado ou manter o bloqueio.
  - 🎉 **NF-e E NFS-e AUTORIZADAS** (2026-08-07, homologação, empresa RR EMPREENDIMENTOS `50031609000104`): NF-e protocolo `129261000154446`, NFS-e protocolo `29136062250031609000104000000000000426082632033618`. XML autorizado recuperável nas duas rotas. **Pipeline completo funcionando ponta a ponta.**
    - **`487` — em homologação o `autXML` tem de ser o CNPJ da própria SEFAZ.** A mensagem diz literalmente qual usar: `13.937.073/0001-56`. Escritório de contabilidade real só é aceito se estiver cadastrado na SEFAZ; em teste, ninguém está. Esta é a última rejeição antes da autorização e a mensagem é autoexplicativa — vale ler antes de investigar.
    - **Diferença entre as duas empresas testadas explica o `203`**: APLOPES (software, CNPJ `36698609000123`) para em `203 — Emissor não habilitado`, porque não tem credenciamento de NF-e na SEFAZ-BA. RR (comércio varejista, `50031609000104`) autoriza. **`203` é credenciamento do contribuinte, não defeito da API** — confirmado por contraste, não por suposição.
    - **IM condicional confirmada nos dois sentidos**: RR emite NFS-e **sem** IM (não está no CNC de Ilhéus); APLOPES exige IM (`E0116`, está no CNC). O mesmo código atende os dois porque o builder já omite `IM` quando ausente.
  - 🎉 **PRIMEIRA NFS-e AUTORIZADA** (2026-08-07, homologação): protocolo `29136062250031609000104000000000000126083747515485`, empresa RR EMPREENDIMENTOS (`50031609000104`). Chegar lá exigiu **cinco** regras que o XSD não expressa — cada uma virou rejeição antes de virar código, e cada rejeição só aparece depois de a anterior ser resolvida:
    - **`E0120`/`E0116` — IM é condicional, não opcional.** Se o CNPJ está no CNC do município, a IM **deve** ir (`E0116` sem ela). Se não está, **não pode** ir (`E0120` com ela). Os dois erros são opostos e dependem de cadastro que só o órgão conhece — não há como decidir localmente.
    - **`E0121` — razão social do prestador não vai.** Com `tpEmit=1` o emitente É o prestador e o Sefin já sabe o nome pelo CNPJ. `xNome` removido de `prest`; o do tomador continua (desse o órgão pode não ter cadastro).
    - **`E0166` — `regApTribSN` é obrigatório para `opSimpNac=3`**, apesar de `minOccurs="0"` no XSD. Emitido como `1` (federais e municipal pelo SN), que é o caso de quem não ultrapassou sublimite. ⚠️ Quem ultrapassou precisa de `2`/`3` — exigiria campo no cadastro, hoje não existe.
    - **`E0625` — alíquota só com retenção.** Sem retenção (`tpRetISSQN=1`) quem define a alíquota é o município, e declará-la é rejeição. `pAliq` passou a sair só quando `issWithheld` é verdadeiro.
    - **`E0712` — ME/EPP não pode usar `indTotTrib`.** O grupo `totTrib` é **obrigatório** pelo schema (`xs:choice` entre valor/percentual/indicador), mas para optante do Simples o indicador é proibido: tem de informar valor. Saída: `vTotTrib` decomposto. ⚠️ **Valores zerados** — o cálculo de transparência tributária (Lei 12.741/2012) exige tabela IBPT por NBS/município, que a API não tem. Zero não é o valor correto; é pendência conhecida, não decisão.
    - **Padrão que se repetiu**: o XSD marca campos como opcionais que o Sefin exige, e aceita campos que ele proíbe. Validar contra o schema é **necessário e insuficiente** — só a transmissão real revela as regras de negócio.
  - **`xNome` truncado em 60 caracteres** (2026-08-07): limite do leiaute da NF-e. Razões sociais maiores são comuns ("RR EMPREENDIMENTOS E COMERCIO VAREJISTA DE MATERIAIS DE CONSTRUCAO LTDA" tem 71) e sem truncar a empresa **não emite**, com erro de schema que não diz qual campo estourou. Truncado no builder, não recusado no cadastro: a razão social é fato jurídico da empresa e o limite é do documento fiscal.
  - **Regras da NF-e descobertas contra a SEFAZ-BA real** (2026-08-07) — cada uma virou rejeição antes de virar código:
    - **Razão social do destinatário em homologação**: em `tpAmb=2` o `dest/xNome` tem de ser EXATAMENTE `NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL`. Aplicado pelo builder (`resolveRecipientName`), **não** pedido ao chamador: o ERP não deve conhecer regra de ambiente do fisco, e um acento a mais no texto derrubaria a nota. Só o nome muda — CPF/CNPJ e endereço seguem reais.
    - **Grupo `autXML` (rejeição 486)**: a Bahia exige o CNPJ/CPF do escritório de contabilidade, mesmo o XSD marcando o grupo como `minOccurs="0"`. Vive em `Company.accountingOfficeDocument` (migration `company_accounting_office`) porque o contador serve o Emitente, não a operação. `xs:choice` resolvido por tamanho: 11 dígitos → `CPF`, 14 → `CNPJ`.
    - **Grupos PIS/COFINS (rejeição 745)**: obrigatórios em toda NF-e, inclusive no Simples Nacional. Simples → `PISOutr`/`COFINSOutr` CST 49 com zeros (contribuições saem no DAS; a nota declara o fato) — **preservado byte a byte** (não-regressão). **2026-08-13 (spec erp/015): a apuração passou a ser real** nos demais regimes. `NfeItemInput` ganhou `pis?`/`cofins?` (`{ cst, aliquota? }`) já resolvidos pelo emissor (erp-api resolve produto→grupo→padrão→CST/alíquota; a fiscal-api **não** conhece grupos/produto). `buildPisCofinsXml` emite `PISAliq`/`COFINSAliq` (CST 01/02) com `vBC`, `pPIS`/`vPIS`, `pCOFINS`/`vCOFINS` calculados sobre a base do item, ou `PISNT`/`COFINSNT` (CST 04–09) sem valores; os totais `vPIS`/`vCOFINS` do `ICMSTot` **somam os itens** (não mais `0.00`). **Fallback**: item sem `pis`/`cofins` (produto sem grupo e sem padrão) → CST 01 zerado (não-regressão 2). CST 03 (`PISQtde`) e 49–99 configurável seguem fora de escopo. Coberto por builder tests (`nfe-xml.builder.spec.ts` — PISAliq/COFINSAliq calculado, PISNT/COFINSNT, totais somados, 2 não-regressões).
    - **IE correta identificada por diferença de rejeição**: `2166330725` → `231 IE não vinculada ao CNPJ`; `166330725` → `203 Emissor não habilitado`. Só a segunda passou a checagem de vínculo, o que a identifica como a IE real. O `203` restante é **credenciamento administrativo** junto à SEFAZ-BA, não código.
  - ⚠️ **Encoding: nunca fazer PATCH/POST com acento via `curl` neste shell.** O shell corrompe UTF-8 antes de chegar à API (`Ilhéus` → `Ilh�us`), o dado é persistido corrompido e a emissão falha depois com `xMun ... not accepted by the pattern` — sintoma que **parece** bug da API e não é. Usar `node --input-type=module` com `fetch`, ou arquivo gravado em UTF-8. Verificado comparando os bytes no banco (`efbfbd` = U+FFFD vs `c3a9` = é correto).
  - **Estado verificado das duas emissões** (2026-08-07, homologação real): ambos os pipelines chegam ao órgão fiscal e são avaliados; **o que falta nos dois é dado cadastral, não código**.
    - **NF-e** → SEFAZ-BA responde `cStat 209 — Rejeicao: IE do emitente invalida`. Montagem do XML, assinatura, mTLS e chave de acesso estão corretos; a IE `123456789` da empresa de teste é inventada. Com IE real registrada na SEFAZ-BA para o CNPJ, deve autorizar.
    - **NFS-e** → Sefin Nacional responde `E0116 — A IM deve ser informada... conforme informações complementares registradas no CNC NFS-e do município emissor`. O certificado A1 **funciona** (mTLS, assinatura e DPS aceitos); falta a Inscrição Municipal da empresa registrada no CNC de Ilhéus. Trocar de certificado **não** resolve — e-CNPJ ICP-Brasil é nacional, não "de Ilhéus".
  - **`cTribNac` deixou de ser derivado** (2026-08-07): o builder da DPS montava o código de tributação nacional acrescentando `"00"` ao municipal (`01.01` → `010100`). Era aproximação documentada, e o Sefin Nacional a desmentiu em homologação com `E0310` ("o código de tributação nacional informado não existe"). Agora `IssueNfseServiceDto` tem `nationalServiceCode` (6 dígitos, tabela **nacional**, distinta da municipal) e `resolveCTribNac` o prefere; a derivação continua como fallback, mas é a que falha. Opcional no contrato, **necessário na prática** — documentado assim no manual de integração do ERP.
  - **`AppError` ganhou `externalCode`** (default: nome da classe) e o filtro HTTP passou a publicá-lo em `error.code`. Existe para rejeições cujo código é definido por órgão externo — quem consome a API precisa do `E1313` do Sistema Nacional, não do nome da nossa classe. Nada muda para os erros existentes.
- **2026-08-13 (spec erp/017 — informações adicionais nos builders)**: os builders passaram a emitir informação complementar já resolvida pelo emissor (erp-api concatena/valida; a fiscal-api recebe texto pronto e reforça o teto do XSD como defesa — mesma divisão de PIS/COFINS e ICMS).
  - **NF-e/NFC-e** (`nfe-xml.builder.ts`, cobre os dois modelos — o `nfce-xml.builder` só insere o QR, não é builder de documento separado): `BuildNfeXmlInput` ganhou `additionalInfo?: NfeAdditionalInfo` (`{ infAdFisco?; infCpl? }`). `buildInfAdicXml` emite `<infAdic>` com `<infAdFisco>` (fisco, máx. **2000**) e/ou `<infCpl>` (contribuinte, máx. **5000**) na `xs:sequence` **após `pag`**; **omite `infAdic`** quando ambos vazios (não-regressão — XML idêntico ao de hoje). Estoura `Error` se algum campo passar do teto (`INF_AD_FISCO_MAX`/`INF_CPL_MAX`).
  - **NFS-e (DPS)** (`dps-xml.builder.ts`): ⚠️ **o `DPS_v1.01.xsd` NÃO tem grupo `infAdic` nem campo `infAdFisco`** (achado do XSD, spec erp/017 plan D10). A informação complementar da NFS-e é **`serv/infoCompl/xInfComp`** (`TSDescInfCompl`, máx. **2000**, análogo do `infCpl`), emitida **dentro de `serv`, após `cServ`**. `BuildDpsXmlInput` ganhou `additionalInfo?: { infCpl? }`; `buildInfoComplXml` emite `infoCompl/xInfComp` quando presente e **omite `infoCompl`** quando vazio. Para NFS-e só o destino `infCpl` existe — o `infAdFisco` é **indisponível** (o cadastro no erp-api recusa `documentType=NFSE` com `target=INF_AD_FISCO`).
  - Cobertura: `nfe-xml.builder.spec.ts` (infAdic com os dois campos + validação contra o `nfe_v4.00.xsd` real via `signXml` perfil `NFE_SEFAZ`; só `infCpl`; não-regressão sem `infAdic`; estouro de limite) e `dps-xml.builder.spec.ts` (infoCompl/xInfComp + validação contra `DPS_v1.01.xsd` perfil `MODERN`; não-regressão; estouro de limite). Suíte dos dois builders: **58/58**.
- **2026-08-13 (spec erp/018 — `tribISSQN` deixa de ser fixo)**: o `dps-xml.builder.ts` **não fixa mais `tribISSQN: '1'`** (o comentário "único caso suportado no v1" **deixou de valer**). `DpsServiceInput` ganhou `tribISSQN?: '1'|'2'|'3'|'4'` (`TSTribISSQN`: 1 tributável, 2 imunidade, 3 exportação, 4 não incidência) — **opcional, default `'1'`** (não-regressão: caller sem o campo segue tributável). O erp-api resolve o valor do **Grupo de ISSQN** e o envia pronto (a fiscal-api não conhece grupos). O bloco de retenção/`pAliq` **não mudou** — `pAliq` continua saindo **só com retenção** (não-regressão E0625). Cobertura em `dps-xml.builder.spec.ts` (`describe('tribISSQN …')`): default '1' sem o campo, cada `tribISSQN` (1/2/4) emitido, e imunidade sem retenção sem `pAliq`. Suíte do builder DPS: **26/26**. Nesta fatia (erp/018) só 1/2/4 são oferecidos pelo cadastro; **3 (exportação)** exige dados extras da nota e fica para evolução.
  - **`tribISSQN` também foi threadado no caminho de emissão** (não só no builder): `IssueNfseServiceDto` (HTTP `issue-nfse.dto.ts` + application `nfse.dto.ts`) ganhou `tribISSQN?: '1'|'2'|'3'|'4'` (opcional, `@IsIn`), e `IssueNfseUseCase` o repassa ao `service` do `buildDpsXml`. Assim o `erp-api` (que resolve o Grupo de ISSQN) envia a exigibilidade pronta no `POST /api/v1/nfse` e ela chega ao XML transmitido. Sem o campo → default '1' (não-regressão). `issue-nfse` use-case tests: 13/13.
  - **Mapa de 441 códigos de rejeição** do Sistema Nacional em `modules/nfse/domain/national-error-codes.ts`, extraído do Anexo I com a mensagem oficial literal preservada e categoria derivada (`CERTIFICATE`/`PAYLOAD`/`REGISTRATION`/`MUNICIPAL`/`DEADLINE`/`LIFECYCLE`/`REQUEST`), cada uma com orientação ao operador. Código desconhecido degrada para o próprio código, nunca para significado inventado. **Arquivo gerado** — ao adotar versão nova do leiaute, reextrair em vez de editar à mão.
- **2026-08-13 (`apps/erp/web`, sem mudança de código aqui — atualiza o contexto do G1/FR-014 acima)**: o proxy `/api/proxy/fiscal` do erp-web começou a autenticar com o client `citybox-fiscal-service` (Service Accounts, role `fiscal_operator` — provisionado desde 2026-08-10, mas nunca antes ligado a código nenhum) em vez do token do usuário final, que nenhum usuário comum tem role pra passar no `PermissionGuard`. Isso torna real, pela primeira vez, o modelo "sistema chamador controla o acesso" que o **G1** já registrava como decisão explícita — mas só para o subconjunto de rotas que o proxy sabe verificar dono (`companyId` no path/query, `/v1/companies` list-by-cnpj/create); as demais (cancelar/corrigir/inutilizar NF-e-NFC-e-NFS-e, ativar certificado, mutar sequência por id) continuam saindo com o token do usuário (403 pra quem não tem role — sem regressão, só sem cobertura ainda). Ver `apps/erp/web/AGENTS.md` (`/api/proxy/fiscal`) e `apps/erp/web/src/lib/api/fiscal-tenant-guard.ts`. O **G1 em si não mudou** — a fiscal-api continua sem checagem própria de "o Emitente pedido é do sistema que está chamando"; o controle vive inteiramente do lado do erp-web para esse caminho.
