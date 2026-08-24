import type { ProductionOrder } from '../entities/production-order.entity';
import type { ProductionHistoryEntry } from '../entities/production-history-entry.entity';
import type { StockMovement } from '../entities/stock-movement.entity';

export const PRODUCTION_ORDER_LIST_TABS = [
  'all',
  'pending',
  'in_progress',
  'completed',
  'cancelled',
] as const;
export type ProductionOrderListTab =
  (typeof PRODUCTION_ORDER_LIST_TABS)[number];

export type ProductionOrderListCriteria = {
  tab?: ProductionOrderListTab;
  search?: string;
  skip?: number;
  take?: number;
};

export type ProductionOrderListRow = {
  order: ProductionOrder;
  productName: string;
  productSku: string;
  sourceStockName: string;
  destinationStockName: string;
};

export type ProductionOrderTabCounts = {
  all: number;
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
};

/**
 * Repositório da ordem de produção — cria/atualiza estado + timeline, e
 * finaliza com os movimentos do ledger na mesma transação.
 */
export abstract class ProductionOrderRepository {
  abstract create(
    order: ProductionOrder,
    historyEntry: ProductionHistoryEntry,
  ): Promise<ProductionOrder>;

  /** Transições sem movimento (start/cancel). `historyEntry` é opcional para reuso genérico. */
  abstract save(
    order: ProductionOrder,
    historyEntry?: ProductionHistoryEntry,
  ): Promise<ProductionOrder>;

  /**
   * Finaliza a ordem e grava, na mesma transação, o(s) `StockMovement`(s)
   * gerados. `outbound` é `null` quando o produto não tem componentes na
   * ficha técnica (produção sem consumo de insumos).
   */
  /**
   * Finaliza gravando consumo de insumo + entrada do acabado atomicamente.
   *
   * Devolve `null` quando a ordem **já não estava pendente/em andamento** no
   * momento do commit — outra finalização concorrente ganhou a corrida e esta
   * não deve duplicar os movimentos. O chamador relê e devolve o estado atual.
   */
  abstract finalizeWithMovements(
    order: ProductionOrder,
    outbound: StockMovement | null,
    inbound: StockMovement,
    historyEntry: ProductionHistoryEntry,
  ): Promise<ProductionOrder | null>;

  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<ProductionOrder | null>;

  abstract findAll(
    organizationId: string,
    criteria?: ProductionOrderListCriteria,
  ): Promise<ProductionOrderListRow[]>;

  abstract count(
    organizationId: string,
    criteria?: Omit<ProductionOrderListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  abstract countByTabs(
    organizationId: string,
  ): Promise<ProductionOrderTabCounts>;

  abstract listHistory(
    organizationId: string,
    orderId: string,
  ): Promise<ProductionHistoryEntry[]>;

  abstract addHistory(
    organizationId: string,
    orderId: string,
    entry: ProductionHistoryEntry,
  ): Promise<ProductionHistoryEntry>;
}
