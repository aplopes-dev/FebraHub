import i18n from '@/i18n';
import type { Coupon, PayMethod, PaymentMethod } from '@/types';
import { brlFull } from '@/utils/format';

export function computeCouponDiscount(subtotal: number, coupon: Coupon | null): number {
  if (!coupon) return 0;
  return coupon.type === 'PERCENT' ? (subtotal * coupon.value) / 100 : coupon.value;
}

export function computeOrderGrandTotal(subtotal: number, shipping: number, coupon: Coupon | null): number {
  return Math.max(0, subtotal + shipping - computeCouponDiscount(subtotal, coupon));
}

export function computePixDiscount(grandTotal: number, pay: PayMethod): number {
  return pay === 'pix' ? grandTotal * 0.05 : 0;
}

export function formatShippingPrice(price: number): string {
  return price <= 0 ? i18n.t('pricing.free', { ns: 'common' }) : `R$ ${brlFull(price)}`;
}

export function formatCpf(digits: string): string {
  const d = digits.replace(/\D/g, '');
  if (d.length !== 11) return d;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function canConfirmCheckout(
  pay: PayMethod,
  selectedPayment: PaymentMethod | null,
  boletoCpf: string,
): boolean {
  if (pay === 'card') return selectedPayment !== null;
  if (pay === 'boleto') return boletoCpf.replace(/\D/g, '').length === 11;
  return true;
}

export function resolveOrderPaymentMethod(
  pay: PayMethod,
  selectedPayment: PaymentMethod | null,
  boletoCpf: string,
): PaymentMethod | undefined {
  if (pay === 'card') return selectedPayment ?? undefined;
  if (pay === 'boleto') {
    const digits = boletoCpf.replace(/\D/g, '');
    return {
      id: `boleto-${Date.now()}`,
      brand: 'UNKNOWN',
      lastFour: '0000',
      expiry: '-',
      holderName: `CPF ${formatCpf(digits)}`,
      label: i18n.t('boleto.label', { ns: 'checkout' }),
      isDefault: false,
    };
  }
  return undefined;
}
