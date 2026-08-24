import i18n from '@/i18n';
import type {
  Address,
  AppNotification,
  Category,
  ChatMessage,
  Coupon,
  FaqItem,
  Order,
  PaymentMethod,
  Review,
  ShippingOption,
  StaticPageType,
} from '../types';

export const DEMO_PASSWORD = '123456';
export const MOCK_RESET_TOKEN = 'mock-reset-token';

/** Resolve a stored i18n key (e.g. `catalog.categories.ofertas`) at runtime. */
export function resolveMockText(key: string): string {
  const [ns, ...rest] = key.split('.');
  if (rest.length === 0) return key;
  return i18n.t(rest.join('.'), { ns });
}

const MOCK_CATEGORY_DEFS = [
  { id: 'ofertas', nameKey: 'catalog.categories.ofertas', icon: '🏷️', color: '#fafafa' },
  { id: 'supermercado', nameKey: 'catalog.categories.supermercado', icon: '🛒', color: '#fafafa' },
  { id: 'moda', nameKey: 'catalog.categories.moda', icon: '👕', color: '#fafafa' },
  { id: 'tecnologia', nameKey: 'catalog.categories.tecnologia', icon: '📱', color: '#fafafa' },
  { id: 'casa', nameKey: 'catalog.categories.casa', icon: '🛋️', color: '#fafafa' },
  { id: 'beleza', nameKey: 'catalog.categories.beleza', icon: '💄', color: '#fafafa' },
  { id: 'esportes', nameKey: 'catalog.categories.esportes', icon: '⚽', color: '#fafafa' },
  { id: 'cupons', nameKey: 'catalog.categories.cupons', icon: '🎟️', color: '#fafafa' },
] as const;

export function resolveMockCategories(): Category[] {
  return MOCK_CATEGORY_DEFS.map(({ nameKey, ...rest }) => ({
    ...rest,
    name: resolveMockText(nameKey),
  }));
}

/** Raw category defs with translation keys — use resolveMockCategories() for display. */
export const MOCK_CATEGORIES: Category[] = MOCK_CATEGORY_DEFS.map(({ nameKey, ...rest }) => ({
  ...rest,
  name: nameKey,
}));

const MOCK_ADDRESS_DEFS: (Omit<Address, 'label'> & { labelKey: string })[] = [
  {
    id: 'addr-1',
    labelKey: 'account.address.labels.home',
    zipCode: '01310-100',
    street: 'Rua das Flores',
    number: '123',
    complement: 'Apto 45',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    isDefault: true,
  },
  {
    id: 'addr-2',
    labelKey: 'account.address.labels.work',
    zipCode: '04543-011',
    street: 'Av. Brigadeiro Faria Lima',
    number: '3477',
    complement: 'Sala 1201',
    neighborhood: 'Itaim Bibi',
    city: 'São Paulo',
    state: 'SP',
    isDefault: false,
  },
  {
    id: 'addr-3',
    labelKey: 'account.address.labels.parents',
    zipCode: '30130-100',
    street: 'Rua da Bahia',
    number: '890',
    neighborhood: 'Centro',
    city: 'Belo Horizonte',
    state: 'MG',
    isDefault: false,
  },
];

export function resolveMockAddresses(): Address[] {
  return MOCK_ADDRESS_DEFS.map(({ labelKey, ...rest }) => ({
    ...rest,
    label: resolveMockText(labelKey),
  }));
}

export const MOCK_ADDRESSES: Address[] = MOCK_ADDRESS_DEFS.map(({ labelKey, ...rest }) => ({
  ...rest,
  label: labelKey,
}));

const MOCK_PAYMENT_DEFS: (Omit<PaymentMethod, 'label'> & { labelKey: string })[] = [
  {
    id: 'card-1',
    labelKey: 'account.payment.labels.primary',
    brand: 'VISA',
    lastFour: '4242',
    expiry: '12/28',
    holderName: 'Camila Souza',
    isDefault: true,
  },
  {
    id: 'card-2',
    labelKey: 'account.payment.labels.backup',
    brand: 'MASTERCARD',
    lastFour: '8888',
    expiry: '06/27',
    holderName: 'Camila Souza',
    isDefault: false,
  },
];

