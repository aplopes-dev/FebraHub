import {
  SEED_AUTH_USER,
  SEED_CATEGORIES,
  SEED_HOME,
  SEED_PRODUCTS,
} from '@/api/seed/catalog';
import type {
  ApiAddress,
  ApiAppliedCoupon,
  ApiCart,
  ApiChatMessage,
  ApiCheckoutSession,
  ApiCoupon,
  ApiFavoritesData,
  ApiNotification,
  ApiOrder,
  ApiOrderItem,
  ApiOrderPaymentMethod,
  ApiPaymentMethod,
  ApiProduct,
  ApiReview,
  ApiReturnDetail,
  ApiSettings,
  ApiShippingOption,
  ApiSubscription,
  ApiTicket,
  ApiUser,
} from '@/api/types';
import {
  DEMO_PASSWORD,
  SEARCH_SUGGESTIONS,
  SUBSCRIPTION_RENEWAL,
  resolveMockAddresses,
  resolveMockChat,
  resolveMockCoupons,
  resolveMockFaq,
  resolveMockNotifications,
  resolveMockOrders,
  resolveMockPaymentMethods,
  resolveMockReviews,
  resolveMockShipping,
  resolveStaticPageContent,
  resolveSubscriptionBenefits,
} from '@/data/mock';
import i18n from '@/i18n';
import type { Order, Review, StaticPageType } from '@/types';

export { DEMO_PASSWORD };

const STORAGE_KEY = 'citybox.msw.state';

type PersistedDb = {
  cart: [string, number][];
  favorites: string[];
  userPassword?: string;
};

let idCounter = 1000;

export function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function loadPersistedDb(): PersistedDb | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedDb) : null;
  } catch {
    return null;
  }
}

function parseBrDate(date: string): string {
  const match = date.match(/^(\d{2})\/(\d{2})(?:\/(\d{4}))?/);
  if (!match) return date;
  const year = match[3] ?? '2024';
  return `${year}-${match[2]}-${match[1]}T12:00:00.000Z`;
}

function toApiAddress(a: ReturnType<typeof resolveMockAddresses>[number]): ApiAddress {
  return {
    id: a.id,
    label: a.label,
    zipCode: a.zipCode,
    street: a.street,
    number: a.number,
    complement: a.complement,
    neighborhood: a.neighborhood,
    city: a.city,
    state: a.state,
    isDefault: a.isDefault,
  };
}

function toApiPaymentMethod(pm: ReturnType<typeof resolveMockPaymentMethods>[number]): ApiPaymentMethod {
  return {
    id: pm.id,
    brand: pm.brand,
    lastFour: pm.lastFour,
    expiry: pm.expiry,
    holderName: pm.holderName,
    label: pm.label,
    isDefault: pm.isDefault,
  };
}

function orderPaymentMethod(
  paymentMethodId: string | undefined,
  paymentMethods: ApiPaymentMethod[],
): ApiOrderPaymentMethod {
  const pm = paymentMethods.find((p) => p.id === paymentMethodId);
  if (!pm) {
    return {
      type: 'PIX',
      displayName: i18n.t('payment.pixDisplayName', { ns: 'api' }),
      label: i18n.t('payment.pixDisplayName', { ns: 'api' }),
    };
  }
  return {
    type: 'CARD',
    displayName: `${pm.brand} ****${pm.lastFour}`,
    label: pm.label,
  };
}

function toApiOrderItem(productId: string, quantity: number): ApiOrderItem {
  const product = productById.get(productId);
  const unitPrice = product?.price ?? 0;
  return {
    productId,
    product,
    quantity,
    unitPrice,
    subtotal: unitPrice * quantity,
  };
}

function toApiOrder(
  order: Order,
  addresses: ApiAddress[],
  paymentMethods: ApiPaymentMethod[],
): ApiOrder {
  const address = addresses.find((a) => a.id === order.addressId);
  return {
    id: order.id,
    items: order.productIds.map(({ id, qty }) => toApiOrderItem(id, qty)),
    status: order.status,
    deliveryDate: order.deliveryDate,
    address,
    paymentMethod: orderPaymentMethod(order.paymentMethodId, paymentMethods),
    subtotal: order.subtotal,
    shipping: order.shipping,
    discount: order.discount,
    total: order.total,
    trackingCode: order.trackingCode,
    carrier: i18n.t('orders.carrier', { ns: 'api' }),
    statusHistory: order.statusHistory.map((entry) => ({
      status: entry.status,
      date: parseBrDate(entry.date),
      location: entry.location,
    })),
    createdAt: '2024-03-08T09:00:00.000Z',
  };
}

