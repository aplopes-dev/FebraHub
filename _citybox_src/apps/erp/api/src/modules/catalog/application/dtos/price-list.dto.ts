import type { PriceAdjustmentType } from '../../domain/entities/price-list.entity';
import type { PriceList } from '../../domain/entities/price-list.entity';
import type { PriceListItem } from '../../domain/entities/price-list-item.entity';

export type SavePriceListFields = {
  name: string;
  adjustmentType: PriceAdjustmentType;
  adjustmentValue: number;
  channels: string[];
  startDate: Date | null;
  endDate: Date | null;
  active: boolean;
};

export type CreatePriceListDto = SavePriceListFields & {
  organizationId: string;
};

export type UpdatePriceListDto = SavePriceListFields & {
  organizationId: string;
  id: string;
};

export type DeletePriceListDto = {
  organizationId: string;
  id: string;
};

export type FindPriceListByIdDto = {
  organizationId: string;
  id: string;
};

export type ListPriceListsDto = {
  organizationId: string;
  search?: string;
  page?: number;
  perPage?: number;
};

export type PriceListListItem = {
  priceList: PriceList;
  productCount: number;
};

export type ListPriceListsResult = {
  items: PriceListListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ReorderPriceListsDto = {
  organizationId: string;
  orderedIds: string[];
};

export type ListPriceListItemsDto = {
  organizationId: string;
  priceListId: string;
};

export type ReplacePriceListItemsDto = {
  organizationId: string;
  priceListId: string;
  items: Array<{ productId: string; priceCents: number }>;
};

export type PriceListItemDto = {
  item: PriceListItem;
};
