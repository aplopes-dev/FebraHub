export type StockTransferLineDto = {
  productId: string;
  quantity: string;
  batch: string | null;
};

export type StockTransferListItemDto = {
  id: string;
  status: "active" | "cancelled";
  fromStockId: string;
  toStockId: string;
  fromStockName: string;
  toStockName: string;
  operatedAt: string;
  carrierId: string | null;
  responsibleName: string;
  notes: string;
  itemsCount: number;
  createdAt: string;
  cancelledAt: string | null;
};

export type StockTransferListResponseDto = {
  data: StockTransferListItemDto[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  tabCounts: { active: number; cancelled: number };
};

export type StockTransferCreatedResponseDto = {
  data: {
    id: string;
    status: "active" | "cancelled";
    fromStockId: string;
    toStockId: string;
    operatedAt: string;
    carrierId: string | null;
    responsibleName: string;
    notes: string;
    itemsCount: number;
    outboundMovementId: string | null;
    inboundMovementId: string | null;
    createdAt: string;
    lines: StockTransferLineDto[];
  };
};

export type StockTransferCancelledResponseDto = {
  data: {
    id: string;
    status: "cancelled";
    cancelledAt: string | null;
  };
};

export type CreateStockTransferPayload = {
  fromStockId: string;
  toStockId: string;
  operatedAt: string;
  carrierId?: string;
  responsibleName: string;
  notes?: string;
  lines: Array<{
    productId: string;
    quantity: string;
    batch?: string;
  }>;
};
