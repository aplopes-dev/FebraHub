# Research — Motor de recebíveis do contrato de cartões

Fase 0 do `/speckit-plan`. Cada decisão resolve uma lacuna técnica encontrada ao ler o código atual
(não coberta pelo spec, que é intencionalmente livre de detalhe de implementação). Nenhuma pendência
`NEEDS CLARIFICATION` restante.

---

## D1 — Onde o motor vive e como `sales` o consome

**Decision**: O cálculo (`calculateCardSettlement`, `business-day-calendar`) é código de domínio
**puro** em `finance/card-contracts/domain/services/` — sem Prisma, sem decorators NestJS. A
resolução de dados (buscar `CardContract`/`CardPaymentMethod`/`CardRateTier` aplicáveis) vira uma
função `resolveCardSettlement(tx, ...)` em `sales/infrastructure/database/resolve-card-settlement.ts`,
que roda **Prisma direto** dentro da mesma transação de `saveWithOptionalMovement`, e importa as
funções puras de `card-contracts` por **import de módulo TypeScript comum** — nunca por injeção de
dependência do `FinanceModule` no `SalesModule`.

**Rationale**: `api/AGENTS.md` §9 já registra, para o `PrismaSaleOrderRepository`, a decisão
consciente de gerar `FinancialEntry` "via Prisma direto na mesma transação, **sem** injetar
`FinanceModule`, de propósito" — e reforça em outro ponto que `SalesModule` **deixou** de importar
`FinanceModule` (histórico de uma reversão). O código atual já busca `ChartOfAccount`/`CostCenter`
por `systemKey` via `tx.chartOfAccount.findFirst(...)` dentro do próprio repositório — o mesmo padrão
se estende para `CardContract`/`CardPaymentMethod`/`CardRateTier`. Isso preserva a decisão registrada
sem reabri-la.

**Alternatives considered**:
- *Injetar `CardContractRepository`/`CardPaymentMethodRepository` do `finance/card-contracts` no
  `SalesModule`* — rejeitado: reabriria a decisão documentada e reintroduziria o import circular que
  motivou a reversão histórica (`api/AGENTS.md` §9/§10).
  Reversão histórica (`api/AGENTS.md` §9/§10).
- *Mover o motor para dentro do próprio `sales`* — rejeitado: o cálculo pertence
  conceitualmente ao domínio de contrato de cartão (é o que o spec já nomeia
  `calculateCardSettlement`), e `card-contracts` é quem já possui os testes/validações de
  `CardRateTier`.

---

## D2 — Campos novos em `SaleOrderPayment`

**Decision**: Adicionar, todos opcionais/nulos (retrocompatíveis com pagamentos não-cartão):

| Campo | Tipo | Uso |
|---|---|---|
| `cardPaymentType` | `CardPaymentMethodType?` (reaproveita o enum existente `pix\|debit\|credit`) | Discriminador estrutural — substitui a inferência hoje impossível a partir de `methodId` (string livre de um catálogo mock). Só setado quando o operador escolhe uma forma de pagamento em cartão/Pix real (ver D6). |
| `brand` | `String?` | Bandeira, vinda do catálogo fixo compartilhado (ver D3). `null` para Pix (RN-11) e para formas não-cartão. |
| `installments` | `Int?` (default implícito 1 quando `cardPaymentType='credit'` e o campo não é enviado) | Número de parcelas do crédito. Irrelevante para débito/Pix. |

`methodId` (campo legado, string livre) **permanece inalterado** — continua sendo a forma de
pagamento "de exibição" hoje. Os campos novos são o sinal estrutural que o motor consome.

**Rationale**: Não modificar `methodId` nem seu catálogo evita reabrir toda a modelagem de formas de
pagamento das vendas (fora de escopo do spec). Os três campos novos são exatamente o que FR-001/002 e
o cálculo (FR-004, FR-006, FR-009/010) exigem, nem mais nem menos.

