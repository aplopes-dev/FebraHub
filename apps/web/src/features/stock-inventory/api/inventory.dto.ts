export type InventoryLineDto = {
  productId: string;
  productName?: string;
  productSku?: string;
  unit?: string;
  systemQuantity: string;
  countedQuantity: string;
};

export type InventoryListItemDto = {
  id: string;
  stockId: string;
  name: string;
  status: "open" | "completed";
  createdAt: string;
  completedAt: string | null;
  itemsCount: number;
  divergentCount: number;
};

export type InventoryDetailDto = InventoryListItemDto & {
  lines: InventoryLineDto[];
};

export type InventoryListResponseDto = {
  data: InventoryListItemDto[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

export type InventoryDetailResponseDto = {
  data: InventoryDetailDto;
};

export type InventoryCreatedResponseDto = {
  data: InventoryDetailDto;
};

export type CreateInventoryPayload = {
  name: string;
  lines: Array<{ productId: string; countedQuantity: string }>;
};
