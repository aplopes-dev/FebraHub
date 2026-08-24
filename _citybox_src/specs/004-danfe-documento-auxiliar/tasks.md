---
description: "Task list — DANFE / DANFSE (documento auxiliar impresso)"
---

# Tasks: Documento auxiliar impresso da nota fiscal (DANFE / DANFSE)

**Input**: `/specs/004-danfe-documento-auxiliar/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Testes**: **obrigatórios**. Não por pedido da spec, mas por governança — a Constituição
manda TDD com RED antes de GREEN e cobertura ≥80%. Toda tarefa que começa com "Escrever teste" deve **falhar** antes da tarefa de
implementação seguinte.

**Base**: todos os caminhos são relativos a `services/fiscal-api/`.

## Formato: `[ID] [P?] [Story] Descrição`

- **[P]**: paralelizável (arquivo distinto, sem dependência pendente)
- **[Story]**: US1 / US2 / US3 conforme [spec.md](./spec.md)

---

## Por que a ordem dos capítulos não segue a prioridade

A prioridade das histórias é **US1 (P1) → US2 (P2) → US3 (P3)**. A ordem de execução aqui é
**US1 → US3 → US2**. Não é engano:

**US3 (reimpressão) não tem código de produção.** O design não persiste nada e deriva tudo
do XML autorizado ([data-model.md](./data-model.md)) — o que significa que reimprimir já é
"chamar o endpoint de novo". US3 vira **verificação** de uma propriedade que o design de
US1 já entrega, e cai naturalmente junto com ela.

**US2 (DANFSE) é a Fase 2 de entrega**, decidida em Clarifications: sem o DANFE a mercadoria
não circula, então ele vem primeiro.

Se US3 exigisse código novo, o design estaria errado — a tarefa T027 existe justamente para
provar que não exige.

---

## Phase 1: Setup

**Objetivo**: dependências e esqueleto do módulo.

- [X] T001 Adicionar dependências de renderização em `package.json` via `pnpm --filter @citybox/fiscal-api add @alexssmusica/node-pdf-nfe pdf-lib` (ver [research.md](./research.md) R2 e R4 — **não** usar npm/yarn; Princípio III)
- [X] T002 Conferir em `package.json` que nenhuma dependência nova traz binário nativo, rodando `pnpm --filter @citybox/fiscal-api install` em container limpo e verificando ausência de `node-gyp` no log
- [X] T003 [P] Criar a estrutura do módulo em `src/modules/auxiliary-documents/` com as pastas `domain/errors/`, `application/use-cases/get-auxiliary-document/`, `infrastructure/pdf/`
- [X] T004 [P] ~~Declarar tipagem local~~ → a lib **expõe tipos** (`lib/index.d.ts`), mas eles referenciam o namespace global `PDFKit`. Resolvido instalando `@types/pdfkit` como devDependency em `package.json` — nenhum `@ts-ignore`

---

## Phase 2: Foundational (bloqueia todas as histórias)

**Objetivo**: portas, erros e o caminho compartilhado que US1 e US2 usam igual.

**⚠️ Nenhuma história pode começar antes desta fase fechar.**

### Domínio

- [X] T005 [P] Definir `AuxiliaryDocument` e `DocumentOrigin` em `src/modules/auxiliary-documents/domain/auxiliary-document.types.ts` conforme [data-model.md](./data-model.md)
- [X] T006 [P] Definir a porta `AuxiliaryDocumentRenderer` (classe abstrata, token de DI) em `src/modules/auxiliary-documents/domain/renderer.interface.ts`, recebendo `RenderInput { authorizedXml, isCancelled, substitutedBy? }` — **recebe XML, nunca entidade**
- [X] T007 [P] Definir a porta `WatermarkStamper` (`stamp(pdf: Buffer, text: string): Promise<Buffer>`) em `src/modules/auxiliary-documents/domain/watermark.interface.ts`
- [X] T008 [P] Criar `DocumentNotPrintableError` em `src/modules/auxiliary-documents/domain/errors/document-not-printable.error.ts`, estendendo `ValidatorDomainError` (→ 422) e carregando `currentStatus` no `details`
- [X] T009 [P] Criar `AuthorizedXmlUnavailableError` em `src/modules/auxiliary-documents/domain/errors/authorized-xml-unavailable.error.ts`, estendendo `InfrastructureError` — **o nome precisa conter `Unavailable`**, porque `app-exception.filter.ts` resolve o status por substring do nome (→ 503)

### Regra de imprimibilidade

- [X] T010 Escrever teste em `src/modules/auxiliary-documents/domain/rules/printability.spec.ts` cobrindo **todos** os 17 valores de `FiscalDocumentStatus` conforme a tabela de [data-model.md](./data-model.md) — deve falhar (RED)
- [X] T011 Implementar `isPrintable(status)` em `src/modules/auxiliary-documents/domain/rules/printability.ts` até T010 passar (GREEN)

### Estampagem da marca d'água

- [X] T012 Escrever teste em `src/modules/auxiliary-documents/infrastructure/pdf/pdf-lib-watermark.stamper.spec.ts` verificando que um PDF **multipágina** recebe a marca em **todas** as páginas e que o texto original continua extraível — deve falhar (RED)
- [X] T013 Implementar `PdfLibWatermarkStamper` em `src/modules/auxiliary-documents/infrastructure/pdf/pdf-lib-watermark.stamper.ts` com texto diagonal cinza de baixa opacidade (FR-005 / FR-005a) até T012 passar
- [X] T014 Adicionar a T012 um caso que estampa um PDF **não produzido por nós** (fixture externo), provando que a estampagem é independente da fonte — é o que garante FR-005 quando o PDF vier da API oficial na Fase 2 (R4)

### Use case compartilhado

- [X] T015 Escrever teste em `src/modules/auxiliary-documents/application/use-cases/get-auxiliary-document/get-auxiliary-document.use-case.spec.ts` com `InMemoryFiscalDocumentRepository`, `InMemoryObjectStorage` e renderizador falso, cobrindo: nota autorizada devolve PDF; estado não imprimível → 422 com status atual; `companyId` divergente → `FiscalDocumentNotFoundError`; `xmlObjectKey` nulo → `AuthorizedXmlUnavailableError`; homologação estampa e produção não — deve falhar (RED)
- [X] T016 Implementar `GetAuxiliaryDocumentUseCase` em `src/modules/auxiliary-documents/application/use-cases/get-auxiliary-document/get-auxiliary-document.use-case.ts` até T015 passar (GREEN)
- [X] T017 Adicionar a T015 o caso do storage **lançando** (não só devolvendo vazio) e confirmar que o erro **não** vira PDF montado do banco (FR-010)
- [X] T018 Criar `src/modules/auxiliary-documents/auxiliary-documents.module.ts` registrando as portas, o `WatermarkStamper` e o use case, e exportando-os para `NfeModule` e `NfseModule`

**Checkpoint**: portas, erros, regra de estado e estampagem prontos e testados. US1 pode começar.

---

## Phase 3: US1 — Entregar o comprovante ao cliente na venda (P1) 🎯 MVP

**Objetivo**: `GET /v1/nfe/{id}/danfe` devolvendo o DANFE de uma NF-e autorizada.

**Teste independente**: emitir uma NF-e, pedir o documento e verificar que o arquivo abre,
é legível e traz a chave de acesso — Cenário 1 do [quickstart.md](./quickstart.md).

- [X] T019 [US1] Escrever teste em `src/modules/auxiliary-documents/infrastructure/pdf/danfe.renderer.spec.ts` com um XML de NF-e autorizada real como fixture, verificando que o PDF gerado contém a **chave de acesso** e o **protocolo** (extraindo texto, não conferindo bytes) — deve falhar (RED)
- [X] T020 [US1] ~~Salvar `.xml` estático~~ → fixture **gerada pelo `buildNfeXml` de produção** e envolvida em `nfeProc`, em `src/modules/auxiliary-documents/tests/fixtures/authorized-nfe-xml.ts`. Um arquivo estático congelaria no formato do dia em que foi salvo e passaria enquanto a produção emitiria outra coisa; e um XML real carrega dados de pessoas
- [X] T021 [US1] Implementar `DanfeRenderer` em `src/modules/auxiliary-documents/infrastructure/pdf/danfe.renderer.ts`, adaptando `gerarPDF(xml, { cancelada })` da lib para a porta `AuxiliaryDocumentRenderer` e convertendo o stream PDFKit em `Buffer`, até T019 passar (GREEN)
- [X] T022 [US1] Criar `GetDanfeRoute` em `src/modules/nfe/infrastructure/http/routes/get-danfe/get-danfe.route.ts` — `GET :id/danfe`, `@ApiTags('nfe')`, `Content-Type: application/pdf`, headers `Content-Disposition`, `X-Document-Origin` e `X-Fiscal-Validity` conforme [contracts/](./contracts/auxiliary-documents.openapi.yaml)
- [X] T023 [US1] Ligar a rota ao `companyId` do header `X-Company-Id` usando o decorator `@CompanyId()` já existente em `src/shared/infra/http/decorators/company-id.decorator.ts` — **atualizar o comentário do decorator**, que hoje afirma que ele não é usado por design (ver [research.md](./research.md) R7)
- [X] T024 [US1] Registrar `GetDanfeRoute` em `controllers` e importar `AuxiliaryDocumentsModule` em `src/modules/nfe/nfe.module.ts`
- [X] T025 [US1] Escrever teste em `tests/integration/get-danfe.integration.spec.ts` contra Postgres real: nota autorizada → 200 com PDF cujo **texto extraído** contém a chave; nota rejeitada → 422; `X-Company-Id` de outro emitente → **404** (não 403). Asserção de status sozinha **não conta** — abrir o PDF é obrigatório
- [X] T026 [US1] Conferência visual da marca d'água — **aprovada pelo usuário em 2026-08-08**

**Checkpoint**: US1 entregue e verificável de ponta a ponta. **Este é o MVP.**

---

## Phase 4: US3 — Reimprimir uma nota antiga (P3)

**Objetivo**: provar que a reimpressão é estável e não contamina com cadastro atual.

**Sem código de produção esperado.** Se alguma tarefa aqui exigir implementação, o design de
US1 tem um defeito — investigar antes de codar.

**Teste independente**: gerar duas vezes e comparar o conteúdo textual — Cenário 5 do
[quickstart.md](./quickstart.md).

- [X] T027 [US3] Adicionar a `tests/integration/get-danfe.integration.spec.ts` um caso que gera o documento **duas vezes** e compara o **texto extraído** (não os bytes — PDF carrega `CreationDate` e nunca bate byte a byte; ver [research.md](./research.md) R6)
- [X] T028 [US3] Adicionar caso que **altera o cadastro do emitente** entre as duas gerações e confirma que o documento segue mostrando os dados vigentes na emissão (FR-008) — é o teste que falha se alguém fizer o renderizador ler `companies`
- [X] T029 [US3] Caso de nota `CANCEL_AUTHORIZED` verificando que o documento é **entregue marcado como cancelado**, não recusado (FR-006) — coberto em `tests/integration/get-danfe.integration.spec.ts`

**Checkpoint**: Fase 1 de entrega completa — DANFE e reimpressão. Passível de release.

---

## Phase 5: US2 — Enviar o comprovante do serviço ao tomador (P2)

**Objetivo**: `GET /v1/nfse/{id}/danfse` com leiaute do Padrão Nacional.

**Teste independente**: emitir uma NFS-e, pedir o documento e verificar que traz a chave de
acesso e o código de verificação — Cenário 8 do [quickstart.md](./quickstart.md).

- [X] T030 [US2] Adicionar `pdfkit`, `bwip-js` e `qrcode` como dependências diretas em `package.json` (hoje só transitivas — dependência transitiva não é contrato; R5)
- [X] T031 [US2] Escrever teste em `src/modules/auxiliary-documents/infrastructure/pdf/danfse.renderer.spec.ts` com fixture de XML de NFS-e autorizada, verificando chave de acesso, prestador, tomador, valores e ISS — deve falhar (RED)
- [X] T032 [US2] ~~Salvar `.xml` estático~~ → fixture **gerada pelo `buildDpsXml` de produção** e envolvida no `NFSe`/`infNFSe` que o Sefin devolve, em `src/modules/auxiliary-documents/tests/fixtures/authorized-nfse-xml.ts` — mesma razão da fixture de NF-e (T020)
- [X] T033 [US2] Implementar `DanfseRenderer` em `src/modules/auxiliary-documents/infrastructure/pdf/danfse.renderer.ts` com pdfkit, seguindo o leiaute do Padrão Nacional — **visivelmente distinto do DANFE**, sem quadro de itens de mercadoria
- [X] T034 [P] [US2] Implementar o código de barras CODE-128C da chave com `bwip-js` e o QR Code com `qrcode`, em `src/modules/auxiliary-documents/infrastructure/pdf/barcode.ts` (FR-004)
- [X] T035 [US2] Estender `DanfseRenderer` para indicar substituição e identificar a nota substituta quando `substitutedBy` vier preenchido (FR-006)
- [X] T036 [US2] Escrever teste em `src/modules/auxiliary-documents/infrastructure/sefin/official-danfse.client.spec.ts` verificando que resposta `501` — e qualquer falha ou timeout — resulta em **fallback silencioso**, nunca em erro propagado (R9) — deve falhar (RED)
- [X] T037 [US2] Implementar `OfficialDanfseClient` em `src/modules/auxiliary-documents/infrastructure/sefin/official-danfse.client.ts` com timeout curto, até T036 passar
- [X] T038 [US2] Ligar a preferência pela API oficial no use case, devolvendo `origin: 'OFFICIAL_API'` quando ela responder, e **aplicando a marca d'água do mesmo jeito** (FR-002a / FR-002b / R4)
- [X] T039 [US2] Adicionar caso provando que um PDF vindo da API oficial em homologação **sai com marca d'água** — é a regressão que o design de T013 existe para impedir
- [X] T040 [US2] Criar `GetDanfseRoute` em `src/modules/nfse/infrastructure/http/routes/get-danfse/get-danfse.route.ts` e registrar em `src/modules/nfse/nfse.module.ts`
- [X] T041 [US2] Escrever teste em `tests/integration/get-danfse.integration.spec.ts` cobrindo os mesmos casos de T025, mais `X-Document-Origin: LOCAL` enquanto o Sefin responder 501

**Checkpoint**: Fase 2 de entrega completa — os dois documentos.

---

## Phase 6: Polish & Cross-Cutting

- [X] T042 Atualizar `services/fiscal-api/AGENTS.md` com o novo módulo, as dependências novas e as duas rotas — **mesmo commit** da implementação (Constituição, Princípio I)
- [X] T043 [P] Documentar os dois endpoints em `packages/docs/fiscal/integracao-erp-fiscal-api.md`, incluindo o que o ERP deve fazer com `X-Fiscal-Validity`
- [X] T044 [P] ⚠️ **`roteiro-teste-real.md` NÃO EXISTE no disco**, embora `demonstracao-emissao-fiscal.md`, `roteiro-teste-swagger.md` e o `quickstart.md` desta spec apontem para ele. O passo de DANFE/DANFSE foi acrescentado a `packages/docs/fiscal/roteiro-teste-swagger.md`, que existe. **A referência quebrada continua aberta** — decidir se o arquivo é recriado ou se as referências mudam.
- [X] T045 Confirmar cobertura ≥80% de `src/modules/auxiliary-documents/` com `pnpm --filter @citybox/fiscal-api test:cov`
- [X] T046 Portão em `services/fiscal-api/`: **build ✅ · lint ✅ · typecheck ✅ · unit ✅ 391/391 · integração ✅ 21/21** (suíte completa contra Postgres real, 2026-08-08, após as correções da revisão).
- [X] T047 Revisores acionados em 2026-08-08. **4 achados, 3 corrigidos:**

  | Sev | Achado | Situação |
  | --- | --- | --- |
  | CRITICAL | `@Header('Content-Type','application/pdf')` roda **antes** do handler no Nest, então toda resposta de ERRO (404/422/503) saía rotulada como PDF — o Express não sobrescreve Content-Type já definido. O ERP nunca chegaria ao `error.code`. | ✅ header movido para depois do `execute()` nas duas rotas |
  | HIGH | FR-006 incompleto: `substitutedBy` nunca era preenchido. Como o Padrão Nacional cancela a original ao aceitar a substituta, o DANFSE de nota **substituída** saía dizendo só "NOTA CANCELADA", sem identificar a nota que vale. | ✅ `findSubstituteAccessKey()` lê `FiscalEvent.replacedByDocumentId`; 4 testes de regressão |
  | MEDIUM | `infNfse['@Id']` produzia `any` implícito, não pego porque o `tsconfig` tem `noImplicitAny: false`. | ✅ helper `attr()` tipado |
  | **HIGH** | **`X-Company-Id` é header escolhido pelo chamador** e o JWT não tem claim de empresa. A comparação de FR-007 impede engano, **não impede ataque**: quem tem `fiscal.documents.view` obtém o documento de qualquer empresa. | ✅ **CORRIGIDO** — `CompanyAccessPolicy` resolve o Emitente a partir do `sub` do JWT via `platform.store_members`; falha nega; 6 testes novos |

---

## Dependências

```
Setup (T001–T004)
   └─> Foundational (T005–T018)   ← BLOQUEIA tudo
          ├─> US1 (T019–T026)  🎯 MVP
          │      └─> US3 (T027–T029)   depende de US1, sem código novo
          └─> US2 (T030–T041)   independente de US1/US3
                 └─> Polish (T042–T047)
