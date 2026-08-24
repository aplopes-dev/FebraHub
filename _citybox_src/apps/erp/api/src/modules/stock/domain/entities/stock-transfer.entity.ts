import { Entity } from '../../../../shared/core/entity';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

export const STOCK_TRANSFER_STATUSES = ['active', 'cancelled'] as const;
export type StockTransferStatus = (typeof STOCK_TRANSFER_STATUSES)[number];

export type StockTransferLineProps = {
  productId: string;
  /** Quantidade Decimal string. */
  quantity: string;
  batch: string | null;
};

export type StockTransferProps = {
  organizationId: string;
  fromStockId: string;
  toStockId: string;
  status: StockTransferStatus;
  operatedAt: Date;
  carrierId: string | null;
  responsibleName: string;
  notes: string;
  outboundMovementId: string | null;
  inboundMovementId: string | null;
  createdByUserId: string;
  createdAt: Date;
  cancelledAt: Date | null;
  lines: StockTransferLineProps[];
};

export type CreateStockTransferProps = {
  organizationId: string;
  fromStockId: string;
  toStockId: string;
  operatedAt: Date;
  carrierId?: string | null;
  responsibleName: string;
  notes?: string;
  createdByUserId: string;
  lines: Array<{
    productId: string;
    quantity: string;
    batch?: string | null;
  }>;
};

function normalizePositiveQuantity(raw: string): string {
  const trimmed = raw.trim();
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) {
    throw new ValidatorDomainError({
      internalMessage: `Invalid transfer line quantity: ${raw}`,
      externalMessage: 'A quantidade de cada item deve ser maior que zero.',
      context: 'StockTransfer',
    });
  }
  return trimmed;
}

/**
 * Remanejamento entre depósitos — create gera 2 movimentos no ledger.
 */
export class StockTransfer extends Entity<StockTransferProps> {
  constructor(props: StockTransferProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    if (this.props.fromStockId === this.props.toStockId) {
      throw new ValidatorDomainError({
        internalMessage: 'StockTransfer with same from/to stock',
        externalMessage: 'O estoque de saída deve ser diferente do de entrada.',
        context: StockTransfer.name,
      });
    }
    if (!this.props.responsibleName.trim()) {
      throw new ValidatorDomainError({
        internalMessage: 'StockTransfer without responsibleName',
        externalMessage: 'Informe o responsável pela transferência.',
        context: StockTransfer.name,
      });
    }
    if (this.props.lines.length === 0) {
      throw new ValidatorDomainError({
        internalMessage: 'StockTransfer without lines',
        externalMessage: 'Informe ao menos um produto na transferência.',
        context: StockTransfer.name,
      });
    }

    const seen = new Set<string>();
    for (const line of this.props.lines) {
      if (!line.productId) {
        throw new ValidatorDomainError({
          internalMessage: 'Transfer line without productId',
          externalMessage: 'Produto inválido na linha da transferência.',
          context: StockTransfer.name,
        });
      }
      if (seen.has(line.productId)) {
        throw new ValidatorDomainError({
          internalMessage: `Duplicate productId in transfer: ${line.productId}`,
          externalMessage:
            'Cada produto deve aparecer apenas uma vez na transferência.',
          context: StockTransfer.name,
        });
      }
      seen.add(line.productId);
      normalizePositiveQuantity(line.quantity);
    }
  }

  public static create(
    props: CreateStockTransferProps,
    id?: string,
  ): StockTransfer {
    const now = new Date();
    return new StockTransfer(
      {
        organizationId: props.organizationId,
        fromStockId: props.fromStockId,
        toStockId: props.toStockId,
        status: 'active',
        operatedAt: props.operatedAt,
        carrierId: props.carrierId?.trim() || null,
        responsibleName: props.responsibleName.trim(),
        notes: (props.notes ?? '').trim(),
        outboundMovementId: null,
        inboundMovementId: null,
        createdByUserId: props.createdByUserId,
        createdAt: now,
        cancelledAt: null,
        lines: props.lines.map((line) => ({
          productId: line.productId,
          quantity: normalizePositiveQuantity(line.quantity),
          batch: line.batch?.trim() || null,
        })),
      },
      id,
    );
  }

  public static with(props: StockTransferProps, id: string): StockTransfer {
    return new StockTransfer(props, id);
  }

  /** Marca cancelada (imutável — retorna nova instância). */
  markCancelled(
    cancelledAt: Date,
    movementIds?: { outbound?: string | null; inbound?: string | null },
  ): StockTransfer {
    return StockTransfer.with(
      {
        ...this.props,
        status: 'cancelled',
        cancelledAt,
        outboundMovementId:
          movementIds?.outbound !== undefined
            ? movementIds.outbound
            : this.props.outboundMovementId,
        inboundMovementId:
          movementIds?.inbound !== undefined
            ? movementIds.inbound
            : this.props.inboundMovementId,
      },
      this.id,
    );
  }

  withMovementIds(outboundId: string, inboundId: string): StockTransfer {
    return StockTransfer.with(
      {
        ...this.props,
        outboundMovementId: outboundId,
        inboundMovementId: inboundId,
      },
      this.id,
    );
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get fromStockId() {
    return this.props.fromStockId;
  }
  get toStockId() {
    return this.props.toStockId;
  }
  get status() {
    return this.props.status;
  }
  get operatedAt() {
    return this.props.operatedAt;
  }
  get carrierId() {
    return this.props.carrierId;
  }
  get responsibleName() {
    return this.props.responsibleName;
  }
  get notes() {
    return this.props.notes;
  }
  get outboundMovementId() {
    return this.props.outboundMovementId;
  }
  get inboundMovementId() {
    return this.props.inboundMovementId;
  }
  get createdByUserId() {
    return this.props.createdByUserId;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get cancelledAt() {
    return this.props.cancelledAt;
  }
  get lines() {
    return this.props.lines;
  }

  get itemsCount() {
    return this.props.lines.length;
  }
}
