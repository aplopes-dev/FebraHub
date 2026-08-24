---

description: "Task list for NFS-e pelo padrão nacional (+ pendências de NF-e)"
---

# Tasks: Emissão de NFS-e pelo Padrão Nacional (+ pendências de NF-e)

**Input**: Design documents from `/specs/003-nfse-padrao-nacional/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: incluídos e **obrigatórios**. `CLAUDE.md` e `common/testing.md` mandatam TDD (RED → GREEN → REFACTOR) e cobertura mínima de 80% em todo o workspace, o que sobrepõe o padrão "tests are optional" do template. Toda fase de user story escreve o teste primeiro (deve falhar) e só então implementa.

**Organization**: agrupadas por user story (US1–US4 do spec.md, em ordem P1→P4), mais uma fase dedicada às pendências de NF-e incluídas no escopo por decisão do usuário.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: a qual user story a tarefa pertence
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Serviço backend único, sem frontend. Todos os caminhos relativos a `services/fiscal-api/` salvo indicação contrária. Estrutura em [plan.md § Project Structure](./plan.md#project-structure).

---

## Phase 1: Setup

**Purpose**: resolver as questões abertas de research.md que decidem forma de implementação, e trazer o material oficial para dentro do serviço. As duas primeiras tarefas são baratas e evitam retrabalho caro — errar a compactação significa rejeição em 100% dos envios.

- [X] T001 Resolver a questão aberta #1 de [research.md](./research.md) (algoritmo de compactação da área de dados: gzip ou deflate) consultando o Swagger de produção restrita em `https://adn.producaorestrita.nfse.gov.br/contribuintes/docs/index.html`; registrar a resposta em `specs/003-nfse-padrao-nacional/research.md` §3
- [X] T002 Resolver a questão aberta #2 de [research.md](./research.md) (perfil de assinatura aceito) lendo `specs/002-fiscal-api/contracts/NFSe/1.01/xmldsig-core-schema.xsd` e verificando se os atributos `fixed=` impõem SHA-1 como no XSD da SEFAZ ou permitem SHA-256; registrar em `research.md` §8
- [X] T003 [P] Copiar os XSD oficiais v1.01 de `specs/002-fiscal-api/contracts/NFSe/1.01/` para `services/fiscal-api/resources/xsd/nfse/1.01/` e criar o resolvedor de caminho `services/fiscal-api/src/modules/nfse/infrastructure/xml/nfse-xsd-path.ts` no mesmo padrão de `nfe-xsd-path.ts` (env com default via `process.cwd()`)
- [X] T004 [P] Declarar em `services/fiscal-api/.env.example` as variáveis do ambiente nacional (endpoint de recepção, endpoint do ADN, ambiente, caminho do XSD) com comentário de origem, seguindo o padrão das variáveis da SEFAZ

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: infraestrutura compartilhada por todas as user stories. **Bloqueia** as fases 3 a 6.

⚠️ **T005 precede T006** por exigência da Constituição V: schema Prisma só muda após revisão do `database-reviewer`.

