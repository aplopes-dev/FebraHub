import type {
  ApiAppliedCoupon,
  ApiCartItemInput,
  ApiCheckoutPreviewExtended,
  ApiCheckoutSession,
  ApiCheckoutSessionData,
  ApiCoupon,
  ApiCouponType,
  ApiOrder,
  ApiOrderItem,
  ApiOrderPaymentMethod,
  ApiPaymentInput,
  ApiPaymentResult,
  ApiPaymentType,
  ApiShippingOption,
} from '@/api/types';
import i18n from '@/i18n';
import {
  buildCart,
  db,
  findProduct,
  MOCK_SHIPPING_OPTIONS,
  nextId,
  persistDb,
  SEED_PRODUCTS,
} from './db';

const PIX_DISCOUNT_PERCENT = 5;
const STATUS_ADVANCE_MS = 20_000;

const STATUS_FLOW: Record<
  ApiOrder['status'],
  ApiOrder['status'] | null
> = {
  CONFIRMED: 'PREPARING',
  PREPARING: 'SHIPPED',
  SHIPPED: 'DELIVERED',
  DELIVERED: null,
  CANCELLED: null,
  RETURN_REQUESTED: null,
  RETURNED: null,
};

export function cartItemsFromDb(): ApiCartItemInput[] {
  return [...db.cart.entries()].map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

export function resolveItems(items?: ApiCartItemInput[]): ApiCartItemInput[] {
  if (items && items.length > 0) return items;
  return cartItemsFromDb();
}

export function subtotalForItems(items: ApiCartItemInput[]): number {
  return items.reduce((sum, item) => {
    const product = findProduct(item.productId);
    return sum + (product?.price ?? 0) * item.quantity;
  }, 0);
}

export function findCoupon(code: string): ApiCoupon | undefined {
  const normalized = code.trim().toUpperCase();
  return db.coupons.find((c) => c.code.toUpperCase() === normalized);
}

export function couponDiscountAmount(
  subtotal: number,
  coupon: ApiCoupon | ApiAppliedCoupon | null,
): number {
  if (!coupon) return 0;
  return coupon.type === 'PERCENT'
    ? (subtotal * coupon.value) / 100
    : coupon.value;
}

export function toAppliedCoupon(
  coupon: ApiCoupon,
  subtotal: number,
): ApiAppliedCoupon {
  return {
    code: coupon.code,
    type: coupon.type as ApiCouponType,
    value: coupon.value,
    discountAmount: couponDiscountAmount(subtotal, coupon),
  };
}

export function shippingOptionById(id: string | null | undefined): ApiShippingOption {
  return (
    MOCK_SHIPPING_OPTIONS.find((o) => o.id === id) ?? MOCK_SHIPPING_OPTIONS[0]
  );
}

export function shippingPriceForSession(session: ApiCheckoutSession): number {
  const option = shippingOptionById(session.shippingOptionId);
  const address = db.addresses.find((a) => a.id === session.selectedAddressId);
  if (db.user.isPlus && address?.state === 'SP' && option.id === 'express') {
    return 0;
  }
  return option.price;
}

export function pixDiscountAmount(
  grandTotal: number,
  paymentType: ApiPaymentType | undefined,
): number {
  return paymentType === 'PIX' ? grandTotal * (PIX_DISCOUNT_PERCENT / 100) : 0;
}

export function buildPreview(
  session: ApiCheckoutSession,
  items?: ApiCartItemInput[],
): ApiCheckoutPreviewExtended {
  const resolvedItems = resolveItems(items);
  const subtotal = subtotalForItems(resolvedItems);
  const shipping = shippingPriceForSession(session);
  const couponDiscount = session.appliedCoupon
    ? couponDiscountAmount(subtotal, session.appliedCoupon)
    : 0;
  const grandTotal = Math.max(0, subtotal + shipping - couponDiscount);
  const pixDiscount = pixDiscountAmount(grandTotal, session.paymentType);
  const total = Math.max(0, grandTotal - pixDiscount);

  return {
    subtotal,
    shipping,
    couponDiscount,
    pixDiscount,
    total,
    pixDiscountPercent: PIX_DISCOUNT_PERCENT,
    canConfirm: canConfirmSession(session),
  };
}

export function canConfirmSession(session: ApiCheckoutSession): boolean {
  if (!session.selectedAddressId || !session.shippingOptionId) return false;
  if (session.paymentType === 'CARD' && !session.paymentMethodId) return false;
  if (
    session.paymentType === 'BOLETO' &&
    (session.boletoCpf?.replace(/\D/g, '').length ?? 0) !== 11
  ) {
    return false;
  }
  return true;
}

export function buildCheckoutSessionData(
  items?: ApiCartItemInput[],
): ApiCheckoutSessionData {
  const session = { ...db.checkoutSession };
  session.canConfirm = canConfirmSession(session);
  return {
    cart: buildCart(),
    session,
    preview: buildPreview(session, items),
  };
}

export function syncCheckoutCoupon(applied: ApiAppliedCoupon | null) {
  db.appliedCoupon = applied;
  db.checkoutSession.appliedCoupon = applied;
}

export function freeShippingMessage(addressId: string | null | undefined): string | null {
  const address = db.addresses.find((a) => a.id === addressId);
  if (db.user.isPlus && address?.state === 'SP') {
    return i18n.t('shipping.freeForCity', {
      ns: 'checkout',
      city: address.city,
      state: address.state,
    });
  }
  return null;
}

function orderPaymentFromInput(payment: ApiPaymentInput): ApiOrderPaymentMethod {
  if (payment.type === 'PIX') {
    return {
      type: 'PIX',
      displayName: i18n.t('payment.pixDisplayName', { ns: 'api' }),
      label: i18n.t('payment.pixLabel', { ns: 'api' }),
    };
  }
  if (payment.type === 'BOLETO') {
    return {
      type: 'BOLETO',
      displayName: i18n.t('payment.boletoDisplayName', { ns: 'api' }),
      label: i18n.t('boleto.label', { ns: 'checkout' }),
    };
  }
  const pm = db.paymentMethods.find((p) => p.id === payment.paymentMethodId);
  if (!pm) {
    return {
      type: 'CARD',
      displayName: i18n.t('payment.cardDisplayName', { ns: 'api' }),
      label: i18n.t('payment.cardFallbackLabel', { ns: 'api' }),
    };
  }
  return {
    type: 'CARD',
    displayName: `${pm.brand} ****${pm.lastFour}`,
    label: pm.label,
  };
}

function buildOrderItems(items: ApiCartItemInput[]): ApiOrderItem[] {
  return items.map(({ productId, quantity }) => {
    const product = findProduct(productId);
    const unitPrice = product?.price ?? 0;
    return {
      productId,
      product,
      quantity,
      unitPrice,
      subtotal: unitPrice * quantity,
    };
  });
}

export function createOrderFromRequest(body: {
  addressId?: string;
  shippingOptionId?: string;
  couponCode?: string | null;
  payment: ApiPaymentInput;
  items?: ApiCartItemInput[];
  buyNow?: boolean;
}): { order: ApiOrder; payment: ApiPaymentResult } {
  const session = { ...db.checkoutSession };
  if (body.addressId) session.selectedAddressId = body.addressId;
  if (body.shippingOptionId) session.shippingOptionId = body.shippingOptionId;
  if (body.couponCode) {
    const coupon = findCoupon(body.couponCode);
    if (coupon) {
      const items = resolveItems(body.items);
      session.appliedCoupon = toAppliedCoupon(coupon, subtotalForItems(items));
    }
  }
  if (body.payment.type) session.paymentType = body.payment.type;
  if (body.payment.paymentMethodId) {
    session.paymentMethodId = body.payment.paymentMethodId;
  }
  if (body.payment.cpf) session.boletoCpf = body.payment.cpf;

  const items = resolveItems(body.items);
  const preview = buildPreview(session, items);
  const shippingOption = shippingOptionById(session.shippingOptionId);
  const address = db.addresses.find((a) => a.id === session.selectedAddressId);
  const orderId = nextId('CB');

  const order: ApiOrder = {
    id: orderId,
    items: buildOrderItems(items),
    status: 'CONFIRMED',
    deliveryDate: shippingOption.deliveryEstimate,
    address,
    paymentMethod: orderPaymentFromInput(body.payment),
    subtotal: preview.subtotal,
    shipping: preview.shipping,
    discount: preview.couponDiscount + preview.pixDiscount,
    total: preview.total,
    trackingCode: `BR${Math.floor(100000000 + Math.random() * 900900000)}CB`,
    carrier: i18n.t('orders.carrier', { ns: 'api' }),
    statusHistory: [
      {
        status: 'CONFIRMED',
        date: new Date().toISOString(),
        location: address?.city
          ? `${address.city}, ${address.state}`
          : i18n.t('locations.defaultCityState', { ns: 'common' }),
      },
    ],
    createdAt: new Date().toISOString(),
  };

  db.orders.unshift(order);
  db.orderStatusAt.set(orderId, Date.now());

  if (!body.buyNow) {
    db.cart.clear();
  }

  syncCheckoutCoupon(null);
  db.checkoutSession = {
    selectedAddressId: session.selectedAddressId ?? null,
    shippingOptionId: 'express',
    appliedCoupon: null,
    paymentType: 'PIX',
    paymentMethodId: null,
    boletoCpf: null,
    canConfirm: false,
  };

  persistDb();

  const payment: ApiPaymentResult =
    body.payment.type === 'PIX'
      ? {
          type: 'PIX',
          status: 'PENDING',
          pixQrCodeBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
          pixCopyPaste: `00020126580014br.gov.bcb.pix0136${orderId}520400005303986540${preview.total.toFixed(2)}5802BR5925CityBox6009SAO PAULO62070503***6304ABCD`,
          expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
        }
      : body.payment.type === 'BOLETO'
        ? {
            type: 'BOLETO',
            status: 'PENDING',
            barcode: '23793.38128 60000.000003 00000.000400 1 84340000062991',
            digitableLine: '2379338128600000000300000000400184340000062991',
            dueDate: new Date(Date.now() + 3 * 86_400_000).toISOString(),
            pdfUrl: `https://cdn.citybox.com.br/boletos/${orderId}.pdf`,
          }
        : {
            type: 'CARD',
            status: 'APPROVED',
            paymentMethodId: body.payment.paymentMethodId ?? null,
            displayName:
              order.paymentMethod?.displayName ??
              i18n.t('payment.cardFallbackLabel', { ns: 'api' }),
            authorizationCode: `AUTH${Math.floor(100000 + Math.random() * 900000)}`,
          };

  return { order, payment };
}

export function maybeAdvanceOrder(order: ApiOrder): ApiOrder {
  const next = STATUS_FLOW[order.status];
  if (!next) return order;

  const lastAt = db.orderStatusAt.get(order.id) ?? Date.now();
  if (Date.now() - lastAt < STATUS_ADVANCE_MS) return order;

  const location =
    next === 'DELIVERED'
      ? i18n.t('tracking.delivered', { ns: 'orders' })
      : next === 'SHIPPED'
        ? i18n.t('tracking.inTransit', { ns: 'orders' })
        : i18n.t('tracking.distributionCenter', { ns: 'orders' });

  order.status = next;
  order.statusHistory = [
    ...order.statusHistory,
    { status: next, date: new Date().toISOString(), location },
  ];
  db.orderStatusAt.set(order.id, Date.now());
  persistDb();
  return order;
}

export function reviewsSummary(productId: string) {
  const reviews = db.reviews[productId] ?? [];
  const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  for (const r of reviews) {
    distribution[String(r.rating)] = (distribution[String(r.rating)] ?? 0) + 1;
  }
  const averageRating =
    reviews.length === 0
      ? 0
      : reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return { reviews, averageRating, totalCount: reviews.length, distribution };
}

export function filtersMetadata() {
  const prices = SEED_PRODUCTS.map((p) => p.price);
  return {
    brands: [...new Set(SEED_PRODUCTS.map((p) => p.brand).filter(Boolean))] as string[],
    priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
    sortOptions: [
      { value: 'relevance', label: i18n.t('sort.relevance', { ns: 'search' }) },
      { value: 'price_asc', label: i18n.t('sort.priceAsc', { ns: 'search' }) },
      { value: 'price_desc', label: i18n.t('sort.priceDesc', { ns: 'search' }) },
      { value: 'rating', label: i18n.t('sort.rating', { ns: 'search' }) },
      { value: 'discount', label: i18n.t('sort.discount', { ns: 'search' }) },
    ],
    ratingOptions: [4, 3],
    flags: [
      { key: 'freeShipping', label: i18n.t('filters.freeShipping', { ns: 'search' }) },
      { key: 'express', label: i18n.t('filters.expressDelivery', { ns: 'search' }) },
    ],
  };
}
