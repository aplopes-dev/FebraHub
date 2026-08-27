import type { PriceAdjustmentType } from "@/features/price-lists/types/price-list";

export type PriceListDto = {
  id: string;
  name: string;
  adjustmentType: PriceAdjustmentType;
  /** Percentual ou centavos conforme o tipo. */
  adjustmentValue: number;
  channels: string[];
  /** Unidades. Vazio = todas. */
  branchIds?: string[];
  startDate: string | null;
  endDate: string | null;
  active: boolean;
  priority: number;
  productCount: number;
};

export type PriceListListResponseDto = {
  data: PriceListDto[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

export type PriceListResponseDto = {
  data: PriceListDto;
};

export type PriceListItemDto = {
  productId: string;
  priceCents: number;
};

export type PriceListItemsResponseDto = {
  data: PriceListItemDto[];
};

export type SavePriceListPayload = {
  name: string;
  adjustmentType: PriceAdjustmentType;
  adjustmentValue: number;
  channels: string[];
  branchIds: string[];
  startDate: string | null;
  endDate: string | null;
  active: boolean;
};

export type ReplacePriceListItemsPayload = {
  items: Array<{ productId: string; priceCents: number }>;
};
