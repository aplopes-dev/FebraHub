# Phase 0 Research: fiscal-api

**Input**: [spec.md](./spec.md) · Constitution: [.specify/memory/constitution.md](../../.specify/memory/constitution.md)

## 0. Prior art already in this repo (read before anything else)

`packages/docs/fiscal/api_fiscal_completa.md` (1783 linhas, commit `a9c8de6`, 2026-06-15) já é um desenho técnico/funcional completo para uma "API Fiscal Centralizada" cobrindo NF-e, NFC-e, NFS-e Municipal e Nacional, Reforma Tributária (CBS/IBS/IS), versionamento de layout, webhooks e um painel administrativo. Ele antecede o spec `002-fiscal-api` e é mais amplo do que o v1 aprovado (que cobre só NF-e + NFS-e Ilhéus, sem NFC-e, sem Tax Reform Engine, sem webhooks, sem painel).

**Decisão**: tratar esse documento como a arquitetura de referência do domínio fiscal para este monorepo e reaproveitar diretamente seus acertos onde não conflitam com o spec já validado — nomes de módulo, padrão Provider/Strategy, tabelas `fiscal_documents`/`fiscal_document_items`/`fiscal_events`/`fiscal_sequences`/`provider_requests`, formato de resposta, convenção de storage. Onde o documento vai além do v1 (NFC-e, Tax Reform Engine, webhooks, painel admin), este plano **não implementa agora**, mas preserva os pontos de extensão (Provider Factory, tabela `fiscal_events` genérica, `environment` em todo lugar) para que essas fases futuras (já roteirizadas no próprio documento, seção 29) encaixem sem refatoração de domínio — o que também satisfaz FR-012/FR-015 do spec (extensibilidade sem retrabalho).

**Alternativas consideradas**: ignorar o documento e desenhar do zero a partir só do spec — rejeitado, violaria a regra de pesquisa-e-reuso do `CLAUDE.md`/`development-workflow.md` ("prefira adotar/portar uma abordagem já pensada a escrever código novo quando ela atende ao requisito") e descartaria uma pesquisa de fontes oficiais (SEFAZ-BA, NFS-e Nacional, MetropolisWeb Ilhéus) já feita.

## 1. Onde o serviço vive no monorepo

**Decision**: `services/fiscal-api`, pacote `@citybox/fiscal-api`, porta **3116**.

**Rationale**: fiscal-api não é uma vertical de negócio (não aparece no catálogo `StoreVertical` do admin-api) — é um microserviço de plataforma cross-vertical, igual em espírito a `services/payment-api`. A convenção `services/<nome>-api` para esse tipo de serviço já existe e é endossada pelo próprio `AGENTS.md` raiz (seção "Services"); reaproveitá-la é seguro mesmo `payment-api` estando marcado para ser refeito — o aviso lá é sobre *padrões internos de código* (auth própria por API-Key, sem Clean Architecture, fora do workspace pnpm), não sobre a *localização*. Porta: `CLAUDE.md` reserva ≥3170 para APIs de vertical (`apps/verticals/*/api`); como fiscal-api não é vertical, usa a faixa geral de apps — próxima porta livre após `erp-api` (3114) é **3116**.

**Alternatives considered**: (a) `apps/verticals/fiscal/api` — rejeitado, daria a entender que é uma vertical cadastrável no admin, o que não é o caso; (b) porta na faixa ≥3170 (ex. 3173) — rejeitado pelo mesmo motivo (reservada a verticais).

**Ação decorrente obrigatória** (Constitution Principle I — docs-as-code): a implementação deve criar `services/fiscal-api/AGENTS.md` e atualizar o `AGENTS.md` raiz (seção 3 — mapa de portas, seção 4 — índice de Services) no mesmo commit/PR, além de adicionar `"services/*"` ao `pnpm-workspace.yaml` (hoje só existe o glob morto `apps/services/*`, que não bate com `services/payment-api` nem bateria com `services/fiscal-api`).

## 2. Linguagem, framework e versões

**Decision**: TypeScript `^5.7.3`, NestJS **11.1.24** (via `catalog:` do `pnpm-workspace.yaml`, mesmas entradas que `@nestjs/common`/`core`/`platform-express`/`swagger`/`config`/`cli`/`schematics` usam nos demais apps), Node.js 24 (mesma imagem `node:24-alpine` usada em `apps/erp/api/Dockerfile` e `apps/verticals/food/api/Dockerfile`), Prisma **7.8.0** (`@prisma/client` + `@prisma/adapter-pg` + `prisma` dev, versão exata igual à de `apps/erp/api/package.json`, o app estruturalmente mais próximo — Clean Architecture + Prisma + MinIO + Zod).