function toApiReview(review: Review): ApiReview {
  return {
    id: review.id,
    productId: review.productId,
    author: review.author,
    rating: review.rating,
    date: parseBrDate(review.date),
    text: review.text,
    photoUrls: review.photoUrls,
  };
}

function seedNotifications(): ApiNotification[] {
  const dates = [
    '2024-03-13T10:00:00.000Z',
    '2024-03-13T07:00:00.000Z',
    '2024-03-12T18:00:00.000Z',
    '2024-03-10T12:00:00.000Z',
    '2024-03-06T09:00:00.000Z',
  ];
  return resolveMockNotifications().map((n, i) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    date: dates[i] ?? dates[dates.length - 1],
    isRead: n.isRead,
    deepLink: null,
  }));
}

function seedChat(): ApiChatMessage[] {
  return resolveMockChat().map((m, i) => ({
    id: m.id,
    text: m.text,
    isAgent: m.isAgent,
    time: `2024-03-13T09:0${i}:00.000Z`,
  }));
}

function seedCoupons(): ApiCoupon[] {
  return resolveMockCoupons().map((c) => ({
    code: c.code,
    description: c.description,
    type: c.type,
    value: c.value,
    expiry: parseBrDate(c.expiry),
    isApplicable: true,
    reason: null,
  }));
}

function seedShipping(): ApiShippingOption[] {
  return resolveMockShipping().map((s) => ({
    id: s.id,
    name: s.name,
    deliveryEstimate: s.deliveryEstimate,
    price: s.price,
    isExpress: s.isExpress,
  }));
}

function seedReviews(): Record<string, ApiReview[]> {
  const out: Record<string, ApiReview[]> = {};
  for (const [productId, reviews] of Object.entries(resolveMockReviews())) {
    out[productId] = reviews.map(toApiReview);
  }
  return out;
}

function seedSettings(): ApiSettings {
  return {
    pushOrdersEnabled: true,
    pushPromoEnabled: true,
    emailPromoEnabled: true,
    darkTheme: false,
    language: 'pt-BR',
  };
}

function seedSubscription(): ApiSubscription {
  return {
    isActive: true,
    planName: 'CityBox+',
    priceMonthly: 19.9,
    renewalDate: parseBrDate(SUBSCRIPTION_RENEWAL),
    benefits: resolveSubscriptionBenefits(),
  };
}

function seedCheckoutSession(addresses: ApiAddress[]): ApiCheckoutSession {
  const defaultAddress = addresses.find((a) => a.isDefault);
  return {
    selectedAddressId: defaultAddress?.id ?? null,
    shippingOptionId: 'express',
    appliedCoupon: null,
    paymentType: 'PIX',
    paymentMethodId: null,
    boletoCpf: null,
    canConfirm: false,
  };
}

