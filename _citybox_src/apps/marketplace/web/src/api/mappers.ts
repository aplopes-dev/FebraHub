import { phImg } from '@/utils/format';
import i18n from '@/i18n';
import type {
  Address,
  AppNotification,
  Category,
  ChatMessage,
  Coupon,
  FaqItem,
  Order,
  OrderStatusEntry,
  PaymentMethod,
  Product,
  Review,
  ShippingOption,
  SubscriptionInfo,
  User,
} from '@/types';
import type {
  ApiAddress,
  ApiCart,
  ApiCategory,
  ApiChatMessage,
  ApiCoupon,
  ApiFaqItem,
  ApiNotification,
  ApiOrder,
  ApiPaymentMethod,
  ApiProduct,
  ApiReview,
  ApiShippingOption,
  ApiSubscription,
  ApiUser,
} from './types';

const PRODUCT_IMAGE_BG = '#f5f5f5';

function installmentsFor(price: number): string {
  const n = price >= 2000 ? 12 : price >= 500 ? 10 : 6;
  const value = (price / n).toFixed(2).replace('.', ',');
  return i18n.t('pricing.installments', { ns: 'common', count: n, value });
}

function formatApiDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
}

function formatApiTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatNotificationDate(iso: string, now = Date.now()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffMs = now - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) {
    return diffHours <= 1
      ? i18n.t('time.hourAgo', { ns: 'common' })
      : i18n.t('time.hoursAgo', { ns: 'common', count: diffHours });
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return i18n.t('time.yesterday', { ns: 'common' });
  if (diffDays < 7) return i18n.t('time.daysAgo', { ns: 'common', count: diffDays });
  const weeks = Math.floor(diffDays / 7);
  return weeks === 1
    ? i18n.t('time.weekAgo', { ns: 'common', count: weeks })
    : i18n.t('time.weeksAgo', { ns: 'common', count: weeks });
}

export function mapProduct(p: ApiProduct): Product {
  const bg = PRODUCT_IMAGE_BG;
  return {
    id: p.id,
    title: p.name,
    amount: p.price,
    original: p.originalPrice ?? p.price,
    discount: p.discountPercent ?? 0,
    installments: installmentsFor(p.price),
    rating: p.rating,
    reviews: p.reviewCount,
    full: p.isExpress,
    bg,
    img: p.imageUrl?.startsWith('http') ? p.imageUrl : phImg(p.name, bg),
    category: p.category,
    categoryId: p.categoryId,
  };
}

export function mapCategory(c: ApiCategory): Category {
  return { id: c.id, name: c.name, icon: c.icon, color: c.colorHex };
}

export function mapUser(u: ApiUser): User {
  return {
    name: u.name,
    email: u.email,
    phone: u.phone,
    avatarInitial: u.avatarInitial || u.name.charAt(0).toUpperCase(),
    isPlus: u.isPlus,
  };
}

export function mapAddress(a: ApiAddress): Address {
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

export function mapCartToRecord(cart: ApiCart): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of cart.items ?? []) {
    if (item.productId && item.quantity > 0) out[item.productId] = item.quantity;
  }
  return out;
}

export function mapFaqItem(f: ApiFaqItem): FaqItem {
  return { question: f.question, answer: f.answer };
}

export function mapOrder(o: ApiOrder): Order {
  return {
    id: o.id,
    productIds: (o.items ?? []).map((item) => ({
      id: item.productId,
      qty: item.quantity,
    })),
    total: o.total,
    status: o.status,
    deliveryDate: o.deliveryDate,
    addressId: o.address?.id,
    paymentMethodId: undefined,
    subtotal: o.subtotal,
    shipping: o.shipping,
    discount: o.discount,
    trackingCode: o.trackingCode ?? '',
    statusHistory: (o.statusHistory ?? []).map(
      (entry): OrderStatusEntry => ({
        status: entry.status,
        date: formatApiDate(entry.date),
        location: entry.location,
      }),
    ),
  };
}

export function mapNotification(n: ApiNotification): AppNotification {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    date: formatNotificationDate(n.date),
    isRead: n.isRead,
  };
}

export function mapChatMessage(m: ApiChatMessage): ChatMessage {
  return {
    id: m.id,
    text: m.text,
    isAgent: m.isAgent,
    time: formatApiTime(m.time),
  };
}

export function mapCoupon(c: ApiCoupon): Coupon {
  return {
    code: c.code,
    description: c.description,
    type: c.type,
    value: c.value,
    expiry: formatApiDate(c.expiry),
  };
}

export function mapPaymentMethod(pm: ApiPaymentMethod): PaymentMethod {
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

export function mapShippingOption(s: ApiShippingOption): ShippingOption {
  return {
    id: s.id,
    name: s.name,
    deliveryEstimate: s.deliveryEstimate,
    price: s.price,
    isExpress: s.isExpress,
  };
}

export function mapReview(r: ApiReview): Review {
  return {
    id: r.id,
    productId: r.productId,
    author: r.author,
    rating: r.rating,
    date: formatApiDate(r.date),
    text: r.text,
    photoUrls: r.photoUrls,
  };
}

export function mapSubscription(s: ApiSubscription): SubscriptionInfo {
  return {
    isActive: s.isActive,
    planName: s.planName,
    priceMonthly: s.priceMonthly,
    renewalDate: formatApiDate(s.renewalDate),
    benefits: s.benefits,
  };
}

