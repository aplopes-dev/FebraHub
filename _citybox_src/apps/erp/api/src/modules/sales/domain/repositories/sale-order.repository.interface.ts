import type {
  SaleOrder,
  SaleOrderChannel,
  SaleOrderStatus,
} from '../entities/sale-order.entity';
import type { StockMovement } from '../../../stock/domain/entities/stock-movement.entity';

export const SALE_ORDER_LIST_TABS = ['open', 'deleted'] as const;
export type SaleOrderListTab = (typeof SALE_ORDER_LIST_TABS)[number];

export const SALE_ORDER_SORT_OPTIONS = [
  'created_at_desc',
  'created_at_asc',
  'amount_desc',
  'amount_asc',
  'number_asc',
  'number_desc',
] as const;
export type SaleOrderSortOption = (typeof SALE_ORDER_SORT_OPTIONS)[number];

export type SaleOrderListCriteria = {
  /** Aba da listagem. `open` (padrão) traz as não excluídas. */
  tab?: SaleOrderListTab;
  search?: string;
  /** Vazio/omitido = não filtra por situação. */
  statuses?: SaleOrderStatus[];
  channelId?: SaleOrderChannel;
  amountMinCents?: number;
  amountMaxCents?: number;
  /** Intervalo (inclusive) sobre `createdAt`. */
  dateFrom?: Date;
  dateTo?: Date;
  sort?: SaleOrderSortOption;
  skip?: number;
  take?: number;
};

export type SaleOrderDetailLine = {
  /** `null` = linha de serviço sem vínculo de catálogo (spec erp/031 D1). */
  productId: string | null;
  /** Nome do produto (join) — `null` para linha de serviço, usar `description`. */
  productName: string | null;
  productSku: string | null;
  /** Rótulo da linha de serviço quando `productId` é `null`. */
  description: string | null;
  quantity: string;
  unitPriceCents: number;
  subtotalCents: number;
};

export type SaleOrderDetail = {
  saleOrder: SaleOrder;
  stockName: string | null;
  lines: SaleOrderDetailLine[];
  /** Presente quando a venda veio de um pedido operacional de delivery da loja. */
  posDeliveryOrderId: string | null;
  posDeliveryOrderNumber: number | null;
  /** `delivery` | `pickup` quando há vínculo com PosDeliveryOrder. */
  posDeliveryFulfillment: 'delivery' | 'pickup' | null;
};

/** Metadados POS gravados na mesma TX da criação da SaleOrder. */
export type SaveSaleOrderPosMeta = {
  cashSessionId: string;
  posTerminalId: string;
  operatorUserId: string;
  posDeliveryOrderId?: string;
};

export type SaleOrderListItem = {
  saleOrder: SaleOrder;
  stockName: string | null;
  posDeliveryOrderId?: string | null;
  posDeliveryOrderNumber?: number | null;
  posDeliveryFulfillment?: 'delivery' | 'pickup' | null;
};

/**
 * Repositório de pedidos de venda — grava documento + linhas + pagamentos e,
 * no máximo, 1 movimento de saída por pedido, tudo na mesma transação.
 */
export abstract class SaleOrderRepository {
  /** Próximo número sequencial do pedido, por organização. */
  abstract nextNumber(organizationId: string): Promise<number>;

  /**
   * Persiste o pedido (create ou update — sempre substitui linhas e
   * pagamentos) e, se `movement` não for `null`, grava o `StockMovement` de
   * saída e o `stockMovementId` na mesma transação.
   *
   * `posMeta` (opcional) grava FKs do PDV (`posDeliveryOrderId`, caixa,
   * terminal, operador) na mesma TX — sem avançar status operacional.
   */
  abstract saveWithOptionalMovement(
    saleOrder: SaleOrder,
    movement: StockMovement | null,
    posMeta?: SaveSaleOrderPosMeta,
  ): Promise<SaleOrder>;

  /** Soft-delete — sem reversão de saldo. */
  abstract softDelete(
    organizationId: string,
    id: string,
    deletedAt: Date,
  ): Promise<void>;

  /** Limpa `deletedAt` — sem efeito no ledger. */
  abstract clearDeletedAt(
    organizationId: string,
    id: string,
    updatedAt: Date,
  ): Promise<void>;

  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<SaleOrderDetail | null>;

  abstract findAll(
    organizationId: string,
    criteria?: SaleOrderListCriteria,
  ): Promise<SaleOrderListItem[]>;

  abstract count(
    organizationId: string,
    criteria?: Omit<SaleOrderListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  abstract countByTabs(
    organizationId: string,
  ): Promise<{ open: number; deleted: number }>;
}
