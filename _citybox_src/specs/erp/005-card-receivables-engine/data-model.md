# Data Model — Motor de recebíveis do contrato de cartões

Fase 1 do `/speckit-plan`. Nenhum model novo — só campos novos em dois models já existentes (ambos
já em `TENANT_SCOPED_MODELS`), mais os tipos internos do calculador puro. Convenção: dinheiro em
centavos (`Int`), taxas em `Decimal(9,4)` — igual ao resto do schema.

## 1. `SaleOrderPayment` (alterado)

Campos atuais preservados (`id`, `organizationId`, `saleOrderId`, `amountCents`, `methodId`,
`bankAccountId`). Campos novos, todos opcionais:

| Campo | Tipo Prisma | Nulo? | Regra |
|---|---|---|---|
| `cardPaymentType` | `CardPaymentMethodType?` (enum já existente: `pix\|debit\|credit`) | sim | Setado pelo frontend só quando a forma de pagamento escolhida é Pix, débito ou crédito real (D4 de research.md). `null` para dinheiro/boleto/transferência. |
| `brand` | `String?` | sim | Do catálogo fixo compartilhado (`card-brands.ts`, D3). `null` para Pix e para não-cartão. Ignorado/`null` se `cardPaymentType` for `null`. |
| `installments` | `Int?` | sim | Só relevante para `cardPaymentType = 'credit'`. `1` (ou `null`, tratado como 1) para débito/Pix. |

**Validação de domínio** (`SaleOrder` entity, `normalizePayments`):
- Se `cardPaymentType = 'credit'` e `installments` informado, deve ser inteiro ≥ 1.
- `brand` obrigatório quando `cardPaymentType` é `debit` ou `credit` (mesma regra do cadastro de
  `CardPaymentMethod` — RN-11: Pix não tem bandeira).
- Nenhuma validação cruzada com `CardContract`/`CardPaymentMethod` acontece aqui — a
  correspondência é responsabilidade do motor no fechamento (FR-003/FR-004), não do formulário da
  venda (o operador pode registrar um pagamento em cartão mesmo sem contrato cadastrado; cai no
  fallback).

**Sem migração de dados**: pagamentos existentes ficam com os três campos `null` — continuam tratados
como "sem `cardPaymentType`" (D5), preservando o `FinancialEntry` agregado de hoje para pedidos já
fechados no passado (nunca reprocessados, D13).

## 2. `FinancialEntry` (alterado)

Campos atuais preservados integralmente. Campos novos, todos opcionais/com default seguro:

| Campo | Tipo Prisma | Nulo?/Default | Regra |
|---|---|---|---|
| `grossAmountCents` | `Int?` | nulo | Valor bruto da venda para este recebível. Presente somente quando `saleOrderPaymentId` também está presente. |
| `acquirerFeeCents` | `Int?` | nulo | Taxa da adquirente (percentual + tarifa fixa) descontada. `grossAmountCents - acquirerFeeCents = amountCents` quando ambos setados (invariante verificada em teste, não em constraint de banco — `Decimal`/arredondamento intermediário não vale a pena modelar como `CHECK`). |
| `cardContractId` | `String?` (FK → `CardContract.id`, `onDelete: SetNull`) | nulo | Contrato resolvido no fechamento (D6). `SetNull`: excluir o contrato depois não deve quebrar o histórico do recebível já gerado. |
| `cardPaymentMethodId` | `String?` (FK → `CardPaymentMethod.id`, `onDelete: SetNull`) | nulo | Método resolvido. |
| `saleOrderPaymentId` | `String?` (FK → `SaleOrderPayment.id`, `onDelete: Cascade`) | nulo | Pagamento de origem — base da idempotência (research.md D11). `Cascade`: se o pagamento for apagado (não deveria acontecer pós-fechamento, mas por segurança), o recebível derivado dele não deve sobreviver órfão. |
| `installmentSequence` | `Int?` | nulo | 1-based. `1` mesmo em parcela única. |
| `installmentCount` | `Int?` | nulo | Total de parcelas geradas para aquele pagamento. |
| `cardSettlementFallback` | `Boolean` | `false` | `true` quando este recebível nasceu do fallback de FR-005 (sem contrato/método correspondente) para um pagamento que **tinha** `cardPaymentType` setado. `false` para o `FinancialEntry` "resto do pedido" (D5) e para lançamentos manuais. |

**Índice de idempotência**:

```prisma
@@unique([saleOrderPaymentId, installmentSequence])
```

Nuláveis — Postgres permite múltiplas linhas com `saleOrderPaymentId IS NULL` (lançamentos manuais e
o `FinancialEntry` agregado "resto do pedido" continuam sem restrição adicional; a idempotência desse
último continua pela checagem de aplicação existente por `saleOrderId`, inalterada).