export function resolveMockPaymentMethods(): PaymentMethod[] {
  return MOCK_PAYMENT_DEFS.map(({ labelKey, ...rest }) => ({
    ...rest,
    label: resolveMockText(labelKey),
  }));
}

export const MOCK_PAYMENT_METHODS: PaymentMethod[] = MOCK_PAYMENT_DEFS.map(({ labelKey, ...rest }) => ({
  ...rest,
  label: labelKey,
}));

type MockReviewDef = Omit<Review, 'author' | 'text'> & { sampleKey: string };

const MOCK_REVIEW_DEFS: Record<string, MockReviewDef[]> = {
  p1: [
    { id: 'r1', productId: 'p1', sampleKey: 'r1', rating: 5, date: '15/03/2024' },
    { id: 'r2', productId: 'p1', sampleKey: 'r2', rating: 5, date: '10/03/2024' },
    { id: 'r3', productId: 'p1', sampleKey: 'r3', rating: 4, date: '05/03/2024' },
  ],
  p2: [
    { id: 'r4', productId: 'p2', sampleKey: 'r4', rating: 5, date: '20/02/2024' },
    { id: 'r5', productId: 'p2', sampleKey: 'r5', rating: 4, date: '18/02/2024' },
  ],
};

function resolveReviewSample(sampleKey: string): Pick<Review, 'author' | 'text'> {
  return {
    author: i18n.t(`reviews.sample.${sampleKey}.author`, { ns: 'engagement' }),
    text: i18n.t(`reviews.sample.${sampleKey}.text`, { ns: 'engagement' }),
  };
}

export function resolveMockReviews(): Record<string, Review[]> {
  const out: Record<string, Review[]> = {};
  for (const [productId, reviews] of Object.entries(MOCK_REVIEW_DEFS)) {
    out[productId] = reviews.map(({ sampleKey, ...rest }) => ({
      ...rest,
      ...resolveReviewSample(sampleKey),
    }));
  }
  return out;
}

/** Raw review defs with sample keys — use resolveMockReviews() for display. */
export const MOCK_REVIEWS: Record<string, Review[]> = Object.fromEntries(
  Object.entries(MOCK_REVIEW_DEFS).map(([productId, reviews]) => [
    productId,
    reviews.map(({ sampleKey, ...rest }) => ({
      ...rest,
      author: `engagement.reviews.sample.${sampleKey}.author`,
      text: `engagement.reviews.sample.${sampleKey}.text`,
    })),
  ]),
);

const MOCK_COUPON_DEFS: (Omit<Coupon, 'description'> & { descriptionKey: string })[] = [
  { code: 'PRIMEIRA10', descriptionKey: 'coupons.descriptions.primeira10', type: 'PERCENT', value: 10, expiry: '31/12/2024' },
  { code: 'FRETEGRATIS', descriptionKey: 'coupons.descriptions.fretegratis', type: 'FIXED', value: 15, expiry: '30/06/2024' },
  { code: 'TECH50', descriptionKey: 'coupons.descriptions.tech50', type: 'FIXED', value: 50, expiry: '15/08/2024' },
];

export function resolveMockCoupons(): Coupon[] {
  return MOCK_COUPON_DEFS.map(({ descriptionKey, ...rest }) => ({
    ...rest,
    description: resolveMockText(descriptionKey),
  }));
}

export const MOCK_COUPONS: Coupon[] = MOCK_COUPON_DEFS.map(({ descriptionKey, ...rest }) => ({
  ...rest,
  description: descriptionKey,
}));

const MOCK_NOTIFICATION_DEFS: (Omit<AppNotification, 'title' | 'body' | 'date'> & {
  titleKey: string;
  bodyKey: string;
  dateKey: string;
})[] = [
  { id: 'n1', type: 'ORDER', titleKey: 'notifications.titles.orderShipping', bodyKey: 'notifications.bodies.orderShipping', dateKey: 'notifications.dates.hours2', isRead: false },
  { id: 'n2', type: 'PROMO', titleKey: 'notifications.titles.flashSale', bodyKey: 'notifications.bodies.flashSale', dateKey: 'notifications.dates.hours5', isRead: false },
  { id: 'n3', type: 'ORDER', titleKey: 'notifications.titles.orderDelivered', bodyKey: 'notifications.bodies.orderDelivered', dateKey: 'notifications.dates.yesterday', isRead: true },
  { id: 'n4', type: 'SYSTEM', titleKey: 'notifications.titles.subscriptionRenewed', bodyKey: 'notifications.bodies.subscriptionRenewed', dateKey: 'notifications.dates.days3', isRead: true },
  { id: 'n5', type: 'PROMO', titleKey: 'notifications.titles.exclusiveCoupon', bodyKey: 'notifications.bodies.exclusiveCoupon', dateKey: 'notifications.dates.week1', isRead: true },
];

