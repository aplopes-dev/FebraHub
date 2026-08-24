import type { PriceList } from '../domain/entities/price-list.entity';
import type { PriceListItem } from '../domain/entities/price-list-item.entity';
import {
  PriceListRepository,
  type PriceListListCriteria,
  type PriceListWithItemCount,
} from '../domain/repositories/price-list.repository.interface';

export class InMemoryPriceListRepository extends PriceListRepository {
  private lists = new Map<string, PriceList>();
  private itemsByListId = new Map<string, PriceListItem[]>();

  findById(organizationId: string, id: string): Promise<PriceList | null> {
    const list = this.lists.get(id);
    return Promise.resolve(
      list && list.organizationId === organizationId ? list : null,
    );
  }

  findByName(organizationId: string, name: string): Promise<PriceList | null> {
    const normalized = name.trim().toLowerCase();
    const found = [...this.lists.values()].find(
      (list) =>
        list.organizationId === organizationId &&
        list.name.trim().toLowerCase() === normalized,
    );
    return Promise.resolve(found ?? null);
  }

  findAll(
    organizationId: string,
    criteria: PriceListListCriteria = {},
  ): Promise<PriceList[]> {
    const filtered = this.filter(organizationId, criteria);
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? filtered.length;
    return Promise.resolve(filtered.slice(skip, skip + take));
  }

  findAllWithItemCounts(
    organizationId: string,
    criteria: PriceListListCriteria = {},
  ): Promise<PriceListWithItemCount[]> {
    const filtered = this.filter(organizationId, criteria);
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? filtered.length;
    return Promise.resolve(
      filtered.slice(skip, skip + take).map((priceList) => ({
        priceList,
        productCount: (this.itemsByListId.get(priceList.id) ?? []).length,
      })),
    );
  }

  findAllOrderedByPriority(organizationId: string): Promise<PriceList[]> {
    return Promise.resolve(
      [...this.lists.values()]
        .filter((list) => list.organizationId === organizationId)
        .sort(
          (a, b) => a.priority - b.priority || a.name.localeCompare(b.name),
        ),
    );
  }

  count(
    organizationId: string,
    criteria: Pick<PriceListListCriteria, 'search'> = {},
  ): Promise<number> {
    return Promise.resolve(this.filter(organizationId, criteria).length);
  }

  maxPriority(organizationId: string): Promise<number> {
    const priorities = [...this.lists.values()]
      .filter((list) => list.organizationId === organizationId)
      .map((list) => list.priority);
    return Promise.resolve(
      priorities.length === 0 ? -1 : Math.max(...priorities),
    );
  }

  save(priceList: PriceList): Promise<PriceList> {
    this.lists.set(priceList.id, priceList);
    if (!this.itemsByListId.has(priceList.id)) {
      this.itemsByListId.set(priceList.id, []);
    }
    return Promise.resolve(priceList);
  }

  saveMany(priceLists: PriceList[]): Promise<void> {
    for (const list of priceLists) {
      this.lists.set(list.id, list);
    }
    return Promise.resolve();
  }

  delete(organizationId: string, id: string): Promise<void> {
    const list = this.lists.get(id);
    if (list && list.organizationId === organizationId) {
      this.lists.delete(id);
      this.itemsByListId.delete(id);
    }
    return Promise.resolve();
  }

  findItems(
    organizationId: string,
    priceListId: string,
  ): Promise<PriceListItem[]> {
    const list = this.lists.get(priceListId);
    if (!list || list.organizationId !== organizationId) {
      return Promise.resolve([]);
    }
    return Promise.resolve(
      (this.itemsByListId.get(priceListId) ?? []).map((item) => item),
    );
  }

  replaceItems(
    organizationId: string,
    priceListId: string,
    items: PriceListItem[],
  ): Promise<PriceListItem[]> {
    const list = this.lists.get(priceListId);
    if (!list || list.organizationId !== organizationId) {
      return Promise.resolve([]);
    }
    const next = items.map((item) => item);
    this.itemsByListId.set(priceListId, next);
    return Promise.resolve(next);
  }

  findNamesByProductIds(
    organizationId: string,
    productIds: string[],
  ): Promise<Map<string, string[]>> {
    const result = new Map<string, string[]>();
    for (const productId of productIds) {
      result.set(productId, []);
    }

    for (const [listId, items] of this.itemsByListId.entries()) {
      const list = this.lists.get(listId);
      if (!list || list.organizationId !== organizationId) continue;
      for (const item of items) {
        if (!result.has(item.productId)) continue;
        const names = result.get(item.productId) ?? [];
        if (!names.includes(list.name)) {
          result.set(item.productId, [...names, list.name]);
        }
      }
    }

    for (const [productId, names] of result.entries()) {
      result.set(
        productId,
        [...names].sort((a, b) => a.localeCompare(b, 'pt-BR')),
      );
    }

    return Promise.resolve(result);
  }

  private filter(
    organizationId: string,
    criteria: PriceListListCriteria,
  ): PriceList[] {
    const search = criteria.search?.trim().toLowerCase();
    return [...this.lists.values()]
      .filter((list) => list.organizationId === organizationId)
      .filter((list) =>
        search ? list.name.toLowerCase().includes(search) : true,
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  clear(): void {
    this.lists.clear();
    this.itemsByListId.clear();
  }
}