**Rationale**: alinhar 1:1 com o app mais recente e mais próximo estruturalmente (`erp-api`) minimiza drift de versão no monorepo e evita quebrar o `pnpm-workspace.yaml` catalog.

**Alternatives considered**: fixar versões independentes — rejeitado, contraria a Constitution Principle III (pnpm único) na prática (lockfile divergente) mesmo sem violá-la na letra.

## 3. Arquitetura interna dos módulos

**Decision**: Clean Architecture por módulo (`domain/` → `application/` → `infrastructure/`), exatamente como `apps/verticals/food/api` e `apps/verticals/clinica/api` — **não** o layout mais plano de `services/payment-api` (módulo único `modules/<nome>/` com controller+service gordo), que o próprio `services/payment-api/AGENTS.md` marca como um dos motivos da reescrita futura.

Módulos de negócio (top-level `src/modules/`), adaptados da lista do documento de referência (`api_fiscal_completa.md` §7) e recortados ao escopo do v1 aprovado no spec:

```
companies/         # Emitente (empresa emissora) — cadastro, 1:1 com Store do CityBox (FR-015)
certificates/       # Upload, validação e guarda segura de certificado A1 (US3)
fiscal-documents/   # Entidade base NF-e/NFS-e — status, protocolo, consulta genérica (US1/US2/US4, FR-003)
nfe/                # Casos de uso específicos de NF-e: emitir, cancelar, carta de correção, inutilizar (US1, US4)
nfse/               # Casos de uso específicos de NFS-e Ilhéus/BA: emitir, cancelar, consultar (US2, US4)
providers/
├── sefaz-ba/        # FiscalProvider para NF-e — XML, XSD, assinatura, SOAP (Strategy Pattern pedido no briefing)
└── ilheus-metropolis/  # FiscalProvider para NFS-e Ilhéus — RPS, XML, autenticação municipal
health/             # healthcheck (padrão já usado em todos os apps)
```

Capacidades técnicas transversais (não são módulos de negócio com controller — vivem em `shared/infra/`, mesmo padrão de `shared/infra/storage`/`shared/infra/keycloak` em food/clinica):

```
shared/infra/fiscal-xml/         # xmlbuilder2 (build) + libxmljs2 (validação XSD)
shared/infra/fiscal-signature/   # xml-crypto (XMLDSig/C14N/SHA-256/RSA) + node-forge (extrai chave/cert do .pfx)
shared/infra/fiscal-soap/        # cliente SOAP (pacote `soap`) para os webservices da SEFAZ-BA
shared/infra/storage/            # MinioObjectStorage (mesmo padrão de erp/imoveis/clinica/food)
shared/infra/keycloak/           # verificação local de JWT (mesmo padrão food/clinica)
shared/infra/http/{guards,decorators,filters}/  # AuthGuard, PermissionGuard, CurrentUser, filtros de erro
shared/domain/                   # interface FiscalProvider (Strategy), ObjectStorage, entidades base
```

**Rationale**: o documento de referência usa um `src/modules/{xml,signatures,soap,...}` mais plano — mas isso é porque ele não parte da convenção Clean-Architecture-por-módulo já estabelecida neste monorepo. XML/assinatura/SOAP não têm entidade de domínio própria nem controller HTTP — são *serviços técnicos injetados pelos providers*, então pertencem à camada `infra`, igual a como `storage`/`keycloak` já vivem hoje. Isso também é mais próximo do pedido original do usuário (módulos `xml`, `signature`, `soap`, `certificates` como responsabilidades isoladas) sem duplicar a convenção de "module = domínio de negócio com controller" só para agrupar utilitários técnicos.

**Alternatives considered**: copiar o layout `src/modules/<technical-concern>/` do documento de referência ao pé da letra — rejeitado por divergir da convenção Clean Architecture já pactuada no monorepo (violaria consistência de code review, `typescript-reviewer`/`react-reviewer` esperam esse padrão).

## 4. Persistência

**Decision**: Prisma com schema próprio `fiscal` no Postgres compartilhado `citybox` (mesma instância/porta `127.0.0.1:15433` usada por food/clinica), `DATABASE_URL=postgresql://aplopes:aplopes@127.0.0.1:15433/citybox?schema=fiscal`, `datasource.schemas = ["fiscal"]` (Prisma multi-schema, já estável — nenhum app do monorepo declara `previewFeatures` para isso). Toda chave primária usa `@default(dbgenerated("citybox_uuid_v7()")) @db.Uuid`, cumprindo a Constitution Principle V à risca (diferente de food/clinica, que hoje usam `@default(uuid())` legado — fiscal-api nasce em conformidade, sem dívida a herdar).

