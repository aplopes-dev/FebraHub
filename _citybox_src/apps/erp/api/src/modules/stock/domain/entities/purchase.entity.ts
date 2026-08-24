import { Entity } from '../../../../shared/core/entity';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

export const PURCHASE_DELIVERY_STATUSES = ['pending', 'received'] as const;
export type PurchaseDeliveryStatus =
  (typeof PURCHASE_DELIVERY_STATUSES)[number];

export const PURCHASE_LINE_STATUSES = [
  'pending',
  'received',
  'cancelled',
] as const;
export type PurchaseLineStatus = (typeof PURCHASE_LINE_STATUSES)[number];

export type PurchaseLineProps = {
  productId: string;
  /** Quantidade Decimal string. */
  quantity: string;
  costCents: number;
  status: PurchaseLineStatus;
};

export type PurchaseProps = {
  organizationId: string;
  stockId: string;
  supplierId: string;
  carrierId: string | null;
  deliveryStatus: PurchaseDeliveryStatus;
  /** Data-only (sem hora) — coluna `@db.Date`. */
  purchasedAt: Date;
  series: string;
  invoiceNumber: string;
  notes: string;
  freightCents: number;
  discountsCents: number;
  otherExpensesCents: number;
  /** Idempotência: id do StockMovement de entrada já gerado (ou null). */
  stockMovementId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lines: PurchaseLineProps[];
};

type PurchaseLineInput = {
  productId: string;
  quantity: string;
  costCents: number;
  status?: PurchaseLineStatus;
};

export type CreatePurchaseProps = {
  organizationId: string;
  stockId: string;
  supplierId: string;
  carrierId?: string | null;
  deliveryStatus?: PurchaseDeliveryStatus;
  purchasedAt: Date;
  series?: string;
  invoiceNumber?: string;
  notes?: string;
  freightCents?: number;
  discountsCents?: number;
  otherExpensesCents?: number;
  lines: PurchaseLineInput[];
};

/**
 * Campos que o formulário edita (semântica de PUT). `stockMovementId` e
 * `deletedAt` ficam fora: idempotência do ledger e exclusão têm fluxo
 * próprio, não fazem parte de "salvar o cadastro".
 */
export type UpdatePurchaseInput = {
  stockId: string;
  supplierId: string;
  carrierId?: string | null;
  deliveryStatus: PurchaseDeliveryStatus;
  purchasedAt: Date;
  series?: string;
  invoiceNumber?: string;
  notes?: string;
  freightCents?: number;
  discountsCents?: number;
  otherExpensesCents?: number;
  lines: PurchaseLineInput[];
};

function normalizePositiveQuantity(raw: string): string {
  const trimmed = raw.trim();
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) {
    throw new ValidatorDomainError({
      internalMessage: `Invalid purchase line quantity: ${raw}`,
      externalMessage: 'A quantidade de cada item deve ser maior que zero.',
      context: 'Purchase',
    });
  }
  return trimmed;
}

function normalizeCostCents(raw: number): number {
  if (!Number.isInteger(raw) || raw < 0) {
    throw new ValidatorDomainError({
      internalMessage: `Invalid purchase line costCents: ${raw}`,
      externalMessage: 'O custo de cada item não pode ser negativo.',
      context: 'Purchase',
    });
  }
  return raw;
}

function normalizeMoneyCents(raw: number, field: string): number {
  if (!Number.isInteger(raw) || raw < 0) {
    throw new ValidatorDomainError({
      internalMessage: `Invalid purchase ${field}: ${raw}`,
      externalMessage: 'Os valores da compra não podem ser negativos.',
      context: 'Purchase',
    });
  }
  return raw;
}

function normalizeLineStatus(
  raw: PurchaseLineStatus | undefined,
): PurchaseLineStatus {
  const status = raw ?? 'pending';
  if (!PURCHASE_LINE_STATUSES.includes(status)) {
    throw new ValidatorDomainError({
      internalMessage: `Invalid purchase line status: ${status}`,
      externalMessage: 'Status inválido na linha da compra.',
      context: 'Purchase',
    });
  }
  return status;
}

