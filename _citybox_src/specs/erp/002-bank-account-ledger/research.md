# Research: Contas bancárias — saldo real, extrato e transferência

Todas as `NEEDS CLARIFICATION` do Technical Context foram evitadas na origem (nenhuma ficou
pendente) — este documento registra as decisões de design que o Technical Context deixou
implícitas, na mesma forma **Decision / Rationale / Alternatives considered** usada em
`001-financial-entries/research.md`.

## D1 — Sincronização das movimentações de origem `financial_entry_payment`

**Decision**: para a origem `financial_entry_payment`, `BankTransaction` não é estritamente
"append-only, nunca tocado" como o resto do ledger — é uma **projeção derivada e
ressincronizada** do estado atual do lançamento, no mesmo espírito de como
`FinancialEntryPayment`/`FinancialEntryAllocation` já são tratados hoje (substituídos por
completo a cada `save()`, sem identidade estável entre saves).

Mecânica: `PrismaFinancialEntryRepository` ganha um helper interno
`syncFinancialEntryLedgerMovements(tx, entry)` chamado dentro da mesma transação de:
- `save()` (create/update): apaga toda `BankTransaction` com `sourceType=financial_entry_payment
  AND sourceId=entry.id`, depois recria — 1 linha por `payments[]` se houver, ou 1 linha única
  de `amountCents=paidCents` se `payments.length === 0 && paidCents > 0` (cobre o lançamento
  gerado por venda, que grava `paidCents` direto sem popular `payments[]` —
  `PrismaSaleOrderRepository.maybeCreateReceivable`). `kind` = `credit` se
  `operation=receivable`, `debit` se `operation=payable`. Só roda se `entry.bankAccountId`
  estiver preenchido (lançamento sem conta vinculada não movimenta nenhum saldo).
- `softDelete()`: apaga as `BankTransaction` com `sourceId=entry.id` (a conta some do balanço
  do lançamento excluído — FR-017 primeira metade).
- `clearDeletedAt()` (restore): como a assinatura do repositório recebe só
  `(organizationId, id, updatedAt)`, a implementação Prisma busca o lançamento (com `payments`)
  dentro da própria transação e roda o mesmo `syncFinancialEntryLedgerMovements` — sem mudar a
  interface pública do `FinancialEntryRepository` (FR-017 segunda metade).

`PrismaSaleOrderRepository.maybeCreateReceivable` ganha uma chamada direta de
`tx.bankTransaction.create()` (mesmo padrão que já usa para criar a
`FinancialEntryAllocation` de sistema ali dentro) — não reusa o helper de `financial-entries`
porque está fora do módulo (mesma razão pela qual hoje ele já grava `FinancialEntry`/
`FinancialEntryAllocation` via Prisma cru em vez de importar `FinanceModule`).

**Rationale**: `FinancialEntryPayment` não tem identidade estável entre saves (a doc do próprio
repositório diz isso: "sem identidade estável para o cliente entre saves"), então amarrar
movimentações a `paymentId` obrigaria a reconciliar ids voláteis a cada `save()` sem ganho real
— o limite de sincronização natural é o `financialEntryId`, não o `paymentId` individual. Isso
também resolve de graça o requisito "idempotente por pagamento originador" do FR-016: o delete
+ recreate por `entry.id` **é** a idempotência (rodar duas vezes com o mesmo `payments[]`
produz o mesmo conjunto de movimentações, não duplica). E resolve FR-017 sem inventar um
conceito de "estorno com sinal invertido" que o resto do domínio não pede — nenhuma tela exige
ver uma movimentação de estorno explícita; o requisito observável é só "o saldo não reflete mais
o lançamento excluído" (FR-017) e "reaparece ao restaurar" — que delete+recreate garante
igualzinho, sem precisar de estado extra.

