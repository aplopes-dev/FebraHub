import i18n from '@/i18n';
import type { ShippingOption } from '@/types';
import { brlFull } from '@/utils/format';

export function installmentCount(price: number): number {
  if (price >= 2000) return 12;
  if (price >= 800) return 10;
  if (price >= 300) return 6;
  if (price >= 100) return 3;
  return 1;
}

export function installmentLabel(price: number): string {
  const count = installmentCount(price);
  const value = price / count;
  if (count === 1) return i18n.t('pricing.cash', { ns: 'common' });
  return i18n.t('pricing.installments', {
    ns: 'common',
    count,
    value: brlFull(value),
  });
}

export function deliveryChipLabel(shipping: ShippingOption | null, isExpressProduct: boolean): string {
  if (!shipping) {
    return isExpressProduct
      ? i18n.t('delivery.tomorrow', { ns: 'catalog' })
      : i18n.t('delivery.checkCheckout', { ns: 'catalog' });
  }
  switch (shipping.id) {
    case 'express':
      return i18n.t('delivery.tomorrow', { ns: 'catalog' });
    case 'normal':
    case 'economico':
      return i18n.t('delivery.arrivesIn', {
        ns: 'catalog',
        estimate: shipping.deliveryEstimate.toLowerCase(),
      });
    default:
      return isExpressProduct
        ? i18n.t('delivery.tomorrow', { ns: 'catalog' })
        : shipping.deliveryEstimate;
  }
}
