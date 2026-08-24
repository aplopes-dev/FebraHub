---

description: "Task list for Tela Facilita NFE (aba Emitido)"

---

# Tasks: Tela Facilita NFE (aba "Emitido")

**Input**: Design documents from `specs/erp/009-facilita-nfe-screen/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/fiscal-documents.md](./contracts/fiscal-documents.md), [quickstart.md](./quickstart.md)

**Tests**: incluídos — a Constitution do monorepo (`Development Workflow & Quality Gates`) exige o fluxo TDD; backend em Postgres real (sem mocks de banco), frontend em Vitest/RTL.

**Organization**: US1 ("Emitido") é a única história com trabalho real nesta entrega — US2 ("Recebido") e US3 (envio/histórico) ficam como placeholder por decisão explícita (ver `spec.md` `## Clarifications`), então viram tarefas pequenas de UI vazia, sem backend.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1 (Emitido, real) · US2 (Recebido, placeholder) · US3 (Envio/Histórico, placeholder)

## Path Conventions

Monorepo — backend em `services/fiscal-api/`, frontend em `apps/erp/web/`. Caminhos
exatos vêm de `plan.md` § Project Structure.

---

## Phase 1: Setup

**Purpose**: preparar ambiente e docs antes de tocar código de domínio

- [ ] T001 Confirmar `FISCAL_API_URL` (`http://127.0.0.1:3116/api`) em `apps/erp/web/.env.example` e documentar em `apps/erp/web/AGENTS.md` §7 (Variáveis de Ambiente)
- [ ] T002 [P] Adicionar linha `fiscal-api` (porta 3116, `services/fiscal-api`) à tabela "Mapa de serviços e portas" no `AGENTS.md` raiz e no `CLAUDE.md` raiz (achado do `research.md` §5 — porta ausente hoje)
- [ ] T003 [P] Confirmar no Keycloak que o client `citybox-backoffice` (usado pelo `erp-web`) tem o role/escopo necessário para `fiscal.documents.view` na `fiscal-api`; registrar o resultado em `services/fiscal-api/AGENTS.md` (pré-requisito de infra, não bloqueia o código se já existir)

**Checkpoint**: ambiente e docs prontos para começar o Foundational

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: infraestrutura compartilhada pelas 3 abas (mesmo só US1 ter dado real)

**⚠️ CRITICAL**: nenhuma história começa antes deste phase estar completo

- [ ] T004 Criar proxy BFF `apps/erp/web/src/app/api/proxy/fiscal/[...path]/route.ts` (molde `app/api/proxy/comercio/route.ts` — injeta Bearer do cookie httpOnly, encaminha para `FISCAL_API_URL`)
- [ ] T005 [P] Criar scaffold da feature `apps/erp/web/src/features/facilita-nfe/` (`types/fiscal-document.ts`, `index.ts`) conforme `plan.md` § Project Structure
- [ ] T006 Criar `apps/erp/web/src/features/facilita-nfe/components/facilita-nfe-tabs.tsx` — shell MUI `Tabs` com as 3 abas (Recebido/Emitido/Emitido como default ativo), sem conteúdo de dados ainda (FR-001)
- [ ] T007 Criar `apps/erp/web/src/features/facilita-nfe/pages/facilita-nfe-page.tsx` renderizando `FacilitaNfeTabs`; atualizar `apps/erp/web/src/app/(app)/financas/facilita-nfe/page.tsx` para reexportar essa page em vez de `PlaceholderPage`
- [X] T008 ~~Remover `disabled` do item "Facilita NF-e"~~ — **correção**: o item `financas-facilita-nfe` em `apps/erp/web/src/lib/navigation.ts` já não tem `disabled: true` (achado inicial do research.md estava errado, corrigido na implementação — ver research.md §6); nenhuma mudança de código necessária, só a tela em si precisa sair de `PlaceholderPage` (T007)
- [ ] T009 [P] Criar `apps/erp/web/src/features/facilita-nfe/GUIA.md` (manual de negócio, molde `products/GUIA.md`) — cobre só o que existe nesta entrega (aba Emitido); nota "Recebido"/"Histórico de Envios" como "em breve"

**Checkpoint**: tela abre pelo menu, mostra as 3 abas navegáveis (sem dado ainda) — pronto para US1

---

## Phase 3: User Story 1 - Consultar documentos fiscais emitidos pela loja (Priority: P1) 🎯 MVP