As outras duas origens (`initial_balance`, `bank_transfer`) continuam genuinamente
append-only/imutáveis depois de criadas — só `financial_entry_payment` tem esse ciclo de
resync, e é isso que o Key Entities do `spec.md` já sinaliza ("revertido quando sua origem é
desfeita").

**Alternatives considered**:
- *Amarrar `sourceId` ao `paymentId` e diffar linha a linha a cada save*: mais fiel à ideia de
  "nunca editar, só criar/reverter", mas exigiria dar identidade estável a
  `FinancialEntryPayment` primeiro (mudança fora do escopo desta fatia, e não pedida por nenhum
  FR) só para poder diffar — complexidade sem requisito que a justifique (YAGNI).
- *Nunca apagar, só somar um estorno de sinal oposto ao excluir*: mantém um histórico mais
  "contábil" (ninguém nunca é literalmente deletado), mas duplicaria linhas no extrato/transações
  do lançamento excluído-e-restaurado sem que nenhum cenário de aceite peça essa visibilidade —
  adiado até haver um requisito de auditoria explícito.

## D2 — Cálculo de saldo: agregação on-the-fly (Opção A do prompt)

**Decision**: `currentBalanceCents` de uma conta é sempre `SUM` com sinal sobre
`bank_transactions`, nunca uma coluna materializada em `BankAccount`. Implementado como
`BankTransactionRepository.sumBalancesByAccountIds(organizationId, accountIds)` — um único
`groupBy(by: ['bankAccountId', 'kind'])` do Prisma, reduzido em código
(`initial_balance + credit − debit` por conta) — usado tanto na listagem (`ListBankAccounts`,
1 query para a página inteira) quanto no detalhe (`FindBankAccountById`, mesma função com 1 id).

**Rationale**: é a recomendação explícita do prompt de entrada ("nesta fatia" — volume de uma
única loja, `groupBy` resolve a lista inteira numa query) e evita toda a superfície de bug de
saldo materializado (esquecer de atualizar em algum dos N pontos de escrita — criação de conta,
transferência, pagamento de lançamento, exclusão/restauração de lançamento). Como D1 já exige
que várias operações escrevam `BankTransaction` dentro de transações que tocam outros
agregados, um saldo materializado precisaria ser atualizado em cada uma dessas transações sem
nunca dessincronizar — risco maior que o custo de um `groupBy` a mais por request, que é
desprezível no volume do projeto.

**Alternatives considered**: saldo materializado em `BankAccount.currentBalanceCents` — mais
rápido de ler (O(1) sem agregação), mas errado de escrever com segurança em 5+ pontos
diferentes do código (criação/edição de conta, transferência, save/delete/restore de
lançamento) sem uma trava mais pesada (lock otimista, `SELECT ... FOR UPDATE`) que o volume do
projeto não justifica agora. Fica documentado aqui como o próximo passo natural se o volume de
movimentações por conta crescer a ponto do `groupBy` pesar — não há gatilho conhecido hoje.

## D3 — Saldo acumulado do extrato correto entre páginas (FR-007/SC-003)

**Decision**: `GET /v1/bank-accounts/:id/statement` busca, numa única query ordenada
`ORDER BY effectiveAt DESC, createdAt DESC, id DESC` (ver D7 — tiebreak determinístico), as
linhas do **início até o fim da página pedida** (`take = skip + perPage`, sem o próprio `skip`
no Prisma — ou seja, sempre parte da mais recente), e caminha o array em memória, do topo para
baixo:

```
runningBalance[0] = totalBalanceCents        // saldo total da conta, via D2
runningBalance[i] = runningBalance[i-1] − signedAmount(rows[i-1])   // i > 0
```

Devolve só a fatia `[skip, skip + perPage)` desse array, já com `runningBalanceCents` correto —
sem depender de reconstituir "a soma de tudo que veio antes desta página" via uma segunda
agregação paralela (que teria que respeitar o mesmíssimo `ORDER BY`/tiebreak para não
divergir).

**Rationale**: é a forma mais simples de garantir SC-003 ("a última linha do extrato mostra
saldo igual ao valor da movimentação mais antiga") sem duplicar a lógica de ordenação em duas
queries que podem divergir sutilmente (paginação por cursor vs. agregação por filtro de data,
por exemplo). O custo é O(nº de movimentações até o fim da página pedida) por request — para o
volume de uma única loja (nunca mais que poucos milhares de movimentações por conta, mesma
ordem de grandeza documentada para `financial-entries`), isso é uma query leve com `SELECT` de
2 colunas (`kind`, `amountCents`) nas linhas anteriores à página — não é um full table scan
disfarçado, é limitado pelo próprio `skip` que o usuário está navegando.

**Gatilho de revisão**: se uma conta acumular volume alto o bastante para o extrato ficar lento
em páginas profundas, a evolução natural é computar `runningBalanceCents` como coluna
persistida em `BankTransaction` no momento da escrita (o inverso de D2 — aqui faria sentido
porque é *append* na maioria dos casos, ao contrário do saldo agregado da conta) — não é
necessário nesta fatia.

**Alternatives considered**:
- *Janela SQL (`SUM() OVER (ORDER BY ...)`) via `$queryRaw`*: resolveria com 1 query e sem
  caminhar em memória, mas introduziria SQL bruto (o projeto usa Prisma Client em todo o resto
  do módulo finance) só para uma tela — adiado até haver evidência de que a versão em memória
  não escala.
- *Saldo acumulado só dentro da página (reinicia a cada página)*: mais simples, mas viola
  FR-007 explicitamente ("não pode ser computado só a partir das movimentações visíveis na
  página atual") — rejeitado.

## D4 — Forma de pagamento da transferência reaproveita o enum de `financial-entries`

**Decision**: `BankTransfer.paymentMethod` valida contra o mesmo array
`FINANCIAL_ENTRY_PAYMENT_METHODS` (`dinheiro`/`pix`/`debito`/`credito`/`boleto`/`deposito`/
`transferencia`) já exportado por `financial-entries/domain/entities/financial-entry-payment.entity.ts`,
importado cross-submódulo (mesmo padrão de `bank-transfers` importar `BankAccountRepository` de
`bank-accounts`, ou de `financial-entries` importar `ChartOfAccountRepository`/
`CostCenterRepository` de outros submódulos de `finance/` — não há parede de isolamento entre
submódulos do mesmo módulo de topo neste código-base).

**Rationale**: não existe cadastro de formas de pagamento na API (débito já registrado em
`001-financial-entries/research.md` D11) — duplicar a lista num enum novo local criaria duas
fontes de verdade da mesma lista fixa que divergem na primeira alteração. O front hoje usa
`MOCK_PAYMENT_METHODS` (`features/purchases/data/mock-payment-methods.ts`) no `TransferDialog`,
mock que sai nesta fatia em favor do mesmo array já usado no formulário de pagamento de
lançamento.

**Alternatives considered**: criar `BankTransferPaymentMethod` como enum Prisma próprio — mais
"correto" formalmente (a transferência não é logicamente um `FinancialEntryPayment`), mas
sincronizar dois enums Prisma com os mesmos 7 valores é puro risco de drift sem benefício
observável; revisitar quando (se) nascer um cadastro real de formas de pagamento — aí os dois
lugares migram juntos.

## D5 — Catálogo de bancos deixa de ser "mock de conta" e vira constante de referência

**Decision**: `features/bank-accounts/data/mock-banks.ts` é **renomeado**, não removido, para
`features/bank-accounts/lib/bank-catalog.ts`, mantendo o mesmo formato de lista estática — só
ganha `code` como chave estável (persistida em `BankAccount.bankCode`) no lugar do `id` mock
usado hoje só localmente. Continua sem tela de cadastro (Assumption do `spec.md`).

**Rationale**: a diferença entre "mock" (dado de exemplo que finge ser dado real, como as
contas/movimentações fictícias que este plano remove) e um "catálogo de referência" (lista de
bancos brasileiros, como `BR_STATES`/`BR_STATE_OPTIONS` já usados em `suppliers`/`carriers`/
`branches`) é real e documentada na spec (Assumption: "a lista de bancos em si continua sendo
uma constante compartilhada no frontend"). Renomear a pasta de `data/` (convenção do projeto
para seeds mock) para `lib/` (convenção para constantes/utilitários) deixa essa distinção
explícita no código, não só na intenção.

**Alternatives considered**: manter em `data/mock-banks.ts` sem renomear — funcionaria
igual, mas o `grep -r "MOCK_" apps/erp/web/src/features/bank-accounts` do gate de "feature sem
mock" (mesmo padrão do `quickstart.md` de `001-financial-entries`) ficaria ambíguo sobre se
essa constante é dívida pendente ou decisão deliberada; o rename + a nota nesta pesquisa
resolvem a ambiguidade para quem rodar o grep depois.

## D6 — Permissões: leitura `org.view`, escrita `store.finance.manage` (sem mudança de padrão)

**Decision**: as 2 rotas novas de leitura (`/transactions`, `/statement`) usam `org.view`,
igual ao resto de `bank-accounts`; `POST /v1/bank-transfers` usa `store.finance.manage`, igual
ao resto de escrita do módulo `finance` (FR-014).

**Rationale**: nenhuma regra nova — é literalmente o padrão já documentado em
`api/AGENTS.md` §9 ("Finance — cadastros de suporte + contas + lançamentos") desde 2026-07-31,
reaplicado às rotas novas sem exceção. Registrado aqui só para deixar explícito que não há
uma permissão nova a criar (`bank-transfer.manage` ou similar) — YAGNI, o guard de papel já
cobre.

## D7 — Ordenação determinística do ledger

**Decision**: toda consulta ordenada de `BankTransaction` usa `ORDER BY effectiveAt DESC,
createdAt DESC, id DESC` (mais recente primeiro em ambas as abas — Transações e Histórico,
preservando o comportamento atual do mock `listBankTransactions`/`listBankStatement`, que já
ordena assim). `createdAt`/`id` desempatam duas movimentações da mesma `effectiveAt`.

**Rationale**: resolve o edge case do `spec.md` ("duas movimentações na mesma data: a ordem
entre elas deve ser determinística") sem introduzir um campo de sequência dedicado — `createdAt`
(timestamp de escrita, sempre distinto por causa da precisão de milissegundo + fallback em `id`
para o caso extremo de mesmo milissegundo) já é suficiente e já existe no schema padrão do
projeto (`@default(now()) @db.Timestamptz(3)`).

## D8 — `createdByName` fica vazio nas movimentações derivadas de pagamento de lançamento

**Decision**: para `sourceType=financial_entry_payment`, `BankTransaction.createdByName` é
`""` — não tenta atribuir a um usuário. Para `initial_balance` e `bank_transfer`, vem de
`resolveActorName(actor)` (mesmo helper que `stock/production` já usa via `@Actor()`), porque
essas duas origens são criadas dentro de uma requisição HTTP autenticada (criar conta, criar
transferência) e o dado está disponível ali.

**Rationale**: `FinancialEntryPayment` em si **não tem** campo de usuário responsável hoje (nem
o schema, nem a entidade) — inventar um "responsável" para a movimentação derivada seria
inventar um dado que a origem não guarda. FR-001 pede "usuário responsável" como parte do que o
movimento registra quando existe, não retroativamente para movimentações sem essa informação na
origem; a UI (Transações) mostra `"—"` quando vazio, mesmo padrão já usado em
`bank-account.presenter`/tabelas do projeto para campos ausentes.

**Alternatives considered**: adicionar `createdByUserId`/`createdByName` a
`FinancialEntryPayment` agora para poder propagar — mudança de schema em outro submódulo
(`financial-entries`) fora do que qualquer FR desta fatia pede; fica registrado como débito
observável, não como bloqueio.