**Rationale**: "Não há pacote `database` central — cada app é dono do seu schema" (Constitution V, `AGENTS.md` §6); `citybox` (não `citybox_platform`) é o banco descrito no `CLAUDE.md` raiz como o compartilhado "por vertical/API" — é o mesmo banco físico de food/clinica, só schema diferente.

**Alternatives considered**: banco dedicado próprio (`citybox_fiscal`), como `payment-api` faz com `citybox_payments` — rejeitado; é justamente um dos padrões de `payment-api` sinalizados como não-aderente ao restante da plataforma (isolamento além do necessário, mais um serviço de infra para operar). Reaproveitar o schema `platform` do admin-api — rejeitado, violaria o isolamento por schema (Principle V).

## 5. Storage de binários (XML autorizado, certificado .pfx)

**Decision**: MinIO via o padrão `ObjectStorage` (interface) + `MinioObjectStorage` (impl) + `InMemoryObjectStorage` (fake de teste) já usado em `erp-api`/`imoveis-api`/`clinica-api`/`food-api`. Bucket dedicado `fiscal`, chaves namespaced por Emitente: `{companyId}/nfe/xml/{documentId}.xml`, `{companyId}/nfse/xml/{documentId}.xml`, `{companyId}/certificates/{certificateId}.pfx.enc` (espelhando a árvore de `storage/tenants/{tenantId}/companies/{companyId}/...` do documento de referência, simplificada para o `companyId` já bastar no v1 — 1 Loja = 1 Emitente, sem necessidade de outro nível `tenantId` acima).

**Rationale**: reaproveita 100% um padrão já testado em 4 apps; evita reintroduzir `@aws-sdk/client-s3` (nunca usado neste monorepo).

**Ação decorrente**: adicionar `mc mb --ignore-existing local/fiscal` ao `minio-init` de `infra/minio/docker-compose.yml`, e documentar em `infra/AGENTS.md` — junto com o bucket, mesma unidade de trabalho (Constitution I).

**Nota de risco**: os `.env.example` de clinica/food apontam `MINIO_ENDPOINT` para a porta `9002` (não `9000`, a porta real de `infra/minio/docker-compose.yml`) — parece um resquício de uma instância MinIO alternativa (`services/infra`, citada em comentário). fiscal-api deve apontar para a instância canônica documentada em `infra/AGENTS.md` (porta `9000`/console `9001`); esse desvio de food/clinica não deve ser copiado.

## 6. Certificado digital A1 (upload, guarda, senha)

**Decision**: upload via `FileInterceptor('file', { limits: { fileSize } })` + `@UploadedFile() file?: Express.Multer.File` (padrão idêntico a `upload-agent-document.route.ts` em `imoveis-api`), com um validador de assinatura binária (magic bytes) análogo a `DocumentFileValidator`, adaptado para PKCS#12 (`.pfx`/`.p12`, DER começa com `0x30`). `node-forge` faz o parse do PKCS#12 (extrai chave privada + certificado a partir da senha informada) só em memória, no momento do upload, para validar que o arquivo é um certificado válido e extrair CNPJ/validade — a senha em si é criptografada (AES-256-GCM, chave de app via `FISCAL_CERT_ENCRYPTION_KEY`) e nunca logada nem retornada em nenhuma resposta de API (FR-007). O `.pfx` original vai criptografado para o MinIO; a senha criptografada vai só no Postgres.

**Rationale**: `node-forge` é a biblioteca mais madura em Node para ler PKCS#12 puro-JS (sem dependência nativa), consistente com o restante do monorepo que evita bindings nativos onde dá.

**Alternatives considered**: guardar a senha em um secrets manager dedicado (Vault/AWS Secrets Manager) — não existe nenhum no monorepo hoje (nem em `infra/AGENTS.md`); fica documentado como evolução futura (o próprio documento de referência, §26, já lista "secrets manager" como item de "produção madura", não do v1) em vez de introduzir uma peça de infra nova só para este serviço.

## 7. XML, validação XSD, assinatura digital, SOAP

