import { Entity } from '../../../../shared/core/entity';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import {
  resolveStockMovementReason,
  type StockMovementReason,
} from './stock-movement-reason';

export const STOCK_MOVEMENT_TYPES = ['entrada', 'saida'] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export const STOCK_MOVEMENT_SOURCE_TYPES = [
  'manual',
  'transfer',
  'inventory',
  'purchase',
  'production',
  'sale',
] as const;
export type StockMovementSourceType =
  (typeof STOCK_MOVEMENT_SOURCE_TYPES)[number];

export type StockMovementLineProps = {
  productId: string;
  /** Quantidade como string Decimal (ex.: "1.5"). */
  quantity: string;
  costCents: number;
};

export type StockMovementProps = {
  organizationId: string;
  stockId: string;
  /** Só na movimentação manual — nos fluxos automáticos o motivo vem de `sourceType`. */
  categoryId: string | null;
  type: StockMovementType;
  operatedAt: Date;
  createdByUserId: string;
  sourceType: StockMovementSourceType;
  sourceId: string | null;
  lines: StockMovementLineProps[];
  createdAt: Date;
};

export type CreateStockMovementProps = {
  organizationId: string;
  stockId: string;
  categoryId?: string | null;
  type: StockMovementType;
  operatedAt: Date;
  createdByUserId: string;
  sourceType?: StockMovementSourceType;
  sourceId?: string | null;
  lines: StockMovementLineProps[];
};

function normalizeQuantity(raw: string): string {
  const trimmed = raw.trim();
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) {
    throw new ValidatorDomainError({
      internalMessage: `Invalid movement line quantity: ${raw}`,
      externalMessage: 'A quantidade de cada item deve ser maior que zero.',
      context: 'StockMovement',
    });
  }
  return trimmed;
}

/**
 * Movimentação de estoque (ledger imutável).
 *
 * Após criada, não há update/delete — correções são novos movimentos.
 */
export class StockMovement extends Entity<StockMovementProps> {
  constructor(props: StockMovementProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    if (!STOCK_MOVEMENT_TYPES.includes(this.props.type)) {
      throw new ValidatorDomainError({
        internalMessage: `Invalid StockMovement type ${this.props.type}`,
        externalMessage: 'Tipo de movimentação inválido.',
        context: StockMovement.name,
      });
    }
    if (this.props.sourceType === 'manual' && !this.props.categoryId) {
      throw new ValidatorDomainError({
        internalMessage: 'Manual StockMovement without categoryId',
        externalMessage: 'Informe a categoria da movimentação.',
        context: StockMovement.name,
      });
    }
    if (this.props.lines.length === 0) {
      throw new ValidatorDomainError({
        internalMessage: 'StockMovement without lines',
        externalMessage: 'Informe ao menos um produto na movimentação.',
        context: StockMovement.name,
      });
    }
    for (const line of this.props.lines) {
      if (!line.productId) {
        throw new ValidatorDomainError({
          internalMessage: 'Line without productId',
          externalMessage: 'Produto inválido na linha.',
          context: StockMovement.name,
        });
      }
      if (!Number.isInteger(line.costCents) || line.costCents < 0) {
        throw new ValidatorDomainError({
          internalMessage: `Invalid costCents ${line.costCents}`,
          externalMessage: 'O custo não pode ser negativo.',
          context: StockMovement.name,
        });
      }
      normalizeQuantity(line.quantity);
    }

    const seen = new Set<string>();
    for (const line of this.props.lines) {
      if (seen.has(line.productId)) {
        throw new ValidatorDomainError({
          internalMessage: `Duplicate productId in lines: ${line.productId}`,
          externalMessage:
            'Cada produto deve aparecer apenas uma vez na movimentação.',
          context: StockMovement.name,
        });
      }
      seen.add(line.productId);
    }
  }

  public static create(
    props: CreateStockMovementProps,
    id?: string,
  ): StockMovement {
    const now = new Date();
    return new StockMovement(
      {
        organizationId: props.organizationId,
        stockId: props.stockId,
        categoryId: props.categoryId ?? null,
        type: props.type,
        operatedAt: props.operatedAt,
        createdByUserId: props.createdByUserId,
        sourceType: props.sourceType ?? 'manual',
        sourceId: props.sourceId ?? null,
        lines: props.lines.map((line) => ({
          productId: line.productId,
          quantity: normalizeQuantity(line.quantity),
          costCents: line.costCents,
        })),
        createdAt: now,
      },
      id,
    );
  }

  public static with(props: StockMovementProps, id: string): StockMovement {
    return new StockMovement(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get stockId() {
    return this.props.stockId;
  }
  get categoryId() {
    return this.props.categoryId;
  }
  get type() {
    return this.props.type;
  }
  get operatedAt() {
    return this.props.operatedAt;
  }
  get createdByUserId() {
    return this.props.createdByUserId;
  }
  get sourceType() {
    return this.props.sourceType;
  }
  get reason(): StockMovementReason {
    return resolveStockMovementReason(this.props.sourceType, this.props.type);
  }
  get sourceId() {
    return this.props.sourceId;
  }
  get lines() {
    return this.props.lines;
  }
  get createdAt() {
    return this.props.createdAt;
  }

  get itemsCount() {
    return this.props.lines.length;
  }

  get totalCostCents() {
    return this.props.lines.reduce((sum, line) => {
      const qty = Number(line.quantity);
      return sum + Math.round(qty * line.costCents);
    }, 0);
  }
}
