# Phase 0 Research: Ajustes no módulo Financeiro

## R1 — Entidade `PaymentMethod` no backend (FR-006, FR-018..FR-022)

**Decision**: Nova entidade `PaymentMethod` em `apps/erp/api/src/modules/finance/payment-methods/`, seguindo exatamente o padrão Clean Architecture já usado por `cost-centers` (referência canônica): `domain/{entities,repositories,errors}`, `application/{dtos,use-cases/{create,update,delete,restore,list,find-by-id}-payment-method}`, `infrastructure/{database,http/routes}`. Coluna `paymentMethodId`/`paymentMethod` em `FinancialEntryPayment` **permanece `String` livre** (sem `@@relation`/FK); a validação passa de `@IsIn(FINANCIAL_ENTRY_PAYMENT_METHODS)` (enum fixo) para "é UUID + existe na tabela `PaymentMethod` da organização", replicando o padrão `assert-cost-center-exists.ts`.

**Rationale**:
- Manter `String` solto evita quebrar os `FinancialEntryPayment` já persistidos com os 7 valores do enum antigo (`dinheiro`, `pix`, `debito`, `credito`, `boleto`, `deposito`, `transferencia`, e o gerado pelo motor `conciliacao_bancaria`) — não há necessidade de migração de backfill nem de lidar com violação de FK para dado histórico órfão.
- Atende diretamente o Edge Case do spec: "lançamento antigo cuja forma de pagamento não corresponde a mais nenhuma forma cadastrada continua sendo exibido, somente leitura".
- `cost-centers` já resolve exatamente os requisitos FR-018 (seed de sistema), FR-019 (proteção contra edição/exclusão de item `isSystem`) e FR-021 (bloqueio de exclusão se em uso) com o padrão `isSystem` + `CostCenterNotRemovableError`; replicar 1:1 minimiza risco e tempo de implementação.

**Alternatives considered**:
- FK real (`@relation`) com `onDelete: SetNull` — rejeitada: exigiria migração de backfill mapeando os 7 valores do enum antigo para os `id`s dos 15 registros de sistema, e ainda assim qualquer valor órfão (typo histórico, dado de import) quebraria a constraint. Ganho de integridade referencial não compensa o risco em produção com dados já existentes.
- Manter só no frontend (store compartilhado em memória) — rejeitada pelo usuário nas Clarifications: não persiste entre sessões/usuários, o que contraria FR-022 ("única origem de dados").

## R2 — Proteção `isSystem` em `PaymentMethod` (FR-019)

**Decision**: Replicar o padrão de `cost-centers`/`financial-groups` para exclusão (`DeletePaymentMethodUseCase` lança `PaymentMethodNotRemovableError` se `isSystem === true`, antes de qualquer soft-delete). Para edição, **estender** o padrão: diferente de `cost-centers` (que não bloqueia update em `isSystem`), `UpdatePaymentMethodUseCase` MUST bloquear qualquer alteração quando `isSystem === true` — espelhando o único precedente existente no monorepo para "bloquear edição de item de sistema", que é `financial-group-immutable-field.error.ts` em `financial-groups`.

**Rationale**: FR-019 exige explicitamente "impedir a **edição e** a exclusão" (não só exclusão, ao contrário de `cost-centers`). `financial-groups` já resolveu esse exato problema (proteção de campo imutável em item de sistema) — reaproveitar a mesma forma de erro de domínio evita inventar um padrão novo.

**Alternatives considered**: Bloquear só no frontend (desabilitar botão Editar) — rejeitada: não é defesa em profundidade; a API precisa recusar a mutação independente do client.

## R3 — Seed dos 15 registros padrão de `PaymentMethod` (FR-018)

**Decision**: Espelhar o mecanismo de provisionamento já existente para `financial-groups`/`chart-of-accounts`/`cost-centers`: adicionar `SEED_PAYMENT_METHODS` (15 itens, cada um com `systemKey` estável) em `apps/erp/api/src/modules/store-setup/application/seed-data/finance.seed.ts`, uma função `writePaymentMethods` (upsert idempotente por `systemKey`, religando `isSystem: true` + `deletedAt: null`) em `.../store-setup/infrastructure/database/writers/finance.writer.ts`, e registrar a chamada em `apply-erp-seed-template.ts`.

**Rationale**: É exatamente o mesmo mecanismo usado para os outros 3 cadastros "de sistema" do módulo financeiro — zero padrão novo, zero surpresa para quem já conhece `store-setup`.