**Goal**: aba "Emitido" lista documentos fiscais reais da loja ativa, com cards de
totais, busca e filtro 100% backend-driven, e paginação.

**Independent Test**: com a loja de teste tendo ≥1 documento fiscal emitido em status
diferentes, abrir a aba "Emitido" e verificar que a tabela e os cards batem com os dados
reais da `fiscal-api` (ver `quickstart.md` Cenários 1-4).

### Tests for User Story 1 ⚠️

> Escrever estes testes primeiro; devem FALHAR antes da implementação.

- [X] T010 [P] [US1] Estender `services/fiscal-api/src/modules/fiscal-documents/tests/fiscal-document-repository.contract.ts` com casos de `search` (por `number`, `series`) — contrato compartilhado por `PrismaFiscalDocumentRepository` e `InMemoryFiscalDocumentRepository` (busca por nome de cliente ficou fora do escopo, research.md §3)
- [X] T011 [P] [US1] Adicionar casos de `search` em `services/fiscal-api/src/modules/fiscal-documents/application/use-cases/list-fiscal-documents/list-fiscal-documents.use-case.spec.ts`
- [X] T012 [P] [US1] Criar `services/fiscal-api/src/modules/fiscal-documents/application/use-cases/get-fiscal-documents-summary/get-fiscal-documents-summary.use-case.spec.ts` (casos: total/autorizadas/canceladas corretos, filtro por `search`/`documentType`, `companyId` sem documentos → zeros)
- [X] T013 [P] [US1] Teste do mapper/presenter novo em `services/fiscal-api/src/modules/fiscal-documents/infrastructure/http/routes/shared/fiscal-document-summary.presenter.spec.ts` (formato `{ total, authorized, cancelled }`) — e caso de `customerName` adicionado a `fiscal-document-response.mapper.spec.ts`
- [ ] T014 [P] [US1] **BLOQUEADA** — Testes de `use-facilita-nfe-list.ts`/`use-facilita-nfe-summary.ts` (Vitest + MSW). **Achado na implementação**: `apps/erp/web` não tem nenhuma infraestrutura de teste frontend hoje — zero `vitest.config`, zero `@testing-library/*` no `package.json`, zero arquivo `.test.ts(x)` em todo o pacote (confirmado por busca exaustiva). Escrever este teste exige primeiro decidir e instalar todo o harness de teste do app (Vitest + RTL + MSW + config), uma decisão de escopo de pacote inteiro, não desta feature. Não assumido silenciosamente — reportado como achado para decisão do time.
- [ ] T015 [P] [US1] **BLOQUEADA** — mesma causa raiz de T014 (sem harness de teste em `apps/erp/web`).

### Implementation for User Story 1

**Backend (`services/fiscal-api`)**

- [X] T016 [US1] Adicionar `search?: string` a `ListFiscalDocumentsDto` em `services/fiscal-api/src/modules/fiscal-documents/application/dtos/fiscal-document.dto.ts` (depende de T010-T011 falhando)
- [X] T017 [US1] Adicionar `search` a `FiscalDocumentRepository.findAll`/`count` (interface) em `services/fiscal-api/src/modules/fiscal-documents/domain/repositories/fiscal-document.repository.interface.ts`
- [X] T018 [US1] Implementar `search` (WHERE `OR` sobre `number`/`series`, `contains` insensitive) em `services/fiscal-api/src/modules/fiscal-documents/infrastructure/database/prisma-fiscal-document.repository.ts` (caminho real difere de `plan.md` — tem subpasta `database/`); incluir `customer: true` no `include` de `findAll`/`findById` e adicionar `withCustomerName`/`customerName` na entidade e no `toFiscalDocumentResponse` (research.md §3.5) (depende de T017)
- [X] T019 [US1] Implementar `search` equivalente em `services/fiscal-api/src/modules/fiscal-documents/tests/in-memory-fiscal-document.repository.ts` para o contrato T010 passar dos dois lados (depende de T017)
- [X] T020 [US1] Adicionar `search` ao `@ApiQuery` e ao `handle()` de `services/fiscal-api/src/modules/fiscal-documents/infrastructure/http/routes/list-fiscal-documents/list-fiscal-documents.route.ts`; corrigir `enum: ['NFE', 'NFSE']` → `['NFE', 'NFSE', 'NFCE']` (research.md §3.4) (depende de T016)
- [X] T021 [US1] Criar `GetFiscalDocumentsSummaryUseCase` em `services/fiscal-api/src/modules/fiscal-documents/application/use-cases/get-fiscal-documents-summary/get-fiscal-documents-summary.use-case.ts` (3× `count()` em paralelo — sem `groupBy` novo no repositório) (depende de T012, T017-T019)
- [X] T022 [US1] Criar `FiscalDocumentSummaryPresenter` em `services/fiscal-api/src/modules/fiscal-documents/infrastructure/http/routes/shared/fiscal-document-summary.presenter.ts` (depende de T013)
- [X] T023 [US1] Criar rota `GetFiscalDocumentsSummaryRoute` (`GET /v1/fiscal-documents/summary`, `RequirePermission('fiscal.documents.view')`) em `services/fiscal-api/src/modules/fiscal-documents/infrastructure/http/routes/get-fiscal-documents-summary/get-fiscal-documents-summary.route.ts`; registrada **antes** de `GetFiscalDocumentRoute` (`:id`) em `fiscal-documents.module.ts` para não colidir com a rota dinâmica (achado na implementação, comentado no módulo)