**Alternatives considered**: substituir `methodId` por um enum estruturado único — rejeitado por
escopo (afetaria toda forma de pagamento, não só cartão/Pix, e o spec não pede isso).

---

## D3 — Catálogo de bandeiras (reaproveitado, não recriado)

**Finding**: `apps/erp/web/src/features/card-contracts/components/payment-method-form-dialog.tsx:29-40`
já define `BRAND_OPTIONS` — catálogo fixo (Visa, Mastercard, Elo, American Express, Hipercard, Diners
Club, Discover, Sodexo, Alelo, "Outra") usado no `Select` de bandeira do cadastro de método de
pagamento do contrato. Ou seja, `CardPaymentMethod.brand` **já é** restrito a esse catálogo na
prática (a coluna Prisma continua `String?` livre, mas a única UI que a escreve já é fechada).

**Decision**: Extrair `BRAND_OPTIONS` para `apps/erp/web/src/features/card-contracts/data/card-brands.ts`
(exportado), no mesmo espírito da extração de `MOCK_PROVIDERS` → `data/card-providers.ts` já exigida
pelo spec. `payment-method-form-dialog.tsx` passa a importar de lá. O novo campo "Bandeira" do painel
de pagamentos de `sales-orders` importa o **mesmo** arquivo — garantindo por construção que qualquer
valor que o operador escolher na venda é um valor que também pode existir num método de contrato,
sem depender de digitação livre nem de uma nova chamada de rede.

**Rationale**: resolve a clarificação do spec ("catálogo fixo, igual ao do contrato") com o menor
diff possível — zero novo endpoint, zero novo tipo no schema Prisma, reaproveita um catálogo que já
existe e já é a fonte real dos valores contra os quais o motor precisa comparar (FR-004).

**Alternatives considered**:
- *Criar catálogo novo do zero* — rejeitado: duplicaria `BRAND_OPTIONS`, arriscando divergência entre
  as duas listas ao longo do tempo.
- *Reaproveitar `useCardBrandSuggestionsQuery` (de `financial-entries`, que agrega bandeiras já usadas
  nos contratos ativos via query)* — considerado e rejeitado para este campo: aquele hook existe para
  **sugestão em campo livre** (`FinancialEntryPayment.cardBrand`, decisão D12 do research de
  `001-financial-entries` — "não enum, não FK"), um caso de uso diferente (lançamento manual, sem
  matching automatizado a jusante). O campo desta feature precisa de um catálogo **fechado** para
  FR-004 funcionar; `BRAND_OPTIONS` estático já cumpre isso sem round-trip de rede.

---

## D4 — Débito vs. crédito não são distinguíveis hoje no formulário de venda

**Finding**: O painel de pagamentos de `sales-orders`
(`components/sale-order-payments-panel.tsx`) usa `paymentMethods` vindo de
`MOCK_PAYMENT_METHODS` (`features/purchases/data/mock-payment-methods.ts`) — uma lista **mock**,
sem nenhuma relação com `CardPaymentMethod` da API. Essa lista tem só **uma** entrada de cartão
("Cartão de crédito", `id: "pm-cartao"`) — não existe opção de débito hoje.

**Decision**: Estender o catálogo de formas de pagamento do painel (mesmo arquivo mock, sem virar
API — fora de escopo tocar a listagem de formas de pagamento como um todo) para separar **Cartão de
débito** e **Cartão de crédito**, cada entrada carregando um `cardPaymentType` (`debit`/`credit`) —
mais a entrada existente de **Pix** ganhando `cardPaymentType: 'pix'`. Formas sem cartão (dinheiro,
boleto, transferência) não carregam `cardPaymentType` (permanece `undefined`). O painel usa esse
campo para decidir quando mostrar os sub-campos Bandeira/Parcelas (FR-001/002) — não o texto do
label.

**Rationale**: é o menor diff que resolve FR-001 (bandeira só faz sentido com débito/crédito
distintos) sem expandir o escopo para "reconstruir o catálogo de formas de pagamento de vendas"
(explicitamente fora do pedido do spec, que só fala de bandeira/parcelas).