**Alternatives considered**: Migration Prisma com `INSERT` direto — rejeitada: não seria reaplicado para organizações criadas depois desta migration (o padrão do monorepo já resolveu esse problema via `store-setup`, que roda no provisionamento de cada organização).

## R4 — Consumidores do enum fixo de forma de pagamento no frontend (FR-006, FR-022)

**Decision**: Substituir `FINANCIAL_ENTRY_PAYMENT_METHODS` (constante estática) por um hook `usePaymentMethodOptionsQuery` (React Query, molde `useChartOfAccountOptionsQuery`/`useCostCenterOptionsQuery`) nos 2 pontos de consumo identificados:
- `financial-entry-payments-section.tsx` (seção Pagamentos do formulário de lançamento — FR-006)
- `transfer-dialog.tsx` (diálogo de Transferências entre contas — fora do escopo direto do pedido do usuário, mas usa a mesma constante; **incluir na mesma migração** para não deixar uma segunda fonte de forma de pagamento divergente logo depois de consolidar a primeira)

**Rationale**: `grep` confirmou que só existem esses 2 consumidores reais no app; migrar os dois junto evita reabrir a mesma tarefa em uma fatia futura por causa de um consumidor esquecido.

**Alternatives considered**: Migrar só `financial-entry-payments-section.tsx` e deixar `transfer-dialog.tsx` no enum antigo — rejeitada: violaria FR-022 ("única origem de dados para qualquer select de forma de pagamento no módulo financeiro") no primeiro release desta fatia.

## R5 — `features/payment-methods` (frontend): o que muda vs. o que fica

**Decision**:
- **Descarta**: `services/payment-method.service.ts` (store in-memory), `hooks/use-payment-method-store.ts` (`useSyncExternalStore`), `data/mock-payment-methods.ts`.
- **Cria**: `api/` (dto + mapper + `payment-methods.service.ts` via `comercioFetch`, molde `features/cost-centers/api/`), `hooks/` (query-keys + queries + mutations, molde `use-cost-center-queries.ts`/`use-cost-center-mutations.ts`).
- **Mantém sem alteração estrutural**: `components/payment-method-list.tsx`, `components/payment-method-row-actions.tsx`, `data/payment-method-options.ts` (tabela fiscal `tPag`, catálogo estático não relacionado à entidade), `types/payment-method.ts` (formato já compatível, só passa a ser preenchido pela API em vez do mock).
- **Ajusta**: `components/payment-method-form-dialog.tsx` (troca chamada direta ao store por mutation), `pages/payment-method-list-page.tsx` (troca `usePaymentMethodStore()` por hook de query real), `selectPaymentMethodGroups` vira helper de mapper (a função pura de separação sistema/próprias sobrevive, só muda a fonte do array).

**Rationale**: Minimiza diff — a UI já está pronta e no padrão certo (`Dialog` MUI, sem `DataTable`, duas listas empilhadas); só a camada de dados precisa trocar, no mesmo molde já usado por `cost-centers`/`financial-groups` nesta mesma pasta `features/`.

## R6 — Estrutura de categorias do DRE (User Story 5, FR-010..FR-012)

**Decision**: Duas mudanças coordenadas, não uma só:
1. **Dado**: seed de 9 novos `FinancialGroup` (Receitas Operacionais, Deduções da Receita, Custos Operacionais, Despesas Operacionais, Despesas Financeiras, Outras Receitas, Outras Despesas, Descontos/Taxas, Juros/Multa) com `classification: 'resultado'`, cada um com um **campo de ordem de catálogo** e **sinal** (`+`/`-`) — ambos precisam existir no schema (ver Open Question abaixo); mais os `ChartOfAccount` filhos das subcategorias (3 em Receitas Operacionais, 2 em Juros/Multa).
2. **Lógica**: `GetIncomeStatementUseCase` reescrito para (a) iterar **todos** os `FinancialGroup` ativos de `classification=resultado` na ordem do catálogo — não só os que têm `sums` no período —, preenchendo zero quando não há allocation; (b) parar de ordenar por `totalCents desc`; (c) expor o sinal por grupo em vez da forma binária `revenue`/`expense`; (d) calcular um único total "Resultado Operacional" somando todos os grupos com seus sinais.

**Rationale**: O agente de grounding confirmou que o use-case atual só itera grupos **com soma no período** e ordena por valor — isso contraria diretamente o requisito de "9 categorias sempre visíveis, em ordem fixa, mesmo com valor zero" (Edge Case do spec). Não dá para resolver só com seed; a agregação em si precisa mudar.

