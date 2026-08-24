import type {
  SaleOrderCardPaymentType,
  SaleOrderChannel,
  SaleOrderStatus,
} from '../../domain/entities/sale-order.entity';
import type {
  SaleOrderDetail,
  SaleOrderListItem,
  SaleOrderListTab,
  SaleOrderSortOption,
} from '../../domain/repositories/sale-order.repository.interface';

export type SaleOrderLineDto = {
  productId: string;
  quantity: string;
  unitPriceCents: number;
};

export type SaleOrderPaymentDto = {
  amountCents: number;
  methodId: string;
  bankAccountId?: string | null;
  cardPaymentType?: SaleOrderCardPaymentType;
  brand?: string | null;
  installments?: number;
};

export type CreateSaleOrderDto = {
  organizationId: string;
  customerId?: string | null;
  customerName: string;
  consumerDocument?: string | null;
  stockId?: string | null;
  status?: SaleOrderStatus;
  channelId?: SaleOrderChannel;
  sellerId?: string | null;
  sellerName?: string;
  createdByName: string;
  createdByUserId: string;
  notes?: string;
  deliveryFeeCents?: number;
  discountsCents?: number;
  lines: SaleOrderLineDto[];
  payments?: SaleOrderPaymentDto[];
  /** Metadados POS — aplicados na mesma TX do create (ver SaveSaleOrderPosMeta). */
  posMeta?: {
    cashSessionId: string;
    posTerminalId: string;
    operatorUserId: string;
    posDeliveryOrderId?: string;
  };
};

export type UpdateSaleOrderDto = {
  organizationId: string;
  id: string;
  customerId?: string | null;
  customerName: string;
  consumerDocument?: string | null;
  stockId?: string | null;
  status: SaleOrderStatus;
  channelId?: SaleOrderChannel;
  sellerId?: string | null;
  sellerName?: string;
  createdByUserId: string;
  notes?: string;
  deliveryFeeCents?: number;
  discountsCents?: number;
  lines: SaleOrderLineDto[];
  payments?: SaleOrderPaymentDto[];
};

export type UpdateSaleOrderStatusDto = {
  organizationId: string;
  id: string;
  status: SaleOrderStatus;
  createdByUserId: string;
};

export type ListSaleOrdersDto = {
  organizationId: string;
  tab?: SaleOrderListTab;
  search?: string;
  statuses?: SaleOrderStatus[];
  channelId?: SaleOrderChannel;
  amountMinCents?: number;
  amountMaxCents?: number;
  dateFrom?: Date;
  dateTo?: Date;
  sort?: SaleOrderSortOption;
  page?: number;
  perPage?: number;
};

/** Vínculo NF-e do pedido (spec erp/029) — resolvido em lote pelo use-case,
 * não pertence ao domínio de `SaleOrder` (é o `nfe-issuance` que é dono do
 * vínculo, mesma direção de dependência já existente entre os módulos). */
export type SaleOrderNfeIssuanceSummary = {
  id: string;
  status: string;
  fiscalDocumentId: string | null;
};

export type SaleOrderListItemDto = SaleOrderListItem & {
  /** `null` = pedido sem NF-e emitida ainda. */
  nfeIssuance: SaleOrderNfeIssuanceSummary | null;
};

export type ListSaleOrdersResult = {
  items: SaleOrderListItemDto[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  tabCounts: { open: number; deleted: number };
};

export type FindSaleOrderByIdDto = { organizationId: string; id: string };

export type FindSaleOrderByIdResult = SaleOrderDetail;

export type DeleteSaleOrderDto = { organizationId: string; id: string };

export type RestoreSaleOrderDto = { organizationId: string; id: string };