**Alternatives considered**: manter uma única entrada "Cartão" com um segundo seletor
Débito/Crédito — rejeitado por ser uma mudança de UX maior que simplesmente adicionar uma opção à
lista existente, sem ganho real.

---

## D5 — Um `FinancialEntry` por pagamento, não por pedido (com fallback agregado preservando o comportamento de hoje)

**Finding**: Hoje, `maybeCreateReceivable` gera **1 único** `FinancialEntry` para
`saleOrder.totalCents` inteiro, usando `saleOrder.payments[0]?.bankAccountId` — ignora completamente
quantos pagamentos existem ou qual método cada um usa.

**Decision**: Iterar `saleOrder.payments`. Para cada pagamento com `cardPaymentType` setado (débito,
crédito ou Pix), tentar resolver+calcular (D1) e gravar 1..N `FinancialEntry` (uma por parcela) — ou,
sem correspondência, gravar 1 `FinancialEntry` de fallback **para aquele pagamento** (bruto, quitado,
hoje, com o indicador visível de FR-005). Para os pagamentos **sem** `cardPaymentType` (dinheiro,
boleto, transferência, ou pagamentos legados sem os campos novos), somar os valores num único
`FinancialEntry` "resto do pedido" — **exatamente** como hoje — só quando essa soma for > 0.

