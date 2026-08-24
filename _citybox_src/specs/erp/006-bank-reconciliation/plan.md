# Implementation Plan: Conciliação bancária — importação de OFX e casamento com lançamentos

**Branch**: `006-bank-reconciliation` | **Date**: 2026-08-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/erp/006-bank-reconciliation/spec.md`

## Summary

Hoje `/financas/conciliacao-bancaria` é `PlaceholderPage` e não existe nenhum código de conciliação
bancária nos dois lados — módulo inteiramente novo. Esta entrega implementa: (1) importação de um
arquivo OFX associado a uma conta bancária, com parsing (charset explícito — bancos BR costumam vir
em Windows-1252/ISO-8859-1) e dedupe por conta; (2) sugestão automática de casamento contra os
lançamentos financeiros da mesma conta (valor exato, janela de ±3 dias, lista de candidatos quando
há empate); (3) conciliação — sugestão, busca manual, soma de N lançamentos e criação de lançamento
direto da tela — todas convergindo para o **mesmo mecanismo já existente** de `FinancialEntryPayment`
+ `syncLedgerMovements` (marca o lançamento como pago **e** gera a `BankTransaction`, numa única
operação, sem duplicar saldo); (4) exclusão/desfazer, sempre reversível.

**Achado crítico do research**: os lançamentos mais prováveis de conciliar (recebíveis de venda do
motor de cartões, `005-card-receivables-engine`) são `isReadOnly` no domínio de `FinancialEntry` — o
método `update()` existente rejeitaria a operação. Esta entrega adiciona dois métodos de domínio
novos (`addPayment`/`removePayment`) que ignoram esse guard de propósito, porque FR-021 já separa
"dados descritivos" (bloqueados) de "status de pagamento" (permitido).

**Descoberta que muda o desenho sugerido no prompt original**: o schema já reserva
`BankTransactionSourceType.reconciliation` para esta feature — mas usá-lo geraria uma **segunda**
`BankTransaction` para o mesmo dinheiro, em paralelo à que o pagamento adicionado já dispara.
`research.md` D3 documenta a decisão de **não** usar esse valor reservado.

**Addendum 2026-08-10 (`/speckit-clarify` — layout de referência)**: 3 mockups trouxeram US4
("Somar lançamentos") de volta ao escopo desta leva de implementação — o `manual-match-drawer.tsx`
já estava desenhado desde o início como multi-select (`Set<string>`, molde `ProductPickerDrawer`,
ver Project Structure abaixo), então **nenhuma mudança de desenho** foi necessária ali, só a
implementação estava incompleta (single-select). Duas decisões novas, genuinamente fora do desenho
original: `create-entry-from-transaction` ganha `bankAccountId` editável (`research.md` D14) e
`list-statement-transactions` ganha filtro de período por `postedAt` (`research.md` D15, rotulado
"Período" na UI — a transação de extrato não tem "vencimento"). O filtro "Conta" do drawer de busca
continua travado na conta do extrato (nenhuma mudança de elegibilidade, FR-016/FR-037). As imagens
de referência são tratadas como layout/estrutura, não como skin — componentes seguem
`@citybox/mui`/tema já adotado no app (Assumptions do spec).

**Addendum 2026-08-11 (`/speckit-clarify` — comparação CPLUG x ERP Citybox, gap de layout + bug)**:
usuário comparou o layout implementado com as 3 imagens de referência e apontou divergência
estrutural real (não só de tema) + um bug funcional (busca manual filtrando só `status=pending`).
Cinco decisões novas: (1) busca manual passa a incluir lançamentos `paid` sem vínculo ativo — exige
ramo novo em `reconcile-transaction` (D16: vínculo sem `addPayment` para `paid`, já que não há saldo
em aberto); (2) lista de Pendentes vira cards com botões reais (FR-039), sem seleção em lote; (3)
drawer "Buscar Registros" ganha filtros completos + tabela (FR-038) — exige endpoint novo dedicado
(D17: `GET .../eligible-entries`) porque a exclusão de já-vinculados (FR-033) não pode mais ficar
implícita em `status=paid`, e os filtros novos (paidFrom/paidTo, paymentMethod, cardBrand,
supplierId) não existiam no `FinancialEntryListCriteria`; (4) "Novo Registro" ganha seções
(Transação Financeira/Dados de pagamento/Classificação) com os campos travados como somente leitura
(FR-040), sem rateio múltiplo; (5) painel consolidado "Registros sugeridos" no rodapé da aba
Pendentes (FR-041), além da sugestão já embutida por card. `research.md` D16/D17 detalham o desenho
de backend; a superfície visual (cards/tabela/seções/painel) é puramente frontend, reaproveitando
`@citybox/mui` — sem novo model/migration.

**Addendum 2026-08-14 (`/speckit-clarify` + `/speckit-plan` — nova comparação CPLUG x Citybox)**:
usuário apontou 4 ajustes de UI/UX; a análise do código real elevou 2 deles a mudanças de backend e
revelou 1 conflito de desenho entre as próprias decisões. Sete decisões novas (`research.md`
D18–D24):

1. **Divergência de valor migra para o cartão** (FR-016/FR-031/FR-039, D18) — puramente frontend.
   O drawer perde o alerta e a mensagem de recusa, mas **mantém** um totalizador neutro
   (Selecionado/Transação/Diferença, sem cor de erro): sem ele, montar uma soma exata de N
   lançamentos (FR-017) vira tentativa e erro. Decisão explícita do usuário em `/speckit-plan`.
2. **Filtro de conta destravado na busca** (FR-037 revogada, D19) — backend + frontend. Achado:
   `search-eligible-entries.use-case.ts:68` já faz `bankAccountId: bankStatement.bankAccountId ??
   undefined`, ou seja, extrato sem conta **já** busca em todas as contas. A mudança é aceitar um
   `bankAccountId` opcional vindo do query param (default = conta do extrato, limpável), não
   remover uma trava rígida — menor do que o addendum de 2026-08-11 sugeria.
3. **"Conciliar" na 1ª posição da linha de ações** (FR-039, D20) — frontend. Exige içar o estado de
   `useSuggestionsQuery` (hoje consumido dentro de `match-suggestion-card.tsx`) para a linha de
   ações de `transaction-card.tsx`, já que o botão passa a depender de haver sugestão.
4. **"Novo Registro" vira Drawer à direita** (FR-040, D21) — frontend. Troca `Dialog` por o mesmo
   `Drawer` de `@citybox/mui` já usado em `manual-match-drawer.tsx` (default `anchor="right"`).
5. **Movimentação sempre na conta do extrato** (FR-029/FR-030/FR-021, D22) — backend, **a mudança de
   maior risco desta leva**. Hoje `addPayment()` gera a movimentação na conta **do lançamento** (via
   `syncLedgerMovements`), não na do extrato — com a conta destravada isso deixa de ser equivalente.
   Exige: coluna nova `previousBankAccountId` em `BankStatementMatch` (+migration) para reverter no
   undo, e um método de domínio novo em `FinancialEntry` que troque `bankAccountId` **ignorando o
   guard `isReadOnly`**, pelo mesmo motivo já documentado em D4 para `addPayment`.
6. **Conciliação exige conta no extrato** (FR-042 nova, D23) — backend + frontend. Conflito real
   detectado no `/speckit-plan`: a decisão 2 é motivada por extratos sem conta (a 007 tornou
   `BankStatement.bankAccountId` nullable), mas a decisão 5 exige uma conta de destino. Resolução do
   usuário: busca liberada sem conta, **conciliação bloqueada** até a conta ser definida, mais uma
   ação nova para definir/corrigir a conta de um extrato já importado.
7. **`data-model.md` estava desatualizado** (D24) — documentava `BankStatement.bankAccountId` como
   obrigatório; o schema real é `String?` desde a 007. Corrigido nesta rodada.
8. **Conciliar `paid` exige mesma conta** (FR-043 nova, D25) — backend, guard sem schema.
   Acrescentado numa 2ª passada de `/speckit-clarify`+`/speckit-plan` no mesmo dia, disparada pelo
   achado **F1** do `/speckit-analyze`: a decisão 2 (conta destravada) invalidou a premissa de D16
   (2026-08-11), que assumia que a conta do lançamento era sempre a do extrato. Sem o guard,
   conciliar um `paid` da conta B com o extrato da conta A não geraria movimentação em lugar
   nenhum, contrariando SC-009. Decisão associada: a assimetria entre sugestão (restrita à conta) e
   busca manual (livre) é intencional e agora está documentada em FR-014.

**Addendum 2026-08-14 — 2ª rodada, disparada por teste em produção (`research.md` D26–D27)**: o
usuário testou a entrega no navegador e reportou 3 pontos. Diferente das rodadas anteriores (que
nasceram de comparação de layout), esta nasceu de **comportamento quebrado em uso real**, e o
diagnóstico mudou uma decisão tomada poucas horas antes.

1. **Não existe chave entre o OFX e o cadastro de contas** (FR-001 reescrita, D26) — a busca manual
   estava 100% bloqueada porque o extrato não resolve a conta. A causa não é o botão: `BankAccount`
   guarda só `bankCode`, o OFX traz agência e conta, e o único campo comum falha na prática. **A
   conta volta a ser obrigatória na importação**, revertendo a `007-financeiro-ajustes-ui` FR-007.
   Consequência direta: **FR-042/D23 vira regra de legado** — a rota `PATCH .../bank-account` deixa
   de ser caminho principal e passa a reparar extratos importados durante a janela de conta opcional.
   Isso torna T149–T156 (Phase 10) parcialmente obsoletas como desenhadas.
2. **Cliente/fornecedor** (FR-044 nova, D27) — dois defeitos sob o mesmo pedido: a tela de
   lançamentos filtra por estágio de CRM (`tab=active`) que **a interface não permite editar** (todo
   cliente nasce `lead`), e o formulário da conciliação usa **texto livre**, sem vínculo com cadastro
   nenhum. Vira seleção nas duas telas; `create-entry-from-transaction` passa a gravar
   `customerId`/`supplierId` — **FKs que já existem** em `FinancialEntry`, sem migration.
3. **Status não virou `paid`** — **não reproduziu**. Lançamento de teste criado em produção com
   pagamento de 100% ficou `paid`, exibido como "Recebido" (`statusLabel()`: `payable`→"Pago",
   `receivable`→"Recebido"). Usuário decidiu manter como está — nenhuma mudança de spec ou plano.

## Technical Context

**Language/Version**: TypeScript ~5.7 (backend NestJS 11 · frontend Next.js 16 / React 19)

**Primary Dependencies**: NestJS 11, Prisma 7.8 (schema único `apps/erp/api/prisma/schema.prisma`,
schema Postgres `erp`), MinIO (`minio` SDK, já dependência), **novas**: `ofx-js` (parser OFX 1.x/2.x,
zero deps de runtime) + `iconv-lite` (decodificação de charset — nenhuma lib de OFX resolve isso
corretamente, ver research.md D10); React Query 5, `@citybox/mui` (frontend)

**Storage**: PostgreSQL (schema `erp`) — 3 models novos (`BankStatement`,
`BankStatementTransaction`, `BankStatementMatch`), todos entrando em `TENANT_SCOPED_MODELS`; arquivo
OFX original no MinIO (bucket `erp`, via `ObjectStorage` já existente, nunca Postgres)

**Testing**: Jest (não node test runner nativo — correção de suposição do prompt original, ver
research.md D13), use cases contra repositórios in-memory, sem `TestingModule` do Nest; `ofx-parser`
e `match-suggester` com fixtures reais de arquivo (`tests/fixtures/*.ofx`, incluindo um em
Windows-1252/ISO-8859-1 acentuado)

**Target Platform**: Linux server (erp-api :3114) + navegador (erp-web :3107)

**Project Type**: web (API NestJS Clean Architecture + frontend Next.js App Router)

**Performance Goals**: importar e listar até 500 transações em <30s (SC-001) — parsing síncrono
dentro do próprio request HTTP, sem fila; sem meta de throughput além disso (RabbitMQ citado como
opção futura no prompt original, não adotado nesta entrega — YAGNI, sem medição que justifique)

**Constraints**: tamanho máximo do arquivo OFX = 10 MB (`413` acima disso, sem processamento
assíncrono nesta entrega); casamento automático é **exato** em valor, sem tolerância configurável
(decisão de `/speckit-clarify`); conciliação nunca reescreve dados descritivos de um lançamento
existente, só adiciona/remove uma linha de pagamento (FR-021)

**Scale/Scope**: 1 tenant único (Ilhéus, ADR C-15/single-city); volume de extratos por loja é
baixo-médio (comércio local, importação manual e esporádica) — sem necessidade de otimização de lote
ou importação assíncrona nesta entrega

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Docs-as-Code (hierarquia `AGENTS.md`) | ✅ Plano prevê atualizar `apps/erp/api/AGENTS.md` §9 (novo módulo `bank-reconciliation`, alteração em `financial-entries`) e `apps/erp/web/AGENTS.md` §4.1/§4.5/§9/§12 (nova feature, linha "Conciliação bancária ⬜ Placeholder" corrigida) na mesma operação que o código — critério de aceite já explícito no prompt original. |
| II. Busca/paginação no backend | ✅ `GET /v1/bank-statements` e `GET /v1/bank-statements/:id/transactions` paginados/filtrados/buscados no backend (contracts/), debounce 400ms no cliente (mesmo padrão de `financial-entries`/`bank-accounts`, sem hook `useDebouncedSearch` compartilhado — nenhuma feature do app tem hoje, YAGNI abrir precedente aqui). `DataTable` com objeto `pagination` server-side (não existe prop `manualPagination` no código real — corrigido do prompt original). **2026-08-10**: filtro de período (`postedFrom`/`postedTo`, D15) também backend-driven, mesmo padrão. **2026-08-11**: novo `GET .../eligible-entries` (D17, FR-038) segue o mesmo padrão — filtros/anti-join de já-vinculados e paginação resolvidos no backend, nunca client-side (motivo explícito em research.md D17, alternativa (a) descartada). |
| III. Package manager único (pnpm) | ✅ Duas dependências novas (`ofx-js`, `iconv-lite`) via `pnpm --filter @citybox/erp-api add`. |
| IV. Atomic design / `@citybox/ui` compartilhado | N/A neste app — `apps/erp/web` usa `@citybox/mui` + `@/components/ui/*` (padrão já documentado, precedência local). Zero `@citybox/ui`/`lucide-react`/`data-table-shadcn` na feature nova — componentes reaproveitados: `ListPageShell`/`ListPagePanel`/`DataTable`/`ListLoadErrorAlert` (`@/components/ui/*`), `SemanticBadge` (`@/components/ui/status`), `Tabs`/`Badge`/`Drawer`/`Dialog`/`PageHeader`/`Menu` (`@citybox/mui`), padrão de `ProductPickerDrawer` para a busca+seleção múltipla de lançamentos. |
| V. Isolamento de tenant / schema próprio por app | ✅ 3 models novos entram em `TENANT_SCOPED_MODELS`; repositórios novos usam `prisma.scoped`. Sem model novo em outro app. |
| Autenticação Keycloak / guards locais | ✅ Rotas novas usam `@RequirePermission('org.view')` (leitura) / `@RequirePermission('store.finance.manage')` (escrita) — mesmo padrão de `bank-accounts`/`financial-entries`; `@OrganizationId()` do contexto de tenant, nunca header cru. |
| Gate de verificação (build/lint/typecheck/test) | ✅ Gate padrão nos dois pacotes, listado em `quickstart.md`. |
| Sem commit sem autorização | ✅ Respeitado — este plano não commita nada. |
| Sem `@ts-ignore`/`eslint-disable` | ✅ Nenhuma necessidade identificada. |

**Resultado**: PASS. Nenhuma violação a justificar em Complexity Tracking.

### Re-check pós-Fase 1 (design)

`data-model.md`, `contracts/` e `quickstart.md` confirmam o desenho: 3 models novos, todos
tenant-scoped; **zero** coluna nova em `FinancialEntry` (só 2 métodos de domínio + 1 valor de união
TS — `research.md` D4/D5); reaproveita 100% o mecanismo existente de `syncLedgerMovements` para
gerar `BankTransaction` (nenhum código novo de projeção de saldo); reaproveita 100% o padrão de
storage/upload/download de `financial-entries` (`ObjectStorage`, `FileInterceptor`, proxy de
download). A decisão de injetar `FinancialEntryRepository`/`BankAccountRepository` via DI
(`research.md` D2) diverge da decisão de Prisma-direto do `005`, mas por um motivo documentado e
específico àquele caso (import circular histórico `sales`↔`finance`, que não existe entre módulos
irmãos de `finance/`) — não reabre nem contradiz aquela decisão. **Resultado**: PASS, inalterado.

**Re-check 2026-08-14 (addendum D18–D24)**: I. Docs-as-Code — mesma exigência das rodadas
anteriores; `apps/erp/api/AGENTS.md` §9 e `apps/erp/web/AGENTS.md` §4.1/§4.5 precisam registrar a
coluna nova, a rota de definir conta do extrato e o `Drawer` no lugar do `Dialog`. II.
Busca/paginação — `bankAccountId` opcional entra como mais um filtro backend-driven no
`eligible-entries` já existente, sem filtragem client-side. IV. Design system — nenhuma primitiva
nova: `Drawer` (D21) e o totalizador neutro (D18) já existem em `@citybox/mui`/`@/components/ui`.
V. Isolamento de tenant / schema — **única mudança de schema desta leva**: coluna
`previousBankAccountId String?` em `BankStatementMatch` (D22), model já tenant-scoped, sem model
novo; exige o gate `database-reviewer` antes da implementação, conforme o princípio V.
**Resultado**: PASS, com a ressalva de que D22 é a primeira migration desta feature desde a entrega
original e a primeira mutação de `FinancialEntry.bankAccountId` — merece revisão de banco e teste de
reversão dedicado.

**Re-check D26/D27 (rodada de produção 2026-08-14)**: V. Isolamento/schema — **nenhuma das duas
decisões mexe em schema**. D26 move a obrigatoriedade para o use case de importação
(`BankStatement.bankAccountId` segue nullable, porque as linhas legadas existem); D27 usa
`customer_id`/`supplier_id`, FKs já mapeadas em `FinancialEntry` desde o desenho original. II.
Busca/paginação — o select de cliente/fornecedor passa a listar sem filtro de estágio, mas continua
server-side e paginado (`perPage=100`, mesmo padrão de `listCostCenterOptionsApi`); nada de baixar o
cadastro inteiro para filtrar no cliente. I. Docs-as-Code — `apps/erp/web/AGENTS.md` §4.5 precisa
registrar o campo de seleção e a conta obrigatória; a mudança em `financial-entries` também toca a
spec da `007`. **Resultado**: PASS — e esta rodada **reduz** risco em vez de acrescentar: D26 elimina
a migration-free porém frágil heurística de matching, e D27 não abre schema novo.

**Re-check D25 (2ª passada 2026-08-14)**: nenhum princípio novo em jogo — D25 é um guard de domínio
dentro de um use case já existente, **sem schema, sem rota nova, sem componente novo**. II
(busca/paginação) intocado: o lançamento continua elegível em `eligible-entries`, a recusa acontece
só na confirmação, então nada muda na query nem na paginação. I (Docs-as-Code) já coberto pelas
tasks de `AGENTS.md` da Phase 10. **Resultado**: PASS, inalterado.

**Re-check 2026-08-11 (addendum de layout/D16/D17)**: `GET .../eligible-entries` (D17) é rota nova,
mas segue exatamente o mesmo padrão de `bank-reconciliation` injetar `FinancialEntryRepository` via
DI (D2) — nenhuma dependência nova, nenhum import circular novo. D16 (vínculo sem `addPayment` para
`paid`) usa só o `financialEntryPaymentId` já existente no schema de `BankStatementMatch` — zero
coluna/migration nova. `FinancialEntryListCriteria` ganha 4 campos opcionais (D17) sobre relações já
mapeadas (`payments`) — sem migration. **Resultado**: PASS, inalterado.

## Project Structure

### Documentation (this feature)

```text
specs/erp/006-bank-reconciliation/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   ├── bank-statement.contract.md
│   └── bank-statement-transaction.contract.md
└── tasks.md             # Phase 2 output (/speckit-tasks command — NOT created by /speckit-plan)
```

### Source Code (repository root)

Monorepo Turborepo — app **web application** (API NestJS Clean Architecture + frontend Next.js). Sem
projeto novo; módulo de API novo dentro de `apps/erp/api`, feature de frontend nova dentro de
`apps/erp/web`, mais dois pontos de alteração em módulos/features já existentes.

```text
apps/erp/api/
├── prisma/
│   ├── schema.prisma                                              # ALTERAR — 3 models novos + enums (data-model.md) + relação inversa em FinancialEntry
│   └── migrations/<timestamp>_add_bank_reconciliation/             # gerado por db:migrate:dev
├── src/shared/infra/prisma/tenant-scope.extension.ts               # ALTERAR — +BankStatement, +BankStatementTransaction, +BankStatementMatch
├── src/modules/finance/financial-entries/
│   ├── domain/entities/financial-entry.entity.ts                   # ALTERAR — +addPayment()/+removePayment() (research.md D4)
│   ├── domain/entities/financial-entry-payment.entity.ts           # ALTERAR — +'conciliacao_bancaria' em FINANCIAL_ENTRY_PAYMENT_METHODS (D5)
│   ├── domain/repositories/financial-entry.repository.interface.ts # ALTERAR — +paidFrom/paidTo/paymentMethod/cardBrand/supplierId em FinancialEntryListCriteria (D17)
│   ├── infrastructure/database/prisma-financial-entry.repository.ts # ALTERAR — buildWhere() com os filtros novos (payments.some, D17)
│   └── financial-entries.module.ts                                 # SEM ALTERAR — já `exports: [FinancialEntryRepository]` (confirmado)
└── src/modules/finance/bank-reconciliation/                        # CRIAR — módulo novo
    ├── bank-reconciliation.module.ts                                # imports: FinancialEntriesModule, BankAccountsModule
    ├── domain/
    │   ├── entities/bank-statement.entity.ts
    │   ├── entities/bank-statement-transaction.entity.ts
    │   ├── entities/bank-statement-match.entity.ts
    │   ├── repositories/bank-statement.repository.interface.ts
    │   ├── repositories/bank-statement-transaction.repository.interface.ts
    │   ├── repositories/bank-statement-match.repository.interface.ts
    │   ├── services/ofx-parser.ts                                   # CRIAR — pura (ofx-js + iconv-lite), research.md D10
    │   ├── services/ofx-parser.spec.ts                               # CRIAR — fixtures 1.x/2.x/Latin-1/corrompido
    │   ├── services/match-suggester.ts                               # CRIAR — pura, research.md D8
    │   ├── services/match-suggester.spec.ts                          # CRIAR — cada critério (exato, divergência, sem candidato, empate)
    │   ├── services/dedupe-key.ts                                    # CRIAR — pura, research.md D11 (fitId ou hash de fallback)
    │   └── errors/{bank-statement-not-found,transaction-not-pending,sum-mismatch,entry-already-reconciled,financial-entry-payment-ambiguous}.error.ts  # +D16
    ├── application/
    │   ├── policies/bank-reconciliation-object-key.policy.ts         # CRIAR — mesmo espírito de ErpFinanceObjectKeyPolicy
    │   └── use-cases/
    │       ├── import-bank-statement/{*.use-case.ts,*.spec.ts}       # parse → dedupe → storage.put → save
    │       ├── list-bank-statements/{...}
    │       ├── find-bank-statement-by-id/{...}
    │       ├── download-bank-statement-file/{...}                    # storage.get(key)
    │       ├── list-statement-transactions/{...}
    │       ├── suggest-matches/{...}                                  # repositório filtra elegibilidade, chama match-suggester puro
    │       ├── search-eligible-entries/{...}                          # CRIAR — research.md D17 (FR-038)
    │       ├── reconcile-transaction/{...}                            # research.md D7 + D16 (ramo `paid` = vínculo apenas)
    │       ├── undo-reconciliation/{...}                              # research.md D6
    │       ├── discard-transaction/{...}
    │       └── create-entry-from-transaction/{...}                    # research.md D9 — create() + addPayment() antes do 1º save
    ├── infrastructure/
    │   ├── database/prisma-bank-statement.repository.ts
    │   ├── database/prisma-bank-statement-transaction.repository.ts
    │   ├── database/prisma-bank-statement-match.repository.ts
    │   ├── storage/ (reaproveita ObjectStorage global — nenhum arquivo novo aqui)
    │   └── http/routes/
    │       ├── import-bank-statement/import-bank-statement.route.ts    # multipart, FileInterceptor
    │       ├── list-bank-statements/list-bank-statements.route.ts
    │       ├── find-bank-statement-by-id/find-bank-statement-by-id.route.ts
    │       ├── download-bank-statement-file/download-bank-statement-file.route.ts  # proxy/stream
    │       ├── list-statement-transactions/list-statement-transactions.route.ts
    │       ├── suggest-matches/suggest-matches.route.ts
    │       ├── search-eligible-entries/search-eligible-entries.route.ts  # CRIAR — GET .../eligible-entries (D17)
    │       ├── reconcile-transaction/reconcile-transaction.route.ts
    │       ├── undo-reconciliation/undo-reconciliation.route.ts
    │       ├── discard-transaction/discard-transaction.route.ts
    │       ├── create-entry-from-transaction/create-entry-from-transaction.route.ts
    │       └── shared/{bank-statement.dto.ts,bank-statement.presenter.ts,bank-statement-transaction.dto.ts,bank-statement-transaction.presenter.ts,eligible-entry.dto.ts,eligible-entry.presenter.ts}
    └── tests/
        ├── in-memory-bank-statement.repository.ts
        ├── in-memory-bank-statement-transaction.repository.ts
        ├── in-memory-bank-statement-match.repository.ts
        ├── bank-reconciliation-test-factory.ts
        └── fixtures/{sample-1.1x-latin1.ofx,sample-2.0x-xml.ofx,corrupted.ofx}

apps/erp/web/src/
├── app/(app)/financas/conciliacao-bancaria/
│   ├── page.tsx                                                     # ALTERAR — troca PlaceholderPage por reexport da feature (lista)
│   └── [id]/page.tsx                                                 # CRIAR — reexport fino (detalhe do extrato)
└── features/bank-reconciliation/                                     # CRIAR
    ├── GUIA.md                                                       # CRIAR — linguagem de negócio, tom de bank-accounts/GUIA.md
    ├── index.ts
    ├── api/
    │   ├── bank-reconciliation.service.ts                             # ALTERAR — troca searchFinancialEntriesForReconciliationApi por chamada a GET .../eligible-entries (D17); + filtros FR-038
    │   ├── bank-statement.dto.ts                                       # ALTERAR — +EligibleEntryDto (filtros/tabela FR-038)
    │   └── bank-statement.mapper.ts
    ├── hooks/
    │   ├── query-keys.ts
    │   ├── use-bank-statement-list.ts                                 # debounce 400ms inline, mesmo padrão local de use-financial-entry-list.ts
    │   ├── use-bank-statement-queries.ts
    │   ├── use-bank-statement-transaction-list.ts                     # por aba (Pendentes/Conciliadas/Excluídas)
    │   └── use-bank-reconciliation-mutations.ts                       # import, reconcile, undo, discard, create-entry
    ├── components/
    │   ├── statement-import-dialog.tsx                                 # comercioUpload, mesmo padrão de uploadProductImage
    │   ├── statement-list-table.tsx
    │   ├── statement-status-badge.tsx                                  # SemanticBadge (@/components/ui/status)
    │   ├── statement-header-card.tsx                                    # instituição (+ iniciais — sem logo externo), conta, período, contadores
    │   ├── transaction-tabs.tsx                                         # mesmo padrão de financial-entry-list-tabs.tsx (Tabs + Badge de contador)
    │   ├── transaction-card.tsx                                         # REESCRITO de transaction-row.tsx — cartão com botões reais (FR-039), entrada verde/saída vermelha, aviso/sugestão embutidos
    │   ├── match-suggestion-card.tsx
    │   ├── suggested-entries-panel.tsx                                  # CRIAR — painel colapsável "Registros sugeridos" (FR-041)
    │   ├── manual-match-drawer.tsx                                      # REESCRITO — filtros completos + tabela de resultados (FR-038), consumindo eligible-entries
    │   ├── manual-match-filters.tsx                                     # CRIAR — Períodos/tipo de data/Categoria/Fornecedor/Conta travada/Método/Bandeira
    │   └── create-entry-from-transaction-dialog.tsx                     # REESCRITO — seções Transação Financeira/Dados de pagamento/Classificação (FR-040), campos travados read-only
    ├── lib/
    │   └── bank-statement-format.ts
    ├── pages/
    │   ├── bank-statement-list-page.tsx
    │   └── bank-statement-detail-page.tsx
    └── types/bank-statement.ts

apps/erp/web/src/features/bank-accounts/components/bank-account-row-actions.tsx  # ALTERAR — troca o toast "em breve" do MenuItem "Importar extrato (OFX)" por router.push(`/financas/conciliacao-bancaria?bankAccountId=${account.id}`)
```

**Structure Decision**: módulo de API novo (`finance/bank-reconciliation`) espelhando a forma de
`finance/bank-accounts`, mais duas alterações cirúrgicas em `finance/financial-entries` (dois métodos
de domínio + um valor de enum de aplicação, sem migration própria). Frontend: feature nova
(`features/bank-reconciliation`) seguindo a estrutura de `features/financial-entries`/
`features/bank-accounts`, mais uma alteração de uma linha em `bank-accounts` (troca o toast "em
breve" por navegação real). Rota `/financas/conciliacao-bancaria` já existe no menu
(`navigation.ts`) — não precisa de entrada nova.

### Deltas de estrutura 2026-08-14 (D18–D24)

```text
apps/erp/api/
├── prisma/
│   ├── schema.prisma                                              # ALTERAR — +previousBankAccountId em BankStatementMatch (D22)
│   └── migrations/<ts>_add_match_previous_bank_account/            # CRIAR — coluna nullable, sem backfill (gate database-reviewer)
├── src/modules/finance/financial-entries/
│   └── domain/entities/financial-entry.entity.ts                   # ALTERAR — +método que troca bankAccountId ignorando isReadOnly (D22, mesma justificativa de D4)
└── src/modules/finance/bank-reconciliation/
    ├── domain/errors/bank-statement-without-account.error.ts        # CRIAR — FR-042/D23
    ├── domain/errors/entry-bank-account-mismatch.error.ts            # CRIAR — FR-043/D25 (paid em outra conta)
    ├── application/use-cases/
    │   ├── search-eligible-entries/                                 # ALTERAR — +bankAccountId? no input (D19)
    │   ├── reconcile-transaction/                                   # ALTERAR — guard FR-042 + guard FR-043 (paid cross-account) + troca de conta + previousBankAccountId (D22/D23/D25)
    │   ├── undo-reconciliation/                                     # ALTERAR — restaura conta original (D22)
    │   └── set-bank-statement-account/{*.use-case.ts,*.spec.ts}     # CRIAR — FR-042/D23
    └── infrastructure/http/routes/
        ├── search-eligible-entries/                                 # ALTERAR — +query param bankAccountId (D19)
        └── set-bank-statement-account/…route.ts                     # CRIAR — PATCH /v1/bank-statements/:id/bank-account (D23)

apps/erp/web/src/features/bank-reconciliation/
├── api/bank-reconciliation.service.ts                               # ALTERAR — +bankAccountId no eligible-entries; +setBankStatementAccount (D19/D23)
├── components/
│   ├── transaction-card.tsx                                         # ALTERAR — Conciliar na 1ª posição, estado de sugestão içado, indicador de divergência (D18/D20)
│   ├── manual-match-drawer.tsx                                      # ALTERAR — remove Alert de divergência, rodapé vira totalizador neutro (D18)
│   ├── manual-match-filters.tsx                                     # ALTERAR — select de Conta deixa de ser disabled (D19)
│   ├── create-entry-from-transaction-dialog.tsx                     # RENOMEAR → …-drawer.tsx, Dialog → Drawer anchor right (D21)
│   └── statement-account-dialog.tsx                                 # CRIAR — definir/corrigir conta do extrato (D23)
└── hooks/use-bank-reconciliation-mutations.ts                       # ALTERAR — +setBankStatementAccount
```

### Deltas de estrutura 2026-08-14 — rodada de produção (D26/D27)

```text
apps/erp/api/src/modules/finance/bank-reconciliation/
├── application/use-cases/
│   ├── import-bank-statement/                    # ALTERAR — bankAccountId obrigatório (D26/FR-001);
│   │                                             #   erro novo se a org não tem conta cadastrada
│   └── create-entry-from-transaction/            # ALTERAR — +customerId/+supplierId no input,
│                                                 #   exclusividade validada, partyName derivado (D27)
└── infrastructure/http/routes/
    ├── import-bank-statement/…route.ts           # ALTERAR — DTO exige bankAccountId (422 se ausente)
    └── create-entry-from-transaction/…route.ts   # ALTERAR — DTO +customerId/+supplierId

apps/erp/web/src/features/
├── bank-reconciliation/components/
│   ├── statement-import-dialog.tsx               # ALTERAR — conta volta a obrigatória; preview só pré-seleciona
│   └── create-entry-from-transaction-drawer.tsx  # ALTERAR — Input de texto livre → Autocomplete de cadastro (D27)
├── customers/api/customers.service.ts            # ALTERAR — listActiveCustomers() perde `tab=active`; renomear
└── financial-entries/…/financial-entry-party-section.tsx  # ⚠️ feature da 007 — mesma regra (D27)
```

⚠️ **Obsolescência parcial**: T149–T156 da Phase 10 foram escritas para o mundo em que a conta era
opcional. Com D26 elas não somem (extrato legado ainda precisa do guard e da rota de reparo), mas
deixam de ser caminho principal e sua justificativa muda — `/speckit-tasks` precisa reescrevê-las
antes de qualquer implementação.

## Complexity Tracking

*Sem violações da Constitution a justificar — tabela vazia de propósito.*