function createDb() {
  const persisted = loadPersistedDb();
  const addresses = resolveMockAddresses().map(toApiAddress);
  const paymentMethods = resolveMockPaymentMethods().map(toApiPaymentMethod);

  return {
    cart: new Map<string, number>(persisted?.cart ?? []),
    favorites: new Set<string>(persisted?.favorites ?? ['p2', 'p7']),
    userPassword: persisted?.userPassword ?? DEMO_PASSWORD,
    addresses,
    paymentMethods,
    user: structuredClone(SEED_AUTH_USER) as ApiUser,
    settings: seedSettings(),
    subscription: seedSubscription(),
    appliedCoupon: null as ApiAppliedCoupon | null,
    orders: resolveMockOrders().map((o) => toApiOrder(o, addresses, paymentMethods)),
    returns: [] as ApiReturnDetail[],
    notifications: seedNotifications(),
    chat: seedChat(),
    reviews: seedReviews(),
    searchHistory: ['smartphone', 'fone bluetooth', ...SEARCH_SUGGESTIONS.slice(0, 2)],
    tickets: [
      {
        ticketId: 'TKT-001',
        status: 'OPEN' as const,
        subject: i18n.t('tickets.seed.tkt001.subject', { ns: 'engagement' }),
        message: i18n.t('tickets.seed.tkt001.message', { ns: 'engagement' }),
        orderId: 'ORD-2024-001',
        createdAt: '2024-03-10T10:30:00.000Z',
      },
      {
        ticketId: 'TKT-002',
        status: 'CLOSED' as const,
        subject: i18n.t('tickets.seed.tkt002.subject', { ns: 'engagement' }),
        message: i18n.t('tickets.seed.tkt002.message', { ns: 'engagement' }),
        orderId: undefined,
        createdAt: '2024-03-05T14:00:00.000Z',
      },
    ] as ApiTicket[],
    checkoutSession: seedCheckoutSession(addresses),
    coupons: seedCoupons(),
    idempotencyOrders: new Map<string, string>(),
    orderStatusAt: new Map<string, number>(),
    onboardingByDevice: new Map<string, boolean>(),
    accessToken: 'mock-token-camila',
  };
}

const productById = new Map(SEED_PRODUCTS.map((p) => [p.id, p]));

export const db = createDb();

export const STATIC_PAGES: Record<StaticPageType, string> = {
  about: resolveStaticPageContent('about'),
  terms: resolveStaticPageContent('terms'),
  privacy: resolveStaticPageContent('privacy'),
};

export const MOCK_FAQ = resolveMockFaq();

export function persistDb() {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        cart: [...db.cart.entries()],
        favorites: [...db.favorites],
        userPassword: db.userPassword,
      } satisfies PersistedDb),
    );
  } catch {
    /* ignore quota / private mode */
  }
}

export function findProduct(id: string): ApiProduct | undefined {
  return productById.get(id);
}

export function buildCart(): ApiCart {
  const items = [...db.cart.entries()].map(([productId, quantity]) => ({
    productId,
    quantity,
    product: findProduct(productId),
  }));
  const subtotal = items.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
    0,
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { items, itemCount, subtotal };
}

export function buildFavorites(): ApiFavoritesData {
  const productIds = [...db.favorites];
  const products = productIds
    .map((id) => findProduct(id))
    .filter((p): p is ApiProduct => p != null);
  return { productIds, products };
}

export function searchProducts(params: {
  q?: string | null;
  minPrice?: string | null;
  maxPrice?: string | null;
  minRating?: string | null;
  freeShipping?: string | null;
  express?: string | null;
  brand?: string | null;
  sortBy?: string | null;
}): ApiProduct[] {
  let products = [...SEED_PRODUCTS];

  const q = params.q?.trim().toLowerCase();
  if (q) {
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.brand?.toLowerCase().includes(q) ?? false),
    );
  }

  const minPrice = params.minPrice ? Number(params.minPrice) : null;
  if (minPrice != null && !Number.isNaN(minPrice)) {
    products = products.filter((p) => p.price >= minPrice);
  }

  const maxPrice = params.maxPrice ? Number(params.maxPrice) : null;
  if (maxPrice != null && !Number.isNaN(maxPrice)) {
    products = products.filter((p) => p.price <= maxPrice);
  }

  const minRating = params.minRating ? Number(params.minRating) : null;
  if (minRating != null && !Number.isNaN(minRating)) {
    products = products.filter((p) => p.rating >= minRating);
  }

  if (params.freeShipping === 'true') {
    products = products.filter((p) => p.isFreeShipping);
  }

  if (params.express === 'true') {
    products = products.filter((p) => p.isExpress);
  }

  const brand = params.brand?.trim();
  if (brand) {
    products = products.filter(
      (p) => p.brand?.toLowerCase() === brand.toLowerCase(),
    );
  }

  switch (params.sortBy) {
    case 'price_asc':
      products.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      products.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      products.sort((a, b) => b.rating - a.rating);
      break;
    case 'discount':
      products.sort(
        (a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0),
      );
      break;
    default:
      break;
  }

  return products;
}

export { SEED_CATEGORIES, SEED_HOME, SEED_PRODUCTS };
export const MOCK_SHIPPING_OPTIONS = seedShipping();
