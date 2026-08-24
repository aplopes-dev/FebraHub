import { PriceList } from '../../../catalog/domain/entities/price-list.entity';
import { PriceListItem } from '../../../catalog/domain/entities/price-list-item.entity';
import {
  buildPdvPriceIndex,
  resolvePdvSellPriceCents,
} from './resolve-pdv-sell-price';

function list(props: {
  id: string;
  priority: number;
  channels?: string[];
  active?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
}): PriceList {
  return PriceList.with(
    {
      organizationId: 'org-1',
      name: props.id,
      adjustmentType: 'manual',
      adjustmentValue: 0,
      channels: props.channels ?? ['pdv'],
      startDate: props.startDate ?? null,
      endDate: props.endDate ?? null,
      active: props.active ?? true,
      priority: props.priority,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    props.id,
  );
}

function item(listId: string, productId: string, priceCents: number) {
  return PriceListItem.with(
    {
      organizationId: 'org-1',
      priceListId: listId,
      productId,
      priceCents,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    `${listId}-${productId}`,
  );
}

describe('resolvePdvSellPriceCents', () => {
  const now = new Date('2026-08-10T12:00:00.000Z');

  it('usa basePriceCents quando não há lista pdv aplicável', () => {
    const index = buildPdvPriceIndex(
      [list({ id: 'delivery-only', priority: 0, channels: ['delivery'] })],
      new Map([['delivery-only', [item('delivery-only', 'p1', 900)]]]),
      now,
    );
    expect(resolvePdvSellPriceCents('p1', 500, index, now)).toBe(500);
  });

  it('lista pdv vence o preço base', () => {
    const index = buildPdvPriceIndex(
      [list({ id: 'promo', priority: 1 })],
      new Map([['promo', [item('promo', 'p1', 420)]]]),
      now,
    );
    expect(resolvePdvSellPriceCents('p1', 500, index, now)).toBe(420);
  });

  it('menor priority vence entre listas pdv', () => {
    const index = buildPdvPriceIndex(
      [list({ id: 'high', priority: 10 }), list({ id: 'low', priority: 1 })],
      new Map([
        ['high', [item('high', 'p1', 100)]],
        ['low', [item('low', 'p1', 200)]],
      ]),
      now,
    );
    expect(resolvePdvSellPriceCents('p1', 500, index, now)).toBe(200);
  });

  it('ignora lista inativa ou fora da vigência', () => {
    const index = buildPdvPriceIndex(
      [
        list({ id: 'off', priority: 0, active: false }),
        list({
          id: 'future',
          priority: 0,
          startDate: new Date('2026-09-01T00:00:00.000Z'),
        }),
      ],
      new Map([
        ['off', [item('off', 'p1', 1)]],
        ['future', [item('future', 'p1', 2)]],
      ]),
      now,
    );
    expect(resolvePdvSellPriceCents('p1', 500, index, now)).toBe(500);
  });
});