**Consequência prática**: um pedido pago 100% em dinheiro continua gerando **exatamente 1**
`FinancialEntry`, idêntico ao comportamento atual (zero regressão). Um pedido pago 100% em cartão
passa a gerar N `FinancialEntry` (um ou mais por pagamento) e **zero** entrada agregada. Um pedido
misto (ex.: metade dinheiro, metade cartão) passa a gerar mais de 1 `FinancialEntry` onde antes
gerava só 1 — mudança de comportamento **intencional e delimitada** por FR-003 ("resolver o contrato
aplicável a **cada** pagamento"), documentada aqui porque o spec não trata explicitamente o caso
misto.

**Rationale**: preserva 100% o caminho mais comum e mais testado (pagamento único, não-cartão) e
aplica a mudança só onde o spec exige.

**Alternatives considered**: manter sempre 1 `FinancialEntry` por pedido, com os campos de
rastreabilidade só preenchidos quando o pedido tem 1 único pagamento em cartão — rejeitado: não
atende FR-009/FR-010 (N parcelas do crédito exigem N `FinancialEntry`) nem o caso de 2+ pagamentos em
cartões/bandeiras diferentes no mesmo pedido.

---

## D6 — Resolução do contrato aplicável: por `bankAccountId` + `cardPaymentType` + `brand`, sistema-derivada

**Decision**: Para cada pagamento com `cardPaymentType` setado, buscar
`CardContract` onde `organizationId` = escopo, `bankAccountId` = `payment.bankAccountId`,
`active = true` e `deletedAt = null` (checagem **explícita** dos dois — a listagem hoje usa só
`deletedAt` para as abas Ativos/Excluídos, então um contrato inativado mas não excluído continuaria
"visível" se só filtrássemos por `deletedAt`). Dentro do(s) contrato(s) candidato(s), buscar
`CardPaymentMethod` com `type = payment.cardPaymentType` e (`brand = payment.brand` OU, para Pix,
`brand IS NULL`). Se exatamente um contrato+método bate → usa. Se nenhum bate → fallback (FR-005).
Se mais de um contrato bate (mesma conta bancária, mais de um contrato ativo com método
correspondente) → usa o mais antigo (`createdAt` asc), determinístico, e **registra o mesmo aviso de
fallback parcial** já que a escolha é ambígua — ver Risks.

O `cardContractId` resolvido fica gravado no `FinancialEntry` gerado (rastreabilidade, FR de
Assumptions do spec) — não é um campo que o operador escolhe na tela; é derivado pelo motor no
fechamento.

**Rationale**: reaproveita `bankAccountId`, que **já existe** em `SaleOrderPayment` e já é usado hoje
para creditar o `FinancialEntry` — nenhum campo novo de "contrato" precisa aparecer no formulário de
venda, evitando um seletor extra que o spec (User Story 1) não pede.

**Alternatives considered**: campo `cardContractId` escolhido manualmente pelo operador no painel de
pagamento — rejeitado por escopo (User Story 1 só pede bandeira+parcelas) e por UX (a maioria das
lojas terá no máximo 1 contrato por conta bancária; forçar uma escolha manual sempre seria atrito
desnecessário no fluxo mais crítico do ERP).

---

## D7 — Progressivo sem faixa correspondente

**Gap não coberto pelo spec/prompt original**: `CardPaymentMethod.progressiveEnabled=true` mas
nenhuma `CardRateTier` cobre o número de parcelas da venda (buraco de faixa — ex.: faixas 1-3 e 7-12
cadastradas, venda em 5x).

**Decision**: se existir `CardPaymentMethod.rate` (a taxa "base", opcional quando progressivo) →
usar essa taxa como último recurso. Se `rate` também for nulo → tratar como "sem correspondência"
(FR-005, fallback bruto para aquele pagamento, com aviso).

**Rationale**: mantém a garantia "nunca falha a venda" (Orientação #2 do spec) mesmo diante de um
cadastro de contrato incompleto, sem inventar uma taxa.

---

## D8 — Arredondamento de parcelas

**Decision**: reaproveitar a convenção já usada em `sales-contracts.service.ts:136-173`:
`base = Math.floor(netTotalCents / count)`; cada parcela recebe `base`; a **última** parcela recebe
`base + (netTotalCents - base * count)` (o resto inteiro). Garante soma exata (FR-012 / SC-002) com o
mesmo algoritmo já testado em produção em outro submódulo do mesmo app — sem inventar uma segunda
convenção de arredondamento no código.

---

## D9 — Calendário de dias úteis

**Decision**: `business-day-calendar.ts` — função pura `addDays(date, n, dayType)`:
- `calendar_days` → soma corrida.
- `business_days` → soma pulando sábado/domingo (`date.getDay() === 0 || 6`), sem tabela de feriados
  (limitação já assumida no spec — Assumptions).
- Push adicional para `businessDaysOnly` (FR-011): se a data final cair em fim de semana, empurra
  para a próxima segunda.

**Finding confirmado**: não existe hoje nenhum utilitário de dia útil no `erp-api` (`grep` por
`business.?day|dia.?[uú]til` não retornou nada) — precisa ser criado do zero, exatamente como o spec
já antecipava.

---

## D10 — Campos novos em `FinancialEntry` (nomes escolhidos para não colidir com `feesCents`/`finesCents`)

**Finding crítico**: `FinancialEntry` já tem `feesCents`/`finesCents` (migration
`20260805180448_...`, feature `001-financial-entries`) — mas com semântica **aditiva**:
`totalCents = amountCents + feesCents + finesCents` (juros/multa por atraso, somados **em cima** do
valor base). É o oposto do nosso conceito (taxa da adquirente **descontada** do bruto para chegar no
líquido). Reaproveitar esses campos criaria uma contradição de sinal/semântica no mesmo model.

**Decision**: campos novos com nomes que não colidem:

| Campo | Tipo | Semântica |
|---|---|---|
| `grossAmountCents` | `Int?` | Valor bruto da venda para aquele recebível/parcela, antes da taxa. `null` em lançamentos não gerados por este motor (compatibilidade). |
| `acquirerFeeCents` | `Int?` | Taxa da adquirente descontada (percentual + tarifa fixa já somadas). `grossAmountCents - acquirerFeeCents = amountCents` quando ambos setados. |
| `cardContractId` | `String?` (FK → `CardContract`) | Contrato resolvido (D6). |
| `cardPaymentMethodId` | `String?` (FK → `CardPaymentMethod`) | Método resolvido. |
| `saleOrderPaymentId` | `String?` (FK → `SaleOrderPayment`) | Pagamento de origem — base da idempotência (D11). |
| `installmentSequence` | `Int?` | 1-based; `1` mesmo quando há só 1 parcela (single_payment, Pix, fallback). |
| `installmentCount` | `Int?` | Total de parcelas geradas para aquele pagamento. |
| `cardSettlementFallback` | `Boolean` (default `false`) | Indicador visível (clarificação do spec) — `true` quando o pagamento caiu no fallback de FR-005 por falta de contrato/método correspondente. |

**Rationale**: nomes descritivos e sem sobreposição de conceito com os campos de atraso já
existentes; todos nulos por padrão preservam 100% os `FinancialEntry` que não passam pelo motor
(lançamentos manuais, vendas sem cartão).

---

## D11 — Idempotência: por que `saleOrderPaymentId` é uma chave segura

**Finding (investigação de código)**: `PrismaSaleOrderRepository.saveWithOptionalMovement` faz
`deleteMany` + `createMany` em `SaleOrderPayment` a **cada** chamada
(`prisma-sale-order.repository.ts:123-140`), preservando o `id` de cada pagamento
(`id: payment.id ?? randomUUID()` — só gera um novo id quando o pagamento chega **sem** id).

O caminho que fecha o pedido é `UpdateSaleOrderStatusUseCase` (PATCH dedicado de status):
`findById` carrega o pedido persistido (payments com id real) → `current.updateStatus('closed')`
**não mexe** em `payments` (spread de `this.props`, `sale-order.entity.ts:270-275`) → o array
salvo de volta tem os **mesmos ids**. O outro caminho que grava `payments` de novo
(`UpdateSaleOrderUseCase`, PUT completo) já **bloqueia** qualquer edição quando
`stockMovementId` está setado — e fechar sempre gera o `stockMovementId` — lançando
`SaleOrderAlreadyClosedError` (`update-sale-order.use-case.ts:47-49`).

**Conclusão**: uma vez fechado, `SaleOrderPayment.id` é **estável** — reprocessar o mesmo fechamento
(reenvio do PATCH de status, retry de rede) sempre reidentifica os mesmos pagamentos.

**Decision**: `@@unique([saleOrderPaymentId, installmentSequence])` em `FinancialEntry` (ambos
nuláveis — Postgres trata `NULL` como distinto em índice único, então lançamentos manuais/legados
com `saleOrderPaymentId IS NULL` não são afetados). O `resolveCardSettlement`/gravação checa essa
combinação antes de criar; se já existe, pula (idempotente). O `FinancialEntry` "resto do pedido" (D5,
pagamentos sem `cardPaymentType`) mantém a checagem de idempotência **atual** por `saleOrderId` com
`saleOrderPaymentId IS NULL` — sem mudança de comportamento aí.

---

## D12 — Indicador visível de fallback no frontend

**Decision**: `cardSettlementFallback` (D10) entra no DTO de leitura de `FinancialEntry`
(`GET /v1/financial-entries`, já consumido por `features/financial-entries` e por
`features/financial-statement`) e a lista/detalhe de Lançamentos ganha um badge simples (reaproveita
`SemanticBadge`/`semanticBadgeSx` já documentado no `web/AGENTS.md` — tom `warning`) quando
`cardSettlementFallback = true`. `grossAmountCents`/`acquirerFeeCents` aparecem no detalhe do
lançamento (FR-015/User Story 5) ao lado do valor líquido (`amountCents`), só quando não-nulos.

**Rationale**: `financial-entries` (Lançamentos) já é o lugar onde o usuário financeiro consulta
qualquer recebível (User Story 5 do spec aponta exatamente para essa consulta) — não precisa de tela
nova, só de campos a mais no DTO já existente e um badge condicional reaproveitando um padrão visual
já documentado.

---

## D13 — Não recalcular o passado

**Decision**: o motor roda a partir do primeiro fechamento de venda **após** o deploy desta
funcionalidade — sem migração de dados/backfill de `FinancialEntry` já existentes (Risco documentado
no spec: "Não recalcular o passado"). Nenhum script de backfill nesta entrega (diferente do
`scripts/backfill-financial-entry-allocations.ts` que a feature `001-financial-entries` precisou —
não se aplica aqui porque não há coluna obrigatória nova sendo retro-preenchida; todos os campos
novos são opcionais).

---

## D14 — Achado durante a implementação: campos do cadastro que continuam sem consumidor (não previstos no research original)

**Finding**: ao escrever os textos de ajuda do formulário (Polish, T045), identificamos que
`resolveCardSettlement`/`calculateCardSettlement` só consomem
`CardContract.{firstPaymentDayType,installmentDayType,businessDaysOnly}` e
`CardPaymentMethod.{rate,feeCents,firstPaymentDays,settlementDays,daysBetweenInstallments,
progressiveEnabled,rateTiers}`. Quatro campos adicionais do cadastro (distintos dos já
documentados como fora de escopo — `cutoffPeriod`/`anticipationPeriods`/`anticipationRate`)
também não são lidos:

- `CardContract.depositFeeCents` — tarifa a nível de contrato, distinta de
  `CardPaymentMethod.feeCents` (essa sim aplicada por método).
- `CardContract.allEntriesPaidInContract` — sem semântica documentada em nenhum lugar (nem
  na transcrição de origem, nem no spec) desde antes desta entrega.
- `CardContract.businessDaysDeposit` — distinto de `CardContract.businessDaysOnly` (esse sim
  aplicado); parece redundante com ele, mas ambos existem como campos separados no schema.
- `CardPaymentMethod.minInstallments`/`maxInstallments` — cadastráveis, mas
  `resolveCardSettlement` não valida se `payment.installments` está dentro da faixa do
  método resolvido antes de calcular.

**Decision**: documentar (form `card-contract-form-view.tsx` + `GUIA.md` da feature +
`api/AGENTS.md` §9), não implementar nesta entrega — mesma lógica de D7/D13: nenhum destes
tinha requisito claro no spec original, e abrir escopo novo no Polish de uma entrega que já
mexe no fluxo mais crítico do ERP (fechamento de venda) é mais risco do que valor. Registrado
como pendência para uma fatia futura, junto de `cutoffPeriod`/antecipação/`voucher`.

## Resumo das decisões

| # | Decisão | Módulo afetado |
|---|---|---|
| D1 | Motor = função pura, consumida por import direto (sem DI) | `card-contracts` (domain) + `sales` (infra) |
| D2 | `SaleOrderPayment` +`cardPaymentType`/`brand`/`installments` | schema + `sales` |
| D3 | Catálogo de bandeiras reaproveitado (`card-brands.ts`) | `card-contracts` (web) + `sales-orders` (web) |
| D4 | Débito/crédito distintos no catálogo mock do painel de pagamento | `sales-orders` (web) |
| D5 | 1 `FinancialEntry` por pagamento em cartão/Pix; resto do pedido preserva o agregado de hoje | `sales` |
| D6 | Resolução do contrato por `bankAccountId`+`type`+`brand`, sistema-derivada | `sales` |
| D7 | Progressivo sem faixa → `rate` base → senão fallback | `card-contracts` (domain) |
| D8 | Arredondamento = convenção de `sales-contracts` (resto na última parcela) | `card-contracts` (domain) |
| D9 | Calendário de dias úteis novo, seg-sex, sem feriados | `card-contracts` (domain) |
| D10 | Campos novos em `FinancialEntry`, nomes sem colisão com `feesCents`/`finesCents` | schema |
| D11 | Idempotência por `(saleOrderPaymentId, installmentSequence)` — seguro pós-fechamento | schema + `sales` |
| D12 | Indicador visível de fallback no DTO/lista de Lançamentos | `financial-entries` (web) |
| D13 | Sem backfill — motor vale só para vendas fechadas a partir do deploy | — |