export function resolveMockNotifications(): AppNotification[] {
  return MOCK_NOTIFICATION_DEFS.map(({ titleKey, bodyKey, dateKey, ...rest }) => ({
    ...rest,
    title: resolveMockText(titleKey),
    body: resolveMockText(bodyKey),
    date: resolveMockText(dateKey),
  }));
}

export const MOCK_NOTIFICATIONS: AppNotification[] = MOCK_NOTIFICATION_DEFS.map(
  ({ titleKey, bodyKey, dateKey, ...rest }) => ({
    ...rest,
    title: titleKey,
    body: bodyKey,
    date: dateKey,
  }),
);

const MOCK_FAQ_DEFS: { questionKey: string; answerKey: string }[] = [
  { questionKey: 'faq.trackOrder.question', answerKey: 'faq.trackOrder.answer' },
  { questionKey: 'faq.cancelOrder.question', answerKey: 'faq.cancelOrder.answer' },
  { questionKey: 'faq.paymentMethods.question', answerKey: 'faq.paymentMethods.answer' },
  { questionKey: 'faq.freeShipping.question', answerKey: 'faq.freeShipping.answer' },
  { questionKey: 'faq.useCoupon.question', answerKey: 'faq.useCoupon.answer' },
  { questionKey: 'faq.changeAddress.question', answerKey: 'faq.changeAddress.answer' },
  { questionKey: 'faq.cityboxPlus.question', answerKey: 'faq.cityboxPlus.answer' },
];

export function resolveMockFaq(): FaqItem[] {
  return MOCK_FAQ_DEFS.map(({ questionKey, answerKey }) => ({
    question: resolveMockText(questionKey),
    answer: resolveMockText(answerKey),
  }));
}

export const MOCK_FAQ: FaqItem[] = MOCK_FAQ_DEFS.map(({ questionKey, answerKey }) => ({
  question: questionKey,
  answer: answerKey,
}));

const MOCK_CHAT_DEFS: (Omit<ChatMessage, 'text'> & { textKey: string })[] = [
  { id: 'c1', textKey: 'chat.messages.greeting', isAgent: true, time: '09:00' },
  { id: 'c2', textKey: 'chat.messages.userOrder', isAgent: false, time: '09:01' },
  { id: 'c3', textKey: 'chat.messages.agentReply', isAgent: true, time: '09:01' },
];

export function resolveMockChat(): ChatMessage[] {
  return MOCK_CHAT_DEFS.map(({ textKey, ...rest }) => ({
    ...rest,
    text: resolveMockText(textKey),
  }));
}

export const MOCK_CHAT: ChatMessage[] = MOCK_CHAT_DEFS.map(({ textKey, ...rest }) => ({
  ...rest,
  text: textKey,
}));

const MOCK_SHIPPING_DEFS: (Omit<ShippingOption, 'name' | 'deliveryEstimate'> & {
  nameKey: string;
  estimateKey: string;
})[] = [
  { id: 'express', nameKey: 'checkout.shipping.options.express', estimateKey: 'checkout.shipping.estimates.express', price: 0, isExpress: true },
  { id: 'normal', nameKey: 'checkout.shipping.options.normal', estimateKey: 'checkout.shipping.estimates.normal', price: 12.9 },
  { id: 'economico', nameKey: 'checkout.shipping.options.economico', estimateKey: 'checkout.shipping.estimates.economico', price: 7.9 },
];

export function resolveMockShipping(): ShippingOption[] {
  return MOCK_SHIPPING_DEFS.map(({ nameKey, estimateKey, ...rest }) => ({
    ...rest,
    name: resolveMockText(nameKey),
    deliveryEstimate: resolveMockText(estimateKey),
  }));
}