```

**US2 não depende de US1.** Compartilham as portas da Phase 2, mas nenhum arquivo. Com a
Foundational fechada, um segundo par poderia tocar US2 em paralelo — a ordem escolhida é de
**urgência de negócio**, não de dependência técnica.

## Oportunidades de paralelismo

| Bloco | Tarefas | Por quê |
| --- | --- | --- |
| Setup | T003, T004 | Arquivos distintos |
| Foundational — domínio | T005, T006, T007, T008, T009 | Cinco arquivos independentes |
| US2 | T034 com T031–T033 | Código de barras é módulo separado |
| Polish | T043, T044 | Documentos distintos |

**Não paralelizar** os pares `[TEST]` → implementação: o teste precisa **falhar primeiro**.

## Estratégia de implementação

**MVP = Phase 1 + Phase 2 + Phase 3 (T001–T026).** Entrega o DANFE, que é o bloqueio duro:
sem ele a mercadoria não circula legalmente. Vale release sozinho.

**Incremento 2 = Phase 4 (T027–T029).** Barato — só verificação — e fecha a Fase 1 de
entrega do plano.

**Incremento 3 = Phase 5 (T030–T041).** DANFSE.

Duas armadilhas que esta base já pagou, registradas para não repetir:

1. **Asserção de status não é asserção de comportamento.** Uma substituição de NFS-e passou
   por 14/14 quebrada porque o teste só conferia HTTP 201. Aqui, `200` com PDF corrompido é
   o mesmo risco — por isso T025, T031 e T041 exigem abrir o PDF.
2. **Fake que repete o defeito do real não testa nada.** O vazamento de tenant do
   `idempotencyKey` sobreviveu porque o repositório em memória tinha a mesma falha. Ao usar
   `InMemoryFiscalDocumentRepository` em T015, confirmar que ele **filtra por `companyId`**
   — se não filtrar, o teste de FR-007 passa sem provar nada.

---

## Phase 7: Marca Citybox (FR-011 a FR-014) — Fase 3 de entrega

**Objetivo**: logo e legenda do Citybox nos dois documentos, **sem** tocar nos quadros
regulados.

**Teste independente**: gerar as amostras e confirmar que a marca aparece nos dois
documentos **e nos dois ambientes** — Cenário 9 do [quickstart.md](./quickstart.md).

### ⚠️ A restrição que governa esta fase

O leiaute do DANFE reserva um espaço de logotipo **dentro do quadro "IDENTIFICAÇÃO DO
EMITENTE"** (a lib o expõe como `pathLogo`; desenha em `get-dados-emitente.js:66`). Aquela
caixa declara **quem emitiu a nota**.

A marca do Citybox ali afirmaria que o emitente é o Citybox, num documento que acompanha
mercadoria e é apresentado em fiscalização. **Nenhuma tarefa desta fase pode usar
`pathLogo`.** Ver [research.md § R10](./research.md).

### Setup

- [X] T048 Adicionar `svg-to-pdfkit` em `services/fiscal-api/package.json` via `pnpm --filter @citybox/fiscal-api add svg-to-pdfkit` — MIT, única dependência é o `pdfkit`, **sem binário nativo** (R11)
- [X] T049 [P] Declarar tipagem para `svg-to-pdfkit` em `services/fiscal-api/src/modules/auxiliary-documents/infrastructure/pdf/svg-to-pdfkit.d.ts` se o pacote não expuser tipos — **proibido** `@ts-ignore`
- [X] T050 [P] Copiar `packages/ui/logotipo.svg` para `services/fiscal-api/src/modules/auxiliary-documents/infrastructure/pdf/assets/citybox-logotipo.svg`, com comentário de proveniência no `AGENTS.md` (desvio do Princípio IV justificado no Complexity Tracking do plano)

### Domínio

- [X] T051 Definir a porta `BrandStamper` e o texto da legenda em `services/fiscal-api/src/modules/auxiliary-documents/domain/branding.ts` — `stamp(pdf: Buffer): Promise<Buffer>`, com a nota de por que é **separada** do `WatermarkStamper`

### Implementação

- [X] T052 Escrever teste em `services/fiscal-api/src/modules/auxiliary-documents/infrastructure/pdf/citybox-brand.stamper.spec.ts`: a legenda é extraível do PDF; aparece em **todas** as páginas; o texto original continua legível; funciona sobre PDF de motor de terceiro — deve falhar (RED)
- [X] T053 Implementar `CityboxBrandStamper` em `services/fiscal-api/src/modules/auxiliary-documents/infrastructure/pdf/citybox-brand.stamper.ts` — logo vetorial via `svg-to-pdfkit` + legenda, no rodapé, até T052 passar
- [X] T054 Adicionar a T052 um caso que compara a **altura do conteúdo** antes e depois da estampagem, provando que nenhum quadro foi deslocado (FR-013)
- [X] T055 Ligar `BrandStamper` em `services/fiscal-api/src/modules/auxiliary-documents/application/use-cases/get-auxiliary-document/get-auxiliary-document.use-case.ts` — aplicado **sempre**, e **antes** da marca d'água, para que em homologação a diagonal passe por cima do rodapé
- [X] T056 Registrar `BrandStamper` → `CityboxBrandStamper` em `services/fiscal-api/src/modules/auxiliary-documents/auxiliary-documents.module.ts`

### Testes de regressão

- [X] T057 Adicionar a `services/fiscal-api/src/modules/auxiliary-documents/application/use-cases/get-auxiliary-document/get-auxiliary-document.use-case.spec.ts` o caso que prova que a marca é aplicada **também em PRODUCTION** — é onde a marca d'água NÃO é, e confundir as duas faria o crédito sumir justamente em produção
- [X] T058 Adicionar caso provando que a marca é aplicada ao PDF vindo da **API oficial** (`origin: 'OFFICIAL_API'`) — mesma razão do teste equivalente da marca d'água
- [X] T059 [P] Estender `services/fiscal-api/tests/integration/get-danfe.integration.spec.ts` e `get-danfse.integration.spec.ts` com asserção da legenda no texto extraído
- [X] T060 Adicionar a `services/fiscal-api/src/modules/auxiliary-documents/infrastructure/pdf/danfe.renderer.spec.ts` um caso que garante que **`pathLogo` NÃO é passado** à biblioteca — trava a restrição de R10 em teste, não só em comentário

### Conferência e documentação

- [X] T061 Conferência visual da marca Citybox — **aprovada em 2026-08-08**, após corrigir três defeitos que só apareceram no PDF: legenda em CMYK (pdfkit lê array de 4 como CMYK, saía cinza amarelado), faixa a 12 pt da borda (dentro da margem não-imprimível — cortava no papel) e logotipo pequeno demais para o wordmark ser legível
- [X] T062 [P] Atualizar `services/fiscal-api/AGENTS.md` com a seção da marca, a proveniência do asset copiado e a proibição de usar `pathLogo` — mesmo commit
- [X] T063 Rodar o portão em `services/fiscal-api/`: `build && lint && typecheck && test` + integração

---

## Dependências — Fase 3

```
T048 (dep) ──> T049, T050 [P]
                  └──> T051 (porta)
                          └──> T052 (RED) ──> T053 (GREEN) ──> T054
                                                  └──> T055 ──> T056
                                                          └──> T057, T058, T059 [P], T060
                                                                  └──> T061, T062 [P], T063
```

**Independente das Fases 1 e 2**, que já estão entregues. Toca o use case (T055) e o módulo
(T056), então não paraleliza com trabalho nesses dois arquivos.

## Armadilha específica desta fase

**Não fundir `BrandStamper` com `WatermarkStamper`.** Parece economia — os dois estampam o
PDF pronto — mas respondem a perguntas diferentes: a marca d'água pergunta *"este documento
vale?"* e só existe em homologação; o crédito pergunta *"quem gerou?"* e existe sempre.
Fundi-los faria a marca Citybox desaparecer em produção. **T057 é o teste que trava isso.**
