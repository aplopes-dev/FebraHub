---

description: "Task list for fiscal-api implementation"
---

# Tasks: fiscal-api — Emissão de Documentos Fiscais (NF-e e NFS-e)

**Input**: Design documents from `/specs/002-fiscal-api/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: incluídos e **obrigatórios**, não opcionais — `CLAUDE.md`/`common/testing.md` deste monorepo mandata TDD (RED → GREEN → REFACTOR) e cobertura mínima de 80% para todo o workspace, o que sobrepõe o padrão "tests are optional" deste template. Toda fase de user story escreve os testes primeiro (devem falhar) e só então implementa.

**Organization**: tarefas agrupadas por user story (US1–US4 do spec.md, em ordem de prioridade P1→P4) para permitir implementação e teste independentes, conforme pedido explicitamente no briefing original ("nunca implemente várias funcionalidades de uma única vez... divida em tarefas pequenas e independentes").

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: a qual user story esta tarefa pertence (US1, US2, US3, US4)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Serviço backend único, sem frontend — todos os caminhos são relativos a `services/fiscal-api/` (ver estrutura completa em [plan.md § Project Structure](./plan.md#project-structure)).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: inicialização do novo serviço `@citybox/fiscal-api` no monorepo

- [X] T001 Criar o esqueleto do serviço `services/fiscal-api` (`package.json` com nome `@citybox/fiscal-api`, `tsconfig.json`, `nest-cli.json`, `Dockerfile` a partir de `node:24-alpine` — mesmo padrão de `apps/erp/api/Dockerfile`) em `services/fiscal-api/`
- [X] T002 Adicionar `"services/*"` ao `pnpm-workspace.yaml` (o glob atual `apps/services/*` é morto — research.md §1) e referenciar as versões de `@nestjs/*` via `catalog:` em `services/fiscal-api/package.json`
- [X] T003 [P] Configurar ESLint/Prettier/`tsconfig` do serviço espelhando `apps/erp/api` (mesma base de regras do monorepo) em `services/fiscal-api/.eslintrc.*`, `.prettierrc`, `tsconfig.json`
- [X] T004 [P] Criar `services/fiscal-api/.env.example` com `DATABASE_URL` (`schema=fiscal`), `MINIO_*`, `KEYCLOAK_ISSUER`, `FISCAL_CERT_ENCRYPTION_KEY`, `PORT=3116` (research.md §1, §4, §5, §6)
- [X] T005 Criar `services/fiscal-api/AGENTS.md` e atualizar o `AGENTS.md` raiz (§3 mapa de portas — porta 3116, §4 índice de Services) na mesma unidade de trabalho (Constitution I)
- [X] T006 [P] Adicionar `mc mb --ignore-existing local/fiscal` ao passo `minio-init` de `infra/minio/docker-compose.yml` e documentar o bucket `fiscal` em `infra/AGENTS.md` (research.md §5)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: schema de banco, infraestrutura compartilhada e entidades base que as 4 user stories dependem

**⚠️ CRITICAL**: nenhuma user story começa antes desta fase estar completa

- [X] T007 Definir no Prisma schema todos os enums e modelos de `data-model.md` (`DocumentType`, `ProviderType`, `Environment`, `FiscalDocumentStatus`, `CertificateStatus`, `FiscalEventType`, `Company`, `Certificate`, `Customer`, `FiscalDocument`, `FiscalDocumentItem`, `FiscalEvent`, `FiscalSequence`, `ProviderRequest`; `datasource.schemas = ["fiscal"]`; todo `id` com `@default(dbgenerated("citybox_uuid_v7()")) @db.Uuid` — Constitution V) em `services/fiscal-api/prisma/schema.prisma`
- [X] T008 Gerar e rodar a migration inicial (`pnpm --filter @citybox/fiscal-api db:migrate:dev`) criando o schema `fiscal` no banco `citybox`
- [X] T009 [P] Implementar `PrismaModule`/`PrismaService` em `services/fiscal-api/src/shared/infra/prisma/`
- [X] T010 [P] Implementar verificação local de JWT Keycloak + `AuthGuard`/`PermissionGuard`/`@Public`/`@CurrentUser`/`@CompanyId` (padrão food/clinica — research.md §8) em `services/fiscal-api/src/shared/infra/keycloak/` e `services/fiscal-api/src/shared/infra/http/{guards,decorators}/`
- [X] T011 [P] Implementar `ObjectStorage` (interface) + `MinioObjectStorage` + `InMemoryObjectStorage` (padrão erp/imoveis/clinica/food — research.md §5) em `services/fiscal-api/src/shared/domain/storage/object-storage.interface.ts` e `services/fiscal-api/src/shared/infra/storage/minio/`
- [X] T012 [P] Implementar a interface Strategy `FiscalProvider` (`issue`/`cancel`/`consult`) e o esqueleto de `FiscalProviderFactory` em `services/fiscal-api/src/shared/domain/fiscal-provider.interface.ts` e `services/fiscal-api/src/modules/providers/provider-factory.ts`
- [X] T013 [P] Implementar o toolkit de XML (`xmlbuilder2` para build + `libxmljs2` para validação contra XSD — FR-009) em `services/fiscal-api/src/shared/infra/fiscal-xml/`
- [X] T014 [P] Implementar o toolkit de assinatura (`node-forge` para extrair chave/certificado de um PKCS#12 + `xml-crypto` para assinatura XMLDSig/C14N/SHA-256/RSA + utilitário AES-256-GCM para criptografar/decriptar a senha do certificado — FR-007) em `services/fiscal-api/src/shared/infra/fiscal-signature/`
- [X] T015 [P] Implementar filtro global de erros HTTP + interceptor de envelope `ApiResponse<T>` (`success`/`data`/`error`/`meta` — `common/patterns.md`) em `services/fiscal-api/src/shared/infra/http/filters/`
- [X] T016 Implementar a entidade de domínio `Company` + interface de repositório + validador Zod em `services/fiscal-api/src/modules/companies/domain/`
- [X] T017 Implementar os casos de uso de `Company` (criar, listar, buscar, atualizar — `contracts/companies-api.md`) em `services/fiscal-api/src/modules/companies/application/use-cases/`
- [X] T018 Implementar o repositório Prisma de `Company` + rotas HTTP (`POST`/`GET`/`GET :id`/`PATCH`) com DTO (`class-validator`) e presenter em `services/fiscal-api/src/modules/companies/infrastructure/`
- [X] T019 [P] Implementar a entidade de domínio `Certificate` + interface de repositório com os métodos de leitura `findValidByCompanyId`/`findById` (a escrita/upload fica na Phase 5 — US3) em `services/fiscal-api/src/modules/certificates/domain/`
- [X] T020 Implementar o repositório Prisma de `Certificate` (métodos de leitura de T019) em `services/fiscal-api/src/modules/certificates/infrastructure/database/`
- [X] T021 [P] Implementar as entidades de domínio `FiscalDocument`, `FiscalDocumentItem`, `FiscalEvent`, `FiscalSequence`, `ProviderRequest` + interfaces de repositório em `services/fiscal-api/src/modules/fiscal-documents/domain/`
- [X] T022 Implementar os repositórios Prisma de `FiscalDocument`/`FiscalEvent`/`FiscalSequence`/`ProviderRequest`, incluindo a busca de idempotência por `(sourceSystem, externalReference, documentType, idempotencyKey)` (FR-013) e a reserva atômica de número/série (`FiscalSequence.currentNumber`) em `services/fiscal-api/src/modules/fiscal-documents/infrastructure/database/`
- [X] T023 Implementar os casos de uso genéricos de consulta (`list`, `get-by-id`, `list-events` — `contracts/fiscal-documents-api.md`, FR-003) em `services/fiscal-api/src/modules/fiscal-documents/application/use-cases/`
- [X] T024 Implementar as rotas HTTP genéricas (`GET /fiscal-documents`, `GET /fiscal-documents/{id}`, `GET /fiscal-documents/{id}/events`) com paginação backend obrigatória (`skip`/`take`/`WHERE`/`ORDER BY` — Constitution II) em `services/fiscal-api/src/modules/fiscal-documents/infrastructure/http/routes/`
- [X] T025 [P] Implementar o módulo `health` (healthcheck padrão do monorepo) em `services/fiscal-api/src/modules/health/`
- [X] T026 Conectar todos os módulos foundational (Prisma, Keycloak guards como `APP_GUARD`, Storage, Companies, FiscalDocuments, Health) e configurar Swagger em `api/v1/docs` com prefixo global `api` em `services/fiscal-api/src/app.module.ts` e `services/fiscal-api/src/main.ts`
- [X] T027 [P] Testes unitários do utilitário de criptografia AES-256-GCM da senha do certificado (round-trip encrypt/decrypt, falha com chave errada) em `services/fiscal-api/src/shared/infra/fiscal-signature/tests/cert-encryption.spec.ts`
- [X] T028 [P] Testes unitários da resolução do `FiscalProviderFactory` (mapeia `SEFAZ_BA_NFE`→provider NF-e, `ILHEUS_METROPOLIS_NFSE`→provider NFS-e, lança erro para provider desconhecido) em `services/fiscal-api/src/modules/providers/tests/provider-factory.spec.ts`

**Checkpoint**: fundação pronta — as 4 user stories podem começar (em paralelo, se houver mais de um desenvolvedor)

**Status real (2026-08-04)**: **Foundational 100% concluída (24/24)** — T014 (toolkit de assinatura/criptografia de certificado) e T027 (seu teste) foram aprovadas e implementadas nesta rodada, incluindo testes adicionais para `pkcs12-parser.ts` e `xml-signer.ts` (5 + 3 specs, cobrindo round-trip criptográfico real com certificado autoassinado gerado em memória, verificação XMLDSig ponta a ponta e detecção de adulteração). Serviço bootável (`pnpm --filter @citybox/fiscal-api dev`), `build`/`lint`/`typecheck`/`test` verdes (35/35 testes). `companies`, a consulta genérica de `fiscal-documents` e agora todo o toolkit de assinatura estão prontos. Próximo bloqueio: **T038/T039 (SOAP real para a SEFAZ-BA)** — ainda fora do escopo autorizado; T029–T037 (testes, validadores, use-cases e rotas de US1, sem chamada externa real) podem prosseguir.

**Status real (2026-08-04, continuação)**: **US1 (T029–T037) concluída** — módulo `nfe` completo exceto integração SOAP real. Marcos técnicos desta rodada:
- **XSD real da NF-e 4.00**: o schema oficial (5 arquivos, ~10k linhas, fornecido pelo usuário em `specs/002-fiscal-api/contracts/NFe/`, copiado para `services/fiscal-api/resources/xsd/nfe/`) substituiu a suposição inicial. Descoberta: `libxmljs2.parseXml` precisa da opção `baseUrl` para resolver `xs:include`/`xs:import` entre os 5 arquivos — sem isso, "Invalid XSD schema".
- **Conflito de perfil XMLDSig resolvido**: o schema real (`xmldsig-core-schema_v1.01.xsd`) fixa `SignatureMethod`/`DigestMethod`/`CanonicalizationMethod` em SHA-1/RSA-SHA1/C14N legado — diferente do SHA-256/C14N-exclusivo que T014 havia implementado por padrão. `xml-signer.ts` ganhou `XmlSignatureAlgorithmProfile` (`MODERN` default preservado, `NFE_SEFAZ` usado pelo módulo `nfe`).
- **Bug de ordem de validação corrigido**: o schema exige `<Signature>` como irmão obrigatório de `<infNFe>` — `IssueNfeUseCase` validava o XML *antes* de assiná-lo, o que sempre falhava. Corrigido para validar o XML **assinado**.
- **Módulo `Customer` criado**: não existia entidade/repositório para `Customer` apesar do model Prisma já existir desde o Foundational (gap do T021 original). Criado nesta rodada e wireado em `FiscalDocumentsModule`.
- **Gap de escopo documentado**: T029–T033 são testes de caso de uso com fakes em memória, não testes HTTP/Supertest reais (ver nota acima na seção de testes de US1).
- Suíte completa verde: **54/54 testes**, `typecheck`/`lint`/`build` limpos. `NfeModule` registrado em `app.module.ts`, mas **sem** `SefazBaNfeProvider` — uma chamada real a `POST /api/v1/nfe` hoje lança `ProviderNotConfiguredError` (424) até T038 ser aprovado.
- Próximo bloqueio (inalterado): **T038/T039 (SOAP real para a SEFAZ-BA)** — fora do escopo autorizado até aprovação explícita.

---

## Phase 3: User Story 1 - Emitir NF-e de uma venda de produtos (Priority: P1) 🎯 MVP

**Goal**: emitir, validar e disponibilizar uma NF-e autorizada pela SEFAZ-BA em ambiente de homologação (spec.md US1)

**Independent Test**: `POST /api/v1/nfe` com dados válidos de emitente/destinatário/itens em homologação retorna protocolo de autorização (ou rejeição justificada) e o XML fica disponível para download — ver [quickstart.md § Cenário 1](./quickstart.md#cenário-1--us1-emitir-nf-e-de-uma-venda-de-produtos) (passo 2, upload do certificado, é semeado diretamente no banco pelos testes automatizados desta fase, sem depender do endpoint de upload da Phase 5/US3 — ver nota em "Dependencies" abaixo)

### Tests for User Story 1 ⚠️ (escrever primeiro, confirmar que falham)

> **Nota de escopo (2026-08-04)**: T029–T033 foram implementados como testes no **nível de caso de uso** (repositórios in-memory via `tests/fixtures/issue-nfe-test-context.ts` + `FakeFiscalProvider`), não como testes HTTP/Supertest black-box contra os paths de arquivo originalmente especificados. As rotas (`issue-nfe.route.ts`, `get-nfe.route.ts`, `get-nfe-xml.route.ts`) são wrappers finos sem lógica adicional além da validação de DTO (já coberta por `class-validator`), então a cobertura de comportamento real está nos testes de caso de uso. Gap: falta um teste HTTP/Supertest genuíno de ponta a ponta (`supertest` ainda não é dependência do pacote). Arquivos reais:
> - `src/modules/nfe/application/use-cases/issue-nfe/issue-nfe.use-case.spec.ts` (T029 sucesso, T030 validação, FR-008, FR-009, rejeição)
> - `src/modules/nfe/application/use-cases/consult-nfe/consult-nfe.use-case.spec.ts` (T031)
> - `src/modules/nfe/application/use-cases/get-nfe-xml/get-nfe-xml.use-case.spec.ts` (T033, sem o requisito de latência "5s" — não testável de forma significativa com repositórios em memória)
> - Idempotência (T032) coberta em `issue-nfe.use-case.spec.ts` ("returns the same document on a repeated request...")

- [X] T029 [P] [US1] Teste de contrato: `POST /api/v1/nfe` com payload válido retorna `201` com `status: "AUTHORIZED"`, `protocol` e `xmlUrl` (Acceptance Scenario 1, SC-001) em `services/fiscal-api/src/modules/nfe/tests/issue-nfe-success.contract.spec.ts`
- [X] T030 [P] [US1] Teste de contrato: `POST /api/v1/nfe` com item sem `totalValue` retorna `422` **antes** de qualquer chamada ao provider (Acceptance Scenario 2, SC-004) em `services/fiscal-api/src/modules/nfe/tests/issue-nfe-validation.contract.spec.ts`
- [X] T031 [P] [US1] Teste de contrato: `GET /api/v1/nfe/{id}` retorna status/protocolo/XML atuais de um documento já autorizado (Acceptance Scenario 3) em `services/fiscal-api/src/modules/nfe/tests/consult-nfe.contract.spec.ts`
- [X] T032 [P] [US1] Teste de integração: `POST /api/v1/nfe` repetido com o mesmo `Idempotency-Key`/`externalReference` retorna o **mesmo** `documentId`, sem duplicar (FR-013, SC-007) em `services/fiscal-api/tests/integration/nfe-idempotency.integration.spec.ts`
- [X] T033 [P] [US1] Teste de integração: `GET /api/v1/nfe/{id}/xml` retorna um XML que valida contra o XSD de homologação da NF-e 4.00 (fixture em `tests/fixtures/`) em até 5s após o protocolo (SC-003, FR-009) em `services/fiscal-api/tests/integration/nfe-xml-download.integration.spec.ts`

### Implementation for User Story 1

- [X] T034 [US1] Implementar os validadores de domínio de NF-e (completude de item, campos obrigatórios `ncm`/`cfop`/`cst`) em `services/fiscal-api/src/modules/nfe/domain/validators/`
- [X] T035 [US1] Implementar `IssueNfeUseCase` (valida → reserva número/série via `FiscalSequence` → constrói XML → valida XSD → assina → chama o provider → persiste `FiscalDocument`/`FiscalDocumentItem` → grava XML no MinIO) em `services/fiscal-api/src/modules/nfe/application/use-cases/issue-nfe/`
- [X] T036 [US1] Implementar `ConsultNfeUseCase` em `services/fiscal-api/src/modules/nfe/application/use-cases/consult-nfe/`
- [X] T037 [US1] Implementar as rotas `POST /api/v1/nfe`, `GET /api/v1/nfe/{id}`, `GET /api/v1/nfe/{id}/xml` com DTO e presenter, per `contracts/nfe-api.md`, em `services/fiscal-api/src/modules/nfe/infrastructure/http/routes/`
- [X] T038 [US1] Implementar `SefazBaNfeProvider` (`issue`/`consult`) chamando os webservices `NFeAutorizacao4`/`NFeConsultaProtocolo4` em homologação (`hnfe.sefaz.ba.gov.br`) em `services/fiscal-api/src/modules/providers/sefaz-ba/infrastructure/`
- [X] T039 [P] [US1] Implementar o cliente SOAP para os webservices da SEFAZ-BA (pacote `soap`, TLS mútuo usando a chave/certificado extraídos pelo toolkit de assinatura) em `services/fiscal-api/src/shared/infra/fiscal-soap/`
- [X] T040 [US1] Conectar `NfeModule` (validators, use-cases, rotas, `SefazBaNfeProvider`) em `services/fiscal-api/src/modules/nfe/nfe.module.ts` e registrá-lo em `app.module.ts`

**Checkpoint**: User Story 1 completa e testável de forma independente (MVP)

**Status real (2026-08-04, T038/T039/T040)**: **US1 (P1, MVP) 100% concluída** — integração SOAP real com a SEFAZ-BA implementada e aprovada explicitamente pelo usuário. Marcos técnicos:
- **WSDL não obtido do endpoint oficial**: WebFetch para `hnfe.sefaz.ba.gov.br` e para os portais nacional/SVRS falhou (`unable to get local issuer certificate` — cadeia ICP-Brasil ausente da trust store do sandbox, distinto de bloqueio de rede puro). O usuário confirmou os **endpoints reais** (produção + homologação, todas as operações NFe4) via `specs/002-fiscal-api/contracts/NFe/NF-e versão 4.0_ambientes.txt`, mas não o WSDL em si. `resources/wsdl/nfe/{NFeAutorizacao4,NFeConsultaProtocolo4}.wsdl` são de **autoria própria** (best-effort, cabeçalho de cada arquivo documenta a ressalva), modelando o payload `nfeDadosMsg`/`nfeResultMsg` (padrão nacional estável, idêntico entre UFs desde a NF-e 3.10) — validados de verdade pelo parser WSDL do `node-soap` em teste (não apenas mockados), mas o binding SOAP exato (nomes de operação, `SOAPAction`) não foi cross-checked contra o WSDL real. **Confirmar contra o WSDL oficial antes do primeiro teste em homologação real.**
- **Descoberta técnica — envio de XML bruto via `node-soap`**: `objectToDocumentXML` sempre re-embrulha os args do método sob o nome do elemento de entrada — a saída **dobrava** `<nfeDadosMsg>` (bug encontrado e corrigido via teste). Solução: usar o escape hatch `{ _xml: <envelope já pronto> }` do `node-soap`, que devolve a string exatamente como fornecida, sem reserialização (elimina o risco de escaping incorreto do XML assinado embutido).
- **TLS mútuo**: `soap.ClientSSLSecurity` trata `string` como **caminho de arquivo** (via `fs.readFileSync`) — passar o PEM decifrado em memória exige `Buffer.from(pem)`, não a string diretamente. Gotcha coberto por teste dedicado.
- **Parsing de resposta**: a resposta SOAP embrulha o XML de negócio (`retEnviNFe`/`retConsSitNFe`) sem schema forte — o parse tipado do `node-soap` não é confiável para esse conteúdo; a extração usa `libxmljs2`/XPath (`local-name()`) diretamente sobre `client.lastResponse` (raw), já usado no toolkit de XSD.
- **Mapeamento de `cStat`**: cobre os códigos estáveis e documentados (104/105 no lote; 100/110 em `infProt`/`retConsSitNFe`) — não modela a tabela completa (centenas de códigos); qualquer código não mapeado vira `REJECTED` (falha fechado, nunca assume sucesso).
- **Gap disclosed**: `IssueDocumentResult.status` (contrato `FiscalProvider`, já usado por 3 casos de uso) não tem variante `DENIED` — denegação (cStat 110) é mapeada para `REJECTED` em `issue()`, com o código original preservado em `errorCode`; `consult()` preserva `DENIED` fielmente (campo `status: string`). Ampliar o contrato é uma evolução futura, não feita para não alterar a interface compartilhada fora do escopo de T038.
- **`cancel()` não implementado** — lança `SefazBaOperationNotImplementedError` (US4, fora do escopo desta entrega; nenhum caso de uso chama esse método hoje).
- Todos os testes (SOAP client + envelope/parser + provider) usam WSDL real (parseado de verdade) com **transporte HTTP mockado** (`IHttpClient` injetado) — nenhuma chamada de rede real foi feita em nenhum momento desta implementação.
- Suíte completa: **83/83 testes**, `typecheck`/`lint` (0 erros, 1 warning tolerado — limitação conhecida de tipagem de `Function.prototype.call` em despacho dinâmico)/`build` limpos; boot smoke test confirma o grafo de DI completo (`SefazBaModule` → `NfeModule` → `AppModule`) resolvendo e respondendo `200` em `/api/health`.

---

## Phase 4: User Story 2 - Emitir NFS-e para Ilhéus/BA (Priority: P2)

**Goal**: emitir, validar e disponibilizar uma NFS-e Padrão Nacional autorizada para emitentes do município de Ilhéus/BA (spec.md US2)

**Independent Test**: `POST /api/v1/nfse` com dados válidos de um prestador cadastrado em Ilhéus/BA retorna protocolo de autorização (ou rejeição justificada) — ver [quickstart.md § Cenário 2](./quickstart.md#cenário-2--us2-emitir-nfs-e-para-ilhéusba)

### Tests for User Story 2 ⚠️

> **Nota de escopo (2026-08-05)**: mesma simplificação já registrada em US1 (T029-T033) — T041-T043 foram implementados como testes de caso de uso (`src/modules/nfse/application/use-cases/issue-nfse/issue-nfse.use-case.spec.ts`, 6 testes cobrindo sucesso/SC-002, rejeição de município fora de Ilhéus/BA, item inválido/SC-004, idempotência/FR-013, certificado inválido/FR-008, rejeição pelo provider), não testes HTTP/Supertest reais.

- [X] T041 [P] [US2] Teste de contrato: `POST /api/v1/nfse` com payload válido para emitente de Ilhéus/BA retorna `201` com `status: "AUTHORIZED"` (Acceptance Scenario 1, SC-002) em `services/fiscal-api/src/modules/nfse/tests/issue-nfse-success.contract.spec.ts`
- [X] T042 [P] [US2] Teste de contrato: `POST /api/v1/nfse` para um emitente com `cityCodeIbge` diferente de `2913606` retorna `422` **antes** de qualquer chamada ao provider (Acceptance Scenario 2) em `services/fiscal-api/src/modules/nfse/tests/issue-nfse-municipality-validation.contract.spec.ts`
- [X] T043 [P] [US2] Teste de integração: idempotência de NFS-e (mesma regra de NF-e — FR-013) em `services/fiscal-api/tests/integration/nfse-idempotency.integration.spec.ts`

### Implementation for User Story 2

- [X] T044 [US2] Implementar os validadores de domínio de NFS-e (checagem de `Company.cityCodeIbge = '2913606'`, completude de item de serviço) em `services/fiscal-api/src/modules/nfse/domain/validators/`
- [X] T045 [US2] Implementar `IssueNfseUseCase` (valida município → reserva número/série via `FiscalSequence` → constrói XML da DPS (Padrão Nacional v1.01) → assina → valida XSD → chama o provider → persiste) em `services/fiscal-api/src/modules/nfse/application/use-cases/issue-nfse/` — **nota**: usa "DPS" (Declaração de Prestação de Serviços), não "RPS" (Recibo Provisório de Serviço, mecanismo legado que o Padrão Nacional substitui — spec.md exige "exclusivamente o Padrão Nacional", que não usa RPS)
- [X] T046 [US2] `ConsultNfeUseCase` (já genérico por `document.provider`, sem nada específico de NF-e) **reaproveitado** para NFS-e via export de `NfeModule` — não duplicado como `ConsultNfseUseCase` (DRY); usado em `GetNfseRoute`
- [X] T047 [US2] Implementar as rotas `POST /api/v1/nfse`, `GET /api/v1/nfse/{id}` (reaproveitando `ConsultNfeUseCase`), `GET /api/v1/nfse/{id}/xml` (reaproveitando `GetNfeXmlUseCase`, também genérico), per `contracts/nfse-api.md`, em `services/fiscal-api/src/modules/nfse/infrastructure/http/routes/`
- [X] T048 [US2] Implementar `IlheusMetropolisNfseProvider` — **stub deliberado**: `issue`/`consult`/`cancel` lançam `IlheusMetropolisNotImplementedError` (não um genérico "provider não configurado") — dependência externa não confirmada (research.md §7, packages/docs/fiscal/api_fiscal_completa.md §14.1: "o provider Ilhéus deve ser implementado somente após obtenção ou confirmação formal do manual técnico..."). Diferente de `SefazBaNfeProvider` (T038), aqui NENHUM detalhe de transporte (SOAP/REST, autenticação, endpoints) está sequer minimamente confirmado — não há base para um best-effort. Implementar a transmissão real assim que o município/MetropolisWeb confirmar o protocolo, em `services/fiscal-api/src/modules/providers/ilheus-metropolis/infrastructure/`
- [X] T049 [US2] Conectar `NfseModule` em `services/fiscal-api/src/modules/nfse/nfse.module.ts` e registrá-lo em `app.module.ts`

**Checkpoint**: User Stories 1 e 2 funcionam de forma independente

**Status real (2026-08-05)**: **US2 (P2) concluída, exceto transmissão real ao município (T048 — stub deliberado, protocolo não confirmado)**. Marcos técnicos:
- **XSD oficial da NFS-e Padrão Nacional v1.01** fornecido pelo usuário em `specs/002-fiscal-api/contracts/NFSe/{1.00,1.01}/` (18 arquivos originalmente, nomes de arquivo não batiam com o conteúdo — clássico artefato de duas pastas por versão extraídas juntas no mesmo diretório; usuário reorganizou em subpastas corretas). Copiados para `services/fiscal-api/resources/xsd/nfse/` (só os 5 arquivos da cadeia `DPS_v1.01.xsd`: `DPS_v1.01.xsd`, `NFSe_v1.01.xsd`, `tiposComplexos_v1.01.xsd`, `tiposSimples_v1.01.xsd`, `xmldsig-core-schema.xsd`).
- **Bug real encontrado e corrigido no XSD oficial**: o padrão `TSSerieDPS` (campo `<serie>`) é `^0{0,4}\d{1,5}$` — mas no dialeto de regex do XML Schema (W3C XML Schema Part 2), `^`/`$` são caracteres LITERAIS, não âncoras (diferente de JS/Perl). Combinado com `maxLength=5`, o padrão publicado é insatisfazível por qualquer valor numérico real. Confirmado isoladamente com `libxmljs2` antes de corrigir. Correção aplicada só na cópia local (`resources/xsd/nfse/tiposSimples_v1.01.xsd`, comentário XML documentando o bug e como reverter) — decisão aprovada explicitamente pelo usuário.
- **DPS ≠ RPS**: o Padrão Nacional NFS-e usa "DPS" (Declaração de Prestação de Serviços, `TCDPS`/`TCInfDPS`) como o documento que o emitente assina e transmite — não "RPS" (mecanismo legado de sistemas municipais pré-Padrão-Nacional). `dps-xml.builder.ts` constrói só os campos exigidos pelo schema para uma prestação de serviço doméstica simples, sem intermediário (obra, evento, comércio exterior, IBS/CBS ficam para evolução futura).
- **Reaproveitamento DRY**: `ConsultNfeUseCase` e `GetNfeXmlUseCase` (Foundational/US1) já eram genéricos por `FiscalDocument`/`document.provider` — exportados de `NfeModule` e reaproveitados diretamente em `NfseModule` em vez de duplicados como `ConsultNfseUseCase`/`GetNfseXmlUseCase`.
- **Gap disclosed (não verificado)**: o dígito "Tipo de Inscrição Federal" no `TSIdDPS` (1=CPF/2=CNPJ) não está explicitado nos arquivos XSD em si — usada a convenção mais consistente com outros documentos fiscais nacionais, sem cross-check contra o Manual de Orientação ao Contribuinte (não disponível neste ambiente). O perfil de assinatura XMLDSig usado (`MODERN`, SHA-256/C14N-exclusivo) também não foi cross-checked contra o que a ADN realmente aceita (o `xmldsig-core-schema.xsd` da NFS-e, ao contrário do da NF-e, não tem atributos `fixed=` forçando um perfil legado — mas isso não confirma o que o backend do ADN de fato exige).
- Suíte completa: **95/95 testes** (86 anteriores + 9 novos), `typecheck`/`lint` (0 erros, 1 warning pré-existente)/`build` limpos; boot smoke test confirma `NfseModule`/`IlheusMetropolisModule` resolvendo e as 3 rotas (`POST /v1/nfse`, `GET /v1/nfse/:id`, `GET /v1/nfse/:id/xml`) mapeadas.

---

## Phase 5: User Story 3 - Gerenciar certificado digital do emitente (Priority: P3)

**Goal**: cadastrar, validar e armazenar com segurança o certificado A1 usado para assinar os documentos fiscais (spec.md US3)

**Independent Test**: upload de um `.pfx` válido com senha confirma a validade e associa o certificado ao emitente sem nunca expor a senha; upload inválido/expirado é rejeitado sem persistir — ver [quickstart.md § Cenário 1, passo 2](./quickstart.md#cenário-1--us1-emitir-nf-e-de-uma-venda-de-produtos) e [§ Cenário 3](./quickstart.md#cenário-3--us3-certificado-expirado-é-rejeitado)

### Tests for User Story 3 ⚠️

> **Nota de escopo (2026-08-05)**: mesma simplificação já registrada em US1/US2 — implementados como testes de caso de uso (`upload-certificate.use-case.spec.ts` 5 testes, `activate-certificate.use-case.spec.ts` 3 testes, `get-certificate-status.use-case.spec.ts` 2 testes, `certificate-response.mapper.spec.ts` 1 teste de regressão FR-007), não testes HTTP/Supertest reais.

- [X] T050 [P] [US3] Teste de contrato: `POST /companies/{companyId}/certificates` com `.pfx`+senha válidos retorna `201` com `status: "VALID"`, resposta **sem** senha/chave em nenhum campo (Acceptance Scenario 1, FR-007) em `services/fiscal-api/src/modules/certificates/tests/upload-certificate-success.contract.spec.ts`
- [X] T051 [P] [US3] Teste de contrato: upload de certificado inválido/corrompido/senha incorreta/expirado retorna `422` e nada é persistido (Acceptance Scenario 2, SC-006) em `services/fiscal-api/src/modules/certificates/tests/upload-certificate-validation.contract.spec.ts`
- [X] T052 [P] [US3] Teste unitário: `GET /certificates/{id}/status` reporta `daysUntilExpiration` corretamente para um certificado próximo do vencimento (Acceptance Scenario 3) em `services/fiscal-api/src/modules/certificates/tests/certificate-status.spec.ts`

### Implementation for User Story 3

- [X] T053 [US3] Implementar `UploadCertificateUseCase` (checagem de assinatura binária PKCS#12 → parse via `node-forge` → validação de senha/validade/CNPJ → criptografia da senha (AES-256-GCM) → upload do `.pfx` criptografado no MinIO → persistência de `Certificate`) em `services/fiscal-api/src/modules/certificates/application/use-cases/upload-certificate/`
- [X] T054 [US3] Implementar `ActivateCertificateUseCase` e `GetCertificateStatusUseCase` em `services/fiscal-api/src/modules/certificates/application/use-cases/{activate-certificate,get-certificate-status}/` — **nota**: o sistema tolera mais de uma linha `VALID` simultânea por Emitente (não há campo `active` dedicado no schema); `ActivateCertificateUseCase` não muda `status` (o contrato já exige que o alvo esteja `VALID`, retornando 409 caso contrário) — ver comentário no use-case para o raciocínio completo
- [X] T055 [US3] Implementar as rotas `POST`/`GET`/`PATCH .../activate`/`GET .../status` (`FileInterceptor` + validador de magic bytes PKCS#12 — `Pkcs12FileValidator`, DER SEQUENCE tag `0x30`, mesma técnica de `DocumentFileValidator` de imoveis-api — per `contracts/certificates-api.md`) em `services/fiscal-api/src/modules/certificates/infrastructure/http/routes/`
- [X] T056 [US3] Conectar `CertificatesModule` em `services/fiscal-api/src/modules/certificates/certificates.module.ts` e registrá-lo em `app.module.ts` (já registrado desde o Foundational — só o módulo em si precisou dos novos providers/controllers)

**Checkpoint**: User Stories 1, 2 e 3 funcionam de forma independente — a partir daqui, a emissão real ponta a ponta (quickstart.md Cenário 1 completo, manualmente) já é possível

**Status real (2026-08-05)**: **US3 (P3) concluída.** Marcos técnicos:
- `Certificate` deixou de ser uma entidade só de leitura — ganhou `Certificate.create()` (nasce sempre `VALID`, já que `UploadCertificateUseCase` só chega a criar a entidade depois de validar PKCS#12/senha/CNPJ/expiração) e `CertificateRepository.save()` (upsert, `PrismaCertificateRepository` + `InMemoryCertificateRepository` — este último já tinha `save()` desde os testes de US1/US2).
- **`AppExceptionFilter` ganhou o mapeamento "Conflict" → 409** (além de "Taken"/"Duplicate"/"AlreadyExists"/"Overlap" já existentes) — usado por `CertificateNotValidForActivationConflictError` e reaproveitável por US4 (cancelamento fora do prazo, inutilização de faixa sobreposta também precisarão de 409).
- Gap disclosed: o dígito "Tipo de Inscrição Federal" e outras nuances de convenção ICP-Brasil não tiveram problema aqui — `extractCnpjFromCommonName` (T014) já cobria a extração; a única decisão nova foi como tratar "no máximo um VALID por vez" sem um campo `active` dedicado (documentada no use-case).
- Suíte completa: **106/106 testes** (95 anteriores + 11 novos), `typecheck`/`lint` (0 erros)/`build` limpos, boot smoke test confirma as 4 rotas de certificados mapeadas.

---

## Phase 6: User Story 4 - Consultar, cancelar, corrigir e inutilizar documentos fiscais (Priority: P4)

**Goal**: gerenciar o ciclo de vida pós-emissão de NF-e/NFS-e — consulta, cancelamento, carta de correção e inutilização (spec.md US4)

**Independent Test**: emitir um documento em homologação (via US1/US2 já implementadas) e executar cada operação de ciclo de vida, verificando o protocolo retornado por cada uma — ver [quickstart.md § Cenário 4](./quickstart.md#cenário-4--us4-cancelar-corrigir-e-inutilizar)

### Tests for User Story 4 ⚠️

> **Nota de escopo (2026-08-05)**: mesma simplificação já registrada em US1/US2/US3 — cancelamento, carta de correção e inutilização implementados como testes de caso de uso (`cancel-nfe.use-case.spec.ts` 5, `correction-letter-nfe.use-case.spec.ts` 6, `inutilize-nfe.use-case.spec.ts` 6) + testes do provider real com transporte SOAP mockado (`sefaz-ba-nfe.provider.spec.ts`, blocos `cancel`/`correctionLetter`/`inutilize`) + testes do builder/parser de evento/inutilização (`nfe-soap-envelope.spec.ts`), não testes HTTP/Supertest reais. Cancelamento de NFS-e (T061) **não tem teste** — a implementação correspondente (T067) foi deferida, ver nota abaixo.

- [X] T057 [P] [US4] Teste de integração: cancelamento de NF-e `AUTHORIZED` dentro do prazo legal retorna `200` com `status: "CANCEL_AUTHORIZED"` (Acceptance Scenario 1) em `services/fiscal-api/tests/integration/nfe-cancel.integration.spec.ts` — **feito como teste de caso de uso**, ver nota de escopo acima
- [X] T058 [P] [US4] Teste de integração: cancelamento de NF-e fora do prazo legal retorna `409` (Acceptance Scenario 2) em `services/fiscal-api/tests/integration/nfe-cancel-expired.integration.spec.ts` — **feito como teste de caso de uso** (verifica `NfeCancelDeadlineConflictError`, mapeado para 409 pelo `AppExceptionFilter` — não testado via HTTP real)
- [X] T059 [P] [US4] Teste de integração: carta de correção de NF-e persiste um `FiscalEvent` e retorna protocolo (Acceptance Scenario 3) em `services/fiscal-api/tests/integration/nfe-correction-letter.integration.spec.ts` — **feito como teste de caso de uso**
- [X] T060 [P] [US4] Teste de integração: inutilização de faixa não utilizada retorna `200`; faixa com números já autorizados retorna `409` (Acceptance Scenario 4 + edge case) em `services/fiscal-api/tests/integration/nfe-inutilize.integration.spec.ts` — **feito como teste de caso de uso** (`inutilize-nfe.use-case.spec.ts`, verifica `NfeInutilizationRangeOverlapError` mapeado para 409)
- [X] T061 [P] [US4] Teste de integração: cancelamento de NFS-e `AUTHORIZED` dentro e fora do prazo legal (mesma regra de NF-e aplicada a NFS-e) em `services/fiscal-api/tests/integration/nfse-cancel.integration.spec.ts` — **feito como teste de caso de uso** (`cancel-nfse.use-case.spec.ts`, 4 testes)
- [X] T062 [P] [US4] Teste de integração: `GET /fiscal-documents/{id}/events` lista os eventos de cancelamento/correção/inutilização em ordem cronológica em `services/fiscal-api/tests/integration/fiscal-events-history.integration.spec.ts` — **já implementado no Foundational** (`list-fiscal-document-events.use-case.spec.ts`), confirmado nesta entrega

### Implementation for User Story 4

- [X] T063 [P] [US4] Implementar `CancelNfeUseCase` (checagem do prazo legal a partir de `authorizedAt` → chama `provider.cancel` → grava `FiscalEvent`) em `services/fiscal-api/src/modules/nfe/application/use-cases/cancel-nfe/`
- [X] T064 [P] [US4] Implementar `CorrectionLetterNfeUseCase` em `services/fiscal-api/src/modules/nfe/application/use-cases/correction-letter-nfe/`
- [X] T065 [P] [US4] Implementar `InutilizeNfeUseCase` (checagem de sobreposição contra números de `FiscalDocument` já autorizados na faixa) em `services/fiscal-api/src/modules/nfe/application/use-cases/inutilize-nfe/` — desbloqueado via migration `20260805012847_fiscal_event_inutilization_fields` (ver nota abaixo)
- [X] T066 [US4] Implementar as rotas `POST /nfe/{id}/cancel`, `POST /nfe/{id}/correction-letter`, `POST /nfe/inutilize` (per `contracts/nfe-api.md`) em `services/fiscal-api/src/modules/nfe/infrastructure/http/routes/` (depende de T063–T065) — **completo**, as 3 rotas implementadas
- [X] T067 [P] [US4] Implementar `CancelNfseUseCase` e a rota `POST /nfse/{id}/cancel` (per `contracts/nfse-api.md`) em `services/fiscal-api/src/modules/nfse/application/use-cases/cancel-nfse/` e `services/fiscal-api/src/modules/nfse/infrastructure/http/routes/` — **completo**, estruturalmente análogo a `CancelNfeUseCase` (ver nota abaixo)
- [X] T068 [P] [US4] Estender `SefazBaNfeProvider` com as operações `cancel`/`correctionLetter`/`inutilize` em `services/fiscal-api/src/modules/providers/sefaz-ba/infrastructure/` — **completo**, as 3 operações implementadas (evento via `NFeRecepcaoEvento4`, inutilização via `NFeInutilizacao4`, ambos assinados XMLDSig perfil `NFE_SEFAZ`)
- [X] T069 [P] [US4] Estender `IlheusMetropolisNfseProvider` com a operação `cancel` em `services/fiscal-api/src/modules/providers/ilheus-metropolis/infrastructure/` — **tão completo quanto possível**: `cancel()` já existe (stub `IlheusMetropolisNotImplementedError`) e agora está de fato conectado a `CancelNfseUseCase`/`POST /nfse/{id}/cancel` via `FiscalProviderFactory`; a transmissão real continua bloqueada porque o protocolo municipal (SOAP vs REST, autenticação, endpoints do MetropolisWeb/POLIS) segue **totalmente não confirmado** — diferente do caso SEFAZ-BA (onde só o XML/WSDL eram incertos, mas o padrão nacional e os endpoints eram conhecidos), aqui não há nenhum padrão público a seguir best-effort; ver research.md §7 e `packages/docs/fiscal/api_fiscal_completa.md` §14.1
- [X] T070 [P] [US4] Implementar a rota `GET /fiscal-documents/{id}/events` (per `contracts/fiscal-documents-api.md`) em `services/fiscal-api/src/modules/fiscal-documents/infrastructure/http/routes/` — **já implementado no Foundational** (`ListFiscalDocumentEventsRoute`), confirmado nesta entrega

**Checkpoint**: as 4 user stories estão completas (US4 100%: NF-e e NFS-e, com a ressalva de que a transmissão real de cancelamento de NFS-e ao município de Ilhéus segue bloqueada por falta de confirmação formal do protocolo — mesma ressalva de US2/emissão)

**Status real (2026-08-05)**: **US4 100% completa** (T057–T070, todos os checkboxes marcados). Marcos técnicos:
- `FiscalProvider` (Strategy) ganhou `correctionLetter()` e `inutilize()` como métodos abstratos — todo provider precisou implementar (`SefazBaNfeProvider` real nos dois; `IlheusMetropolisNfseProvider` rejeita ambos com erros dedicados, já que nenhum existe no Padrão Nacional de NFS-e; `FakeFiscalProvider` de testes configurável igual aos demais métodos).
- **Prazo legal de cancelamento**: `fiscal-documents/domain/rules/nfe-cancel-deadline.ts` — 24h a partir de `authorizedAt` (Ajuste SINIEF 07/05), por `FiscalDocumentType`, não hardcoded inline (spec.md Assumptions deixava o valor exato em aberto — resolvido com esse default documentado, sem confirmação explícita do usuário por ser um detalhe de implementação de baixo risco/fácil ajuste, não uma decisão arquitetural).
- **Carta de correção — campo não corrigível**: `nfe/domain/validators/correction-text.validator.ts` usa uma heurística de palavras-chave (valor, quantidade, CNPJ/CPF, datas, tributos, partes, CFOP) para rejeitar com `NfeCorrectionFieldNotAllowedError` (422) — não é uma verificação semântica completa, é um guard-rail para os casos óbvios (documentado no código; o edge case do spec.md era uma pergunta em aberto, não uma regra especificada).
- **XML de evento/inutilização SEFAZ (`envEvento`/`evento`/`infEvento`, `inutNFe`/`infInut`) é best-effort, não verificado contra XSD oficial** — decisão explícita do usuário (AskUserQuestion, 2026-08-05: "Prosseguir best-effort") após confirmar que `specs/002-fiscal-api/contracts/NFe/` só tem o pacote núcleo (leiauteNFe/nfe/tiposBasico/xmldsig), sem os XSDs de evento/inutilização. Mesmo padrão dos WSDLs de T038/T039: `resources/wsdl/nfe/NFeRecepcaoEvento4.wsdl` e `NFeInutilizacao4.wsdl` (novos) seguem a mesma estrutura simplificada `nfeDadosMsg`/`nfeResultMsg`; os endpoints em si **são reais e confirmados** (`NF-e versão 4.0_ambientes.txt`). O XML de inutilização foi implementado sem uma nova rodada de pergunta ao usuário — a mesma decisão ("best-effort, disclosed") já havia sido confirmada 3x consecutivas nesta sessão para exatamente essa categoria de artefato; se essa leitura estiver errada, é fácil reverter/corrigir. Confirmar `envEvento`/`inutNFe` + WSDLs contra as fontes oficiais antes do primeiro teste real em homologação.
- **Desbloqueio de T065 (inutilização)**: `FiscalEvent.fiscalDocumentId` virou nullable (migration `20260805012847_fiscal_event_inutilization_fields`, ver seção "Decisão de schema" abaixo) — decisão tomada via AskUserQuestion (opção "Tornar fiscalDocumentId nullable + 4 colunas novas", recomendada e escolhida pelo usuário), não silenciosamente.
- **Decisão de schema (AskUserQuestion, 2026-08-05)**: `FiscalEvent` ganhou `companyId`/`series`/`numberRangeStart`/`numberRangeEnd` (todas nullable, só preenchidas para `eventType=INUTILIZATION`) + `fiscalDocumentId` nullable. Mantém a tabela genérica única (research.md §3) em vez de uma tabela `FiscalNumberInutilization` separada. Migration escrita manualmente (`prisma migrate dev`/`--create-only` falham neste ambiente por causa da shadow database do Prisma não ter `public.citybox_uuid_v7()`, criada só via `infra/postgres/init/`, não replicada pelo Prisma na shadow DB) — aplicada com `prisma migrate deploy` (que não usa shadow DB) e verificada com `prisma migrate diff --from-config-datasource --to-schema ... --exit-code` (diff vazio, zero drift confirmado).
- **Overlap check de inutilização**: "número já autorizado" (edge case do spec.md) = `FiscalDocument.authorizedAt !== null`, independente do status atual (ex.: um documento já cancelado ainda "usou" aquele número) — critério mais simples e correto do que uma lista de status. Busca limitada por `companyId`+`série` (novo filtro `series` em `ListFiscalDocumentsCriteria`, não exposto no filtro público de `GET /fiscal-documents`) com um teto de segurança (`MAX_OVERLAP_LOOKUP=5000`, documentado como não-expectativa-real-de-volume) em vez de `$queryRaw` — mantém 100% Prisma Client tipado, consistente com o resto do código.
- **T067/T069 (NFS-e, implementados nesta rodada final)**: `CancelNfseUseCase` é estruturalmente idêntico a `CancelNfeUseCase` (mesma regra de prazo — `fiscal-documents/domain/rules/nfe-cancel-deadline.ts` já cobria `NFSE`; mesma persistência de `ProviderRequest`/`FiscalEvent`) — duplicado em vez de compartilhado deliberadamente, extrair uma base genérica `CancelFiscalDocumentUseCase` é um refactor à parte não feito aqui (evita misturar duas mudanças numa entrega). Erros próprios do módulo `nfse` (`NfseDocumentNotAuthorizedError`/`NfseCancelDeadlineConflictError`) em vez de reaproveitar os de `nfe` — mesmo padrão de escopo-por-módulo já usado em todo o resto do código. Nova rota `POST /api/v1/nfse/{id}/cancel`. `IlheusMetropolisNfseProvider.cancel()` **não foi alterado** — já era um stub correto e continua sendo; a diferença é que agora está de fato acionável via `CancelNfseUseCase`/`FiscalProviderFactory`, então uma chamada real hoje resulta em `IlheusMetropolisNotImplementedError` (500) depois de passar por toda a validação de prazo/status com sucesso — mesmo comportamento desenhado para `issue`/`consult` desde US2.
- Suíte completa: **145/145 testes** (141 anteriores + 4 novos: `cancel-nfse.use-case.spec.ts`), `typecheck`/`lint` (0 erros, 1 warning pré-existente não relacionado)/`build` limpos, boot smoke test real (Postgres conectado, migrations aplicadas) confirma `POST /api/v1/nfse/:id/cancel` mapeada e toda a árvore de DI resolvendo sem erro.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: melhorias que afetam as 4 user stories em conjunto

- [ ] T071 [P] Rodar a validação completa de [quickstart.md](./quickstart.md) (4 cenários) contra o stack local de homologação
- [ ] T072 [P] Adicionar rate limiting por Emitente/token nos endpoints de emissão (`common/security.md`) em `services/fiscal-api/src/shared/infra/http/`
- [ ] T073 [P] Garantir logging estruturado de auditoria (quem solicitou, sistema de origem, certificado usado, XML enviado/recebido — FR-011) em todos os casos de uso, gravando em `ProviderRequest`
- [ ] T074 Verificar cobertura de testes ≥80% (`pnpm --filter @citybox/fiscal-api test -- --coverage`) — `common/testing.md`
- [ ] T075 Rodar o gate `pnpm --filter @citybox/fiscal-api build && lint && typecheck && test` — `development-workflow.md`
- [ ] T076 Revisão do `database-reviewer` sobre `services/fiscal-api/prisma/schema.prisma` (Constitution V)
- [ ] T077 Atualizar `services/fiscal-api/AGENTS.md` com o inventário final de módulos/endpoints implementados (Constitution I)

---

## Phase 8: Correções pós-validação de homologação (D1–D4)

**Purpose**: fechar os 4 defeitos levantados na validação manual de 2026-08-05, quando os 3 cenários de NF-e e os 3 de NFS-e do `quickstart.md` foram executados contra o stack local. Resultado da validação: o pipeline de NF-e (montagem → assinatura → validação XSD 4.00 → numeração → persistência) funciona nas 3 variações testadas (interna PF, interna PJ com 2 itens, interestadual com PIX), mas nenhuma emissão chega a `AUTHORIZED`.

**Premissas assumidas** (marcadas para revisão — troque as tarefas se a decisão for outra):
- **D3** resolvido por *retomada da transmissão*, não por `409` — é o que a máquina de estados de [data-model.md](./data-model.md) já prevê (`SIGNED` é não-terminal) e o que um retry de cliente ERP espera.
- **D1** com bundle de CA versionado no repositório e passado via parâmetro `ca`, não via `NODE_EXTRA_CA_CERTS` — mantém a confiança escopada à chamada da SEFAZ em vez de alargar o trust store do processo, que também fala com MinIO e Keycloak.

### D2 — Itens do documento fiscal nunca são persistidos

Bloqueia D3: sem itens no banco não há como reconstruir uma nota para retransmitir.

- [X] T078 [US1] Escrever teste de round-trip no repositório Prisma (salvar `FiscalDocument` com 2 itens → `findById` devolver 2) em `services/fiscal-api/src/modules/fiscal-documents/tests/` — deve **falhar** (RED), hoje `items` volta `[]`
- [X] T079 [US1] Incluir escrita aninhada de `items` no `upsert` de `services/fiscal-api/src/modules/fiscal-documents/infrastructure/database/prisma-fiscal-document.repository.ts`, reusando os ids já presentes nas entidades; no ramo `update`, só tocar em `items` quando `document.items.length > 0` para o segundo `save` (AUTHORIZED) não apagar o que o primeiro gravou
- [X] T080 [US1] Estender o teste de contrato do repositório para rodar contra as duas implementações (Prisma e `InMemoryFiscalDocumentRepository`) em `services/fiscal-api/src/modules/fiscal-documents/tests/` — o fake guarda a entidade por referência e por isso mascarou o defeito

### D3 — Idempotência congela falha transitória de transmissão

- [X] T081 [US1] Escrever teste: documento existente em `SIGNED` para a mesma chave de idempotência deve **retomar a transmissão** (não devolver o `SIGNED` como resposta final) em `services/fiscal-api/src/modules/nfe/application/use-cases/issue-nfe/issue-nfe.use-case.spec.ts` — deve falhar (RED)
- [X] T082 [US1] Gravar o XML assinado em `{companyId}/nfe/signed/{documentId}.xml` **antes** da transmissão em `services/fiscal-api/src/modules/nfe/application/use-cases/issue-nfe/issue-nfe.use-case.ts` — hoje o XML só vai para o MinIO quando autoriza, e uma falha de comunicação não deixa rastro do que foi assinado
- [X] T083 [US1] Classificar status terminal (`AUTHORIZED`, `REJECTED`, `DENIED`, `CANCEL_AUTHORIZED`, `INUTILIZED`, `CORRECTION_LETTER_AUTHORIZED`) vs. não-terminal (`SIGNED`, `SENT`, `PROCESSING`, `SYNC_REQUIRED`) na checagem de idempotência de `issue-nfe.use-case.ts`; terminal devolve o existente (preserva FR-013/SC-007), não-terminal retoma a transmissão **sem reservar novo número**
- [X] T084 [US1] Documentar a nova semântica de idempotência em `services/fiscal-api/AGENTS.md` (Constitution I) — o contrato mudou para quem consome a API

### D1 — Cadeia ICP-Brasil ausente no cliente SOAP

Independente de D2/D3 — pode correr em paralelo. Bloqueia qualquer emissão autorizada: o handshake com `hnfe.sefaz.ba.gov.br` falha com `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` mesmo **sem** certificado de cliente, porque o servidor é emitido pela `AC Certisign ICP-Brasil SSL EV G4`, ausente do bundle da Mozilla que o Node usa.

- [X] T085 [P] [US1] Obter e versionar a cadeia ICP-Brasil (intermediária AC Certisign ICP-Brasil SSL EV G4 + ACs superiores até a Raiz Brasileira) em `services/fiscal-api/resources/ca/icp-brasil.pem`, seguindo o padrão já existente de `resources/wsdl/` e `resources/xsd/`
- [X] T086 [P] [US1] Adicionar resolução de caminho com override por env (`SEFAZ_CA_BUNDLE_PATH` com default) em `services/fiscal-api/src/modules/providers/sefaz-ba/infrastructure/sefaz-ba-config.ts`, mesmo padrão de `NFE_XSD_PATH` e dos WSDLs; refletir em `.env.example`
- [X] T087 [US1] Passar o bundle como terceiro parâmetro `ca` do `ClientSSLSecurity` em `services/fiscal-api/src/shared/infra/fiscal-soap/sefaz-soap-client.ts` (assinatura `ClientSSLSecurity(key, cert, ca?, defaults?)` confirmada em `soap@1.10.0`)
- [X] T088 [P] [US1] Teste unitário garantindo que o bundle carrega e parseia os certificados esperados, em `services/fiscal-api/src/shared/infra/fiscal-soap/tests/`
- [X] T089 [US1] Teste de integração com handshake TLS real contra `hnfe.sefaz.ba.gov.br`, no projeto `integration` do Jest, gated por env como os testes de Postgres já são
- [X] T090 [US1] Registrar em `services/fiscal-api/AGENTS.md` a data de validade do bundle de CA e a necessidade de revisão antes do vencimento (Constitution I) — CA expirada quebra emissão em produção sem mudança de código

### D4 — NFS-e Ilhéus/MetropolisWeb

Bloqueado por informação externa. **Não é defeito de código**: [ilheus-metropolis-nfse.provider.ts](../../services/fiscal-api/src/modules/providers/ilheus-metropolis/infrastructure/ilheus-metropolis-nfse.provider.ts) lança deliberadamente enquanto protocolo, autenticação e layout não forem confirmados pelo município. A guarda de município (`validateNfseMunicipality`) já está implementada e cobre o US2 cenário 2.

- [X] T091 [P] [US2] Mapear `IlheusMetropolisNotImplementedError` para **501 Not Implemented** em vez de 500 em `services/fiscal-api/src/shared/infra/http/` — "integração indisponível" não é falha inesperada e hoje polui alarme de erro
- [X] T092 [US2] ~~**BLOQUEADO**~~ **SUPERADA** por `specs/003-nfse-padrao-nacional/` — Ilhéus aderiu ao Padrão Nacional (Decreto Municipal nº 220/2026), então a transmissão municipal deixou de ser necessária: a NFS-e passa pelo Sistema Nacional (`SefinNacionalNfseProvider`). O bloqueio não foi resolvido, foi **removido pela mudança de escopo**. Texto original: — implementar a transmissão real só após confirmação formal do município sobre endpoint, protocolo (SOAP vs REST), autenticação e layout RPS (research.md §7); preencher `NFSE_ILHEUS_METROPOLIS_*` em `.env.example` no mesmo commit

### Validação e gates da Phase 8

- [X] T093 Reexecutar os 6 cenários de validação (3 NF-e + 3 NFS-e) e confirmar: NF-e chegando a `AUTHORIZED` com protocolo, `items` presentes no `GET`, retry de chave idempotente retransmitindo
- [X] T094 Rodar o gate `pnpm --filter @citybox/fiscal-api build && lint && typecheck && test` — `development-workflow.md`
- [X] T095 Revisão do `database-reviewer` sobre a mudança de persistência de T079 (Constitution V) — **coberta por T005 de `specs/003-nfse-padrao-nacional/`**, que revisou o schema completo incluindo as mudanças de T079

**Nota**: T093 só produz `AUTHORIZED` de verdade com um certificado A1 ICP-Brasil real. O `.pfx` autoassinado usado na validação de 2026-08-05 passa por upload, parse e assinatura, mas não sobrevive ao TLS mútuo da SEFAZ.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: depende da conclusão do Setup — **bloqueia** todas as user stories
- **User Stories (Phase 3–6)**: todas dependem da conclusão do Foundational
  - Podem prosseguir em paralelo (se houver equipe) ou sequencialmente em ordem de prioridade (P1 → P2 → P3 → P4)
- **Polish (Phase 7)**: depende da conclusão de todas as user stories desejadas

### User Story Dependencies

- **US1 (P1)**: pode começar após o Foundational — **sem** dependência de outra user story em nível de código. **Nota de teste**: os testes automatizados de US1 (T029–T033) semeiam um `Certificate` `VALID` diretamente no banco via o repositório de T020, em vez de passar pelo endpoint `POST /certificates` de US3 — isso preserva a independência real de US1 mesmo o Acceptance Scenario 1 do spec citando "um emitente com certificado digital válido" como pré-condição. A validação manual ponta a ponta descrita em `quickstart.md` (upload real do certificado antes de emitir) só fica possível depois que US3 também estiver implementada.
- **US2 (P2)**: pode começar após o Foundational — mesma nota de independência de teste que US1 (usa a mesma leitura de `Certificate` semeada diretamente)
- **US3 (P3)**: pode começar após o Foundational — sem dependência de US1/US2 em código; entrega o endpoint de upload que passa a alimentar de verdade os certificados usados por US1/US2 em uso manual/produção
- **US4 (P4)**: depende de US1 e/ou US2 já existirem em código (usa `NfeModule`/`NfseModule`, `SefazBaNfeProvider`/`IlheusMetropolisNfseProvider` e as rotas de emissão para ter o que cancelar/corrigir/inutilizar) — é a única user story com dependência real de outra, refletindo a própria narrativa do spec.md ("depende das User Stories 1 e 2 já existirem — não há o que cancelar/corrigir sem uma emissão prévia")

### Within Each User Story

- Testes escritos e devem **falhar** antes da implementação (RED)
- Domínio/validadores → casos de uso → rotas HTTP → provider → módulo conectado ao `app.module.ts`
- Story completa antes de avançar para a próxima prioridade

### Parallel Opportunities

- Todas as tarefas `[P]` do Setup podem rodar em paralelo
- Todas as tarefas `[P]` do Foundational podem rodar em paralelo (T009–T015, T019, T021, T025, T027–T028)
- Depois do Foundational completo, US1/US2/US3 podem começar em paralelo entre si (US4 aguarda US1/US2)
- Todos os testes `[P]` de uma mesma user story podem rodar em paralelo
- `T068` (estender provider SEFAZ-BA) e `T069` (estender provider Ilhéus) em Phase 6 são arquivos diferentes — paralelos entre si

---

## Parallel Example: User Story 1

```bash
# Testes de US1 em paralelo (escrever e confirmar RED antes de implementar):
Task: "Teste de contrato: POST /api/v1/nfe válido retorna 201 AUTHORIZED em services/fiscal-api/src/modules/nfe/tests/issue-nfe-success.contract.spec.ts"
Task: "Teste de contrato: POST /api/v1/nfe com item inválido retorna 422 em services/fiscal-api/src/modules/nfe/tests/issue-nfe-validation.contract.spec.ts"
Task: "Teste de contrato: GET /api/v1/nfe/{id} em services/fiscal-api/src/modules/nfe/tests/consult-nfe.contract.spec.ts"
Task: "Teste de integração: idempotência de NF-e em services/fiscal-api/tests/integration/nfe-idempotency.integration.spec.ts"
Task: "Teste de integração: download de XML autorizado em services/fiscal-api/tests/integration/nfe-xml-download.integration.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 apenas)

1. Completar Phase 1 (Setup) e Phase 2 (Foundational — bloqueia tudo)
2. Completar Phase 3 (US1 — emitir NF-e)
3. **PARAR e VALIDAR**: rodar os testes de US1 (T029–T033) e confirmar que passam de forma independente
4. Ambiente de homologação já emite e consulta NF-e ponta a ponta usando um certificado semeado diretamente no banco

### Incremental Delivery

1. Setup + Foundational → fundação pronta
2. + US1 → testar independentemente → MVP (emissão de NF-e via API, com certificado de teste)
3. + US2 → testar independentemente → NFS-e Ilhéus/BA disponível
4. + US3 → testar independentemente → upload real de certificado passa a alimentar US1/US2 sem seed manual
5. + US4 → testar independentemente → ciclo de vida completo (cancelar/corrigir/inutilizar)
6. Cada incremento agrega valor sem quebrar as user stories anteriores

### Parallel Team Strategy

Com mais de um desenvolvedor, após o Foundational: Dev A em US1, Dev B em US2, Dev C em US3 — todas paralelas entre si. US4 só começa quando ao menos US1 ou US2 estiver concluída.

---

## Notes

- `[P]` = arquivos diferentes, sem dependência de tarefa incompleta
- `[Story]` mapeia cada tarefa à sua user story para rastreabilidade
- Cada user story deve ser completável e testável de forma independente (exceto US4, cuja dependência de US1/US2 é intrínseca ao domínio — ciclo de vida pós-emissão não existe sem uma emissão prévia)
- Confirmar que os testes falham antes de implementar (RED do TDD)
- Seguir a estratégia de desenvolvimento pedida no briefing original: uma tarefa pequena por vez, revisar a implementação, rodar os testes, validar os critérios de aceite, só então avançar para a próxima — nunca implementar várias tarefas de uma vez
- Evitar: tarefas vagas, conflito no mesmo arquivo marcado `[P]`, dependências entre stories que quebrem a independência (única exceção documentada: US4 → US1/US2)