function normalizeLines(lines: PurchaseLineInput[]): PurchaseLineProps[] {
  const seen = new Set<string>();
  return lines.map((line) => {
    if (!line.productId) {
      throw new ValidatorDomainError({
        internalMessage: 'Purchase line without productId',
        externalMessage: 'Produto inválido na linha da compra.',
        context: 'Purchase',
      });
    }
    if (seen.has(line.productId)) {
      throw new ValidatorDomainError({
        internalMessage: `Duplicate productId in purchase: ${line.productId}`,
        externalMessage: 'Cada produto deve aparecer apenas uma vez na compra.',
        context: 'Purchase',
      });
    }
    seen.add(line.productId);

    return {
      productId: line.productId,
      quantity: normalizePositiveQuantity(line.quantity),
      costCents: normalizeCostCents(line.costCents),
      status: normalizeLineStatus(line.status),
    };
  });
}

/**
 * Compra de mercadoria de um fornecedor.
 *
 * Não há pagamento aqui — isso pertence a outro módulo (F7 §1). Ao ser
 * recebida, gera no máximo 1 `StockMovement` de entrada
 * (`buildPurchaseEntryMovement`), idempotente via `stockMovementId`.
 */
export class Purchase extends Entity<PurchaseProps> {
  constructor(props: PurchaseProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    if (!PURCHASE_DELIVERY_STATUSES.includes(this.props.deliveryStatus)) {
      throw new ValidatorDomainError({
        internalMessage: `Invalid Purchase deliveryStatus ${this.props.deliveryStatus}`,
        externalMessage: 'Situação de entrega inválida.',
        context: Purchase.name,
      });
    }
    if (this.props.lines.length === 0) {
      throw new ValidatorDomainError({
        internalMessage: 'Purchase without lines',
        externalMessage: 'Informe ao menos um produto na compra.',
        context: Purchase.name,
      });
    }

    const seen = new Set<string>();
    for (const line of this.props.lines) {
      if (!line.productId) {
        throw new ValidatorDomainError({
          internalMessage: 'Purchase line without productId',
          externalMessage: 'Produto inválido na linha da compra.',
          context: Purchase.name,
        });
      }
      if (seen.has(line.productId)) {
        throw new ValidatorDomainError({
          internalMessage: `Duplicate productId in purchase: ${line.productId}`,
          externalMessage:
            'Cada produto deve aparecer apenas uma vez na compra.',
          context: Purchase.name,
        });
      }
      seen.add(line.productId);
      normalizePositiveQuantity(line.quantity);
      normalizeCostCents(line.costCents);
      if (!PURCHASE_LINE_STATUSES.includes(line.status)) {
        throw new ValidatorDomainError({
          internalMessage: `Invalid purchase line status: ${line.status}`,
          externalMessage: 'Status inválido na linha da compra.',
          context: Purchase.name,
        });
      }
    }

    this.assertReceiptIsComplete();
  }

  /**
   * Recebimento é all-or-nothing: não existe compra "recebida" com linha ainda
   * pendente.
   *
   * O movimento de entrada é gerado só com as linhas `received`, mas o
   * `stockMovementId` é gravado assim mesmo — e a partir daí a compra fica
   * bloqueada para edição (`PurchaseAlreadyReceivedError`). O resultado era uma
   * compra travada para sempre: quando a linha pendente chegasse fisicamente,
   * não havia caminho para recebê-la, só movimentação manual desvinculada.
   *
   * O diálogo de recebimento da UI já força cada linha a `received` ou
   * `cancelled` — este invariante fecha a mesma porta no contrato da API.
   * Recebimento em etapas é funcionalidade à parte (exigiria `purchase_receipts`).
   */
  private assertReceiptIsComplete(): void {
    if (this.props.deliveryStatus !== 'received') return;

    const pending = this.props.lines.filter(
      (line) => line.status === 'pending',
    );
    if (pending.length === 0) return;

    throw new ValidatorDomainError({
      internalMessage: `Purchase marked as received with ${pending.length} pending line(s)`,
      externalMessage:
        'Para marcar a compra como recebida, defina cada item como recebido ou cancelado.',
      context: Purchase.name,
    });
  }

  public static create(props: CreatePurchaseProps, id?: string): Purchase {
    const now = new Date();
    return new Purchase(
      {
        organizationId: props.organizationId,
        stockId: props.stockId,
        supplierId: props.supplierId,
        carrierId: props.carrierId?.trim() || null,
        deliveryStatus: props.deliveryStatus ?? 'pending',
        purchasedAt: props.purchasedAt,
        series: (props.series ?? '').trim(),
        invoiceNumber: (props.invoiceNumber ?? '').trim(),
        notes: (props.notes ?? '').trim(),
        freightCents: normalizeMoneyCents(
          props.freightCents ?? 0,
          'freightCents',
        ),
        discountsCents: normalizeMoneyCents(
          props.discountsCents ?? 0,
          'discountsCents',
        ),
        otherExpensesCents: normalizeMoneyCents(
          props.otherExpensesCents ?? 0,
          'otherExpensesCents',
        ),
        stockMovementId: null,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
        lines: normalizeLines(props.lines),
      },
      id,
    );
  }

