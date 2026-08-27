import type {
  SaleOrderChannelId,
  SaleOrderStatus,
} from "@/features/sales-orders/types/sale-order";
import type { PaymentMethodType } from "@/features/card-contracts/types/card-contract";

export type SaleOrderListItemDto = {
  id: string;
  number: number;
  customerId: string | null;
  customerName: string;
  stockId: string | null;
  status: SaleOrderStatus;
  channelId: SaleOrderChannelId;
  sellerId: string | null;
  sellerName: string;
  createdByName: string;
  totalCents: number;
  stockMovementId: string | null;
  posDeliveryOrderId?: string | null;
  posDeliveryOrderNumber?: number | null;
  posDeliveryFulfillment?: "delivery" | "pickup" | null;
  deletedAt: string | null;
  createdAt: string;
};

export type SaleOrderListMetaDto = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type SaleOrderTabCountsDto = {
  open: number;
  deleted: number;
};

export type SaleOrderListResponseDto = {
  data: SaleOrderListItemDto[];
  meta: SaleOrderListMetaDto;
  tabCounts: SaleOrderTabCountsDto;
};

export type SaleOrderLineDto = {
  productId: string;
  productName?: string;
  productSku?: string;
  quantity: string;
  unitPriceCents: number;
};

export type SaleOrderPaymentDto = {
  id?: string;
  amountCents: number;
  methodId: string;
  bankAccountId: string | null;
  cardPaymentType?: PaymentMethodType | null;
  brand?: string | null;
  installments?: number | null;
};

export type SaleOrderDetailDto = {
  id: string;
  number: number;
  customerId: string | null;
  customerName: string;
  stockId: string | null;
  status: SaleOrderStatus;
  channelId: SaleOrderChannelId;
  sellerId: string | null;
  sellerName: string;
  createdByName: string;
  notes: string;
  deliveryFeeCents: number;
  discountsCents: number;
  totalCents: number;
  stockMovementId: string | null;
  posDeliveryOrderId?: string | null;
  posDeliveryOrderNumber?: number | null;
  posDeliveryFulfillment?: "delivery" | "pickup" | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lines: SaleOrderLineDto[];
  payments: SaleOrderPaymentDto[];
};

export type SaleOrderDetailResponseDto = {
  data: SaleOrderDetailDto;
};

export type SaleOrderSingleResponseDto = {
  data: SaleOrderDetailDto;
};

export type SaveSaleOrderPayload = {
  customerId?: string | null;
  customerName: string;
  stockId?: string | null;
  status: SaleOrderStatus;
  channelId?: SaleOrderChannelId;
  sellerId?: string | null;
  sellerName?: string;
  notes?: string;
  deliveryFeeCents?: number;
  discountsCents?: number;
  lines: Array<{
    productId: string;
    quantity: string;
    unitPriceCents: number;
  }>;
  payments?: Array<{
    amountCents: number;
    methodId: string;
    bankAccountId?: string | null;
    cardPaymentType?: PaymentMethodType;
    brand?: string;
    installments?: number;
  }>;
};

export type PatchSaleOrderStatusPayload = {
  status: SaleOrderStatus;
};
