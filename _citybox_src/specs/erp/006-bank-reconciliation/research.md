# Research — Conciliação bancária (importação de OFX e casamento com lançamentos)

Fase 0 do `/speckit-plan`. Cada decisão resolve uma lacuna técnica encontrada ao ler o código atual
(`apps/erp/api`, `apps/erp/web`) — o spec é intencionalmente livre de detalhe de implementação.
Nenhuma pendência `NEEDS CLARIFICATION` restante.

---

## D1 — Local do módulo e Clean Architecture

**Decision**: Novo módulo `src/modules/finance/bank-reconciliation/` no `erp-api`, espelhando
exatamente a estrutura de `finance/bank-accounts` (o módulo irmão mais próximo em forma):
`domain/{entities,repositories,errors,services}`, `application/{dtos,use-cases/<nome>}`,
`infrastructure/{database,http/routes,storage}`, `tests/in-memory-*.repository.ts`.

**Rationale**: `bank-accounts` é o módulo `finance` mais recente e mais próximo em forma (entidades
simples + histórico paginado + ledger). Reaproveitar sua forma reduz decisões novas.

**Alternatives considered**: colocar a conciliação dentro do próprio módulo `bank-accounts` (já que a
transcrição de origem trata "Importar OFX" como uma ação da conta bancária) — rejeitado: o domínio de
conciliação (extrato, transação, sugestão, match) é grande o suficiente para merecer módulo próprio;
`bank-accounts` continua dono só da conta e do livro-razão.

---

## D2 — Cross-módulo: `bank-reconciliation` injeta os repositórios de `financial-entries` e
`bank-accounts` via DI (diferente da decisão de `005`)

**Finding**: `005-card-receivables-engine` (`research.md` D1) decidiu **não** injetar `FinanceModule`
em `SalesModule`, usando Prisma direto, para preservar uma decisão histórica documentada em
`api/AGENTS.md` §9/§10 sobre uma reversão por import circular **especificamente entre `sales` e
`finance`**.

**Decision**: `bank-reconciliation` **injeta normalmente**, via `imports: [FinancialEntriesModule,
BankAccountsModule]` + `exports` desses módulos, os repositórios `FinancialEntryRepository` e
`BankAccountRepository`/`BankTransactionRepository`. Não é o mesmo caso do `005`: aqui os três módulos
(`bank-reconciliation`, `financial-entries`, `bank-accounts`) são todos irmãos dentro de `finance/` —
não há o histórico de import circular documentado para essa combinação específica, e a alternativa
(Prisma direto duplicando toda a lógica de `recomputeAggregates`/`syncLedgerMovements` de
`FinancialEntry`) reimplementaria código crítico já testado.

**Alternatives considered**: Prisma direto (D1 do 005) — rejeitado aqui porque duplicaria a lógica de
agregação de pagamentos e sincronização de `BankTransaction` de `FinancialEntry`, que já existe e é
testada; duplicar essa lógica é o tipo de risco que a decisão do `005` evitava em um contexto
diferente (sem essa lógica compartilhada para reaproveitar).

---

## D3 — Efeito da conciliação sobre o lançamento: reaproveitar `FinancialEntryPayment` +
`syncLedgerMovements`, não o `sourceType: reconciliation` reservado

