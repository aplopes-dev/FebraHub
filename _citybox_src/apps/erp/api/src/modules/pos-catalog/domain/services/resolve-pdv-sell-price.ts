import type { PriceList } from '../../../catalog/domain/entities/price-list.entity';
import type { PriceListItem } from '../../../catalog/domain/entities/price-list-item.entity';

export type PdvPriceListWithItems = {
  list: PriceList;
  itemsByProductId: Map<string, number>;
};

/**
 * Preço efetivo do canal `pdv` para um produto.
 *
 * Listas candidatas: `active`, canal `pdv`, dentro da vigência. Ordem = menor
 * `priority` primeiro. A primeira que tiver item para o produto vence; senão
 * cai em `basePriceCents`.
 *
 * O PDV **não** remescla — esta função é a única fonte.
 */
export function resolvePdvSellPriceCents(
  productId: string,
  basePriceCents: number,
  lists: PdvPriceListWithItems[],
  now: Date = new Date(),
): number {
  for (const entry of lists) {
    if (!isPdvListApplicable(entry.list, now)) continue;
    const itemPrice = entry.itemsByProductId.get(productId);
    if (itemPrice !== undefined) return itemPrice;
  }
  return basePriceCents;
}

export function isPdvListApplicable(list: PriceList, now: Date): boolean {
  if (!list.active) return false;
  if (!list.channels.includes('pdv')) return false;
  if (list.startDate && list.startDate.getTime() > now.getTime()) return false;
  if (list.endDate && list.endDate.getTime() < now.getTime()) return false;
  return true;
}

/** Ordena listas por prioridade (menor = maior prioridade) e monta o índice. */
export function buildPdvPriceIndex(
  lists: PriceList[],
  itemsByListId: Map<string, PriceListItem[]>,
  now: Date = new Date(),
): PdvPriceListWithItems[] {
  return [...lists]
    .filter((list) => isPdvListApplicable(list, now))
    .sort((a, b) => a.priority - b.priority)
    .map((list) => {
      const items = itemsByListId.get(list.id) ?? [];
      const itemsByProductId = new Map<string, number>();
      for (const item of items) {
        itemsByProductId.set(item.productId, item.priceCents);
      }
      return { list, itemsByProductId };
    });
}
