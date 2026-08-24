# Phase 0 — Research: Extrato financeiro consolidado

Nenhum "NEEDS CLARIFICATION" resta no Technical Context — todas as decisões abaixo vieram de uma
exploração factual do código já implementado (`001-financial-entries`, `002-bank-account-ledger`,
`003-financial-reports-cost-center`), não de escolhas em aberto. A única ambiguidade real do spec
(FR-013, escopo de unidade/filial) foi resolvida com o usuário antes desta fase — ver
"Clarifications" em `spec.md`.

## D1 — Onde vive a agregação dos cards de resumo (FR-008)

**Decision**: Estender `finance/financial-entries` com um método novo no repositório
(`sumAmountsByOperation`) e um use case/rota novos (`GetFinancialEntriesSummaryUseCase` /
`GET /v1/financial-entries/summary`) — **não** criar um módulo `finance/statement/`.

**Rationale**: Os cards somam `FinancialEntry.amountCents` por `operation` (`receivable`/`payable`)
sobre o **mesmo conjunto de filtros da listagem** — é a mesma entidade, o mesmo `buildWhere`,
sem cruzar outro agregado. Isso é estruturalmente diferente do `finance/reports/` (`003`), que
precisou de um módulo à parte porque a DRE agrega `FinancialEntryAllocation` na hierarquia
`ChartOfAccount → FinancialGroup` (2 módulos de cadastro importados). Aqui não há hierarquia:
o resumo é um `groupBy(['operation'])` direto sobre `financialEntry`, reaproveitando o `buildWhere`
que a listagem já precisa ter. Manter os dois no mesmo módulo evita duplicar a lógica de filtro em
dois lugares (DRY) e é consistente com o princípio YAGNI — não introduzir uma camada de módulo que
nada mais usaria.

**Alternatives considered**:
- Módulo `finance/statement/` à parte, replicando o padrão do `reports/` — rejeitado: não há
  cadastro de terceiros para compor (nenhum `FinancialGroupRepository`/`ChartOfAccountRepository`
  seria injetado), só adicionaria indireção sem ganho de coesão.
- Calcular o resumo no frontend somando os itens já paginados — **proibido pela Constitution II**
  e pelo FR-008 explícito ("nunca apenas da página exibida").

## D2 — Eixo de data dual (competência vs. vencimento) sem um parâmetro "axis"

**Decision**: Adicionar `competenceFrom`/`competenceTo` como um segundo par de filtros de data,
independente de `dueFrom`/`dueTo` (que já existe). Nenhum parâmetro `dateAxis` novo na API.

**Rationale**: O backend já tem `dueFrom`/`dueTo`; adicionar o par de competência com a mesma forma
(dois `@IsDateString` opcionais, aplicados com `AND` se ambos vierem) é a extensão mínima — o
`FinancialEntry` já tem os dois campos de data (`competenceDate`/`dueDate`) e o índice
`@@index([organizationId, competenceDate])` já existe. O frontend decide qual par preencher
(estado local `dateAxis: 'competence' | 'due'`), enviando só um dos dois pares por vez — mas o
backend aceita ambos simultaneamente sem problema (útil se um consumidor futuro precisar cruzar os
dois eixos). Introduzir um enum `axis` no contrato HTTP obrigaria o backend a decidir "qual campo
aplicar" com um `switch`, sem ganho real sobre dois pares de filtro independentes já ortogonais.

**Alternatives considered**: parâmetro único `dateAxis` + `dateFrom`/`dateTo` — rejeitado, mais
indireção no DTO/`buildWhere` para o mesmo resultado; quebraria a compatibilidade do `dueFrom`/
`dueTo` já consumido pela tela de Lançamentos.

## D3 — Validação de período (data final < inicial) nos dois eixos

**Decision**: `domain/validators/period-range.validator.ts` novo, `assertValidPeriodRange(from?, to?)`,
lançando `InvalidStatementPeriodError` (novo, módulo-local, mesmo padrão de
`InvalidReportPeriodError` do `reports/`). Chamado para os dois pares de data
(`dueFrom`/`dueTo` e `competenceFrom`/`competenceTo`) em `ListFinancialEntriesUseCase` **e** em
`GetFinancialEntriesSummaryUseCase`.