- [X] T005 Executar o gate `database-reviewer` sobre a migration proposta em [data-model.md § Resumo da migration](./data-model.md), cobrindo também a mudança de persistência de itens pendente da entrega anterior (T095 de `specs/002-fiscal-api/tasks.md`)
- [X] T006 Aplicar a migration via `pnpm --filter @citybox/fiscal-api db:migrate:dev` em `services/fiscal-api/prisma/schema.prisma`: campos novos em `FiscalDocument` (`dpsObjectKey`, `municipalIncidenceCode`), em `FiscalEvent` (`nationalEventCode`, `generatorEnvironment`, `replacedByDocumentId`) e em `Company` (`nationalNfseEnabled`); novos valores em `FiscalEventType` e `ProviderType`; tabela `MunicipalParameters` com `citybox_uuid_v7()` como default
- [X] T007 Antes de remover `ILHEUS_METROPOLIS_NFSE` do enum `ProviderType`, rodar `SELECT provider, count(*) FROM fiscal.fiscal_documents GROUP BY provider;` em cada ambiente; se houver linhas com esse valor, manter o valor no enum e apenas parar de usá-lo (ver nota em [data-model.md](./data-model.md))
- [X] T008 Escrever o teste do cliente HTTP com mTLS em `services/fiscal-api/src/shared/infra/fiscal-http/tests/` — deve falhar (RED)
- [X] T009 Implementar `services/fiscal-api/src/shared/infra/fiscal-http/sefin-http-client.ts` **espelhando `postSoapEnvelope` de `sefaz-soap-client.ts`** (`https.request` com `key`/`cert`/`ca`, `rejectUnauthorized: true`), que já está provado contra órgão fiscal real. Diferenças: corpo JSON em vez de XML, e `Accept: application/json`. Reaproveitar `loadSefazCaBundle`, `loadCertificateKeyMaterial` e `withRetry`
- [X] T010 [P] Implementar `dpsXmlGZipB64` (**GZip + base64**, confirmado no schema `NFSePostRequest` do OpenAPI oficial — ver [research.md §3](./research.md)) em `services/fiscal-api/src/shared/infra/fiscal-http/payload-encoding.ts`, usando `zlib.gzipSync`, com teste de ida e volta
- [X] T011 [P] Extrair do Anexo I (`contracts/ANEXO_I-SEFIN_ADN-DPS_NFSe-SNNFSe-v1.01-20260209.xlsx`, colunas `CÓD. ERRO` e `MSG. ERRO`) o mapa de códigos oficiais para mensagens acionáveis em `services/fiscal-api/src/modules/nfse/domain/national-error-codes.ts` — decisão de [research.md §4](./research.md)
- [X] T012 Criar a entidade `MunicipalParameters` (domain + repositório abstrato + implementação Prisma) em `services/fiscal-api/src/modules/nfse/`, com leitura tipada do payload Json e invalidação diária conforme [research.md §5](./research.md)
- [X] T013 Criar `SefinNacionalNfseProvider` em `services/fiscal-api/src/modules/providers/sefin-nacional/`, registrado no `FiscalProviderFactory` via `onModuleInit`. Endpoints confirmados no OpenAPI oficial: `POST /nfse` (emissão síncrona), `GET /nfse/{chaveAcesso}`, `GET /nfse/{chaveAcesso}/eventos`, `GET /dps/{id}` — ver [research.md §3](./research.md)
- [X] T014 Remover `services/fiscal-api/src/modules/providers/ilheus-metropolis/` (provider, módulo e erros) e suas referências em `app.module.ts` e nos casos de uso — decisão de [research.md §7](./research.md); a abstração `FiscalProvider`/`FiscalProviderFactory` permanece

**Checkpoint**: com a Phase 2 concluída, o serviço sobe, fala com o ambiente nacional por mTLS e tem o mapa de erros — mas ainda não emite.

---

## Phase 3: User Story 1 — Emitir NFS-e de um serviço prestado (Priority: P1) 🎯 MVP

> ### ⚠️ Correção de escopo — 2026-08-06
>
> Este plano foi escrito assumindo que o módulo `nfse` precisaria ser reescrito. **Estava errado.**
> Inventário do código em 2026-08-06 mostrou que a entrega anterior **já construiu a camada de DPS
> contra o padrão nacional**:
>
> | Já existe | Arquivo |
> |---|---|
> | Identificador da DPS (45 chars, IBGE+tipo+inscrição+série+número) | `infrastructure/xml/dps-id.ts` |
> | Builder do XML da DPS | `infrastructure/xml/dps-xml.builder.ts` |
> | Validação contra o XSD oficial `DPS_v1.01.xsd` | `infrastructure/xml/nfse-xsd-path.ts` |
> | Caso de uso de emissão (numeração, assinatura, storage) | `application/use-cases/issue-nfse/` |
> | Caso de uso de cancelamento | `application/use-cases/cancel-nfse/` |
> | Rotas HTTP (emitir, cancelar, consultar, XML) | `infrastructure/http/routes/` |
> | Validador de município e erros de domínio | `domain/` |
>
> A assinatura já usa o perfil `MODERN`, coerente com o que T002 confirmou.
>
> **O que realmente falta** é a camada de transmissão: hoje o caso de uso chama
> `providerFactory.getProvider('ILHEUS_METROPOLIS_NFSE')`, que é um stub. As tarefas T015–T018 e
> T022 abaixo estão **superadas** — o trabalho remanescente é T019 (parcialmente feito), T020,
> T021 e T023.
>
> **Bloqueio removido em 2026-08-06**: com os certificados A1 reais, o OpenAPI do SEFIN Nacional
> tornou-se legível (era ele que exigia certificado de cliente). Contrato do `POST /nfse`,
> algoritmo de compactação e endpoints agora são **fato verificado** — ver
> [research.md §3](./research.md). O provider é implementável.

**Goal**: emitir uma nota de serviço ponta a ponta — montar a DPS, assinar, transmitir e devolver a nota gerada com sua chave de acesso.

**Independent Test**: enviar uma solicitação de emissão para um prestador com certificado válido e verificar que a resposta traz a nota autorizada com chave de acesso, sem nenhuma interação manual com o portal nacional (Cenário 1 de [quickstart.md](./quickstart.md)).