**Decision**:
- **Build de XML**: `xmlbuilder2` — biblioteca TS-friendly, mantida, e o padrão de fato para geração de XML em Node.
- **Validação contra XSD**: `libxmljs2` (binding nativo libxml2, com suporte real a XSD — não existe validador XSD confiável em JS puro). Alternativa considerada: `xsd-schema-validator` (wrapper fino sobre o mesmo libxmljs) — descartada por ser uma camada a mais sem ganho.
- **Assinatura XMLDSig** (canonicalização C14N, SHA-256, RSA — exigência explícita do briefing): `xml-crypto`, biblioteca Node madura e amplamente usada em integrações de NF-e brasileiras, com suporte a assinatura customizada compatível com o padrão exigido pela SEFAZ.
- **Cliente SOAP** (comunicação com os webservices `NFeAutorizacao4`/`NFeRetAutorizacao4`/`NFeInutilizacao4`/`NFeConsultaProtocolo4`/`NFeStatusServico4` da SEFAZ-BA — endpoints em `hnfe.sefaz.ba.gov.br` para homologação, conforme `packages/docs/fiscal/api_fiscal_completa.md` §12.1): pacote `soap`, com o certificado do Emitente (chave/cert extraídos via `node-forge`) configurado como client cert TLS mútuo via `httpsAgent`.
- **NFS-e Ilhéus/BA (portal MetropolisWeb/POLIS)**: o protocolo exato (SOAP vs REST, autenticação, layout RPS) **não está confirmado** — o próprio documento de referência (§3.4, §14.1) é explícito: *"O provider Ilhéus deve ser implementado somente após obtenção ou confirmação formal do manual técnico, credenciais, endpoints, layout XML/RPS, regras de assinatura/autenticação e ambiente de teste/produção junto ao município ou sistema MetropolisWeb/POLIS."* Isso é tratado como uma dependência externa a resolver durante a implementação da Fase 2 (`IlheusMetropolisNfseProvider`), não como uma incógnita de arquitetura — a interface `FiscalProvider` (Strategy) isola essa incerteza atrás de um contrato estável, então não bloqueia o desenho do restante do sistema nem as demais fases.

**Rationale**: nenhuma dessas bibliotecas está instalada em nenhum lugar do monorepo hoje — este é um domínio genuinamente novo (greenfield) dentro da plataforma, confirmado por busca exaustiva em todos os `package.json`. As escolhas acima seguem o que o próprio documento de referência já mapeou como stack esperada (`packages/docs/fiscal/api_fiscal_completa.md` §31 "Checklist para iniciar desenvolvimento": NestJS + Prisma + PostgreSQL + MinIO) e o que é padrão de mercado para integração NF-e em Node.

## 8. Autenticação e autorização (v1 — só clientes internos, per FR-015)

**Decision**: reaproveitar o padrão exato de `AuthGuard`/`PermissionGuard`/`@CurrentUser`/`@Public` de `apps/verticals/food/api/src/shared/infra/http/guards/` — verificação local de JWT Keycloak via `jose` (sem chamar o Keycloak admin API). `PermissionGuard` autoriza por **role/permissão** (`fiscal.documents.manage`/`.view`, atribuída aos client IDs internos listados em `INTERNAL_CLIENT_IDS`), não por Emitente individual.

**Rationale**: FR-015 do spec já resolveu que o v1 atende só sistemas internos do CityBox (ERP, PDV, marketplace) — logo o modelo de auth já usado por eles (Keycloak/JWT propagado) é reaproveitável sem inventar um esquema de API-Key como o de `payment-api` (que, de novo, é o padrão explicitamente marcado para não copiar).

**Alternatives considered**: API Key por sistema consumidor (como o documento de referência propõe para clientes de fora do CityBox, e como `payment-api` implementa) — adiado para quando FR-015 for reaberto (onboarding de clientes externos), não implementado agora (YAGNI — não há consumidor externo hoje).

**Decisão revisitada (2026-08-04, achado G1 de `/speckit-analyze`)**: o desenho original desta seção previa um decorator `@CompanyId()` (`shared/infra/http/decorators/company-id.decorator.ts`, mesmo papel do `@StoreId()` de food/clinica) para escopar **cada requisição individual** ao Emitente correto — lendo `X-Company-Id` e comparando contra `document.companyId` em toda rota de leitura/emissão. O decorator foi criado no Foundational, mas **nunca foi ligado a nenhuma rota** (`GetFiscalDocumentRoute`, `GetNfeRoute`, `GetNfeXmlRoute`, `ListFiscalDocumentsRoute`, `IssueNfeRoute` não o usam) — `/speckit-analyze` marcou isso como achado CRITICAL (G1): qualquer chamador com a role `fiscal_operator`/`platform.admin` pode ler/baixar o XML de **qualquer** Emitente, bastando saber o `id` do documento (classe de vulnerabilidade Broken Object Level Authorization — OWASP API1:2023).

