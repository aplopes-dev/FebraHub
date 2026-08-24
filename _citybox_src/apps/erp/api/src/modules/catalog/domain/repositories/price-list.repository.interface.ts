import type { PriceList } from '../entities/price-list.entity';
import type { PriceListItem } from '../entities/price-list-item.entity';

export type PriceListListCriteria = {
  search?: string;
  skip?: number;
  take?: number;
};

export type PriceListWithItemCount = {
  priceList: PriceList;
  productCount: number;
};

export abstract class PriceListRepository {
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<PriceList | null>;

  abstract findByName(
    organizationId: string,
    name: string,
  ): Promise<PriceList | null>;

  abstract findAll(
    organizationId: string,
    criteria?: PriceListListCriteria,
  ): Promise<PriceList[]>;

  abstract findAllWithItemCounts(
    organizationId: string,
    criteria?: PriceListListCriteria,
  ): Promise<PriceListWithItemCount[]>;

  abstract findAllOrderedByPriority(
    organizationId: string,
  ): Promise<PriceList[]>;

  abstract count(
    organizationId: string,
    criteria?: Pick<PriceListListCriteria, 'search'>,
  ): Promise<number>;

  abstract maxPriority(organizationId: string): Promise<number>;

  abstract save(priceList: PriceList): Promise<PriceList>;

  abstract saveMany(priceLists: PriceList[]): Promise<void>;

  abstract delete(organizationId: string, id: string): Promise<void>;

  abstract findItems(
    organizationId: string,
    priceListId: string,
  ): Promise<PriceListItem[]>;

  abstract replaceItems(
    organizationId: string,
    priceListId: string,
    items: PriceListItem[],
  ): Promise<PriceListItem[]>;

  /** Nomes das listas (ordenados) que contêm cada produto. */
  abstract findNamesByProductIds(
    organizationId: string,
    productIds: string[],
  ): Promise<Map<string, string[]>>;
}