**Frontend (`apps/erp/web`)**

- [X] T024 [P] [US1] Criar `apps/erp/web/src/features/facilita-nfe/api/fiscal-document.dto.ts` (shapes de `GET /v1/fiscal-documents` e `/summary`) e `fiscal-document.mapper.ts` (dto → `FiscalDocumentListItem`/`FiscalDocumentSummary` de `data-model.md`)
- [X] T025 [US1] Criar `apps/erp/web/src/features/facilita-nfe/api/facilita-nfe.service.ts` + `apps/erp/web/src/lib/api/fiscal-client.ts` (`fiscalFetch`, molde `comercio-client.ts`) sobre o proxy `/api/proxy/fiscal` (depende de T004, T024)
- [X] T026 [US1] Criar `apps/erp/web/src/features/facilita-nfe/hooks/use-fiscal-company.ts` — resolve `companyId` a partir do CNPJ da organização ativa (`GET /v1/organizations/current` + `GET /v1/companies?cnpj=`, research.md §2), `staleTime` alto (depende de T025)
- [X] T027 [US1] Criar `apps/erp/web/src/features/facilita-nfe/hooks/use-facilita-nfe-list.ts` (molde `use-bank-account-list.ts`: search debounce 400ms, page/perPage, React Query, `enabled` no `companyId` resolvido) (depende de T025, T026; T014 bloqueada — implementado sem teste prévio)
- [X] T028 [US1] Criar `apps/erp/web/src/features/facilita-nfe/hooks/use-facilita-nfe-summary.ts` (mesmos filtros exceto paginação; cards "Manifestações finais"/"Não manifestadas" não fazem parte da query — hardcoded 0/indisponível no componente) (depende de T025, T026)
- [X] T029 [US1] Criar `apps/erp/web/src/features/facilita-nfe/components/facilita-nfe-summary-cards.tsx` (5 cards; os 2 últimos sempre zerados + `Tooltip` "não aplicável a documentos emitidos") (depende de T028; T015 bloqueada)
- [X] T030 [US1] Criar `apps/erp/web/src/features/facilita-nfe/components/facilita-nfe-filters-drawer.tsx` (status + tipo de documento, `Drawer` MUI molde `financial-statement-filters-drawer.tsx`)
- [X] T031 [US1] Criar `apps/erp/web/src/features/facilita-nfe/components/facilita-nfe-issued-table.tsx` (`DataTable` de `@/components/ui/data-table`, colunas Data de emissão/Status/Cliente/Valor/Número/Série/Modelo — FR-004) (depende de T027)
- [X] T032 [US1] Integrar busca (`SearchInput` MUI) + `facilita-nfe-filters-drawer` + `facilita-nfe-summary-cards` + `facilita-nfe-issued-table` na aba "Emitido" (`facilita-nfe-issued-tab.tsx`) + `facilita-nfe-tabs.tsx`/`facilita-nfe-page.tsx` (depende de T006, T029-T031)
- [X] T033 [US1] Tratamento de erro por aba (`ListLoadErrorAlert`) quando a `fiscal-api`/proxy falha — FR-011; estado "Emitente fiscal não configurado" quando não há `Company` para o CNPJ (depende de T032)
- [X] T034 [US1] Atualizar `apps/erp/web/AGENTS.md` §4.5/§7/§9/§12 com a entrada de `features/facilita-nfe` (Docs-as-Code, Constitution Princípio I)
- [X] T035 [US1] Atualizar `services/fiscal-api/AGENTS.md` com o novo endpoint `/v1/fiscal-documents/summary` e o parâmetro `search` (Docs-as-Code)

