import { Entity } from '../../../../shared/core/entity';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ProductionInvalidQuantityError } from '../errors/production-invalid-quantity.error';
import { ProductionOrderInvalidTransitionError } from '../errors/production-order-invalid-transition.error';

export const PRODUCTION_ORDER_STATUSES = [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
] as const;
export type ProductionOrderStatus = (typeof PRODUCTION_ORDER_STATUSES)[number];

/** Status a partir dos quais a ordem ainda pode ser cancelada ou finalizada. */
export const CANCELLABLE_PRODUCTION_ORDER_STATUSES: readonly ProductionOrderStatus[] =
  ['pending', 'in_progress'];

export type ProductionOrderProps = {
  organizationId: string;
  productId: string;
  /** Quantidade planejada — Decimal string. */
  plannedQuantity: string;
  /** Quantidade efetivamente produzida — só existe depois de finalizar. */
  producedQuantity: string | null;
  sourceStockId: string;
  destinationStockId: string;
  expectedDate: Date;
  status: ProductionOrderStatus;
  observation: string | null;
  /** Movimento de saída dos insumos (`consumo-interno`). Null se sem BOM. */
  outboundMovementId: string | null;
  /** Movimento de entrada do produto acabado (`entrada-avulsa`). */
  inboundMovementId: string | null;
  createdByUserId: string;
  startedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateProductionOrderProps = {
  organizationId: string;
  productId: string;
  plannedQuantity: string;
  sourceStockId: string;
  destinationStockId: string;
  expectedDate: Date;
  observation?: string | null;
  createdByUserId: string;
};

function normalizePositiveQuantity(raw: string): string {
  const trimmed = raw.trim();
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) {
    throw new ProductionInvalidQuantityError(raw);
  }
  return trimmed;
}

/**
 * Ordem de produção — consome os insumos da ficha técnica (BOM ao vivo) num
 * depósito de origem e gera o produto acabado num depósito de destino.
 *
 * Diferente de `StockTransfer`, origem e destino **podem** ser o mesmo
 * depósito: produzir "no lugar" é um cenário legítimo de produção.
 */
export class ProductionOrder extends Entity<ProductionOrderProps> {
  constructor(props: ProductionOrderProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    if (!PRODUCTION_ORDER_STATUSES.includes(this.props.status)) {
      throw new ValidatorDomainError({
        internalMessage: `Invalid ProductionOrder status ${this.props.status}`,
        externalMessage: 'Situação da ordem de produção inválida.',
        context: ProductionOrder.name,
      });
    }
    if (!this.props.productId) {
      throw new ValidatorDomainError({
        internalMessage: 'ProductionOrder without productId',
        externalMessage: 'Produto inválido na ordem de produção.',
        context: ProductionOrder.name,
      });
    }
    normalizePositiveQuantity(this.props.plannedQuantity);
    if (this.props.producedQuantity !== null) {
      normalizePositiveQuantity(this.props.producedQuantity);
    }
  }

  public static create(
    props: CreateProductionOrderProps,
    id?: string,
  ): ProductionOrder {
    const now = new Date();
    return new ProductionOrder(
      {
        organizationId: props.organizationId,
        productId: props.productId,
        plannedQuantity: normalizePositiveQuantity(props.plannedQuantity),
        producedQuantity: null,
        sourceStockId: props.sourceStockId,
        destinationStockId: props.destinationStockId,
        expectedDate: props.expectedDate,
        status: 'pending',
        observation: props.observation?.trim() || null,
        outboundMovementId: null,
        inboundMovementId: null,
        createdByUserId: props.createdByUserId,
        startedAt: null,
        completedAt: null,
        cancelledAt: null,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }

  public static with(props: ProductionOrderProps, id: string): ProductionOrder {
    return new ProductionOrder(props, id);
  }

  /** `pending` → `in_progress`. */
  start(): ProductionOrder {
    if (this.props.status !== 'pending') {
      throw new ProductionOrderInvalidTransitionError(
        this.props.status,
        'in_progress',
      );
    }
    const now = new Date();
    return ProductionOrder.with(
      { ...this.props, status: 'in_progress', startedAt: now, updatedAt: now },
      this.id,
    );
  }

  /** `pending`/`in_progress` → `cancelled`. */
  cancel(): ProductionOrder {
    if (!CANCELLABLE_PRODUCTION_ORDER_STATUSES.includes(this.props.status)) {
      throw new ProductionOrderInvalidTransitionError(
        this.props.status,
        'cancelled',
      );
    }
    const now = new Date();
    return ProductionOrder.with(
      { ...this.props, status: 'cancelled', cancelledAt: now, updatedAt: now },
      this.id,
    );
  }

  /**
   * `pending`/`in_progress` → `completed`. Valida a quantidade produzida e
   * delega a mudança de estado a `markCompleted` — o caso de uso trata a
   * ordem já `completed` de forma idempotente **antes** de chamar `finalize`,
   * então aqui a transição sempre precisa ser válida.
   */
  finalize(producedQuantity: string, observation?: string): ProductionOrder {
    if (!CANCELLABLE_PRODUCTION_ORDER_STATUSES.includes(this.props.status)) {
      throw new ProductionOrderInvalidTransitionError(
        this.props.status,
        'completed',
      );
    }
    const normalizedQuantity = normalizePositiveQuantity(producedQuantity);
    return this.markCompleted(normalizedQuantity, observation);
  }

  /** Setter de baixo nível — assume que a transição já foi validada. */
  markCompleted(
    producedQuantity: string,
    observation?: string,
  ): ProductionOrder {
    const now = new Date();
    return ProductionOrder.with(
      {
        ...this.props,
        status: 'completed',
        producedQuantity,
        completedAt: now,
        updatedAt: now,
        observation:
          observation !== undefined
            ? observation.trim() || null
            : this.props.observation,
      },
      this.id,
    );
  }

  /** Grava os movimentos gerados na finalização (saída pode ser null sem BOM). */
  withMovementIds(
    outboundMovementId: string | null,
    inboundMovementId: string,
  ): ProductionOrder {
    return ProductionOrder.with(
      {
        ...this.props,
        outboundMovementId,
        inboundMovementId,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get productId() {
    return this.props.productId;
  }
  get plannedQuantity() {
    return this.props.plannedQuantity;
  }
  get producedQuantity() {
    return this.props.producedQuantity;
  }
  get sourceStockId() {
    return this.props.sourceStockId;
  }
  get destinationStockId() {
    return this.props.destinationStockId;
  }
  get expectedDate() {
    return this.props.expectedDate;
  }
  get status() {
    return this.props.status;
  }
  get observation() {
    return this.props.observation;
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
  get startedAt() {
    return this.props.startedAt;
  }
  get completedAt() {
    return this.props.completedAt;
  }
  get cancelledAt() {
    return this.props.cancelledAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  /** Quantidade para cálculo de insumos: produzida se já existir, planejada caso contrário. */
  get quantityForCalculation(): string {
    return this.props.producedQuantity ?? this.props.plannedQuantity;
  }
}