**Alternatives considered**: Manter a forma binária `revenue`/`expense` do DTO atual e só trocar os nomes dos grupos — rejeitada: o modelo pedido tem categorias com sinal próprio fora do binário receita/despesa (ex.: "Deduções da Receita (+)" e "Descontos/Taxas (-)" não mapeiam limpo em "é receita ou é despesa"), então o DTO precisa mesmo virar uma lista ordenada de grupos com sinal.

**Open Question resolvida para o design (não é [NEEDS CLARIFICATION] — é decisão técnica de implementação, não de produto)**: `FinancialGroup` ganha 2 campos novos — `catalogOrder: Int` (ordem de exibição fixa) e `sign: FinancialGroupSign` (`positive`/`negative`) — ambos **não expostos no formulário de cadastro de Grupo financeiro** (mesma decisão já tomada para `classification`, que também é consumido só pela DRE e não aparece no CRUD de `/financas/grupo-financeiro`, ver `apps/erp/web/AGENTS.md` §4.5). Ver `data-model.md`.

## R7 — Grades de `/financas/extratos` e `/financas/lancamentos` (FR-003, FR-004)

**Decision**:
- `/financas/lancamentos`: a tabela já tem 6 das 7 colunas pedidas na ordem certa; só falta separar "Valor" (hoje uma coluna única, `computeEntryTotal`) em duas — "Valor original" (`entry.baseAmountCents` ou equivalente já existente na entidade, ver `data-model.md`) e "Valor final" (o valor final já calculado hoje).
- `/financas/extratos`: mudança maior — remove "Fornecedor ou cliente" e "Tipo", adiciona "Método de pagamento" (não existe hoje na tabela — dado já disponível no item, mesmo padrão de `financial-entries`), troca a coluna única de data (toggle competência/vencimento) por **duas colunas fixas simultâneas** (Competência e Vencimento), e separa Valor em original/final como em Lançamentos.

**Rationale**: Grounding confirmou a estrutura atual exata de ambas as tabelas (`financial-entry-list-table.tsx`, `financial-statement-table.tsx`) — a mudança é mecânica (adicionar/remover/reordenar `columns[]`), sem necessidade de endpoint novo, já que o item de lista já carrega esses campos (ou campos equivalentes) do backend.

**Alternatives considered**: Manter o toggle competência/vencimento como coluna única no Extrato e só trocar o rótulo — rejeitada: a spec (FR-003, US1) pede as duas colunas simultaneamente, não uma alternável; o toggle de filtro (`dateAxis`) continua controlando **o filtro de busca**, só a tabela deixa de alternar a coluna exibida.

## R8 — Auto-detecção de conta bancária na importação de OFX (FR-007a/b)

**Decision**: No `ImportBankStatementUseCase` (ou numa camada antes dele, no controller/handler HTTP), tornar `bankAccountId` opcional no DTO; quando ausente, o backend MUST parsear o arquivo primeiro (já existe: `parseOfxFile` já extrai `bankCode`), buscar contas bancárias ativas da organização com `bankCode` igual ao do arquivo, e usar a conta encontrada **somente se exatamente 1 resultado** — senão segue sem `bankAccountId` (extrato fica sem conta associada, consistente com o Edge Case do spec). No frontend, `StatementImportDialog` perde o `required` do campo e ganha lógica de pré-seleção client-side (parse do arquivo já acontece no browser? Não — hoje o parse é 100% backend; a pré-seleção portanto **precisa vir da resposta da API**, não pode ser calculada no client antes do upload).

**Rationale/consequência de design importante**: como o parser OFX só roda no backend hoje, o fluxo de "pré-selecionar automaticamente antes do usuário confirmar" (conforme a User Story 4 descreve) exige uma chamada prévia ao servidor para inspecionar o arquivo **antes** da importação definitiva — não dá para resolver isso só no frontend. Duas abordagens possíveis, ambas compatíveis com o FR:
  - (a) **Preview endpoint novo** (`POST /v1/bank-reconciliation/statements/preview` ou similar) que só faz o parse e devolve `bankCode` + sugestão de conta, sem persistir nada — o dialog chama esse endpoint ao selecionar o arquivo, pré-seleciona o campo, e só then o usuário confirma o import de fato.
  - (b) **Auto-detecção só no momento do import definitivo** (sem preview) — o campo Conta bancária fica vazio/opcional até o clique em "Importar"; o backend resolve a conta sozinho quando `bankAccountId` vier vazio, e a UI mostra o resultado (conta associada ou "sem conta") só na tela seguinte/toast de sucesso, não antes.
  - Como a User Story 4 e o Acceptance Scenario 1 descrevem explicitamente "o campo é pré-selecionado automaticamente, permanecendo editável" **antes** da confirmação, a opção (a) é a que atende literalmente o texto aprovado nas Clarifications — fica registrada aqui como decisão de design a confirmar no `/speckit-tasks` seguinte, não é ambiguidade de produto (já resolvida), é sequenciamento técnico.