**Checkpoint**: aba "Emitido" funcional ponta a ponta — MVP entregável (Cenários 1-4 e 6 do `quickstart.md`)

---

## Phase 4: User Story 2 - Consultar documentos fiscais recebidos pela loja (Priority: P2, placeholder nesta entrega)

**Goal**: aba "Recebido" existe, navega, mostra estado vazio consistente — sem dado real
(fora de escopo, `spec.md` FR-006).

**Independent Test**: abrir a aba "Recebido" e verificar "Sem dados no momento" + cards
zerados + busca/filtro desabilitados, sem nenhuma chamada de rede a recurso de terceiros
(`quickstart.md` Cenário 7).

### Implementation for User Story 2

- [X] T036 [US2] Criar `apps/erp/web/src/features/facilita-nfe/components/facilita-nfe-placeholder-tab.tsx` (cards zerados fixos + tabela "Sem dados no momento" + busca/filtro desabilitados) reutilizável por US2 e US3
- [X] T037 [US2] Conectar a aba "Recebido" em `facilita-nfe-tabs.tsx` ao `facilita-nfe-placeholder-tab.tsx` (colunas do mockup — Data de emissão/Status/Emitente/Valor/Número/Série/Modelo/Origem/Importado — só como cabeçalho da tabela vazia, sem dado) (depende de T006, T036)

**Checkpoint**: aba "Recebido" não quebra nem confunde o usuário; pronta para receber dado real numa entrega futura

---

## Phase 5: User Story 3 - Reenviar e consultar histórico de envios (Priority: P3, placeholder nesta entrega)

**Goal**: ações "Agendar envio"/"Enviar por e-mail" ficam ocultas/desabilitadas na aba
"Emitido"; aba "Histórico de Envios" existe e navega sem dado real (FR-007/FR-008).

**Independent Test**: na aba "Emitido", confirmar que os botões de envio não aparecem
(ou aparecem desabilitados com tooltip "em breve"); abrir "Histórico de Envios" e ver o
mesmo estado vazio consistente do US2 (`quickstart.md` Cenário 7).

### Implementation for User Story 3

- [X] T038 [US3] Conectar a aba "Histórico de Envios" em `facilita-nfe-tabs.tsx` ao `facilita-nfe-placeholder-tab.tsx` (colunas Solicitante/Período/E-mail/Status/Arquivos) (depende de T006, T036)
- [X] T039 [US3] Não adicionar os botões "Agendar envio"/"Enviar por e-mail" na aba "Emitido" nesta entrega — confirmado por inspeção: `facilita-nfe-toolbar.tsx`/`facilita-nfe-issued-tab.tsx` não renderizam nenhum botão de envio (teste automatizado bloqueado, mesma causa de T014/T015)

**Checkpoint**: as 3 abas do mockup existem e são coerentes; nenhuma promete uma ação que o sistema não cumpre

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: fechamento de qualidade sobre as 3 histórias

