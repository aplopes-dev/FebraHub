import type { PriceList } from '../../../../domain/entities/price-list.entity';
import type { PriceListItem } from '../../../../domain/entities/price-list-item.entity';
import type { ListPriceListsResult } from '../../../../application/dtos/price-list.dto';

export type PriceListResponse = {
  id: string;
  name: string;
  adjustmentType: string;
  adjustmentValue: number;
  channels: string[];
  startDate: string | null;
  endDate: string | null;
  active: boolean;
  priority: number;
  productCount: number;
};

export type PriceListItemResponse = {
  productId: string;
  priceCents: number;
};

export class PriceListPresenter {
  static toHttp(priceList: PriceList, productCount = 0): PriceListResponse {
    return {
      id: priceList.id,
      name: priceList.name,
      adjustmentType: priceList.adjustmentType,
      adjustmentValue: priceList.adjustmentValue,
      channels: priceList.channels,
      startDate: priceList.startDate?.toISOString() ?? null,
      endDate: priceList.endDate?.toISOString() ?? null,
      active: priceList.active,
      priority: priceList.priority,
      productCount,
    };
  }

  static toHttpSingle(priceList: PriceList, productCount = 0) {
    return { data: this.toHttp(priceList, productCount) };
  }

  static toHttpPaginatedList(result: ListPriceListsResult) {
    return {
      data: result.items.map(({ priceList, productCount }) =>
        this.toHttp(priceList, productCount),
      ),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }

  static toHttpPriorityList(lists: PriceList[]) {
    return {
      data: lists.map((list) => this.toHttp(list, 0)),
    };
  }

  static toHttpItem(item: PriceListItem): PriceListItemResponse {
    return {
      productId: item.productId,
      priceCents: item.priceCents,
    };
  }

  static toHttpItems(items: PriceListItem[]) {
    return {
      data: items.map((item) => this.toHttpItem(item)),
    };
  }
}
