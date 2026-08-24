import { money } from '../common/money.js';
import { toApiProduct } from '../catalog/product.presenter.js';

/** Regras de preço replicadas de apps/marketplace/web/src/mocks/checkout-logic.ts. */
export const PIX_DISCOUNT_PERCENT = 5;

// ── Shapes do contrato (web/src/api/types.ts) ────────────────────────────

export type ApiProductShape = ReturnType<typeof toApiProduct>;

export interface ApiCartItem {
  productId: string;
  quantity: number;
  product?: ApiProductShape;
}

export interface ApiCart {
  items: ApiCartItem[];
  itemCount: number;
  subtotal: number;
}

export interface ApiAppliedCoupon {
  code: string;
  type: string;
  value: number;
  discountAmount: number;
}

export interface ApiCheckoutSessionView {
  selectedAddressId: string | null;
  shippingOptionId: string | null;
  appliedCoupon: ApiAppliedCoupon | null;
  paymentType: string | null;
  paymentMethodId: string | null;
  boletoCpf: string | null;
  canConfirm: boolean;
}

export interface ApiCheckoutPreviewExtended {
  subtotal: number;
  shipping: number;
  couponDiscount: number;
  pixDiscount: number;
  total: number;
  pixDiscountPercent: number;
  installmentOptions?: Array<{ count: number; value: number; hasInterest: boolean }>;
  canConfirm: boolean;
  validationErrors: string[];
}

export interface ApiAddressShape {
  id: string;
  label: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
}

// ── Linhas Prisma usadas pelas regras (tipagem estrutural) ───────────────

export interface CouponRow {
  code: string;
  description: string;
  type: string;
  value: unknown;
  expiry: Date;
  minSubtotal: unknown | null;
  active: boolean;
}

export interface ShippingOptionRow {
  id: string;
  name: string;
  deliveryEstimate: string;
  price: unknown;
  isExpress: boolean;
}

export interface AddressRow {
  id: string;
  label: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
}

// ── Presenters ───────────────────────────────────────────────────────────

export function toApiAddress(row: AddressRow): ApiAddressShape {
  return {
    id: row.id,
    label: row.label,
    zipCode: row.zipCode,
    street: row.street,
    number: row.number,
    complement: row.complement ?? undefined,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    isDefault: row.isDefault,
  };
}

export function toApiShippingOption(row: ShippingOptionRow) {
  return {
    id: row.id,
    name: row.name,
    deliveryEstimate: row.deliveryEstimate,
    price: money(row.price as never),
    isExpress: row.isExpress,
  };
}

export interface CouponApplicability {
  isApplicable: boolean;
  reason: string | null;
}

/** Regras de aplicabilidade (active/expiry/minSubtotal) contra o subtotal. */
export function couponApplicability(coupon: CouponRow, subtotal: number): CouponApplicability {
  if (!coupon.active) return { isApplicable: false, reason: 'Cupom inválido' };
  if (coupon.expiry.getTime() < Date.now()) {
    return { isApplicable: false, reason: 'Cupom expirado' };
  }
  const min = coupon.minSubtotal == null ? 0 : money(coupon.minSubtotal as never);
  if (min > subtotal) {
    return {
      isApplicable: false,
      reason: `Válido para compras acima de R$ ${min.toFixed(2).replace('.', ',')}`,
    };
  }
  return { isApplicable: true, reason: null };
}

export function toApiCoupon(coupon: CouponRow, subtotal: number) {
  const { isApplicable, reason } = couponApplicability(coupon, subtotal);
  return {
    code: coupon.code,
    description: coupon.description,
    type: coupon.type,
    value: money(coupon.value as never),
    expiry: coupon.expiry.toISOString(),
    isApplicable,
    reason,
  };
}

/** checkout-logic.ts#couponDiscountAmount — PERCENT sobre o subtotal, FIXED valor cheio. */
export function couponDiscountAmount(subtotal: number, coupon: CouponRow | null): number {
  if (!coupon) return 0;
  const value = money(coupon.value as never);
  return coupon.type === 'PERCENT' ? money((subtotal * value) / 100) : value;
}