- [~] T015 (SUPERADA — já existe) [P] [US1] Escrever teste de montagem da DPS que valida o XML resultante contra o XSD oficial v1.01 em `services/fiscal-api/src/modules/nfse/infrastructure/xml/tests/` — deve falhar (RED)
- [~] T016 (SUPERADA — já existe) [P] [US1] Escrever testes do caso de uso de emissão (sucesso, rejeição do ambiente nacional, validação pré-transmissão, idempotência, retomada) em `services/fiscal-api/src/modules/nfse/application/use-cases/issue-nfse/issue-nfse.use-case.spec.ts` — devem falhar (RED)
- [~] T017 (SUPERADA — já existe) [US1] Implementar o builder da DPS em `services/fiscal-api/src/modules/nfse/infrastructure/xml/dps-xml.builder.ts`, montando o identificador conforme o leiaute (IBGE 7 + tipo de inscrição 1 + inscrição federal 14 + série 5 + número 15)
- [~] T018 (SUPERADA — já existe) [US1] Implementar os validadores de domínio da DPS em `services/fiscal-api/src/modules/nfse/domain/validators/`, cobrindo **apenas** completude e consistência que evitam consumo indevido de numeração — não replicar as 655 regras do Anexo I ([research.md §4](./research.md))
- [X] T019 [US1] Implementar `IssueNfseUseCase` em `services/fiscal-api/src/modules/nfse/application/use-cases/issue-nfse/issue-nfse.use-case.ts`: idempotência com classificação terminal/não-terminal, reserva de numeração da DPS via `FiscalSequence`, montagem, assinatura, validação XSD, persistência em `SIGNED` e gravação do XML da DPS em `{companyId}/nfse/dps/{documentId}.xml` **antes** de transmitir
- [X] T020 [US1] Implementar em `SefinNacionalNfseProvider` a operação de recepção da DPS e o parse da resposta, mapeando rejeições para os códigos oficiais via o mapa de T011
- [X] T021 [US1] Implementar a guarda de município não aderente (FR-020) usando `Company.nationalNfseEnabled`, recusando **antes** de qualquer transmissão
- [~] T022 (SUPERADA — já existe) [US1] Implementar a rota `POST /api/v1/nfse` em `services/fiscal-api/src/modules/nfse/infrastructure/http/routes/issue-nfse/`, conforme [contracts/nfse-api.md](./contracts/nfse-api.md)
- [X] T023 [US1] Implementar a consulta `GET /dps/{id}` no provider e usá-la antes de retomar transmissão de documento sem desfecho conhecido, para não emitir duplicado quando a resposta anterior se perdeu (edge case do spec)

**Checkpoint**: MVP entregue — a plataforma emite NFS-e pelo padrão nacional.

---

## Phase 4: User Story 2 — Cancelar uma NFS-e emitida (Priority: P2)

**Goal**: cancelar uma nota dentro do prazo, ou encaminhar para análise fiscal quando fora dele, sem o operador precisar saber a diferença.

**Independent Test**: emitir uma nota, solicitar o cancelamento com justificativa, e verificar que o documento consta cancelado na plataforma e na consulta ao ambiente nacional (Cenário 3 de [quickstart.md](./quickstart.md)).

- [X] T024 [P] [US2] Escrever testes do caso de uso de cancelamento (direto, encaminhado a análise fiscal, recusado por estado incompatível) em `services/fiscal-api/src/modules/nfse/application/use-cases/cancel-nfse/cancel-nfse.use-case.spec.ts` — devem falhar (RED)
- [X] T025 [US2] Implementar a montagem do pedido de registro de evento em `services/fiscal-api/src/modules/nfse/infrastructure/xml/evento-xml.builder.ts`, cobrindo cancelamento (`e101101`) e solicitação de análise fiscal (`e101103`), validando contra `pedRegEvento_v1.01.xsd`
- [X] T026 [US2] Implementar `CancelNfseUseCase` em `services/fiscal-api/src/modules/nfse/application/use-cases/cancel-nfse/cancel-nfse.use-case.ts`, decidindo entre cancelamento direto e análise fiscal a partir da parametrização municipal de T012 — sem prazo hardcoded
- [X] T027 [US2] Implementar a transmissão de eventos em `SefinNacionalNfseProvider` e a persistência do `FiscalEvent` com `nationalEventCode` e `generatorEnvironment`
- [X] T028 [US2] Implementar a rota `POST /api/v1/nfse/{id}/cancel` em `services/fiscal-api/src/modules/nfse/infrastructure/http/routes/cancel-nfse/`, devolvendo `path: "DIRECT" | "FISCAL_ANALYSIS"` conforme [contracts/nfse-api.md](./contracts/nfse-api.md)

