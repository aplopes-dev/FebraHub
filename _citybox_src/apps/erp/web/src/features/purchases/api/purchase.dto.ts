export type PurchaseDeliveryStatusDto = "pending" | "received";

export type PurchaseLineStatusDto = "pending" | "received" | "cancelled";

export type PurchaseListItemDto = {
  id: string;
  stockId: string;
  stockName: string;
  supplierId: string;
  supplierName: string;
  carrierId: string | null;
  carrierName: string | null;
  deliveryStatus: PurchaseDeliveryStatusDto;
  purchasedAt: string;
  series: string;
  invoiceNumber: string;
  itemsCount: number;
  totalCents: number;
  stockMovementId: string | null;
  deletedAt: string | null;
  createdAt: string;
};

export type PurchaseListMetaDto = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type PurchaseTabCountsDto = {
  active: number;
  deleted: number;
};

export type PurchaseListResponseDto = {
  data: PurchaseListItemDto[];
  meta: PurchaseListMetaDto;
  tabCounts: PurchaseTabCountsDto;
};

export type PurchaseDetailLineDto = {
  productId: string;
  productName: string;
  productSku: string;
  quantity: string;
  costCents: number;
  status: PurchaseLineStatusDto;
};

export type PurchaseDetailDto = {
  id: string;
  stockId: string;
  stockName: string;
  supplierId: string;
  supplierName: string;
  carrierId: string | null;
  carrierName: string | null;
  deliveryStatus: PurchaseDeliveryStatusDto;
  purchasedAt: string;
  series: string;
  invoiceNumber: string;
  notes: string;
  freightCents: number;
  discountsCents: number;
  otherExpensesCents: number;
  linesTotalCents: number;
  totalCents: number;
  stockMovementId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lines: PurchaseDetailLineDto[];
};

export type PurchaseDetailResponseDto = {
  data: PurchaseDetailDto;
};

/** Resposta de create/update — mais enxuta que o detalhe (sem nomes relacionados). */
export type PurchaseSingleLineDto = {
  productId: string;
  quantity: string;
  costCents: number;
  status: PurchaseLineStatusDto;
};

export type PurchaseSingleDto = {
  id: string;
  stockId: string;
  supplierId: string;
  carrierId: string | null;
  deliveryStatus: PurchaseDeliveryStatusDto;
  purchasedAt: string;
  series: string;
  invoiceNumber: string;
  notes: string;
  freightCents: number;
  discountsCents: number;
  otherExpensesCents: number;
  linesTotalCents: number;
  totalCents: number;
  stockMovementId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lines: PurchaseSingleLineDto[];
};

export type PurchaseSingleResponseDto = {
  data: PurchaseSingleDto;
};

export type SavePurchaseLinePayload = {
  productId: string;
  quantity: string;
  costCents: number;
  status: PurchaseLineStatusDto;
};

export type SavePurchasePayload = {
  stockId: string;
  supplierId: string;
  carrierId?: string;
  deliveryStatus: PurchaseDeliveryStatusDto;
  purchasedAt: string;
  series?: string;
  invoiceNumber?: string;
  notes?: string;
  freightCents: number;
  discountsCents: number;
  otherExpensesCents: number;
  lines: SavePurchaseLinePayload[];
};