export const MOCK_SHIPPING: ShippingOption[] = MOCK_SHIPPING_DEFS.map(({ nameKey, estimateKey, ...rest }) => ({
  ...rest,
  name: nameKey,
  deliveryEstimate: estimateKey,
}));

export const MOCK_ORDERS: Order[] = [
  {
    id: 'CB-001234',
    productIds: [{ id: 'p1', qty: 1 }],
    total: 1799.9,
    status: 'SHIPPED',
    deliveryDate: 'orders.delivery.tomorrow',
    addressId: 'addr-1',
    paymentMethodId: 'card-1',
    subtotal: 1799.9,
    shipping: 0,
    discount: 0,
    trackingCode: 'BR123456789CB',
    statusHistory: [
      { status: 'CONFIRMED', date: '12/03 10:30', location: 'common.locations.defaultCityState' },
      { status: 'PREPARING', date: '12/03 14:00', location: 'orders.tracking.distributionCenter' },
      { status: 'SHIPPED', date: '13/03 08:15', location: 'orders.tracking.inTransit' },
    ],
  },
  {
    id: 'CB-001100',
    productIds: [{ id: 'p2', qty: 1 }, { id: 'p7', qty: 1 }],
    total: 579.8,
    status: 'DELIVERED',
    deliveryDate: 'orders.delivery.delivered',
    addressId: 'addr-1',
    paymentMethodId: 'card-1',
    subtotal: 579.8,
    shipping: 0,
    discount: 0,
    trackingCode: 'BR987654321CB',
    statusHistory: [
      { status: 'CONFIRMED', date: '08/03 09:00', location: 'common.locations.defaultCityState' },
      { status: 'PREPARING', date: '08/03 15:30', location: 'orders.tracking.distributionCenter' },
      { status: 'SHIPPED', date: '09/03 07:00', location: 'orders.tracking.inTransit' },
      { status: 'DELIVERED', date: '10/03 14:22', location: 'orders.tracking.delivered' },
    ],
  },
];

export function resolveMockOrders(): Order[] {
  return MOCK_ORDERS.map((order) => ({
    ...order,
    deliveryDate: resolveMockText(order.deliveryDate),
    statusHistory: order.statusHistory.map((entry) => ({
      ...entry,
      location: entry.location?.includes('.') ? resolveMockText(entry.location) : entry.location,
    })),
  }));
}

export const STATIC_PAGE_CONTENT_KEYS: Record<StaticPageType, string> = {
  about: 'legal.content.about',
  terms: 'legal.content.terms',
  privacy: 'legal.content.privacy',
};

export function resolveStaticPageContent(type: StaticPageType): string {
  return resolveMockText(STATIC_PAGE_CONTENT_KEYS[type]);
}

/** @deprecated Use STATIC_PAGE_CONTENT_KEYS + resolveStaticPageContent */
export const STATIC_PAGE_CONTENT: Record<StaticPageType, string> = STATIC_PAGE_CONTENT_KEYS;

export const SUBSCRIPTION_RENEWAL = '15/07/2024';

export const SUBSCRIPTION_BENEFIT_KEYS = [
  'subscription.benefits.freeShipping',
  'subscription.benefits.express',
  'subscription.benefits.cashback',
  'subscription.benefits.earlyAccess',
  'subscription.benefits.support',
] as const;

export function resolveSubscriptionBenefits(): string[] {
  return SUBSCRIPTION_BENEFIT_KEYS.map((key) => resolveMockText(key));
}

/** @deprecated Use SUBSCRIPTION_BENEFIT_KEYS + resolveSubscriptionBenefits */
export const SUBSCRIPTION_BENEFITS = [...SUBSCRIPTION_BENEFIT_KEYS];

export const SEARCH_SUGGESTIONS = ['iPhone', 'AirPods', 'PlayStation', 'MacBook', 'TV Samsung', 'Kindle'];

export const CEP_MOCK: Record<string, Partial<Address>> = {
  '01310100': { street: 'Av. Paulista', neighborhood: 'Bela Vista', city: 'São Paulo', state: 'SP' },
  '30130100': { street: 'Av. Afonso Pena', neighborhood: 'Centro', city: 'Belo Horizonte', state: 'MG' },
};
