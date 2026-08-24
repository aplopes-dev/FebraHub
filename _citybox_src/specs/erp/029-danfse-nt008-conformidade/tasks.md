# Tasks: DANFSe conforme a NT 008/2026 (Padrão Nacional)

**Input**: Design em `specs/erp/029-danfse-nt008-conformidade/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: incluídos — o SC-001 exige verificação por teste automatizado (presença/ordem) **e** amostra visual. Padrão do projeto: só backend testado (erp-web sem harness — D0).

**Serviço único**: todo o trabalho é em `services/fiscal-api`. Caminhos abaixo são relativos a esse pacote salvo indicação contrária.

**Organização**: por user story (US1/US2/US3), com Setup e Foundational antes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizável (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1 / US2 / US3 (fases de story); Setup/Foundational/Polish sem label

---

## Phase 1: Setup (infraestrutura compartilhada)

**Purpose**: preparar assets e mapa de campos antes de codar.

- [X] T001 [P] Confirmar o asset oficial em `services/fiscal-api/resources/brand/nfse-nacional-horizontal.png` (PNG 1920×389 RGBA já baixado de gov.br/nfse) e anotar a proporção (~4.94:1) para o slot do cabeçalho.
- [X] T002 [P] Levantar os nomes exatos dos elementos do XML a partir de `services/fiscal-api/resources/xsd/nfse/1.01/` (`NFSe_v1.01.xsd`, `DPS_v1.01.xsd`, `tiposComplexos_v1.01.xsd`) para: endereço (`end`/`enderNac`), intermediário (`interm`), serviço (`locPrest`, `cServ`, `cTribNac`, qtde/valor unit.), valores (BC, deduções, descontos, líquido), tributos municipais (`tribMun`), retenções federais (`tribFed`) e totais (`totTrib`). Registrar o mapa em [data-model.md](./data-model.md) (seção "Fonte dos nomes").

**Checkpoint**: asset confirmado e mapa de campos fechado.

---

## Phase 2: Foundational (pré-requisitos bloqueantes)

**Purpose**: remoção da marca Citybox (fatia isolada, vale p/ DANFE **e** DANFSe) e extensão do reader (dado que ambas as stories consomem).

**⚠️ CRÍTICO**: nenhuma story de renderização pode ser concluída antes do reader estendido (T006–T008).

### FR-014 — remoção da marca Citybox (DANFE + DANFSe)

- [X] T003 Remover a chamada ao `BrandStamper` (injeção + `brandStamper.stamp(rendered)`) em `src/modules/auxiliary-documents/application/use-cases/get-auxiliary-document/get-auxiliary-document.use-case.ts`, mantendo o estágio de marca d'água de homologação (`WatermarkStamper`) intacto.
- [X] T004 Remover a porta e constantes de marca: apagar `src/modules/auxiliary-documents/domain/branding.ts` (`BrandStamper`, `CITYBOX_BRAND_CAPTION`, `BRAND_FOOTER_HEIGHT`); apagar a impl `src/modules/auxiliary-documents/infrastructure/pdf/citybox-brand.stamper.ts` e seu spec `citybox-brand.stamper.spec.ts`; remover o provider do `CityboxBrandStamper` em `src/modules/auxiliary-documents/auxiliary-documents.module.ts`; remover o asset órfão `resources/brand/citybox-logotipo.svg`.
- [X] T005 Ajustar `src/modules/auxiliary-documents/application/use-cases/get-auxiliary-document/get-auxiliary-document.use-case.spec.ts`: remover/reescrever o teste que travava a **presença** da marca Citybox para afirmar a **ausência** dela, e manter a asserção de que a marca d'água de homologação continua aplicada (não-regressão FR-012).

### FR-011 — reader estendido + fixtures

- [X] T006 Estender o modelo de leitura `NfseDocumentData` (e o tipo `Address`) em `src/modules/auxiliary-documents/infrastructure/pdf/nfse-xml.reader.ts` conforme [data-model.md](./data-model.md), com todos os campos novos **opcionais** (omitidos quando ausentes — sem `0`/`""` sintético).
- [X] T007 Implementar a extração dos novos grupos em `nfse-xml.reader.ts` (endereços prestador/tomador, intermediário, local da prestação/código/qtde/valor unit., BC/deduções/descontos/líquido, ISS, retenções federais IRRF/PIS/COFINS/CSLL/INSS, totais/transparência) usando os nomes de elemento levantados em T002; grupo/campo ausente ⇒ `undefined`.
- [X] T008 [P] Ampliar as fixtures em `src/modules/auxiliary-documents/tests/fixtures/authorized-nfse-xml.ts`: manter a **mínima** (só obrigatórios → exercita omissão) e adicionar uma variante **cheia** (endereços, intermediário, retenções federais, totais) para exercitar presença.
- [X] T009 Criar `src/modules/auxiliary-documents/infrastructure/pdf/nfse-xml.reader.spec.ts`: afirmar campos populados no XML **cheio** e `undefined` no **mínimo** (presença + omissão).

**Checkpoint**: marca Citybox removida dos dois documentos; reader entrega todos os campos da NT.

---

## Phase 3: User Story 1 — DANFSe com estrutura e identidade do Padrão Nacional (P1) 🎯 MVP

**Goal**: documento em **quadros/bordas**, na ordem da NT, com a **identidade visual nacional** no cabeçalho, em A4.

**Independent Test**: gerar amostra de um XML autorizado e conferir visualmente contra o modelo da NT 008/2026 (estrutura em quadros + identidade + ordem das seções).

### Tests (US1)

- [X] T010 [P] [US1] Em `src/modules/auxiliary-documents/infrastructure/pdf/danfse.renderer.spec.ts`, adicionar asserções de estrutura: texto extraído contém os **títulos das seções na ordem da NT** (identidade → identificação/chave/QR → Prestador → Tomador → [Intermediário] → Serviço → Valores → [Tributos] → [Retenções] → [Totais]) e o PDF é **A4** de página única para a fixture padrão (usar `tests/pdf-text.ts`).

### Implementation (US1)

- [X] T011 [US1] Criar helper de "caixa de seção" (moldura + título + conteúdo, com quebra de página preservando a moldura) — novo `src/modules/auxiliary-documents/infrastructure/pdf/section-box.ts` — reutilizável pelo renderer.
- [X] T012 [US1] Reescrever `src/modules/auxiliary-documents/infrastructure/pdf/danfse.renderer.ts` para desenhar as seções em **quadros na ordem da NT** (A4, margens aproximadas — fidelidade estrutural R1), usando o `section-box` (T011); reaproveitar `barcode.ts` para chave/QR.
- [X] T013 [US1] Implementar o cabeçalho com **identidade nacional**: embutir o PNG oficial (`resources/brand/nfse-nacional-horizontal.png`) via `image()` preservando proporção; **fallback textual** ("NFS-e — Padrão Nacional") no mesmo slot caso o asset falhe ao carregar (R2).
- [X] T014 [US1] Garantir paginação: descrição de serviço longa quebra para nova página mantendo a moldura, sem cortar seções (edge case SC-005).

**Checkpoint**: DANFSe "parece" o oficial — estrutura, identidade e ordem conformes; sem marca Citybox (herdado da Fase 2).

---

## Phase 4: User Story 2 — Todos os campos exigidos pela NT, corretos (P1)

**Goal**: renderizar **todos** os campos obrigatórios da NT lidos do XML, omitindo os ausentes.

**Independent Test**: a partir do XML **cheio**, cada campo da NT aparece com o valor correto; do XML **mínimo**, seções/linhas opcionais não aparecem.

### Tests (US2)

- [X] T015 [P] [US2] Em `danfse.renderer.spec.ts`, adicionar asserções de **campos**: com a fixture cheia, endereços/intermediário/local da prestação/BC/deduções/descontos/ISS/retenções federais/totais aparecem com os valores; com a fixture mínima, Intermediário/retenções/totais **não** aparecem (sem `0,00` falso) — SC-002/SC-003.

### Implementation (US2)

- [X] T016 [US2] No `danfse.renderer.ts`, renderizar Prestador (CNPJ, nome, **endereço**, IM) e Tomador (doc, nome, **endereço**; "NÃO IDENTIFICADO" quando sem documento) — FR-003/FR-004.
- [X] T017 [US2] Renderizar a seção **Intermediário** apenas quando presente (omitir quando ausente) — FR-005.
- [X] T018 [US2] Renderizar a seção **Serviço** (descrição, local da prestação, código/item, valor unitário, quantidade, alíquota do ISS) — FR-006.
- [X] T019 [US2] Renderizar a seção **Valores** (base de cálculo, deduções, descontos, valor líquido) — FR-007.
- [X] T020 [US2] Renderizar **Tributos**: ISS (retido/não, mantendo o texto explicativo quando alíquota é do município) e **retenções federais** IRRF/PIS/COFINS/CSLL/INSS, **omitindo** as ausentes — FR-008.
- [X] T021 [US2] Renderizar **Totalizadores/transparência** (totais federais/municipais) presentes no XML, omitindo os ausentes — FR-009; garantir chave legível+codificada, QR e código de verificação quando exigido — FR-010.

**Checkpoint**: DANFSe conforme em estrutura **e** conteúdo.

---

## Phase 5: User Story 3 — Não-regressão: cancelada/substituída e marca de homologação (P2)

**Goal**: preservar sinalização de cancelada/substituída e a marca d'água de homologação.

**Independent Test**: gerar DANFSe cancelado e em homologação; conferir marcação e marca d'água.

### Tests (US3)

- [X] T022 [P] [US3] Em `danfse.renderer.spec.ts`, afirmar a faixa/indicação de **cancelada** quando `isCancelled` (e a indicação de substituição quando `substitutedBy`), no novo leiaute — FR-012/SC-004.
- [X] T023 [P] [US3] Confirmar em `get-auxiliary-document.use-case.spec.ts` (já ajustado em T005) que a marca d'água de homologação é aplicada **após** o render e **sem** o BrandStamper — não-regressão FR-012.

**Checkpoint**: comportamentos da spec 004 preservados sobre o novo leiaute.

---

## Phase 6: Polish & Cross-Cutting

- [X] T024 [P] Atualizar `services/fiscal-api/tests/manual/gerar-amostras.spec.ts` para gerar amostras do **novo** DANFSe: normal, cancelada e com retenções federais → PDFs em `services/fiscal-api/amostras/` para conferência humana (SC-001b).
- [X] T025 [P] Atualizar `services/fiscal-api/AGENTS.md` (docs-as-code): novo leiaute do DANFSe conforme NT 008/2026, asset oficial da identidade nacional, e **remoção da marca Citybox** de DANFE+DANFSe (registrar a reversão da decisão R10 da spec 004).
- [X] T026 Rodar o gate de qualidade no pacote: `pnpm --filter @citybox/fiscal-api build && pnpm --filter @citybox/fiscal-api lint && pnpm --filter @citybox/fiscal-api typecheck && pnpm --filter @citybox/fiscal-api test`.
- [X] T027 Rodar `quickstart.md` (validação E2E: testes automatizados + geração de amostras) e conferir a matriz SC-001..SC-006.
- [X] T028 Gate `typescript-reviewer` sobre reader + renderer + use-case; gate `security-reviewer` condicional (verificar que a remoção do brand não afeta a marca d'água de homologação e que o reader não lê fora do XML autorizado). Sem `database-reviewer` (sem migration) nem `react-reviewer` (sem frontend).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sem dependências.
- **Foundational (Fase 2)**: depende do Setup. **Bloqueia** as stories — em especial o reader (T006–T009) alimenta o renderer das US1/US2.
- **US1 (Fase 3)**: depende do reader (T006–T007). MVP.
- **US2 (Fase 4)**: depende de US1 (mesmo arquivo `danfse.renderer.ts`) e do reader.
- **US3 (Fase 5)**: depende de US1 (leiaute) e de T005.
- **Polish (Fase 6)**: depende das stories desejadas.

### Nota sobre paralelismo real

`danfse.renderer.ts` é **um só arquivo** — as tasks de US1 (T012–T014) e US2 (T016–T021) editam o mesmo arquivo e devem ser **sequenciais** entre si, apesar dos marcadores [P] valerem apenas para specs/fixtures/arquivos distintos. FR-014 (T003–T005) e o reader (T006–T009) tocam arquivos diferentes e podem andar em paralelo entre si.

### Parallel Opportunities

- T001 ‖ T002 (Setup).
- Fase 2: bloco FR-014 (T003→T004→T005) ‖ bloco reader (T006→T007, T008, T009).
- Specs marcados [P] (T010, T015, T022, T023) podem ser escritos em paralelo aos demais specs; a implementação no renderer é sequencial.
- Polish: T024 ‖ T025.

---

## Implementation Strategy

### MVP (US1)

1. Fase 1 (Setup) → 2. Fase 2 (FR-014 + reader) → 3. Fase 3 (US1: estrutura + identidade) → **validar amostra visual** contra a NT.

### Incremental

US1 (estrutura) → US2 (campos) → US3 (não-regressão) → Polish (amostras, docs, gates). Cada incremento é conferível por amostra em `amostras/` + specs.

---

## Notes

- Sem commit: acumular em `feat/fiscal-api` até autorização explícita (constraint do projeto).
- Produção permanece desligada (endpoint oficial `501`); esta feature conforma a geração **local**.
- A marca d'água de homologação (`pdf-lib-watermark.stamper.ts`) **não** é tocada — só o `citybox-brand.stamper.ts` sai.