**Alternatives considered**: Fazer parse do OFX no browser (JS) só para extrair `BANKACCTFROM.BANKID` e evitar round-trip — rejeitada: duplicaria a lógica de parsing/charset (o parser atual lida com detecção de charset CP1252/UTF-8/ISO-8859-1 e formatos OFX 1.x SGML vs 2.x XML, ver `ofx-parser.ts`) em dois lugares, alto risco de divergência de comportamento entre preview (client) e import real (server).

**Status de implementação (grounding em 2026-08-09)**: R8 já foi implementado — `PreviewBankStatementMutation`/`GET .../preview` existem e `StatementImportDialog` já usa `<input type="file" accept=".ofx" hidden>` (não é mais campo de texto). Um relato do usuário nesta data de que o campo "ainda é texto" não bateu com o código lido; tratado como pendência de reteste (cache/build), não como regressão de escopo — ver nota em `checklists/requirements.md`.

## R9 — Bloqueio de exclusão de lançamento com pagamento conciliado (FR-006e/f, US10)

**Decision**: `DeleteFinancialEntryUseCase` passa a consultar, antes do `softDelete()`, `BankStatementMatchRepository.findActiveFinancialEntryIds(organizationId, [entry.id])` (método **já existente**, hoje usado por `reconcile-transaction` para excluir candidatos já conciliados de sugestão/busca). Se o `Set` retornado contiver `entry.id`, lança um novo erro de domínio `FinancialEntryNotRemovableError` (409), com mensagem apontando para desfazer a conciliação primeiro.

**Correção de grounding (pós primeira leitura)**: `BankStatementMatch` **não** tem campo de status próprio — o comentário do repositório é explícito: *"o vínculo só existe enquanto ativo"* (`bank-statement-match.repository.interface.ts`, referência a `research.md D6` de outra spec). Ou seja, a linha é **hard-deletada** quando a conciliação é desfeita (`deleteByTransactionId`, método também já existente), não marcada com um status. Portanto a checagem correta é só "existe alguma linha de `BankStatementMatch` para este `financialEntryId`" — **não** é necessário juntar com `BankStatementTransaction.status`; `findActiveFinancialEntryIds` já faz exatamente essa query e é reaproveitada sem alteração.

**Achado de grounding — rota de desfazer conciliação está incompleta**: o método de domínio `BankStatementTransaction.undoReconciliation()` já existe (comentário no código já cita `FR-020`), e o frontend já tem `undoReconciliationApi`/`useUndoReconciliationMutation` chamando `POST /v1/bank-statements/:bankStatementId/transactions/:transactionId/reconcile/undo` — mas **não existe rota, controller nem use-case correspondente no `erp-api`** (`grep` não encontra nenhum `@Post('.../reconcile/undo')` nem chamada a `undoReconciliation()` fora da entidade). Ou seja, hoje o botão "Desfazer conciliação" do frontend (se exposto em alguma tela) resulta em 404 — a Acceptance Scenario 2 de US10 ("desfazer a conciliação e a exclusão passa a ser permitida") **depende dessa rota existir**, senão o bloqueio de FR-006e vira uma trava permanente sem saída para o usuário.

**Decisão de escopo**: implementar o `UndoReconciliationUseCase` + rota faltante como parte desta fatia (não é uma feature nova de produto — é fechar um contrato que o frontend já assume existir; sem isso, FR-006f fica não-testável). O use-case: (1) carrega a `BankStatementTransaction`, valida `status === 'reconciled'` (senão `BankStatementTransactionNotReconciledError`, erro **já existente**, hoje sem nenhum lançador); (2) `transaction.undoReconciliation()` + `save`; (3) `bankStatementMatchRepository.deleteByTransactionId(organizationId, transactionId)` (método **já existente**, hard-delete dos matches — consistente com D6). Nenhum método novo de repositório é necessário; só o use-case + rota + módulo. Registrar como task explícita em `/speckit-tasks`, módulo `bank-reconciliation` (não `financial-entries`).