**Finding crítico**: o schema já tem `BankTransactionSourceType.reconciliation` **reservado**
(`schema.prisma:1985-1992`, comentário: *"reservado para a fase de conciliação bancária... nenhum
código grava esse valor ainda"*). A leitura ingênua seria: toda conciliação grava uma `BankTransaction`
com esse `sourceType`.

**Decision**: **Não usar** `sourceType: 'reconciliation'` para gerar a movimentação. Em vez disso,
reconciliar = adicionar uma `FinancialEntryPayment` ao(s) lançamento(s) vinculado(s)
(`amountCents` = valor alocado, `paidAt` = `BankStatementTransaction.postedAt` — decisão de
`/speckit-clarify`, FR-034) e persistir via `FinancialEntryRepository.save(entry)`. O mecanismo
**já existente** (`financial-entries/domain/services/derive-bank-transaction-inputs.ts` +
`syncLedgerMovements` no repositório Prisma) automaticamente recalcula `status`/`paidCents`
(FR-029, "marcar como pago/recebido") e regrava as `BankTransaction` do lançamento com
`sourceType: 'financial_entry_payment'` (FR-029, "gerar a movimentação bancária correspondente"),
usando `deleteMany+createMany` — mesmo padrão já testado em produção.

**Rationale**: os dois `MUST` de FR-029 (marcar pago + gerar movimentação) são satisfeitos **pela
mesma operação já existente**, sem nenhum código novo de projeção de saldo. Usar `reconciliation`
como um `sourceType` **paralelo** geraria uma segunda `BankTransaction` para o mesmo dinheiro (uma via
`financial_entry_payment` quando o pagamento é adicionado, outra via `reconciliation`) — dupla
contagem no saldo real da conta, violando SC-009. `BankTransactionSourceType.reconciliation`
**permanece reservado e não utilizado** por este desenho — documentado aqui para quem revisitar o
enum no futuro não achar que foi esquecido.

**Alternatives considered**: gravar `BankTransaction` diretamente com `sourceType: 'reconciliation'`,
`sourceId: BankStatementTransaction.id`, sem tocar `FinancialEntryPayment` — rejeitado: não marca o
lançamento como pago (viola a primeira metade de FR-029), e duplicaria a movimentação se o lançamento
também acumular pagamento por outro caminho.

---

## D4 — `FinancialEntry.isReadOnly` bloqueia lançamentos de venda — precisa de um método de domínio
novo que não passe por `update()`

**Finding crítico**: `financial-entry.entity.ts:356-359` — `update(input)` lança
`SaleOrderLinkedEntryForbiddenError` quando `this.isReadOnly` (`saleOrderId !== null`). **Os
lançamentos mais prováveis de serem conciliados são exatamente os recebíveis de venda gerados pelo
motor de cartões (`005-card-receivables-engine`)** — todos com `saleOrderId` setado, logo todos
`isReadOnly`. Chamar `entry.update({...})` para adicionar o pagamento de conciliação falharia sempre
no caso de uso central do módulo.

**Decision**: Adicionar dois métodos novos à entidade `FinancialEntry`
(`financial-entries/domain/entities/financial-entry.entity.ts`), **sem** passar pelo guard de
`isReadOnly` — porque FR-021 já separa explicitamente "dados descritivos" (bloqueados) de "status de
pagamento" (permitido mesmo somente-leitura):

```ts
/** Permitido mesmo em lançamento somente-leitura (FR-021 de 006-bank-reconciliation) —
 *  só acrescenta uma linha de pagamento, nunca reescreve amountCents/dueDate/etc. */
addPayment(payment: FinancialEntryPaymentInput): FinancialEntry { /* recomputeAggregates, FinancialEntry.with(...) */ }

/** Remove uma linha de pagamento por id (desfazer conciliação). Mesmo raciocínio de addPayment. */
removePayment(paymentId: string): FinancialEntry { /* recomputeAggregates, FinancialEntry.with(...) */ }
```

Ambos preservam `payments` existentes (spread + adiciona/filtra), recomputam `paidCents`/`status` via
a mesma `recomputeAggregates` já privada ao módulo (torna-se exportada ou o método fica na própria
entidade, que já a usa internamente), e devolvem uma nova instância (`FinancialEntry.with`, imutável).
`FinancialEntryRepository.save(entry)` não tem checagem de `isReadOnly` (só o método de domínio tinha)
— confirmado em `prisma-financial-entry.repository.ts:167` (`save` aceita qualquer entidade).

**Rationale**: menor diff que reabrir `update()` para aceitar um flag "ignorar isReadOnly" (mais
propenso a erro — um caller desatento poderia reescrever `amountCents` de um lançamento de venda).
Métodos dedicados deixam explícito, no próprio nome, o que é permitido.

**Alternatives considered**: gravar a conciliação sem tocar `FinancialEntry` nenhum, só em
`BankStatementMatch` — rejeitado: não satisfaz FR-029 (marcar pago/gerar movimentação), que a
`/speckit-clarify` já confirmou como obrigatório.

**Coordenação**: como `005-card-receivables-engine` também tocou `FinancialEntry`
(campos `grossAmountCents`/`cardContractId`/etc.), e esta é outra alteração na mesma entidade —
**nenhuma sobreposição de nome** (`addPayment`/`removePayment` são métodos novos, não campos), sem
conflito de migration (esta feature não adiciona coluna em `FinancialEntry`, só métodos de domínio).

---

## D5 — `FINANCIAL_ENTRY_PAYMENT_METHODS` precisa de um valor novo para "conciliação bancária"

**Finding**: `financial-entry-payment.entity.ts:9-17` — `FINANCIAL_ENTRY_PAYMENT_METHODS` é uma união
TS fixa (`dinheiro | pix | debito | credito | boleto | deposito | transferencia`), sem nenhum valor
que identifique "este pagamento veio de uma conciliação bancária, não de um caixa/PDV". A coluna
Postgres é `String` livre (sem `enum` de banco) — a lista é só validação de aplicação.

**Decision**: adicionar `'conciliacao_bancaria'` a `FINANCIAL_ENTRY_PAYMENT_METHODS`. Todo pagamento
criado por `addPayment()` a partir de uma conciliação usa esse valor. A lista/detalhe de Lançamentos
(que já exibe `paymentMethod`) passa a mostrar a origem real do pagamento sem heurística.

**Rationale**: sem esse valor, o pagamento gerado pela conciliação ficaria indistinguível de um
pagamento manual — o operador de Lançamentos perderia a rastreabilidade de por que aquele lançamento
foi marcado como pago.

**Alternatives considered**: reaproveitar `'transferencia'` — rejeitado: perderia rastreabilidade
exatamente do jeito que este achado quer evitar.

---

## D6 — Desfazer conciliação: `removePayment` + apagar `BankStatementMatch`, sem tocar
`FinancialEntry.amountCents`/demais campos

**Decision**: `undo-reconciliation` carrega os `BankStatementMatch` da transação, para cada um chama
`entry.removePayment(match.financialEntryPaymentId)` + `save()` (re-sincroniza `BankTransaction`
automaticamente, removendo a movimentação daquele pagamento — `deleteMany+createMany` por
`sourceType+sourceId`), depois apaga as linhas de `BankStatementMatch` (hard delete — "Vínculo de
conciliação... existe apenas enquanto a conciliação não é desfeita", Key Entities do spec) e volta
`BankStatementTransaction.status` para `pending`.

**Rationale**: espelha exatamente D3/D4, na direção inversa. Hard delete do vínculo (não soft-delete)
é intencional — o spec não pede histórico de vínculos desfeitos, só que a ação seja possível
(FR-020/FR-030).

---

## D7 — Soma de N lançamentos (FR-017): um `BankStatementMatch` por lançamento, cada um com seu
próprio `FinancialEntryPayment`

**Decision**: para "somar lançamentos", o use case valida que
`sum(financialEntry.amountCents - financialEntry.paidCents para cada id selecionado) ===
transaction.amountCents` (valor absoluto) antes de qualquer escrita — se não fechar, `422` sem tocar
nada. Se fechar, para **cada** lançamento selecionado: `addPayment` com `amountCents` = o saldo em
aberto **daquele** lançamento (não uma fração arbitrária — cada lançamento nasce/fica totalmente
quitado), gerando um `BankStatementMatch` próprio (`financialEntryId` + `financialEntryPaymentId` +
`amountCents` daquele lançamento). O caso 1:1 (sugestão/manual) é o caso N=1 deste mesmo fluxo — não
há um código separado para "conciliar um só".

**Rationale**: um único fluxo cobre FR-015/016/017 (sugestão, busca manual, soma) — todos são
"conciliar com uma lista de `financialEntryId`s", variando só o tamanho da lista e como ela foi
montada na UI. Reduz a superfície de código e de teste.

---

## D8 — Critério de candidato (sugestão automática): filtros determinísticos, ordenação por
confiança sem "IA" nenhuma

**Decision**: `suggest-matches` (função pura em `domain/services/match-suggester.ts`, sem Prisma/Nest
— recebe já como parâmetro a lista de `FinancialEntry` candidatos pré-filtrada pelo repositório) —

Filtro de elegibilidade (aplicado na query do repositório, não no domínio puro):
- `bankAccountId` = o da conta do extrato;
- `operation` compatível com o sinal da transação (`credit` → `receivable`, `debit` → `payable`);
- saldo em aberto (`amountCents - paidCents`) > 0;
- **não** aparece em nenhum `BankStatementMatch` ativo (FR-033 — "excluído até desfazer");
- `dueDate` dentro de ±3 dias de `postedAt` (Assumptions do spec).

Dentro desse conjunto, o `match-suggester` (puro) classifica cada candidato:
- saldo em aberto === valor da transação → candidato de **sugestão direta** (FR-014/032), pontuado
  por proximidade de data (mais perto de `postedAt` = mais confiança) e por similaridade textual
  memo↔descrição (peso baixo, critério de desempate) — retorna **todos** os empatados em valor exato,
  ordenados (FR-014, decisão de `/speckit-clarify`: lista, não um só).
- saldo em aberto !== valor mas dentro da mesma janela/conta/sinal → **divergência de valor**
  (FR-031/032) — retornado separadamente, nunca misturado com a lista de sugestão direta.
- nenhum candidato em nenhuma das duas categorias → resposta vazia (busca manual, FR-016).

**Rationale**: mantém 100% do cálculo de matching como função pura testável (a exigência mais
enfatizada no prompt original), com a query de elegibilidade (tenant, exclusão de já-conciliados)
ficando no repositório, onde o acesso a dado pertence.

---

## D9 — Criar lançamento a partir da transação (FR-018): usa `FinancialEntry.create()` normal +
`addPayment()` na mesma operação

**Decision**: `create-entry-from-transaction` chama `FinancialEntry.create({...dados do formulário,
bankAccountId: statement.bankAccountId})` (sem `saleOrderId` — nasce editável), depois imediatamente
`entry.addPayment({amountCents: transaction.amountCents, paidAt: transaction.postedAt, paymentMethod:
'conciliacao_bancaria'})` antes do primeiro `save()` — um único `INSERT` já nasce com o pagamento e o
`BankTransaction` correspondente (o `syncLedgerMovements` roda no primeiro `save()` igual a qualquer
lançamento novo com pagamento). Cria também 1 `BankStatementMatch`.

**Rationale**: "nasce conciliado" (User Story 5) sem precisar de duas operações (criar, depois
conciliar) — o próprio construtor + o método novo compõem antes do save único.

---

## D10 — Import de extrato: parser puro (`ofx-js` + `iconv-lite`) + storage MinIO seguindo o padrão
de anexo de lançamento

**Decision**: adicionar duas dependências novas a `apps/erp/api/package.json`
(`pnpm --filter @citybox/erp-api add ofx-js iconv-lite`):

- **`ofx-js`** (não `node-ofx-parser`, `ofx`, nem parser próprio) — única opção sem dependências de
  runtime (evita a cadeia `fast-xml-parser@^3` com prototype-pollution conhecida do
  `node-ofx-parser`), com tipos TS nativos, mantida ativamente, e que já tenta XML puro (2.x) antes de
  cair para o "mangling" de SGML tag-soup (1.x) — cobre os dois formatos sem flag manual.
- **`iconv-lite`** — nenhuma lib de OFX decodifica charset corretamente (`ofx-js` espera receber
  `string` já decodificada; a alternativa `ofx-data-extractor` finge resolver isso mas faz
  `buffer.toString()` fixo em UTF-8, o que corromperia acentos de bancos BR em `CHARSET:1252`/
  `8859-1` — exatamente o defeito que FR-028/RN citam). `ofx-parser.ts` (domínio puro) faz, nesta
  ordem: (1) lê os ~2KB iniciais como ASCII para achar `ENCODING:`/`CHARSET:` (OFX 1.x) ou o atributo
  `encoding="..."` da declaração XML (2.x); (2) mapeia para `'windows-1252' | 'iso-8859-1' | 'utf-8'`
  (nunca usa `Buffer.toString('latin1')` para CP1252 — faixa 0x80–0x9F diverge de ISO-8859-1 e
  corromperia aspas curvas/travessão); (3) decodifica com `iconv-lite`; (4) só então chama
  `ofx-js`'s `parseStrict()`; (5) normaliza `STMTTRN` (pode vir objeto único ou array).

`ofx-parser.ts` continua **função pura** (sem Prisma/Nest) mesmo importando essas duas libs — "pura"
aqui significa sem I/O de banco/rede, testável com fixtures de arquivo, não "zero dependência".

**Storage**: mesmo padrão de `financial-entries` (`ObjectStorage` injetada via `@Global()`
`StorageModule`, nunca `MinioObjectStorage` direto). `BankReconciliationObjectKeyPolicy` (mesmo
espírito de `ErpFinanceObjectKeyPolicy`):
```ts
static bankStatementFileKey(organizationId: string, bankStatementId: string): string {
  return `${organizationId}/financeiro/conciliacao-bancaria/${bankStatementId}/extrato.ofx`;
}
```
Upload: `import-bank-statement.use-case.ts` — gera `bankStatementId` (`randomUUID()`) antes da key
(mesma ordem de `upload-financial-entry-attachment`), parseia **antes** de persistir qualquer coisa
(um OFX ilegível nunca deve gravar arquivo nem linha — FR-002), só então `storage.put(...)` +
`repository.save(...)`. Download: rota dedicada faz proxy/stream (`storage.get(key)` → `res.send`),
igual a `get-financial-entry-attachment.route.ts` — nunca signed URL.

**Rationale**: reaproveita 100% um padrão já estabelecido (interceptor de upload, limite de tamanho,
`ObjectStorage`, proxy de download) — o único código genuinamente novo é o parser em si.

**Alternatives considered**: escrever parser SGML/XML do zero — rejeitado (research dedicada): a
lógica que seria reimplementada é essencialmente o que `ofx-js` já faz (~200 linhas, zero deps),
reinventá-la adiciona risco de bugs de parsing sem ganho.

---

## D11 — Dedupe (FR-027): chave de dedupe composta, não `fitId` cru

**Finding**: o schema sugerido no prompt original tinha `@@unique([bankStatementId, fitId])` — quebra
quando `fitId` vem vazio (múltiplas linhas com `fitId=""` colidiriam na constraint, ou pior, ficariam
sem proteção nenhuma se o campo virasse nulável fora do unique).

**Decision**: `BankStatementTransaction.dedupeKey` (`String`, calculado no parser/use case, nunca
pelo cliente): `dedupeKey = fitId` quando `fitId` não-vazio; senão
`sha1(postedAt.toISOString() + '|' + amountCents + '|' + memo.trim().toLowerCase())`. Constraint:
`@@unique([bankAccountId, dedupeKey])` — **por conta**, não por extrato: reimportar um período
sobreposto em dois arquivos diferentes da mesma conta também não duplica (mais forte que "por
extrato", e é o que RN-21 pede: "dentro da mesma conta").

**Rationale**: cobre FR-027 (bancos com `FITID` ausente/instável) sem exigir `fitId` sempre presente,
e generaliza corretamente o dedupe para reimportações de arquivos diferentes que se sobrepõem.

---

## D12 — IDs: `@default(uuid())`, não `citybox_uuid_v7()` — correção de uma afirmação do `CLAUDE.md`

**Finding**: `citybox_uuid_v7()` **não aparece em nenhum lugar** de `apps/erp/api/prisma/schema.prisma`
— todos os 67 models existentes usam `@default(uuid())` (UUID v4, gerado pelo Prisma), incluindo todo
o domínio `finance` (`BankAccount`, `BankTransaction`, `FinancialEntry`, `CardContract`, ...). A
afirmação do `CLAUDE.md` raiz ("UUIDs: `citybox_uuid_v7()`... em todos os IDs") não reflete o código
real deste app.

**Decision**: os três models novos (`BankStatement`, `BankStatementTransaction`,
`BankStatementMatch`) usam `id String @id @default(uuid())`, consistente com todo model vizinho em
`finance/`. Divergir introduziria o único model do schema com estratégia de ID diferente, sem
benefício.

---

## D13 — Testes: Jest, não node test runner nativo

**Finding**: `erp-api` usa **Jest** (`package.json:12`, `"test": "jest"`) — o prompt original menciona
"node --import tsx --test" como padrão do app, o que está desatualizado/incorreto para este pacote
específico.

**Decision**: `.spec.ts` de use cases roda em Jest, instanciando o use case diretamente com
repositórios in-memory (sem `TestingModule`), mesmo padrão de `bank-accounts`/`financial-entries`.
`ofx-parser.spec.ts` e `match-suggester.spec.ts` também em Jest, com fixtures reais de arquivo OFX em
`tests/fixtures/*.ofx` (1.x SGML Latin-1 acentuado, 2.x XML, arquivo corrompido).

---

## D14 — Criar lançamento: `bankAccountId` editável, diferente de `chartOfAccountId`/`costCenterId`

**Finding**: `/speckit-clarify` 2026-08-10 (layout de referência) trouxe um campo "Conta" editável
no formulário "Novo Registro" — mockup mostra um `Select` de conta bancária, não um valor fixo.

**Decision**: `create-entry-from-transaction` passa a receber `bankAccountId` no corpo, validado via
`assertBankAccountExists` (padrão já usado em `create-financial-entry.use-case.ts`), pré-preenchido
no cliente com `bankStatement.bankAccountId` mas editável. Diferente de valor/data/sinal (que
continuam **travados** na transação — FR-021), a conta bancária do lançamento é um dado do
lançamento em si, não da conciliação: trocar a conta não desfaz nem impede o vínculo com a
transação de origem (o `BankStatementMatch` não referencia `bankAccountId`).

**Rationale**: o mockup existe porque o operador às vezes não tem certeza de qual conta o arquivo
OFX realmente representa (`BankStatement.bankAccountId` já é opcional desde `007-financeiro-ajustes-ui`
FR-007, pelo mesmo motivo) — travar a conta do lançamento à do extrato removeria essa flexibilidade
sem necessidade, já que nada no domínio depende de as duas coincidirem.

**Alternatives considered**: manter `bankAccountId` implícito (sempre `bankStatement.bankAccountId`,
como na primeira implementação) — rejeitado pelo `/speckit-clarify`: quando o extrato não resolveu a
conta automaticamente (`bankAccountId: null`), não haveria conta nenhuma para usar, e forçar o
operador a corrigir a conta do extrato antes de criar o lançamento adicionaria um passo evitável.

---

## D15 — Filtro de período na lista de transações: `postedAt`, rótulo "Período"

**Finding**: `/speckit-clarify` 2026-08-10 trouxe um filtro "Período de vencimento" no mockup de
referência, acima da lista de transações pendentes. `BankStatementTransaction` não tem campo de
vencimento — só `postedAt` (data em que o banco processou).

**Decision**: `list-statement-transactions.use-case.ts` ganha `postedFrom`/`postedTo` opcionais,
filtrando por `postedAt` dentro do intervalo (mesmo padrão de `dueFrom`/`dueTo` em
`financial-entries`). Na UI, o campo chama-se **"Período"**, nunca "vencimento" — evita o operador
achar que está filtrando pelo vencimento de um lançamento financeiro (conceito que não existe numa
transação de extrato).

**Rationale**: reaproveita o padrão de filtro de intervalo de data já usado em
`financial-entries`/`financial-statement` (`dueFrom`/`dueTo`), sem introduzir um conceito novo de
"vencimento" que não existe no domínio de extrato bancário.

**Alternatives considered**: nenhuma — a única ambiguidade real era qual campo o filtro usa, já
resolvida pelo `/speckit-clarify`.

---

## D16 — Busca manual passa a incluir lançamentos `paid`: conciliação vira "vínculo apenas" nesse caso,
sem `addPayment` novo

**Finding** (`/speckit-clarify` 2026-08-11, comparação CPLUG x ERP Citybox): a busca manual
(`searchFinancialEntriesForReconciliationApi`) filtrava `status=pending` fixo no frontend — bug
relatado pelo usuário. A correção óbvia (remover o filtro) esbarra em `reconcile-transaction.
use-case.ts:67-69`, que rejeita qualquer `financialEntryId` cujo `status !== 'pending'` com
`FinancialEntryAlreadyReconciledError` — um lançamento `paid` nunca poderia ser confirmado mesmo
aparecendo na busca.

**Decision**: dois comportamentos distintos dentro do mesmo fluxo unificado (D7), decididos por
`entry.status`:
- `pending` (saldo em aberto > 0): comportamento já existente — `addPayment({amountCents:
  openBalanceCents, ...})` + `BankStatementMatch` referenciando o `FinancialEntryPayment` recém-criado.
- `paid` (saldo em aberto = 0, ainda sem `BankStatementMatch` ativo — FR-033 continua a única
  exclusão): **vínculo apenas**, sem chamar `addPayment`/`save()` no lançamento. O use case exige
  `entry.payments.length === 1` (assume — MVP não tem fluxo de pagamento parcial fora desta feature,
  D3/D9) e cria um `BankStatementMatch` referenciando esse único `financialEntryPaymentId` já
  existente, com `amountCents = entry.amountCents`. Um lançamento `paid` com mais de um pagamento é
  rejeitado com um erro novo (`FinancialEntryPaymentAmbiguousError`) — caso não tratado nesta entrega,
  não existe hoje nenhum fluxo que produza isso.
- Em ambos os casos, `openBalanceCents`/"valor elegível" do lançamento entra na soma validada por
  FR-016/017 (exato para 1 selecionado, soma exata para N) — a UI trata os dois casos de forma
  idêntica, só o backend ramifica.
- **Movimentação bancária (FR-029) para o caso `paid`**: já existe — foi gerada quando o pagamento
  original foi registrado (`syncLedgerMovements` roda em todo `save()` de `FinancialEntry`, a partir
  de `entry.payments`). Vincular o `BankStatementMatch` não precisa gerar nem duplicar
  `BankTransaction` nenhuma; é só para fins de rastreabilidade/auditoria (esta transação do extrato
  corresponde a este pagamento já existente).
- **Desfazer (FR-020)**: já não toca em `FinancialEntryPayment` para nenhum caso — o comportamento
  atual de `undo-reconciliation.use-case.ts` (decisão de `007-financeiro-ajustes-ui`, mais recente que
  D6 abaixo, que está desatualizado) só apaga o `BankStatementMatch`; funciona sem alteração para o
  novo ramo `paid`, já que não há pagamento novo para reverter.

**Rationale**: preserva a decisão do usuário (busca deve incluir `paid` sem vínculo ativo) sem violar
o invariante "nunca conciliação parcial" nem duplicar movimentação bancária; o custo é uma ramificação
nova no use case + 1 erro novo, não uma reescrita.

**Alternatives considered**: (a) reverter para `pending`-only — descartado, contraria a decisão
explícita do usuário; (b) sempre criar um novo `FinancialEntryPayment` mesmo para `paid` — descartado,
duplicaria valor pago (`paidCents` passaria de `amountCents` para `2×amountCents`).

---

## D17 — Busca manual ganha endpoint dedicado em `bank-reconciliation` (elegibilidade + filtros ricos),
substitui a chamada direta a `/v1/financial-entries`

**Finding**: FR-038 (filtros de Período/tipo de data/Categoria/Fornecedor/Método de
pagamento/Bandeira + tabela de resultados) e a exclusão de lançamentos já vinculados (FR-033) exigem
lógica que não pertence a `financial-entries` (não conhece `BankStatementMatch`) nem pode ficar
inteira no frontend (paginação quebraria se o anti-join fosse feito client-side). Além disso,
`status=paid` deixou de implicar "já conciliado" (D16) — sem endpoint dedicado, qualquer lançamento
`paid` já vinculado a outra transação vazaria na busca.

**Decision**: nova rota `GET /v1/bank-statements/:bankStatementId/transactions/:transactionId/
eligible-entries`, com use case próprio (`search-eligible-entries`) em `bank-reconciliation`,
substituindo `searchFinancialEntriesForReconciliationApi` (que hoje chama `/v1/financial-entries`
direto). O use case:
1. Resolve extrato/transação, usa `bankAccountId` do extrato (FR-037, travado).
2. Chama `FinancialEntryRepository.list(...)` (já injetado, D2) com os filtros de FR-038 — **sem**
   filtro de status.
3. Filtra fora os `financialEntryId` presentes em `bankStatementMatchRepository.
   findActiveFinancialEntryIds(...)` (FR-033 explícito aqui, já que não é mais implícito por status).
4. Calcula `eligibleAmountCents` por item (`pending` → saldo em aberto; `paid` → `amountCents`,
   D16) e devolve paginado, com os campos de tabela do FR-038 (vencimento, data de pagamento,
   competência, descrição/categoria, valor).

`FinancialEntryRepository`/`FinancialEntryListCriteria` (interface já usada por D2) ganham os filtros
que faltam para isso: `paidFrom`/`paidTo` (sobre `FinancialEntryPayment.paidAt`, relação `payments`),
`paymentMethod`/`cardBrand` (idem, sobre `payments`), `supplierId` (só `customerId` existe hoje no
filtro de listagem geral — `supplierId` só existe no DTO de escrita). Esses filtros novos servem tanto
a este endpoint quanto ficam disponíveis para a listagem geral de `financial-entries` no futuro (sem
uso adicional nesta entrega).

**Rationale**: mantém a regra "elegibilidade de conciliação é conhecimento de `bank-reconciliation`"
(mesmo espírito do comentário em `financial-entry.repository.interface.ts` sobre "anti-join com
BankStatementMatch"), sem forçar `financial-entries` a conhecer `BankStatementMatch` (import
circular) — mesma direção de dependência já estabelecida em D2.

**Alternatives considered**: (a) manter a chamada direta a `/v1/financial-entries` e excluir
já-vinculados client-side — descartado, quebra paginação (uma página cheia de resultados poderia
ficar vazia depois do filtro) e obrigaria o frontend a buscar a lista de `financialEntryId`s ativos
separadamente a cada busca; (b) mover o conhecimento de `BankStatementMatch` para dentro de
`financial-entries` — descartado, inverteria a direção de dependência estabelecida em D2 (bank-
reconciliation depende de financial-entries, não o contrário).

---

## D18 — Divergência de valor sai do drawer e vai para o cartão; o totalizador fica (neutro)

**Finding**: `manual-match-drawer.tsx:105-109/141-146/188-201` calcula `difference` e exibe **dois**
sinais no momento da escolha: um `Alert` de aviso ("a conciliação será recusada até a diferença
chegar a zero") e um rodapé "Diferença: R$ X" colorido em `warning.dark`/`success.main`. O usuário
pediu que a validação apareça no cartão da linha, não na hora de escolher o lançamento.

**Decision**: sai do drawer o **alerta** e a mensagem de recusa; entra no cartão o indicador de
divergência (mesma superfície do `value_divergence` que `match-suggestion-card.tsx:42-52` já
renderiza). O rodapé **permanece**, reduzido a um totalizador neutro — Selecionado / Transação /
Diferença — sem cor semântica de erro. O botão Conciliar do drawer continua `disabled` enquanto a
soma não fecha (o bloqueio de FR-016/FR-017 não mudou; só a sinalização mudou de lugar).

**Rationale**: FR-017 exige que o operador monte uma seleção cuja soma seja **exata**. Sem feedback
ao vivo do total, isso vira tentativa e erro — o rodapé é instrumento de construção da seleção, não
veredito de validação. O que o usuário classificou como ruído é o alerta, que julga antes da hora.
Decisão tomada com o usuário durante `/speckit-plan` (pergunta explícita).

**Alternatives considered**: (a) remover tudo do drawer — leitura mais literal do pedido, descartada
por inviabilizar a soma de N lançamentos no desktop; (b) rodapé só a partir de 2 selecionados —
segue a fronteira exata FR-016/FR-017, descartada por produzir um rodapé que aparece e some.

---

## D19 — Destravar o filtro de conta é aceitar um parâmetro opcional, não remover uma trava

**Finding**: `search-eligible-entries.use-case.ts:68` já resolve
`bankAccountId: bankStatement.bankAccountId ?? undefined` — um extrato **sem** conta resolvida já
busca hoje em todas as contas da organização. A "trava" da FR-037 é, na prática, "usa a conta do
extrato quando ela existe", e o frontend a reforça desabilitando o próprio botão "Buscar registro"
(`transaction-card.tsx:126-132`, tooltip "Este extrato não tem uma conta bancária resolvida").

**Decision**: `SearchEligibleEntriesInput` ganha `bankAccountId?: string` vindo do query param. O
use case passa a usar `input.bankAccountId ?? bankStatement.bankAccountId ?? undefined`. No
frontend, o select de conta em `manual-match-filters.tsx:177-182` deixa de ser `disabled` e passa a
listar as contas da organização, e o guard `disabled={!bankAccountId}` do botão sai.

**Rationale**: a mudança é aditiva e menor do que o addendum de 2026-08-11 fazia supor — o backend
já sabia lidar com ausência de conta. Mantém o default útil (conta do extrato pré-selecionada) sem
transformar o filtro em obrigatório.

**Alternatives considered**: remover `bankAccountId` do input e sempre buscar em todas as contas —
descartada: perde o default que torna a busca útil no caso comum (extrato com conta resolvida).

---

## D20 — "Conciliar" na linha de ações exige içar o estado de sugestão para o cartão

**Finding**: hoje `transaction-card.tsx:116-148` renderiza 3 controles (Novo Registro, Buscar
registro, excluir) e o botão Conciliar vive dentro de `match-suggestion-card.tsx:80-87`, um por
candidato sugerido. A FR-039 sempre exigiu 4 controles na linha; o código entrega 3.

**Decision**: `useSuggestionsQuery` (já consumido em `transaction-card.tsx:54`) passa a alimentar
também a linha de ações. "Conciliar" vira o 1º botão, habilitado apenas quando
`suggestion.kind === "exact"` (⚠️ **corrigido na implementação 2026-08-14** — este documento dizia
`"match"`, valor que não existe no tipo `MatchSuggestionResult`, cujos kinds são
`exact | value_divergence | none`). Com **um** candidato, concilia direto; com **vários**, foca/expande o
bloco de sugestões para o operador escolher (FR-014 proíbe o sistema escolher sozinho).

**Rationale**: nenhum dado novo é buscado — o estado já existe no componente pai; é reposicionamento
de UI. O ramo "vários candidatos" é o único ponto de desenho real, e a spec já o resolve.

**Alternatives considered**: duplicar `useSuggestionsQuery` na linha de ações — descartada, dobraria
requisições por cartão sem ganho.

---

## D21 — "Novo Registro": `Dialog` → `Drawer` à direita, componente já existente

**Finding**: `create-entry-from-transaction-dialog.tsx:59` usa
`<Dialog maxWidth="sm" fullWidth>`; `manual-match-drawer.tsx:51` usa
`<Drawer width={640}>` de `@citybox/mui`, cujo default é `anchor="right"`
(`packages/mui/src/molecules/drawer/drawer.tsx:35,46,60`).

**Decision**: trocar `Dialog`/`DialogTitle`/`DialogContent`/`DialogActions` pelo `Drawer` já usado
na mesma tela, sem passar `anchor` (o default já é `right`). Renomear o arquivo para
`create-entry-from-transaction-drawer.tsx`.

**Rationale**: as duas superfícies da tela passam a entrar pelo mesmo lado; zero componente novo,
zero token novo — só troca de container. O formulário de 3 seções (FR-040) ganha altura, que é o
eixo em que ele é longo.

**Alternatives considered**: `anchor="left"` (colide com a sidebar do ERP) e `anchor="bottom"`
(pouca altura útil para 3 seções no desktop) — ambas descartadas pelo usuário na clarificação.

---

## D22 — Movimentação na conta do extrato: exige coluna nova + método de domínio que troca a conta

**Finding**: o ramo `pending` de `reconcile-transaction.use-case.ts:126-133` chama
`entry.addPayment(...)` e `save()`; a `BankTransaction` resultante é projetada por
`syncLedgerMovements` na conta **do próprio lançamento**. Enquanto a busca era travada na conta do
extrato, as duas coincidiam. Com D19 elas divergem. `BankStatementMatch` (schema real) não tem
nenhuma coluna para guardar a conta anterior do lançamento.

**Decision**: (1) `BankStatementMatch` ganha `previousBankAccountId String? @map("previous_bank_
account_id")` — nulo quando a conta do lançamento já era a do extrato (caso comum, sem custo);
(2) `FinancialEntry` ganha um método de domínio que troca `bankAccountId` **ignorando o guard
`isReadOnly`**, pelo mesmo motivo já documentado em D4 para `addPayment` (FR-021 separa "dados
descritivos" de efeitos de pagamento; a conta é efeito de liquidação); (3) `reconcile-transaction`
grava `previousBankAccountId` e troca a conta **antes** do `addPayment`, para a movimentação nascer
já na conta certa; (4) `undo-reconciliation` restaura a conta a partir da coluna.

**Rationale**: o extrato é o fato — o dinheiro passou pela conta do extrato, e SC-009 exige que o
saldo dela reflita isso. Guardar a conta anterior no `match` (e não no lançamento) mantém a
reversibilidade sem poluir `FinancialEntry` com estado de conciliação.

**Alternatives considered**: (a) movimentação na conta do lançamento — mais barata (sem migration,
sem mutação), descartada pelo usuário por deixar SC-009 parcial; (b) derivar a conta anterior de
histórico/auditoria em vez de coluna — descartada: não há trilha consultável e o undo ficaria
heurístico, o mesmo erro que D6 evitou ao guardar `financialEntryPaymentId`.

⚠️ **Maior risco desta leva**: primeira migration da feature desde a entrega original e primeira
mutação de `FinancialEntry.bankAccountId`. Exige gate `database-reviewer` (Constitution V) e teste
de reversão dedicado (conciliar cross-account → desfazer → conta original restaurada, saldo das
duas contas de volta ao inicial).

---

## D23 — Conciliar exige conta no extrato (FR-042): resolve o conflito entre D19 e D22

**Finding**: conflito detectado durante `/speckit-plan`. D19 é motivada por extratos **sem** conta
(`BankStatement.bankAccountId` virou `String?` na `007-financeiro-ajustes-ui`), mas D22 exige uma
conta de destino para a movimentação. As duas decisões, juntas, deixavam o caso indefinido.

**Decision**: separar leitura de escrita. **Busca manual** (FR-016) segue disponível sem conta — o
operador precisa investigar. **Conciliar** (FR-015/016/017/018) fica bloqueado enquanto
`bankStatement.bankAccountId` for nulo, com erro de domínio dedicado
(`bank-statement-without-account.error.ts`) e mensagem clara na UI. Entra uma ação nova para
definir/corrigir a conta de um extrato já importado (use case + rota `PATCH`), reaproveitando a
validação de conta de FR-004.

**Rationale**: mantém SC-009 verdadeiro em 100% dos casos, em vez de fazer a semântica de saldo
depender de o OFX ter resolvido a conta. Escolha explícita do usuário durante `/speckit-plan`.

**Alternatives considered**: (a) fallback para a conta do lançamento quando o extrato não tem conta
— sem UI nova, descartada por fazer o mesmo fluxo produzir saldos em contas diferentes conforme o
arquivo; (b) reverter D22 — a mais barata, descartada junto com D22.

---

## D24 — Correção: `data-model.md` documentava `BankStatement.bankAccountId` como obrigatório

**Finding**: `data-model.md:27` declara `bankAccountId String @map("bank_account_id")`. O schema
real (`apps/erp/api/prisma/schema.prisma`) traz `String?`, alterado pela
`007-financeiro-ajustes-ui` FR-007 (importação deixou de exigir conta resolvida). O documento de
design da 006 nunca foi sincronizado com essa mudança de uma feature posterior.

**Decision**: corrigir `data-model.md` para refletir o schema real e anotar a origem da mudança.

**Rationale**: a divergência foi o que mascarou o conflito D19×D22 até o `/speckit-plan` — planejar
contra um documento desatualizado teria produzido tarefas erradas.

**Alternatives considered**: nenhuma.

---

## D25 — Conciliar lançamento `paid` exige mesma conta do extrato (FR-043); sugestão segue restrita à conta

**Finding**: achado **F1** do `/speckit-analyze` 2026-08-14. D16 desenhou o ramo `paid` como "vínculo
apenas, sem `addPayment`", com a justificativa de que a movimentação bancária do pagamento original
já existe. Essa justificativa só vale enquanto a conta do lançamento **é** a do extrato — premissa
verdadeira sob a FR-037 original (busca travada), e falsa desde D19. Com a conta destravada,
conciliar um `paid` da conta B com o extrato da conta A não gera movimentação nenhuma em A: a
movimentação existente está em B. O saldo de A nunca reflete uma transação que o banco processou,
contrariando SC-009. Nem a spec nem os contratos nem as tasks cobriam o caso.

**Decision**: (1) `reconcile-transaction` ganha um guard: no ramo `paid`, se
`entry.bankAccountId !== bankStatement.bankAccountId`, lança erro de domínio dedicado (`422`), sem
escrita nenhuma — validado junto das demais precondições, antes do laço de escrita. (2) O lançamento
continua elegível em `search-eligible-entries` (a busca serve para investigar; a recusa é só na
confirmação). (3) A restrição **não** se aplica ao ramo `pending`, que gera movimentação nova e para
o qual vale a troca de conta de D22. (4) Decisão associada: a sugestão automática (FR-014) permanece
restrita à conta do extrato — assimetria intencional com a busca manual.

**Rationale**: `pending` e `paid` são assimétricos por natureza — um cria movimentação (e por isso
pode escolher onde ela nasce), o outro reaproveita uma que já existe (e por isso não pode). Bloquear
é a única saída que preserva SC-009 sem alterar uma `BankTransaction` criada por outro fluxo. O caso
recusado é raro e conceitualmente suspeito: se o dinheiro passou pela conta A, um pagamento
registrado na conta B provavelmente é um erro de cadastro, que merece correção manual em vez de ser
absorvido silenciosamente por uma conciliação.

Sobre a assimetria sugestão×busca: sugerir é o sistema afirmando que dois registros casam; buscar é
o operador investigando. Cruzar contas na sugestão automática produziria falsos positivos (mesmo
valor e data em contas diferentes é comum em transferências internas) e, pela decisão (1), um
candidato `paid` de outra conta nem seria conciliável — o sistema estaria sugerindo algo que ele
mesmo recusa.

**Alternatives considered**: (a) transferir a `BankTransaction` existente de B para A — mantém
SC-009 e permite o caso, descartada por mutar um lançamento de saldo que esta feature não criou,
alterando o saldo histórico de B possivelmente já usado em fechamentos e relatórios; (b) permitir e
aceitar o saldo inalterado — zero código, descartada por exigir reescrever SC-009 para excluir o
ramo `paid`, transformando um critério de sucesso em exceção condicional.

---

## D26 — Não existe chave entre o OFX e o cadastro de contas: o operador informa na importação

**Finding**: reportado pelo usuário testando **em produção** — "Buscar registro" ficou desabilitado
em 100% das transações. Diagnóstico no navegador: tooltip "Este extrato não tem uma conta bancária
resolvida"; a organização tem 1 conta cadastrada (Banco do Brasil) e o arquivo OFX declara "Banco 1".
Investigação no schema achou a causa estrutural, não o bug pontual:

| | Campos disponíveis |
|---|---|
| `BankAccount` (cadastro) | `name`, `bankName`, **`bankCode`** — sem agência, sem número de conta |
| `BankStatement` (do OFX) | `bankName`, `bankCode`, `branchNumber`, `accountNumber` |

O OFX **traz** agência e conta; o cadastro não tem onde guardá-las. O único campo em comum é
`bankCode`, e ele falha na prática. O cadastro é uma conta **virtual** (`bank-accounts/GUIA.md`:
"espelham as contas reais, sem integração bancária") — ele nunca modelou coordenadas bancárias.
Ou seja: **não existe chave confiável de casamento**, e a heurística da `007-financeiro-ajustes-ui`
FR-007 (pré-selecionar quando exatamente 1 conta ativa tiver o mesmo `bankCode`) só disfarçava isso.

**Decision**: a conta bancária volta a ser **obrigatória na importação** (FR-001), revertendo a
opcionalidade da 007. Quem baixou o arquivo sabe de qual conta ele veio — o humano supre a chave que
os dados não têm. O `bankCode` do arquivo continua sendo usado, mas só para **pré-selecionar** o
campo (a rota `POST .../preview` da 007 permanece com esse papel); ele nunca aceita nem recusa uma
importação. Consequência: **FR-042/D23 vira regra de legado** — nenhum extrato novo nasce sem conta,
e a rota `PATCH .../bank-account` passa a existir para reparar os extratos importados durante a
janela em que a conta era opcional (sem ela, ficariam permanentemente inconciliáveis).

**Rationale**: ataca a causa em vez do sintoma. Sem migration, sem campo novo, sem heurística de
matching para manter. Também elimina o passo extra que D23 introduziria no caminho feliz: em vez de
importar → descobrir que travou → abrir uma ação para definir a conta, o operador informa uma vez,
no momento em que já está escolhendo o arquivo. `BankStatement.bankAccountId` **continua nullable no
schema** — as linhas legadas existem e precisam ser lidas; a obrigatoriedade é do use case de
importação, não da coluna.

**Alternatives considered**: (a) adicionar agência + número de conta ao `BankAccount` e casar por
eles — vira automático de verdade, descartada por exigir migration, backfill das contas já
cadastradas e ainda um fallback manual para bancos que formatam a conta de outro jeito; (b) revogar
FR-042 e D22 e mandar a movimentação para a conta do lançamento — é o comportamento do CPLUG
(verificado: lá o botão fica habilitado sem conta resolvida), descartada pelo usuário nesta rodada e
já na de manhã, porque deixa SC-009 parcial.

---

## D27 — Cliente/fornecedor: FK que já existe, filtro de CRM que não deveria existir

**Finding**: dois defeitos distintos sob o mesmo pedido do usuário ("o campo deve listar os clientes
de `/clientes`"), achados testando as duas telas:

1. **Tela de lançamentos** (`/financas/lancamentos`, feature `financial-entries`): o select chama
   `listActiveCustomers()` → `GET /v1/customers?tab=active`, ou seja, filtra pelo **estágio de CRM**
   "Cliente ativo". Mas **nenhuma tela permite editar o estágio**: todo cliente nasce `lead`
   (`customer.entity.ts:154`, `stage: input.stage ?? 'lead'`) e fica preso ali. A única exceção é o
   `customer-quick-create-dialog.tsx:106`, que grava `stage = "active"` fixo. Resultado: cliente
   cadastrado pela tela `/clientes` **nunca** aparece no select — comprovado em produção (1 cliente
   cadastrado, em `lead`, select vazio).
2. **Formulário da conciliação** (`create-entry-from-transaction-drawer.tsx:235`): o campo nem é um
   select — é um `Input` de **texto livre** que preenche `partyName`. O use case
   `create-entry-from-transaction.use-case.ts:100` repassa só `partyName` e **nunca** preenche
   `customerId`/`supplierId`.

**Decision**: (1) o campo vira **seleção sobre os cadastros** nas duas telas, sem filtro de estágio —
todos os clientes não excluídos mais os fornecedores; (2) `create-entry-from-transaction` ganha
`customerId`/`supplierId` opcionais e mutuamente exclusivos no input e na rota, gravando o vínculo
real; `partyName` continua existindo como rótulo denormalizado, derivado do cadastro escolhido;
(3) `listActiveCustomers()` deixa de mandar `tab=active` (renomear para refletir que não filtra mais
por estágio).

**Rationale**: estágio de CRM descreve funil de vendas, não autorização para receber ou pagar —
filtrar por um campo que a interface não deixa editar é uma trava sem dono. E o vínculo por FK é
barato: `FinancialEntry` **já tem** `customer_id`/`supplier_id` mapeados desde o desenho original
(`schema.prisma:21-22`, com `onDelete: SetNull` e a exclusividade validada em
`financial-entry.entity.ts:180`) — não há coluna nem migration nesta decisão, só um campo que o use
case deixava de preencher.

**Alternatives considered**: (a) manter o filtro e criar um editor de estágio em `/clientes` —
preserva a intenção original, descartada por acrescentar tela, validação e migração dos clientes já
presos em `lead`, tudo para sustentar uma restrição que ninguém pediu; (b) listar todos menos os
`inactive` — descartada porque impediria reeditar um lançamento antigo de um cliente aposentado.

⚠️ **Atravessa duas features**: o item (1) da tela de lançamentos é da `007-financeiro-ajustes-ui`.
Registrado aqui porque o usuário reportou as duas telas juntas e a regra é a mesma, mas a correção em
`financial-entries` deve ser espelhada na spec da 007.

---

## Resumo das decisões

| # | Decisão | Módulo afetado |
|---|---|---|
| D1 | Módulo novo `finance/bank-reconciliation`, forma espelha `bank-accounts` | novo módulo |
| D2 | Injeta `FinancialEntryRepository`/`BankAccountRepository` via DI (não Prisma direto) | `bank-reconciliation` |
| D3 | Conciliar = `FinancialEntryPayment` + `syncLedgerMovements` existente; `sourceType: reconciliation` fica não utilizado | `financial-entries` (reaproveitado) |
| D4 | `FinancialEntry.addPayment()`/`removePayment()` novos, sem guard de `isReadOnly` | `financial-entries` (domain) |
| D5 | `FINANCIAL_ENTRY_PAYMENT_METHODS` +`'conciliacao_bancaria'` | `financial-entries` (domain) |
| D6 | Desfazer = `removePayment` + apagar `BankStatementMatch` (hard delete) | `bank-reconciliation` |
| D7 | Sugestão/manual/soma = um único fluxo (`financialEntryIds: string[]`), N=1 é o caso simples | `bank-reconciliation` |
| D8 | `match-suggester` puro: elegibilidade no repositório, classificação (sugestão vs. divergência) no domínio | `bank-reconciliation` (domain) |
| D9 | Criar lançamento = `create()` + `addPayment()` antes do primeiro `save()` | `bank-reconciliation` + `financial-entries` |
| D10 | Parser: `ofx-js` + `iconv-lite` (charset explícito); storage = `ObjectStorage` padrão, bucket `erp` | `bank-reconciliation` |
| D11 | Dedupe por `(bankAccountId, dedupeKey)`, `dedupeKey` = `fitId` ou hash de fallback | `bank-reconciliation` (schema) |
| D12 | IDs `@default(uuid())`, igual a todo o resto do schema `erp-api` | schema (correção de suposição) |
| D13 | Testes em Jest, in-memory repos, sem `TestingModule` | `bank-reconciliation` |
| D14 | `create-entry-from-transaction` ganha `bankAccountId` editável (valor/data/sinal continuam travados) | `bank-reconciliation` |
| D15 | `list-statement-transactions` ganha filtro `postedFrom`/`postedTo` (UI: "Período", não "vencimento") | `bank-reconciliation` |
| D16 | Busca manual inclui `paid`: conciliar um `paid` vira vínculo apenas (sem `addPayment` novo) | `bank-reconciliation` + `financial-entries` (domain) |
| D17 | Novo endpoint `GET .../eligible-entries` (elegibilidade + filtros FR-038), substitui chamada direta a `/v1/financial-entries` | `bank-reconciliation` + `financial-entries` (novos filtros de listagem) |
| D18 | Divergência sai do drawer e vai para o cartão; rodapé fica como totalizador neutro | frontend (`bank-reconciliation`) |
| D19 | `eligible-entries` aceita `bankAccountId` opcional (default = conta do extrato); filtro destravado | `bank-reconciliation` + frontend |
| D20 | "Conciliar" vira o 1º botão da linha de ações; estado de sugestão içado para o cartão | frontend (`bank-reconciliation`) |
| D21 | "Novo Registro": `Dialog` → `Drawer` à direita (componente já existente) | frontend (`bank-reconciliation`) |
| D22 | Movimentação sempre na conta do extrato: +coluna `previousBankAccountId`, +método de domínio que troca a conta | **schema (migration)** + `bank-reconciliation` + `financial-entries` (domain) |
| D23 | Conciliar exige conta no extrato (FR-042); +ação para definir a conta de um extrato importado | `bank-reconciliation` + frontend |
| D24 | Correção: `data-model.md` dizia `bankAccountId` obrigatório; schema real é `String?` desde a 007 | documentação |
| D25 | Conciliar `paid` exige mesma conta do extrato (FR-043); sugestão (FR-014) segue restrita à conta | `bank-reconciliation` (guard, sem schema) |
| D26 | Sem chave OFX↔cadastro: conta obrigatória na importação (FR-001, reverte 007 FR-007); FR-042/D23 vira legado | `bank-reconciliation` + frontend (sem schema) |
| D27 | Cliente/fornecedor vira seleção com `customerId`/`supplierId` (FKs já existentes); sem filtro de estágio CRM (FR-044) | `bank-reconciliation` + `financial-entries` (007) |

> **Nota (2026-08-11)**: D6 está desatualizado em relação ao código real — `undo-reconciliation.
> use-case.ts` (decisão posterior de `007-financeiro-ajustes-ui`, US10/R9) não chama mais
> `removePayment`; só apaga o `BankStatementMatch`, mantendo o `FinancialEntryPayment` como pagamento
> manual. D16 já considera esse comportamento real, não o documentado em D6. Mantido sem edição por
> política de nunca remover conteúdo histórico (`CLAUDE.md` §7) — só sinalizado aqui.