  public static with(props: PurchaseProps, id: string): Purchase {
    return new Purchase(props, id);
  }

  /** Substituição completa (PUT) — sempre troca o conjunto de linhas. */
  update(input: UpdatePurchaseInput): Purchase {
    return Purchase.with(
      {
        ...this.props,
        stockId: input.stockId,
        supplierId: input.supplierId,
        carrierId: input.carrierId?.trim() || null,
        deliveryStatus: input.deliveryStatus,
        purchasedAt: input.purchasedAt,
        series: (input.series ?? '').trim(),
        invoiceNumber: (input.invoiceNumber ?? '').trim(),
        notes: (input.notes ?? '').trim(),
        freightCents: normalizeMoneyCents(
          input.freightCents ?? 0,
          'freightCents',
        ),
        discountsCents: normalizeMoneyCents(
          input.discountsCents ?? 0,
          'discountsCents',
        ),
        otherExpensesCents: normalizeMoneyCents(
          input.otherExpensesCents ?? 0,
          'otherExpensesCents',
        ),
        updatedAt: new Date(),
        lines: normalizeLines(input.lines),
      },
      this.id,
    );
  }

  /** Grava o id do movimento de entrada gerado — idempotência (regra F7 §2/§3). */
  withStockMovementId(stockMovementId: string): Purchase {
    return Purchase.with({ ...this.props, stockMovementId }, this.id);
  }

  /**
   * Desativa sem apagar e **sem estornar saldo**: a compra é documento
   * fiscal, e desfazer o efeito no estoque é ajuste manual, não consequência
   * automática de excluir o registro (regra F7 §4).
   */
  softDelete(): Purchase {
    const now = new Date();
    return Purchase.with(
      { ...this.props, deletedAt: now, updatedAt: now },
      this.id,
    );
  }

  /**
   * Volta à aba Ativas. Não cria nem estorna movimento de estoque — o
   * `stockMovementId` (se existir) permanece como estava.
   */
  restore(): Purchase {
    return Purchase.with(
      { ...this.props, deletedAt: null, updatedAt: new Date() },
      this.id,
    );
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get stockId() {
    return this.props.stockId;
  }
  get supplierId() {
    return this.props.supplierId;
  }
  get carrierId() {
    return this.props.carrierId;
  }
  get deliveryStatus() {
    return this.props.deliveryStatus;
  }
  get purchasedAt() {
    return this.props.purchasedAt;
  }
  get series() {
    return this.props.series;
  }
  get invoiceNumber() {
    return this.props.invoiceNumber;
  }
  get notes() {
    return this.props.notes;
  }
  get freightCents() {
    return this.props.freightCents;
  }
  get discountsCents() {
    return this.props.discountsCents;
  }
  get otherExpensesCents() {
    return this.props.otherExpensesCents;
  }
  get stockMovementId() {
    return this.props.stockMovementId;
  }
  get deletedAt() {
    return this.props.deletedAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
  get lines() {
    return this.props.lines;
  }

  get itemsCount() {
    return this.props.lines.length;
  }

  get receivedLines(): PurchaseLineProps[] {
    return this.props.lines.filter((line) => line.status === 'received');
  }

  /**
   * Soma quantidade × custo das linhas cobráveis (sem frete/descontos/despesas).
   *
   * Linha `cancelled` NÃO entra: o operador a marcou como não recebida no
   * diálogo de recebimento, e o fornecedor não a cobra. `pending` entra — foi
   * pedida e consta da nota, só não chegou ainda.
   *
   * O frontend já aplicava essa regra em `sumLineCosts`; o domínio somava
   * todas as linhas, e a divergência aparecia como total diferente entre a
   * tela de edição e a listagem. `totalCents` é derivado na leitura (não há
   * coluna persistida), então alinhar a regra não exige migração de dado.
   */
  get linesTotalCents(): number {
    return this.props.lines.reduce((sum, line) => {
      if (line.status === 'cancelled') return sum;
      const qty = Number(line.quantity);
      return sum + Math.round(qty * line.costCents);
    }, 0);
  }

  /** Total do documento: linhas + frete + outras despesas − descontos. */
  get totalCents(): number {
    return (
      this.linesTotalCents +
      this.props.freightCents +
      this.props.otherExpensesCents -
      this.props.discountsCents
    );
  }
}