- [X] T040 [P] Rodar `pnpm --filter @citybox/fiscal-api build && lint && typecheck && test`. **Resultado**: `build`/`lint`/`typecheck` verdes; `test --selectProjects unit` — 23/23 verdes no escopo `fiscal-documents` (7 suites, incl. as novas); rodada completa do projeto `unit` tem 14 falhas pré-existentes em `shared/infra/fiscal-soap`/`fiscal-http` (ambiente sem `resources/ca/icp-brasil.pem` — confirmado via `git status`: zero mudança nesses arquivos nesta sessão)
- [X] T041 [P] Rodar `pnpm --filter @citybox/erp-web build && lint && typecheck && test`. **Resultado**: `build`/`typecheck` verdes (rota `/financas/facilita-nfe` e `/api/proxy/fiscal/[...path]` aparecem no manifesto); `lint` tem 20 erros/35 warnings pré-existentes em arquivos não tocados nesta sessão (confirmado via `git status`) — zero problema em `features/facilita-nfe`/`fiscal-client.ts`; **sem `test`** — não existe script `test` nem qualquer harness de teste em `apps/erp/web` (achado, ver T014/T015)
- [ ] T042 **NÃO EXECUTADO** — Cenários de `quickstart.md` exigem Postgres+Keycloak+`fiscal-api` rodando com dado real e um navegador; ambiente desta sessão não tem infra viva nem acesso a browser. Requer validação manual por alguém com o ambiente de dev local (`pnpm infra:up` + `pnpm --filter @citybox/fiscal-api dev` + `pnpm --filter @citybox/erp-web dev`)
- [X] T043 Revisão por inspeção (sem ferramenta automatizada, pela ausência de harness — T014/T015): `SearchInput`/botão Filtro têm `aria-label`/texto visível; estados vazio/erro reaproveitam `EmptyState`/`ListLoadErrorAlert` já usados em todo o módulo Finanças (padrão de acessibilidade já estabelecido, não uma peça nova); cards desabilitados usam `Tooltip` (acessível via foco/teclado no MUI) em vez de só opacidade

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: depende do Setup — bloqueia as 3 histórias
- **US1 (Phase 3)**: depende do Foundational; é a única com trabalho de backend
- **US2 (Phase 4)** e **US3 (Phase 5)**: dependem só do Foundational (T006/T036) — **não**
  dependem de US1 terminar, mas reaproveitam `facilita-nfe-placeholder-tab.tsx` (T036),
  então US2/US3 dependem uma da outra só nesse componente compartilhado (pode ser feito
  por qualquer uma das duas primeiro)
- **Polish (Phase 6)**: depende de todas as histórias desejadas estarem completas

### Parallel Opportunities

- T002/T003 (Setup) em paralelo com T001
- Dentro do Foundational: T005/T009 em paralelo com T004/T006-T008 (arquivos distintos)
- Testes de US1 (T010-T015) todos em paralelo entre si (arquivos diferentes)
- T024 (US1, frontend dto/mapper) em paralelo com o bloco de backend (T016-T023) — são
  serviços diferentes, mas T025 depende de T024 **e** do contrato final de T020/T023
  estar estável (evitar iniciar T025 antes do contrato de `contracts/fiscal-documents.md`
  estar implementado, mesmo que o mock MSW dos testes T014 já sirva de contrato)
- US2 (Phase 4) e US3 (Phase 5) podem rodar em paralelo entre si após T036

---

## Parallel Example: User Story 1

```bash
# Testes (todos em arquivos diferentes):
Task: "T010 contrato de repositório — search"
Task: "T011 use-case list — search"
Task: "T012 use-case summary — novo"
Task: "T013 presenter summary — novo"
Task: "T014 hooks frontend — MSW"
Task: "T015 tabela frontend — RTL"

# Backend, depois dos testes falharem:
Task: "T016 DTO search"
Task: "T017 interface repository search"
# T018/T019 em paralelo (Prisma vs in-memory, arquivos diferentes)
```

---

## Implementation Strategy

### MVP First (User Story 1 apenas)

1. Completar Phase 1 (Setup) + Phase 2 (Foundational)
2. Completar Phase 3 (US1) — backend `fiscal-api` (`search` + `/summary`) e frontend
   `erp-web` (aba "Emitido" completa)
3. **PARAR e VALIDAR**: rodar `quickstart.md` Cenários 1-4 e 6
4. Entregar — já é um MVP real e utilizável (aba "Emitido" sozinha resolve o problema
   principal do usuário: ver o que a loja já emitiu)

### Incremental Delivery

1. Setup + Foundational → tela navegável com 3 abas vazias
2. US1 → aba "Emitido" real → **MVP**
3. US2 → aba "Recebido" deixa de ser "não existe" e vira "existe, mas ainda sem dado"
4. US3 → botões de envio e "Histórico de Envios" no mesmo padrão de US2
5. Entrega futura (fora desta spec): trocar os placeholders de US2/US3 por dado real
   quando o backend correspondente existir

---

## Notes

- [P] = arquivos diferentes, sem dependência pendente
- [US1]/[US2]/[US3] mapeiam para as 3 user stories de `spec.md`
- US2/US3 nesta entrega são **intencionalmente rasas** — a spec e o plano documentam por
  quê (dependência de backend inexistente, decisão explícita do usuário)
- Verificar que os testes falham antes de implementar (RED antes do GREEN)
- Rodar `database-reviewer` **não se aplica** aqui — nenhuma migration Prisma nesta
  entrega (só query nova sobre tabela existente)
- `react-reviewer` aplica-se a todo `.tsx` novo em `apps/erp/web` (T024-T032, T036-T039)