**Alternatives considered**:
- Bloquear a exclusão sem prover nenhum caminho de desfazer — rejeitada: contraria FR-006f e deixa o usuário sem saída, pior que o comportamento atual.
- Criar um método de repositório novo, dedicado, em vez de reaproveitar `findActiveFinancialEntryIds` — rejeitada: o método existente já faz exatamente a query necessária (mesma tabela, mesmo filtro), criar outro seria duplicação sem ganho.

**Achado adicional de grounding — direção de dependência entre módulos**: `bank-reconciliation` já importa `FinancialEntriesModule` (D2 de `specs/erp/006-bank-reconciliation/research.md`) — é uma dependência de **mão única**. `DeleteFinancialEntryUseCase` vive em `financial-entries`, então precisar de `BankStatementMatchRepository` (dono de `bank-reconciliation`) inverteria essa direção e criaria um ciclo (`financial-entries` → `bank-reconciliation` → `financial-entries`). D2 já registrou que esse par de módulos não tinha, até agora, o histórico de import circular que levou `sales`/`finance` a usar Prisma direto (`specs/erp/005-card-receivables-engine/research.md` D1) — esta fatia é a primeira vez que o ciclo aparece de verdade nessa dupla.

**Decision (wiring)**: usar `forwardRef(() => BankReconciliationModule)` em `FinancialEntriesModule` (e o lado espelhado, `forwardRef(() => FinancialEntriesModule)`, já pode ser necessário em `BankReconciliationModule` — a confirmar ao implementar) para injetar `BankStatementMatchRepository` em `DeleteFinancialEntryUseCase`, em vez de duplicar a query via Prisma direto. É a ferramenta padrão do NestJS para exatamente este caso (dependência circular real entre módulos irmãos), documentada e testável, e evita repetir a decisão do `005` (Prisma direto) para um caso onde a lógica a reaproveitar é uma única query de existência — não a agregação complexa que motivou o Prisma direto em `005`.

**Alternative considered**: Prisma direto no `DeleteFinancialEntryUseCase` para consultar `bank_statement_matches` sem depender do módulo — rejeitada porque duplicaria a tabela/nome de coluna fora do repositório dono, além do `database-reviewer` provavelmente sinalizar acesso cross-schema sem passar pelo repository pattern do módulo dono (Constitution/`patterns.md` — Repository Pattern). Reservar Prisma direto para quando `forwardRef` realmente não resolver em implementação (não esperado aqui, dado que é só 1 método simples).

## R10 — Catálogo de Bandeira em Pagamentos de lançamento (FR-006a..d, US9)

**Decision**: Ampliar `CARD_BRAND_OPTIONS` (`apps/erp/web/src/features/card-contracts/data/card-brands.ts`) para a união das opções hoje existentes (Visa, Mastercard, Elo, American Express, Hipercard, Diners Club, Discover, Sodexo, Alelo, Outra) com as pedidas nesta fatia (Sorocred, Credicard, Ticket, VR Benefícios, Banricompras, MasterCard/American Express/Outros — já cobertos ou variação de grafia), preservando os `value`s já persistidos em `CardPaymentMethod.brand`/`SaleOrderPayment.cardBrand` (ex.: manter `"Mastercard"` como `value`, não trocar para `"MasterCard"`, para não invalidar dado já gravado que o motor de recebíveis compara por igualdade exata — `apps/erp/api/AGENTS.md` §9/§10). Trocar `financial-entry-payments-section.tsx` de `Autocomplete freeSolo` (com `useCardBrandSuggestionsQuery`, que lê sugestões dinâmicas do histórico) para `Select` fechado sobre `CARD_BRAND_OPTIONS`, no mesmo padrão já usado em `sales-orders` (decisão de arquitetura de 2026-08-06 registrada no `AGENTS.md` do `erp-web`).

**Rationale**: A Clarification de 2026-08-09 already resolveu "mesmo catálogo compartilhado, ampliado, sem remover opção existente" — aqui só a mecânica: `CardPaymentMethod.brand`/`FinancialEntryPayment.cardBrand` continuam `String` livre no schema (sem FK), então ampliar a constante de frontend não exige migration. `useCardBrandSuggestionsQuery` (endpoint de sugestões dinâmicas) fica órfão após a troca — candidato a remoção se nenhum outro consumidor restar (`grep` a confirmar em `/speckit-tasks`).

**Alternatives considered**: Criar uma segunda constante `FINANCIAL_ENTRY_CARD_BRAND_OPTIONS` separada de `CARD_BRAND_OPTIONS` — rejeitada pela resposta do usuário na Clarification ("pode usar o mesmo card brand options"), que pediu explicitamente reaproveitamento, não duplicação.