---

## Phase 5: User Story 3 — Substituir uma NFS-e com erro (Priority: P3)

**Goal**: reemitir uma nota corrigida preservando o vínculo com a original.

**Independent Test**: emitir uma nota, solicitar a substituição com dados corrigidos, e verificar que a original consta cancelada por substituição e a nova referencia a anterior (Cenário 4 de [quickstart.md](./quickstart.md)).

- [X] T029 [P] [US3] Escrever testes do caso de uso de substituição, incluindo as recusas (fora do prazo parametrizado, sem identificação do tomador quando exigida, com análise fiscal pendente, com bloqueio de ofício vigente) em `services/fiscal-api/src/modules/nfse/application/use-cases/substitute-nfse/substitute-nfse.use-case.spec.ts` — devem falhar (RED)
- [X] T030 [US3] Estender `evento-xml.builder.ts` com o evento de cancelamento por substituição (`e105102`)
- [X] T031 [US3] Implementar `SubstituteNfseUseCase` em `services/fiscal-api/src/modules/nfse/application/use-cases/substitute-nfse/substitute-nfse.use-case.ts`, reaproveitando `IssueNfseUseCase` para a nota nova e gravando `replacedByDocumentId` no evento da original
- [X] T032 [US3] Implementar a rota `POST /api/v1/nfse/{id}/substitute` em `services/fiscal-api/src/modules/nfse/infrastructure/http/routes/substitute-nfse/`

---

## Phase 6: User Story 4 — Consultar notas e seus eventos (Priority: P4)

**Goal**: recuperar a nota, seu documento fiscal e a linha do tempo completa — incluindo eventos gerados pelo município.

**Independent Test**: após uma emissão e um cancelamento, consultar a nota e verificar que documento e histórico voltam corretos (Cenário 5 de [quickstart.md](./quickstart.md)).

- [X] T033 [P] [US4] Escrever testes dos casos de uso de consulta (nota, XML, eventos) em `services/fiscal-api/src/modules/nfse/application/use-cases/` — devem falhar (RED)
- [X] T034 [P] [US4] Implementar `GetNfseUseCase` e `GetNfseXmlUseCase` em `services/fiscal-api/src/modules/nfse/application/use-cases/`
- [X] T035 [US4] Implementar a sincronização de eventos vindos do ambiente nacional (`GET /NFSe/{ChaveAcesso}/Eventos`) em `SefinNacionalNfseProvider`, persistindo os eventos de ofício do município que nunca emitimos — [research.md §9](./research.md)
- [X] T036 [US4] Implementar `ListNfseEventsUseCase` em `services/fiscal-api/src/modules/nfse/application/use-cases/list-nfse-events/`, devolvendo a linha do tempo em ordem cronológica
- [X] T037 [US4] Implementar as rotas `GET /api/v1/nfse/{id}`, `GET /api/v1/nfse/{id}/xml` e `GET /api/v1/nfse/{id}/events` em `services/fiscal-api/src/modules/nfse/infrastructure/http/routes/`

---

## Phase 7: Pendências de NF-e

**Purpose**: fechar o que ficou aberto na validação de 2026-08-05, conforme escopo definido pelo usuário. Independente das fases 3 a 6 — pode correr em paralelo a elas.

