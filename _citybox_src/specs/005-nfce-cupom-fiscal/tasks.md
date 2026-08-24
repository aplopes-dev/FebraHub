---
description: "Task list — NFC-e (cupom fiscal, modelo 65)"
---

# Tasks: Cupom fiscal eletrônico (NFC-e, modelo 65)

**Input**: `/specs/005-nfce-cupom-fiscal/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Testes**: **obrigatórios** por governança — a Constituição manda TDD com RED antes de
GREEN e cobertura ≥80%. Toda tarefa que começa com "Escrever teste" deve **falhar** antes da
tarefa de implementação seguinte.

**Base**: caminhos relativos a `services/fiscal-api/`.

## Formato: `[ID] [P?] [Story] Descrição`

- **[P]**: paralelizável (arquivo distinto, sem dependência pendente)
- **[Story]**: US1 / US2 / US3 / US4 conforme [spec.md](./spec.md)

---

## Ordem das fases, e por que US4 vem antes de US3

Prioridade: **US1 (P1) · US2 (P1) · US3 (P2) · US4 (P2)**.
Execução: **US1 → US2 → US4 → US3**.

US3 e US4 empatam em prioridade, e o desempate é tamanho e risco. O cancelamento (US4)
reusa o caminho de evento que a NF-e já tem — é pequeno e fecha o ciclo de vida. A
contingência (US3) traz fila persistente, agendador, transmissão ordenada e um estado novo
("rejeitado depois de entregue"). Entregar o pequeno antes deixa a feature utilizável mais
cedo e concentra o risco no fim, quando o resto já está estável.

---

## Phase 1: Setup

- [X] T001 Acrescentar `NFCE` ao enum `DocumentType` em `prisma/schema.prisma` e criar a migration em `prisma/migrations/` — **é o que dá numeração isolada de graça** (`fiscal_sequences` já é única por `documentType`; ver [research.md](./research.md) R6)
- [X] T002 Acrescentar `cscId` e `cscTokenEncrypted` ao modelo `Company` em `prisma/schema.prisma`, ambos **nulos** — o Emitente existe antes de obter o CSC junto à SEFAZ
- [X] T003 Criar o modelo da fila de contingência em `prisma/schema.prisma` com `fiscalDocumentId`, `sequence`, `emittedAt`, `attempts`, `lastError`, `status` — **persistente**, ver [research.md](./research.md) R4
- [X] T004 Sincronizar os **três espelhos manuais** de `DocumentType`: enum Postgres (T001), `DOCUMENT_TYPES` em `src/modules/fiscal-documents/domain/entities/fiscal-document.entity.ts`, e `FILE_PREFIX` em `src/modules/auxiliary-documents/application/use-cases/get-auxiliary-document/get-auxiliary-document.use-case.ts` — divergência **não quebra compilação**, quebra no INSERT em runtime
- [X] T005 `database-reviewer` executado em 2026-08-08. **4 achados, todos corrigidos:**

  | Sev | Achado | Correção |
  | --- | --- | --- |
  | HIGH | `onDelete: Cascade` **contradizia o próprio comentário do modelo**, que diz que perder o registro é a pior falha da feature | → `Restrict` |
  | HIGH | `sequence` documentada como "monotônica por Emitente" **sem `companyId` na tabela e sem constraint** — corrida entre duas emissões deixaria a ordem indeterminada | `companyId` desnormalizado + `@@unique([companyId, sequence])` |
  | MEDIUM | Índice de dreno indexava `TRANSMITTED`/`REJECTED`, que a query nunca filtra e que são histórico permanente | Índice **parcial** `WHERE status = 'PENDING'` |
  | MEDIUM | Nada impedia `PENDING` com `transmitted_at` preenchido | `CHECK` amarrando estado e carimbo |

  Confirmado sem achado: `ADD VALUE` no enum e as colunas de CSC **não tomam lock pesado**, e a numeração da NFC-e fica de fato isolada pela unique existente de `fiscal_sequences`.
- [X] T006 ⏸️ Aplicar a migration `20260808200000_nfce_cupom_fiscal` — **bloqueado: Docker Desktop caiu** (terceira vez na sessão). O SQL foi **escrito à mão** seguindo a convenção do serviço, já com o índice parcial e o `CHECK` que o Prisma não expressa declarativamente. Aplicar com `pnpm --filter @citybox/fiscal-api db:migrate:dev` e conferir `db:migrate:status` quando a infra voltar

---

## Phase 2: Foundational (bloqueia todas as histórias)

**⚠️ Nenhuma história começa antes desta fase fechar.**

### Parametrizar o builder de NF-e

- [X] T007 Escrever teste em `src/modules/nfe/infrastructure/xml/tests/nfe-xml.builder.spec.ts` cobrindo modelo `65`, tipo de emissão de contingência e **destinatário ausente** — deve falhar (RED)
- [X] T008 Parametrizar `model` e `emissionType` em `src/modules/nfe/infrastructure/xml/nfe-xml.builder.ts`, hoje fixos em `NFE_MODEL = '55'` (2 ocorrências) e `tpEmis: '1'` (2 ocorrências), até T007 passar
- [X] T009 Tornar `recipient` opcional em `BuildNfeXmlInput` de `src/modules/nfe/infrastructure/xml/nfe-xml.builder.ts` — NFC-e a consumidor não identificado é o caso comum, não a exceção
- [X] T010 Validar o XML modelo 65 contra o XSD já existente (`resources/xsd/nfe/nfe_v4.00.xsd`) em `src/modules/nfe/infrastructure/xml/tests/` — o mesmo schema serve os dois modelos, e é o que confirma que a parametrização não quebrou a NF-e

### CSC

- [X] T011 [P] Escrever teste em `src/modules/companies/application/use-cases/set-csc/set-csc.use-case.spec.ts`: o token é gravado **cifrado**; a leitura devolve o valor claro; o token **nunca** aparece em log ou mensagem de erro — deve falhar (RED)
- [X] T012 Implementar guarda e leitura do CSC reusando `src/shared/infra/fiscal-signature/cert-encryption.ts` — mesmo caminho já usado para a senha do PKCS#12, para não criar uma segunda superfície de auditoria ([research.md](./research.md) R3)
- [X] T013 Criar rota de cadastro do CSC em `src/modules/companies/infrastructure/http/routes/set-csc/set-csc.route.ts`

### QR Code ⚠️

- [X] T014 Escrever teste em `src/modules/nfce/domain/tests/qr-code.spec.ts` com um caso de referência conhecido (chave + CSC → conteúdo esperado) — deve falhar (RED)
- [X] T015 Implementar o cálculo do conteúdo do QR Code em `src/modules/nfce/domain/qr-code.ts` — **texto, não imagem**: é o que vai no XML, e a imagem impressa deriva dele
- [X] T016 Escrever teste que trava a **ordem de montagem** em `src/modules/nfce/infrastructure/xml/tests/nfce-xml.builder.spec.ts`: o `qrCode` está presente em `infNFeSupl` no XML **efetivamente transmitido**. ⚠️ **Correção de rumo (2026-08-09)**: a redação anterior exigia o QR Code no XML *antes da assinatura*. Está errada. `infNFeSupl` é irmão de `infNFe` e fica **fora** da assinatura, e na contingência o conteúdo depende do `DigestValue` — que só existe **depois** de assinar. A ordem correta é montar → assinar → calcular QR → inserir `infNFeSupl`. O que o teste precisa travar é que a inserção **não invalida a assinatura** e que nada transmite sem `qrCode` ([research.md](./research.md) R2)
- [X] T017 Implementar `src/modules/nfce/infrastructure/xml/nfce-xml.builder.ts` delegando ao builder de NF-e e inserindo `infNFeSupl`, até T016 passar

### Regras de recusa ⚠️

- [X] T018 [P] Escrever teste em `src/modules/nfce/domain/rules/tests/consumer-limit.spec.ts` para o limite de valor sem identificação, **configurável por UF** — a legislação é estadual e muda sem aviso
- [X] T019 [P] Implementar `src/modules/nfce/domain/rules/consumer-limit.ts` até T018 passar
- [X] T020 [P] Criar os erros de domínio em `src/modules/nfce/domain/errors/` — CSC ausente (→ 424), limite excedido (→ 422), venda vazia (→ 422); nomes conforme o mapeamento por substring de `app-exception.filter.ts`

### Pagamento

- [X] T021 [P] Escrever teste em `src/modules/nfce/domain/tests/payment.spec.ts`: **várias** formas na mesma venda; troco só em dinheiro; soma dos pagamentos confere com o total
- [X] T022 [P] Implementar `src/modules/nfce/domain/payment.entity.ts` até T021 passar — modelar como lista, não valor único: parte em cartão e resto em dinheiro é rotina no varejo

**Checkpoint**: builder parametrizado, CSC, QR Code, regras e pagamento prontos. US1 pode começar.

---

## Phase 3: US1 — Fechar uma venda no balcão (P1) 🎯 MVP

**Objetivo**: `POST /api/v1/nfce` autorizando o cupom na SEFAZ-BA.

**Teste independente**: emitir e verificar que a SEFAZ autorizou, devolvendo chave e
protocolo — Cenário 1 do [quickstart.md](./quickstart.md).

- [X] T023 [US1] Escrever teste em `src/modules/nfce/application/use-cases/issue-nfce/issue-nfce.use-case.spec.ts` com provider falso: venda comum autoriza; **venda sem consumidor identificado também autoriza**; venda sem itens recusa — deve falhar (RED)
- [X] T024 [US1] ⚠️ Adicionar a T023 o teste que prova que **toda recusa acontece antes de reservar numeração** (produção não habilitada, CSC ausente, limite excedido): o contador de `fiscal_sequences` não avança. Número queimado exige inutilização junto à SEFAZ — esta base já deixou **sete documentos órfãos** por verificar tarde uma vez
- [X] T025 [US1] ⚠️ Feito antes de T023/T024 (ciclo TDD invertido); coberto depois, e a força do teste de ordem foi confirmada por **mutação** — mover a reserva para cima derruba os 5 testes do bloco. Implementar `IssueNfceUseCase` em `src/modules/nfce/application/use-cases/issue-nfce/issue-nfce.use-case.ts` até T023 e T024 passarem
- [X] T026 [US1] Criar `POST /api/v1/nfce` em `src/modules/nfce/infrastructure/http/routes/issue-nfce/issue-nfce.route.ts` conforme [contracts/](./contracts/nfce.openapi.yaml), com `@CompanyId()`, `@CurrentUser()` e a `CompanyAccessPolicy` da feature 004
- [X] T027 [US1] Criar `GET /api/v1/nfce/{id}` em `src/modules/nfce/infrastructure/http/routes/get-nfce/get-nfce.route.ts` reusando `ConsultNfeUseCase`, que já é genérico por `FiscalDocument`
- [X] T028 [US1] Criar `src/modules/nfce/nfce.module.ts` e registrá-lo em `src/app.module.ts`
- [ ] T029 [US1] Escrever teste de integração em `tests/integration/issue-nfce.integration.spec.ts` contra Postgres real: cupom autorizado persiste com `documentType = NFCE`; **numeração isolada da NF-e** (FR-002)
- [ ] T030 [US1] ⚠️ Adicionar a T029 a asserção que confere o **`qrCode` no XML autorizado armazenado**, não no PDF — é o único lugar onde a falha de ordem de montagem aparece

**Checkpoint**: o caixa vende. **Este é o MVP.**

---

## Phase 4: US2 — Entregar o cupom impresso (P1)

**Objetivo**: `GET /api/v1/nfce/{id}/danfce` nos dois formatos.

**Teste independente**: emitir e obter o documento nos dois leiautes, conferindo QR Code e
chave — Cenário 4 do [quickstart.md](./quickstart.md).

- [X] T031 [US2] Escrever teste em `src/modules/auxiliary-documents/infrastructure/pdf/danfe-nfce.renderer.spec.ts` com fixture de XML modelo 65: o PDF sai em **largura de bobina**, com QR Code, chave, itens, totais e **formas de pagamento** — deve falhar (RED)
- [X] T032 [US2] Criar a fixture de NFC-e autorizada em `src/modules/auxiliary-documents/tests/fixtures/authorized-nfce-xml.ts`, gerada pelo builder de produção — **não** um `.xml` estático, mesma razão das features anteriores
- [X] T033 [US2] Implementar `DanfeNfceRenderer` em `src/modules/auxiliary-documents/infrastructure/pdf/danfe-nfce.renderer.ts` **delegando à biblioteca já adotada**, que despacha por `ide.mod` e produz bobina sem código de leiaute novo ([research.md](./research.md) R5)
- [X] T034 [US2] Escrever teste em `src/modules/auxiliary-documents/infrastructure/pdf/danfce-a4.renderer.spec.ts` para o leiaute A4 (FR-007a) — deve falhar (RED)
- [X] T035 [US2] Implementar `DanfceA4Renderer` em `src/modules/auxiliary-documents/infrastructure/pdf/danfce-a4.renderer.ts` com pdfkit, até T034 passar
- [X] T036 [US2] ⚠️ Escrever teste que compara o **conteúdo textual** da bobina e do A4 do mesmo cupom (SC-007). Duas vias do mesmo documento fiscal com dados diferentes é **defeito**, não variação de formato
- [X] T037 [US2] Registrar os dois renderizadores no `RENDERER_REGISTRY` de `src/modules/auxiliary-documents/auxiliary-documents.module.ts`, com seleção por formato
- [X] T038 [US2] Criar `GET /api/v1/nfce/{id}/danfce` com o parâmetro `formato` em `src/modules/nfce/infrastructure/http/routes/get-danfce/get-danfce.route.ts`
- [X] T039 [US2] Verificar que a **marca d'água de homologação e a marca Citybox** se aplicam aos dois formatos **sem alteração** — foram desenhadas como estágios independentes do renderizador na feature 004, e este é o teste que confirma que a decisão se pagou
- [ ] T040 [US2] Escrever teste de integração em `tests/integration/get-danfce.integration.spec.ts` abrindo os dois PDFs e conferindo o **conteúdo** — asserção de status não conta

**Checkpoint**: a venda fecha de ponta a ponta. Passível de release.

---

## Phase 5: US4 — Cancelar e inutilizar (P2)

**Objetivo**: fechar o ciclo de vida do cupom.

**Teste independente**: emitir, cancelar dentro do prazo e verificar o registro na SEFAZ —
Cenário 6 do [quickstart.md](./quickstart.md).

- [X] T041 [US4] Escrever teste em `src/modules/nfce/application/use-cases/cancel-nfce/cancel-nfce.use-case.spec.ts`: dentro do prazo cancela; fora do prazo recusa **informando o prazo**; justificativa curta demais recusa — deve falhar (RED)
- [X] T042 [US4] Implementar `CancelNfceUseCase` em `src/modules/nfce/application/use-cases/cancel-nfce/cancel-nfce.use-case.ts` reusando o caminho de evento do `SefazBaNfeProvider`
- [X] T043 [US4] Criar `POST /api/v1/nfce/{id}/cancel` em `src/modules/nfce/infrastructure/http/routes/cancel-nfce/cancel-nfce.route.ts`
- [X] T044 [US4] Garantir que a mensagem de recusa **não** ofereça substituição — a NFC-e não tem esse caminho, e sugerir algo inexistente manda o operador para um beco
- [X] T045 [P] [US4] Inutilização de faixa. ⚠️ **Não criou caso de uso novo**: `InutilizeNfeUseCase` foi parametrizado por `documentType`, porque duplicá-lo daria duas máquinas de estado para manter em sincronia. O trabalho real foi outro — `mod = '55'` estava **fixo** em `nfe-soap-envelope.ts` e a checagem de sobreposição consultava sempre `documentType: 'NFE'`. Inutilizar faixa de cupom teria queimado a faixa equivalente de NF-e junto ao fisco e deixado a lacuna do cupom aberta, nenhum dos dois reversível por código
- [X] T046 [P] [US4] Criar `POST /api/v1/nfce/inutilize` em `src/modules/nfce/infrastructure/http/routes/inutilize-nfce/inutilize-nfce.route.ts`

---

## Phase 6: US3 — Contingência (P2)

**Objetivo**: o caixa continua vendendo com a SEFAZ fora do ar.

⚠️ **Recorte decidido em Clarifications**: cobre a queda **da SEFAZ**. Queda da internet da
loja deixa o solicitante sem alcançar a API, e nenhuma contingência server-side resolve
(FR-010a).

**Teste independente**: simular a SEFAZ indisponível, emitir, restabelecer e verificar a
transmissão — Cenário 5 do [quickstart.md](./quickstart.md).

- [X] T047 [US3] Escrever teste em `src/modules/nfce/application/use-cases/issue-nfce/issue-nfce.use-case.spec.ts`: com o provider indisponível, a emissão **conclui** com tipo de emissão de contingência e enfileira — deve falhar (RED)
- [X] T048 [US3] Implementar a detecção de indisponibilidade e o caminho de contingência em `IssueNfceUseCase` — distinguir **indisponibilidade** de **rejeição**: rejeição é resposta do órgão e não deve virar contingência
- [X] T049 [US3] Implementar o repositório da fila em `src/modules/nfce/infrastructure/contingency/prisma-contingency-queue.repository.ts` — **persistente**; um cupom entregue ao consumidor e perdido num restart é a pior falha desta feature
- [X] T050 [US3] ⚠️ Teste em `tests/integration/contingency-queue.integration.spec.ts` — **executado contra Postgres real e ACHOU UM DEFEITO**: o `enqueue` calculava a `sequence` por subconsulta dentro do `INSERT`, o que **não serializa** em `READ COMMITTED` (duas transações leem o mesmo `MAX` e colidem na unique). Corrigido com `pg_advisory_xact_lock(hashtext(company_id))`. Nenhum teste de unidade pegaria — o dublê em memória é sequencial e passava
- [X] T051 [US3] Escrever teste que prova a **transmissão na ordem de emissão** — fora de ordem, a numeração chega quebrada à SEFAZ
- [X] T052 [US3] Implementar `TransmitPendingNfceUseCase` em `src/modules/nfce/application/use-cases/transmit-pending-nfce/transmit-pending-nfce.use-case.ts`, até T051 passar
- [X] T053 [US3] Agendador em `src/modules/nfce/infrastructure/contingency/contingency.scheduler.ts`. ⚠️ **Nasce DESLIGADO** (`NFCE_CONTINGENCY_DRAIN=on`) e só é seguro com **uma** instância da API: `setInterval` roda em todo processo, e sem reivindicação atômica na fila duas réplicas podem transmitir o mesmo cupom — duplicidade na SEFAZ sobre papel já entregue
- [X] T054 [US3] ⚠️ Escrever teste para FR-012: cupom de contingência **rejeitado** na transmissão posterior é sinalizado **explicitamente**. O consumidor já levou o papel; falhar em silêncio aqui é o pior caso da feature
- [X] T055 [US3] Implementar o alarme de **prazo legal excedido** na fila — é problema fiscal, não pendência técnica, e por isso não pode ser um retry silencioso
- [X] T056 [US3] Marcar o documento auxiliar de cupom em contingência (FR-011). A condição é lida do **XML** (`tpEmis=9`), não recebida por parâmetro — assim é impossível imprimir cupom de contingência sem a marca por esquecer uma flag. Faixa sólida, não marca d'água: a d'água diz "não vale"; esta diz "vale, mas ainda não autorizado" em `src/modules/auxiliary-documents/infrastructure/pdf/danfe-nfce.renderer.ts` e no A4

---

## Phase 7: Polish & Cross-Cutting

- [X] T057 Documentar `SEFAZ_BA_NFCE_*` e o limite por UF em `services/fiscal-api/.env.example`, com a nota de que produção segue sem valor padrão
- [X] T058 Atualizar `services/fiscal-api/AGENTS.md` com o módulo `nfce`, a migration, o CSC e o recorte da contingência — mesmo commit (Princípio I)
- [X] T059 [P] Atualizar `AGENTS.md` raiz: documento fiscal novo no serviço, entrada no histórico de mudanças estruturais
- [X] T060 [P] Documentar os endpoints em `packages/docs/fiscal/integracao-erp-fiscal-api.md`, incluindo o que o PDV faz com `emissionType: CONTINGENCY`
- [X] T061 [P] Acrescentar um passo de NFC-e a `packages/docs/fiscal/roteiro-teste-swagger.md`
- [X] T062 Estender `tests/manual/gerar-amostras.spec.ts` com amostras de cupom (bobina e A4, normal e contingência) para a conferência visual
- [ ] T063 Conferência visual das amostras — bobina legível em impressora térmica, A4 apresentável, marcação de contingência evidente
- [X] T064 Cobertura de `src/modules/nfce/`: **90,73% statements**. O que falta é `prisma-contingency-queue.repository.ts` (44%), que **precisa de Postgres** — é o T050 bloqueado, não descuido
- [X] T065 Portão completo: `build`, `lint`, `typecheck`, `test` **e integração** — 38 testes de integração passando contra Postgres real (5 pulados por exigirem `platform.store_members`, schema do admin-api ausente neste banco)
- [X] T066 Revisão do diff (feita **manualmente**, sem subagentes — instrução do usuário nesta sessão). ⚠️ **Achou um defeito de tenant na própria entrega**: `PUT /v1/companies/:id/csc` validava `@RequirePermission('fiscal.companies.manage')` mas **não** o Emitente. Qualquer usuário com a permissão podia gravar CSC em empresa alheia — quebrando a emissão de cupom dela em silêncio, ou gravando um CSC conhecido para forjar QR Code que a consulta pública aceita. Corrigido com `CompanyAccessPolicy` (404, não 403) + 3 testes. A correção expôs um ciclo de módulos (`companies` ← `certificates` ← `auxiliary-documents`), resolvido movendo a política para `shared/infra/tenant/` — que é onde autorização de tenant pertence, agora que três módulos a usam

---

## Dependências

```
Setup (T001–T006)  ← T005 database-reviewer BLOQUEIA T006
   └─> Foundational (T007–T022)   ← BLOQUEIA tudo
          ├─> US1 (T023–T030)  🎯 MVP
          │      └─> US2 (T031–T040)   precisa de cupom emitido para renderizar
          │             ├─> US4 (T041–T046)
          │             └─> US3 (T047–T056)
          └────────────────────> Polish (T057–T066)
