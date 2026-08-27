import type {
  SaleOrderLine,
  SaleOrderPayment,
} from "@/features/sales-orders/types/sale-order-form";

export type SaleOrderStatus =
  | "open"
  | "closed"
  | "cancelled"
  | "preparing"
  | "delivering"
  | "reserved"
  | "waiting"
  | "pickup";

export type SaleOrderListTab = "open" | "deleted";

export type SaleOrderPeriodPreset =
  | "all"
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_2_weeks"
  | "last_30_days"
  | "custom";

export type SaleOrderPeriod = {
  preset: SaleOrderPeriodPreset;
  /** ISO date `yyyy-MM-dd` when preset is custom (inclusive). */
  customFrom: string | null;
  /** ISO date `yyyy-MM-dd` when preset is custom (inclusive). */
  customTo: string | null;
};

/** ids alinhados a `PRODUCT_CHANNEL_OPTIONS` (pdv, delivery, marketplace, cardapio). */
export type SaleOrderChannelId =
  | "pdv"
  | "delivery"
  | "marketplace"
  | "cardapio";

export type SaleOrder = {
  id: string;
  number: number;
  customerName: string;
  totalAmount: number;
  status: SaleOrderStatus;
  /** Canal de origem do pedido. */
  channelId: SaleOrderChannelId;
  createdBy: string;
  createdAt: string;
  deletedAt?: string | null;
  /** Presente quando a baixa/entrada de estoque já foi gerada — formulário vira só leitura. */
  stockMovementId?: string | null;
  /**
   * Campos completos do formulário, persistidos para permitir edição.
   * Opcionais porque pedidos gerados a partir de OS (`generateSaleFromServiceOrder`)
   * ainda não têm esses detalhes.
   */
  warehouseId?: string;
  customerId?: string;
  sellerId?: string;
  notes?: string;
  lines?: SaleOrderLine[];
  payments?: SaleOrderPayment[];
  deliveryFee?: number;
  discounts?: number;
  /** Pedido operacional de delivery vinculado (quando canal = delivery). */
  posDeliveryOrderId?: string | null;
  posDeliveryOrderNumber?: number | null;
  /** Entrega vs retirada do pedido operacional vinculado. */
  posDeliveryFulfillment?: "delivery" | "pickup" | null;
};

export type SaleOrderListFilters = {
  statuses: SaleOrderStatus[];
  /** Canal de origem. `null` = todos. */
  channelId: SaleOrderChannelId | null;
  /** Valor mínimo do pedido (reais). `null` = sem filtro. */
  amountMin: number | null;
  /** Valor máximo do pedido (reais). `null` = sem filtro. */
  amountMax: number | null;
  period: SaleOrderPeriod;
};

export type SaleOrderSortOption =
  | "created_at_desc"
  | "created_at_asc"
  | "amount_desc"
  | "amount_asc"
  | "number_asc"
  | "number_desc";

export type SaleOrderTabCounts = Record<SaleOrderListTab, number>;

export type SaleOrderListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type SaleOrderListParams = {
  tab: SaleOrderListTab;
  search: string;
  filters: SaleOrderListFilters;
  sort: SaleOrderSortOption;
  page: number;
  perPage: number;
};

export type SaleOrderListResult = {
  data: SaleOrder[];
  meta: SaleOrderListMeta;
  tabCounts: SaleOrderTabCounts;
};