export function toAppliedCoupon(coupon: CouponRow, subtotal: number): ApiAppliedCoupon {
  return {
    code: coupon.code,
    type: coupon.type,
    value: money(coupon.value as never),
    discountAmount: couponDiscountAmount(subtotal, coupon),
  };
}

/** checkout-logic.ts#shippingPriceForSession — Plus + SP + express ⇒ frete 0. */
export function shippingPrice(
  option: ShippingOptionRow | null,
  isPlus: boolean,
  addressState: string | null | undefined,
): number {
  if (!option) return 0;
  if (isPlus && addressState === 'SP' && option.id === 'express') return 0;
  return money(option.price as never);
}

/** checkout-logic.ts#freeShippingMessage. */
export function freeShippingMessage(
  isPlus: boolean,
  address: AddressRow | null | undefined,
): string | null {
  if (isPlus && address?.state === 'SP') {
    return `Frete grátis para ${address.city}, ${address.state}`;
  }
  return null;
}

export interface SessionLike {
  selectedAddressId: string | null;
  shippingOptionId: string | null;
  paymentType: string | null;
  paymentMethodId: string | null;
  boletoCpf: string | null;
}

/** checkout-logic.ts#canConfirmSession + carrinho não vazio. */
export function sessionValidationErrors(session: SessionLike, itemCount: number): string[] {
  const errors: string[] = [];
  if (itemCount <= 0) errors.push('Carrinho vazio');
  if (!session.selectedAddressId) errors.push('Endereço de entrega obrigatório');
  if (!session.shippingOptionId) errors.push('Opção de frete obrigatória');
  if (!session.paymentType) errors.push('Forma de pagamento obrigatória');
  if (session.paymentType === 'CARD' && !session.paymentMethodId) {
    errors.push('Cartão obrigatório');
  }
  if (
    session.paymentType === 'BOLETO' &&
    (session.boletoCpf?.replace(/\D/g, '').length ?? 0) !== 11
  ) {
    errors.push('CPF inválido para boleto');
  }
  return errors;
}

/** Parcelas para CARD: 1x a 12x sem juros (web exibe "12x sem juros"). */
export function buildInstallments(total: number) {
  return Array.from({ length: 12 }, (_, i) => {
    const count = i + 1;
    return { count, value: money(total / count), hasInterest: false };
  });
}

export interface PreviewInput {
  subtotal: number;
  itemCount: number;
  session: SessionLike;
  shippingOption: ShippingOptionRow | null;
  coupon: CouponRow | null;
  isPlus: boolean;
  addressState: string | null | undefined;
}

/** checkout-logic.ts#buildPreview. */
export function buildPreview(input: PreviewInput): ApiCheckoutPreviewExtended {
  const { subtotal, session } = input;
  const shipping = shippingPrice(input.shippingOption, input.isPlus, input.addressState);
  const couponDiscount = couponDiscountAmount(subtotal, input.coupon);
  const grandTotal = Math.max(0, money(subtotal + shipping - couponDiscount));
  const pixDiscount =
    session.paymentType === 'PIX' ? money(grandTotal * (PIX_DISCOUNT_PERCENT / 100)) : 0;
  const total = Math.max(0, money(grandTotal - pixDiscount));
  const validationErrors = sessionValidationErrors(session, input.itemCount);

  return {
    subtotal: money(subtotal),
    shipping,
    couponDiscount,
    pixDiscount,
    total,
    pixDiscountPercent: PIX_DISCOUNT_PERCENT,
    installmentOptions: session.paymentType === 'CARD' ? buildInstallments(total) : undefined,
    canConfirm: validationErrors.length === 0,
    validationErrors,
  };
}

/** Extrai prazo em dias do deliveryEstimate ("3 a 5 dias úteis" → 5; "Amanhã até 22h" → 1). */
export function parseDeliveryDays(estimate: string): number {
  if (/amanh[ãa]/i.test(estimate)) return 1;
  const match = estimate.match(/(?:(\d+)\s*a\s*)?(\d+)\s*dias?/i);
  if (match) return Number(match[2]);
  return 5;
}