**Sem mudança nos campos existentes** `feesCents`/`finesCents` — permanecem com sua semântica atual
(aditiva, atraso/multa), sem relação com `acquirerFeeCents` (dedutiva, taxa de adquirência).

## 3. Entidades existentes consultadas, sem alteração de schema

- **`CardContract`** — consultado por `organizationId` + `bankAccountId` + `active=true` +
  `deletedAt=null` (D6). Nenhum campo novo.
- **`CardPaymentMethod`** — consultado por `cardContractId` + `type` + `brand`, com `rateTiers`
  incluído quando `progressiveEnabled=true`. Nenhum campo novo.
- **`CardRateTier`** — consultado via `CardPaymentMethod.rateTiers`, filtrado por
  `minInstallments <= installments <= maxInstallments` (a não-sobreposição já é garantida na escrita
  pelo validador existente — `card-rate-tiers.validator.ts`). Nenhum campo novo.

## 4. Tipos do calculador puro (não persistidos — contrato interno de domínio)

Definidos em `finance/card-contracts/domain/services/card-settlement-calculator.ts`. Espelham
exatamente a assinatura já esperada pelo prompt de origem, ajustados aos achados de research.md.

```ts
export type CardSettlementMethodSnapshot = {
  rate: string | null;              // Decimal(9,4) serializado — null quando só progressivo cobre
  feeCents: number | null;
  firstPaymentDays: number | null;  // fallback: settlementDays quando firstPaymentDays ausente
  daysBetweenInstallments: number | null;
  progressiveEnabled: boolean;
  rateTiers: Array<{ minInstallments: number; maxInstallments: number; rate: string }>;
};

export type CardSettlementContractSnapshot = {
  firstPaymentDayType: 'business_days' | 'calendar_days';
  installmentDayType: 'business_days' | 'calendar_days' | 'single_payment';
  businessDaysOnly: boolean;
};

export type CardSettlementInput = {
  grossAmountCents: number;
  saleDate: Date;
  installments: number;             // 1 para débito/Pix
  method: CardSettlementMethodSnapshot;
  contract: CardSettlementContractSnapshot;
};

export type CardSettlementInstallment = {
  sequence: number;                 // 1-based
  dueDate: Date;
  grossAmountCents: number;         // fração bruta desta parcela
  feeAmountCents: number;           // taxa descontada desta parcela
  netAmountCents: number;           // grossAmountCents - feeAmountCents desta parcela
};

/**
 * Função pura — sem Prisma, sem NestJS, sem I/O. Lança apenas em input
 * estruturalmente inválido (ex.: installments <= 0); "sem taxa aplicável"
 * é responsabilidade do chamador resolver antes de chamar (D7 de research.md).
 */
export function calculateCardSettlement(
  input: CardSettlementInput,
): CardSettlementInstallment[];
```

`business-day-calendar.ts` expõe a função auxiliar usada internamente:

```ts
export type DayCountType = 'business_days' | 'calendar_days';

/** Soma `days` a partir de `from`, pulando fins de semana quando `type='business_days'`. */
export function addDays(from: Date, days: number, type: DayCountType): Date;

/** Empurra `date` para a próxima segunda-feira se cair em sábado/domingo. */
export function pushToNextBusinessDay(date: Date): Date;
```

## 5. Resolução (fora do calculador — infraestrutura)

`sales/infrastructure/database/resolve-card-settlement.ts` — não é model de dados, mas define o
formato de retorno que alimenta o calculador puro e a escrita do `FinancialEntry`:

```ts
export type CardSettlementResolution =
  | { kind: 'matched'; cardContractId: string; cardPaymentMethodId: string;
      method: CardSettlementMethodSnapshot; contract: CardSettlementContractSnapshot;
      bankAccountId: string }
  | { kind: 'fallback' }; // sem contrato/método correspondente — aciona FR-005
```

## 6. Migration

Uma única migration Prisma (`db:migrate:dev`), aditiva (`ALTER TABLE ... ADD COLUMN`, todas as
colunas novas nuláveis ou com default `false`) — sem `NOT NULL` sem default, sem backfill (D13). Nome
sugerido: `add_card_settlement_engine`. **Coordenar com o prompt de Lançamentos (`2_...`)** se ele
também alterar `FinancialEntry` em paralelo — não há sobreposição de nomes de campo neste desenho
(verificado contra os campos já existentes: `feesCents`, `finesCents`, `note`, `supplierId`, `status`
— nenhum colide com `grossAmountCents`/`acquirerFeeCents`/`cardContractId`/`cardPaymentMethodId`/
`saleOrderPaymentId`/`installmentSequence`/`installmentCount`/`cardSettlementFallback`).