**Rationale**: O spec exige essa validação como edge case explícito ("Período informado com data
final anterior à inicial: o sistema rejeita a consulta com uma mensagem clara"). Hoje
`ListFinancialEntriesUseCase` **não valida** isso para `dueFrom`/`dueTo` — é uma lacuna
pré-existente. Como a extrato reusa o mesmo endpoint de listagem para os dois eixos, a correção
mais consistente é validar os dois pares no use case de listagem (que passa a servir também o
extrato) em vez de só no endpoint novo — sem isso, o eixo de vencimento do extrato ficaria com uma
regra diferente do eixo de competência. Risco de regressão: baixo — nenhum chamador hoje envia
intervalos invertidos (tela de Lançamentos usa sempre `DateRangePicker`, que já impede isso na UI);
a mudança só rejeita um caso que hoje silenciosamente devolvia uma lista vazia sem explicação.

**Alternatives considered**: validar só no endpoint de resumo novo — rejeitado, deixaria a listagem
do extrato (mesmo endpoint de `financial-entries`) sem a mensagem de erro clara que o FR-014/edge
case pede.

## D4 — Filtro por conta bancária

**Decision**: Adicionar `bankAccountId?: string` a `FinancialEntryListCriteria`, validado como
`@IsUUID(4)` no DTO, aplicado como `{ bankAccountId: criteria.bankAccountId }` no `buildWhere`.

**Rationale**: Extensão direta — `FinancialEntry.bankAccountId` já existe na entidade e no schema
(nullable). Não precisa de `some`/relação como `chartOfAccountId`/`costCenterId` (que vivem em
`allocations`) porque é um campo direto do lançamento.

## D5 — Extrair uma DTO de filtros compartilhada entre listagem e resumo

**Decision**: `financial-entry.dto.ts` ganha uma classe base `FinancialEntryFilterQueryDto` com os
campos comuns (`operation`, `status`, `chartOfAccountId`, `costCenterId`, `bankAccountId`, `search`,
`dueFrom`, `dueTo`, `competenceFrom`, `competenceTo`). `ListFinancialEntriesQueryDto extends
FinancialEntryFilterQueryDto` (+ `tab`, `sort`, `page`, `perPage`).
`GetFinancialEntriesSummaryQueryDto extends FinancialEntryFilterQueryDto` (sem campos extras —
resumo nunca pagina, nunca ordena, e sempre ignora lançamentos excluídos como a aba `active`
padrão).

**Rationale**: DRY (Constitution/coding-style) — evita redigitar 9 decorators de validação em dois
DTOs. `class-validator` suporta herança de classe normalmente (mesmo padrão usado em outros DTOs do
monorepo que estendem uma base comum).

## D6 — Saldo por conta bancária (US2): zero endpoint novo

**Decision**: O frontend chama `GET /v1/bank-accounts?perPage=100&tab=active` diretamente — o mesmo
endpoint que a tela de Contas bancárias e o hook `useBankAccountOptionsQuery` já consomem hoje.
Nenhuma rota nova no backend.

**Rationale**: `ListBankAccountsUseCase`/`BankAccountPresenter.toHttpList` já devolvem
`currentBalanceCents` por conta (calculado via `BankTransactionRepository.sumBalancesByAccountIds`,
`groupBy` no banco). `perPage=100` (teto `MAX_PER_PAGE`) já é o padrão estabelecido em
`listBankAccountOptionsApi` para "me dê o cadastro inteiro" — contas bancárias são cadastro de
apoio (dezenas, não milhares), mesmo porte de grupo financeiro/plano de contas/centro de custo, que
o `GetIncomeStatementUseCase` já carrega inteiro em memória sem paginar. Se uma organização real
algum dia ultrapassar 100 contas bancárias — não observado em nenhum piloto — vira um problema de
UX de cadastro (paginação na tela de Contas bancárias), não do extrato.

**Alternatives considered**: endpoint agregado novo `GET /v1/bank-accounts/balances` sem paginação
— rejeitado por YAGNI: o endpoint já existente resolve, e um teto de 100 é generoso para o porte do
piloto (single-city Ilhéus).

## D7 — Seleção de linhas com soma (US3, FR-011): sem suporte nativo no `DataTable`

**Decision**: Construir a coluna de checkbox como uma coluna comum do `DataTable`
(`columns[].render()`), com `stopPropagation` no `onClick`/`onChange` — o mesmo padrão que o
componente já documenta para "controles internos (checkbox, menu ⋯)"
(`packages/mui/src/organisms/data-table/data-table.tsx:40`). Estado de seleção
(`Set<string>` de ids + mapa id→`{operation, amountCents}` das linhas carregadas) fica num hook
local da feature (`use-financial-statement-selection.ts`), **não** no `DataTable` nem em estado
global.

**Rationale**: Nem `@citybox/mui` `DataTable` nem o wrapper local em `apps/erp/web` têm prop de
seleção — confirmado por busca no código-fonte do componente. O comentário-fonte já antecipa esse
uso (controles internos por coluna), então não é um hack: é o ponto de extensão pretendido. A soma
é sobre as linhas **já carregadas na página atual** (spec Assumptions: "não existe nenhuma ação em
lote... apenas uma soma visual, calculada a partir dos dados já carregados na tela") — não precisa
buscar dados extras nem agregar no backend.

**Alternatives considered**: adicionar suporte a seleção no `DataTable` de `@citybox/mui`
(componente compartilhado) — rejeitado por escopo: mudaria um pacote de design system consumido por
outros apps, para um requisito que hoje só a extrato pede; se um segundo consumidor pedir seleção,
vira candidato a subir para o design system depois (YAGNI aplicado ao pacote compartilhado).

## D8 — Estados vazios (FR-014): duas variantes distintas

**Decision**: `financial-statement-empty-state.tsx` com duas variantes — "sem filtro, organização
sem movimentação" (mensagem neutra, sem ação) e "com filtro, zero resultado" (mensagem + botão
"Limpar filtros" que reseta para `createEmptyFinancialStatementFilters()`).

**Rationale**: Requisito explícito do spec (edge cases) e do FR-014. `countActiveFinancialEntryFilters`
(molde a replicar em `lib/financial-statement-filters.ts`) já existe em `financial-entries` para
decidir "há algum filtro ativo?" — reaproveitado para escolher a variante.

## D9 — Testes

**Decision**: Backend — `.spec.ts` novos/estendidos sobre `in-memory-financial-entry.repository.ts`
(mesmo padrão de `list-financial-entries.use-case.spec.ts`), cobrindo: filtro por competência,
filtro por conta bancária, validação de período inválido (os 2 eixos), e o novo
`sumAmountsByOperation` (soma correta por operação, ignora soft-deleted, respeita os mesmos
filtros da listagem). Frontend — sem infraestrutura de teste em `apps/erp/web` (confirmado,
inalterado desde `001`/`002`/`003`); validação via `quickstart.md` (cenários manuais mapeados
1:1 aos Acceptance Scenarios do spec) + `pnpm --filter @citybox/erp-web typecheck`/`lint`.

**Rationale**: Consistente com o padrão já estabelecido nas 3 fatias anteriores do módulo
`finance` — não é uma decisão nova desta fatia, é continuidade.