**Decisão explícita**: para o v1, **manter o modelo atual — autorização só por role/sistema chamador, sem checagem de Emitente por requisição** — em vez de impor escopo por Emitente em código agora. Justificativa: FR-015 já restringe o v1 a um conjunto fechado de sistemas internos confiáveis do próprio CityBox (ERP, PDV, marketplace, via `INTERNAL_CLIENT_IDS`), e cada um desses sistemas já é responsável por só solicitar ações fiscais em nome do Emitente/Loja que o usuário final autenticado nele efetivamente controla — a fiscal-api confia nessa fronteira já estabelecida em vez de reimplementá-la como uma segunda camada redundante. `@CompanyId()` permanece no código (não removido — decorator genérico, sem custo de manutenção), documentado como **não usado por design no v1**, reservado para quando FR-015 for reaberto (onboarding de clientes externos/multi-tenant de verdade, quando a fronteira de confiança deixa de ser "é um sistema interno do CityBox" e passa a exigir checagem por Emitente em cada requisição).

**Risco aceito, registrado explicitamente**: um sistema interno comprometido, com bug, ou mal configurado (ex.: um cliente da API que deixa o usuário final escolher `companyId` livremente sem validação no próprio sistema) pode, hoje, ler/baixar documentos fiscais de um Emitente que não é o dele através da fiscal-api — não há segunda linha de defesa no nível desta API. Revisitar esta decisão se: (a) FR-015 for reaberto, ou (b) qualquer sistema interno adicional for integrado sem a mesma garantia de que já faz seu próprio controle de acesso por Loja/Emitente antes de chamar a fiscal-api.

## 9. Provisionamento do Emitente (Company)

Nenhuma das 3 perguntas de clarificação do spec cobriu **quem cria o registro do Emitente e quando** — só que a relação é 1:1 com a Loja (Store) do CityBox.

**Decision**: fiscal-api expõe um endpoint interno `POST /companies` (protegido pelo mesmo Keycloak/guarda dos demais, chamável apenas pelo ERP/admin-api) para provisionar o Emitente quando uma Loja habilita a funcionalidade fiscal — o mesmo padrão de "provisionamento sob demanda" já usado por `@citybox/nest-common` para Keycloak. fiscal-api **não** consome eventos `citybox.store.*` para isso no v1 (consistente com a decisão síncrona de FR-016); a criação do Emitente é um passo explícito, não implícito.

**Rationale**: mantém o mesmo modelo de interação (síncrono, API-first) decidido em FR-016 para toda a superfície pública do serviço, em vez de introduzir um único fluxo assíncrono isolado só para esse caso.

## Resumo das decisões (Technical Context)

| Campo | Valor |
|---|---|
| Language/Version | TypeScript `^5.7.3`, Node.js 24 |
| Primary Dependencies | NestJS 11.1.24 (catalog), Prisma 7.8.0 + `@prisma/adapter-pg`, `class-validator`/`class-transformer` (DTOs HTTP), `zod` (validação de domínio), `jose` (JWT Keycloak), `minio` 8.0.5, `xmlbuilder2`, `libxmljs2`, `xml-crypto`, `node-forge`, `soap` |
| Storage | PostgreSQL (schema `fiscal` no banco `citybox` compartilhado) + MinIO (bucket `fiscal`) |
| Testing | Jest + `ts-jest` (padrão food/clinica) — unit tests com repositórios/providers fake em memória; `tests/integration/` com Postgres real (padrão clinica, gated por `DATABASE_URL`); fixtures de XML de homologação para testes de contrato dos providers |
| Target Platform | Linux (Docker, `node:24-alpine`), serviço HTTP standalone |
| Project Type | web-service (API backend, sem frontend) |
| Performance Goals | SC-001/002: protocolo em até 30s; SC-003: XML disponível em até 5s após protocolo |
| Constraints | Só ambiente de homologação/sandbox no v1 (Assumptions do spec); senha/certificado nunca em log; HTTPS/TLS mútuo com SEFAZ |
| Scale/Scope | v1 = só emitentes internos do CityBox (FR-015), NF-e modelo 55 + NFS-e Ilhéus/BA (FR-002), 1 Loja : 1 Emitente |

Nenhuma marcação `NEEDS CLARIFICATION` permanece — as únicas duas questões técnicas sem confirmação externa (protocolo exato do provider Ilhéus/MetropolisWeb, e o momento de migrar a senha do certificado para um secrets manager real) são dependências operacionais documentadas nas seções 6 e 7 acima, não incógnitas de arquitetura: a interface `FiscalProvider` e a criptografia AES-256-GCM já dão um caminho de implementação completo para o v1 independentemente delas.