```

**US2 depende de US1** — diferente das features anteriores: não há documento auxiliar sem
cupom emitido. **US3 e US4 são independentes entre si** e poderiam ir em paralelo com dois
pares.

## Oportunidades de paralelismo

| Bloco | Tarefas | Por quê |
| --- | --- | --- |
| Foundational | T011, T018, T019, T020, T021, T022 | CSC, regras e pagamento não se tocam |
| US4 | T045, T046 com T041–T044 | Inutilização é caminho separado do cancelamento |
| Polish | T059, T060, T061 | Documentos distintos |

**Não paralelizar** pares `teste → implementação`: o teste precisa falhar primeiro.

## Estratégia de implementação

**MVP = T001–T030.** O cupom é autorizado pela SEFAZ. Ainda não imprime — mas prova o
caminho fiscal inteiro, que é onde mora o risco.

**Entrega utilizável = + T031–T040.** Com o documento auxiliar, a venda fecha no balcão.

**Depois**: T041–T046 (ciclo de vida) e T047–T056 (contingência).

### Cinco armadilhas que esta base já pagou

1. **Recusa depois de reservar número** queimou numeração e deixou 7 documentos órfãos. **T024** trava.
2. **Asserção de status não é asserção de comportamento** — uma substituição de NFS-e passou por 14/14 quebrada. **T030, T036, T040** exigem abrir o conteúdo.
3. **Fake que repete o defeito do real não testa nada** — o vazamento de tenant sobreviveu porque o dublê tinha a mesma falha. **T050** usa Postgres real.
4. **Asset em `src/` não sobrevive ao build** — deu 500 em toda impressão na feature 004. Se a NFC-e trouxer asset, vai para `resources/`.
5. **Espelho manual de enum** — `DocumentType` tem três, e divergência só quebra em runtime. **T004** sincroniza os três.