- [X] T038 [P] Escrever teste que prova que `ProviderRequest` persiste `requestPayload`/`responsePayload` em `services/fiscal-api/tests/integration/` — deve falhar (RED); hoje o repositório descarta os dois ([research.md §10.1](./research.md))
- [X] T039 Incluir `requestPayload` e `responsePayload` no `create` de `services/fiscal-api/src/modules/fiscal-documents/infrastructure/database/prisma-provider-request.repository.ts`, usando o mesmo cast de Json já aplicado em `prisma-fiscal-document.repository.ts`
- [X] T040 [P] Marcar como concluídas em `specs/002-fiscal-api/tasks.md` as tarefas T092 (NFS-e Ilhéus — agora superada por esta feature, não mais bloqueada) e T095 (revisão de banco, coberta por T005), com nota apontando para `specs/003-nfse-padrao-nacional/`

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T041 [P] Registrar em `services/fiscal-api/AGENTS.md` a versão de leiaute adotada e sua vigência, no mesmo formato da tabela de validade da cadeia ICP-Brasil — leiaute vencido derruba emissão em produção sem mudança de código ([research.md §6](./research.md))
- [X] T042 Adicionar teste que falha quando a versão de leiaute declarada no código divergir da suportada pelos XSD versionados, em `services/fiscal-api/src/modules/nfse/infrastructure/xml/tests/`
- [X] T043 [P] Atualizar `services/fiscal-api/AGENTS.md` com o inventário do módulo `nfse` reescrito, as variáveis de ambiente novas, a remoção do provider municipal e a nova semântica de eventos (Constituição I)
- [X] T044 Rodar a validação completa de [quickstart.md](./quickstart.md) — cenários 1 a 5 exigem A1 ICP-Brasil real; cenário 6 e a verificação de resiliência rodam sem ele
- [X] T045 Verificar cobertura ≥80% (`pnpm --filter @citybox/fiscal-api test:cov`)
- [X] T046 Rodar o gate `pnpm --filter @citybox/fiscal-api build && lint && typecheck && test`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências. T001 e T002 devem terminar antes de T009/T010 e T017, respectivamente — são elas que decidem a forma da implementação.
- **Foundational (Phase 2)**: depende do Setup. **Bloqueia** as fases 3 a 6. T005 (revisão de banco) precede obrigatoriamente T006 (migration) por exigência da Constituição V.
- **User Stories (Phases 3–6)**: todas dependem do Foundational.
- **Pendências de NF-e (Phase 7)**: independente das fases 3 a 6 — só depende do Foundational por causa da revisão de banco.
- **Polish (Phase 8)**: depende das fases desejadas estarem concluídas.

### User Story Dependencies

- **US1 (P1)**: sem dependência de outra story. É o MVP.
- **US2 (P2)**: depende de US1 **em domínio** — não há o que cancelar sem emissão. Em código, depende do builder de evento (T025), que é próprio da fase.
- **US3 (P3)**: depende de US1 (reaproveita a emissão) e do builder de evento de US2 (T025). É a única com dependência de código em outra story, refletindo a natureza da substituição: cancelar por substituição + emitir.
- **US4 (P4)**: depende de US1 para ter o que consultar. As consultas de nota e XML (T034) são independentes; a sincronização de eventos (T035) só faz sentido após US2/US3 gerarem eventos.

### Parallel Opportunities

- **Phase 1**: T003 e T004 em paralelo (arquivos distintos). T001 e T002 são consultas independentes.
- **Phase 2**: T010 e T011 em paralelo após T009. T012, T013 tocam módulos distintos.
- **Phase 3**: T015 e T016 em paralelo (arquivos de teste distintos).
- **Phase 7**: roda inteira em paralelo com as fases 3 a 6 — arquivos completamente distintos.
- **Phase 8**: T041 e T043 tocam o mesmo arquivo (`AGENTS.md`) — **não** paralelizar entre si; T041 é `[P]` em relação a T042.

---

## Implementation Strategy

### MVP First (User Story 1 apenas)

1. Completar Phase 1 (Setup) e Phase 2 (Foundational — bloqueia tudo)
2. Completar Phase 3 (US1 — emitir)
3. **PARAR e VALIDAR**: rodar o Cenário 1 e o Cenário 6 de [quickstart.md](./quickstart.md)
4. Nesse ponto a plataforma emite NFS-e pelo padrão nacional — valor entregue

### Incremental Delivery

1. Setup + Foundational → fundação pronta
2. + US1 → emissão funcionando → **MVP**
3. + US2 → cancelamento disponível
4. + US3 → substituição disponível
5. + US4 → consulta e auditoria completas
6. Phase 7 pode entrar em qualquer ponto após o Foundational — não bloqueia nem é bloqueada

### Nota sobre validação

Os cenários 1 a 5 do quickstart exigem **certificado A1 ICP-Brasil real**. Um `.pfx` autoassinado atravessa upload, parse, assinatura e validação XSD, mas é rejeitado pelo ambiente nacional (regra `E1208`). O Cenário 6 existe justamente para separar o que é validável sem esse material — e é bastante: montagem, assinatura, XSD, numeração, idempotência e retomada.

---

## Notes

- `[P]` = arquivos diferentes, sem dependência de tarefa incompleta
- Confirmar que os testes falham antes de implementar (RED do TDD)
- Uma tarefa pequena por vez: implementar, revisar, rodar os testes, validar os critérios de aceite, só então avançar — nunca várias de uma vez
- Nenhum commit sem autorização explícita do usuário (Constituição, Development Workflow)
- Evitar: tarefas vagas, conflito no mesmo arquivo marcado `[P]`, dependências entre stories que quebrem a independência (exceção documentada: US3 → US1/US2)
