import i18n from '@/i18n';

export type PayMethod = 'pix' | 'card' | 'boleto';

export interface Product {
  id: string;
  title: string;
  amount: number;
  original: number;
  discount: number;
  installments: string;
  rating: number;
  reviews: number;
  full: boolean;
  bg: string;
  img: string;
  category?: string;
  categoryId?: string;
}

export interface DecoratedProduct extends Product {
  priceInt: string;
  priceCents: string;
  originalFmt: string;
  discountFmt: string;
  reviewsFmt: string;
  ratingFmt: string;
  starsFull: string;
  starsEmpty: string;
}

export interface CartLine extends DecoratedProduct {
  qty: number;
  lineTotalFmt: string;
}

export interface OrderInfo {
  no: string;
  totalFmt: string;
}

export interface Shortcut {
  label: string;
  icon: string;
  bg: string;
  categoryId?: string;
}

export interface User {
  name: string;
  email: string;
  phone: string;
  avatarInitial: string;
  isPlus: boolean;
}

export interface Address {
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

export type CardBrand = 'VISA' | 'MASTERCARD' | 'ELO' | 'AMEX' | 'UNKNOWN';

export interface PaymentMethod {
  id: string;
  brand: CardBrand;
  lastFour: string;
  expiry: string;
  holderName: string;
  label: string;
  isDefault: boolean;
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  photoUrls?: string[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export type CouponType = 'PERCENT' | 'FIXED';

export interface Coupon {
  code: string;
  description: string;
  type: CouponType;
  value: number;
  expiry: string;
}

export type NotificationType = 'ORDER' | 'PROMO' | 'SYSTEM';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  date: string;
  isRead: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  isAgent: boolean;
  time: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  deliveryEstimate: string;
  price: number;
  isExpress?: boolean;
}

export type OrderStatus =
  | 'CONFIRMED'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED';

export interface OrderStatusEntry {
  status: OrderStatus;
  date: string;
  location?: string;
}

export interface Order {
  id: string;
  productIds: { id: string; qty: number }[];
  total: number;
  status: OrderStatus;
  deliveryDate: string;
  addressId?: string;
  paymentMethodId?: string;
  subtotal: number;
  shipping: number;
  discount: number;
  trackingCode: string;
  statusHistory: OrderStatusEntry[];
}

export interface AppSettings {
  pushOrdersEnabled: boolean;
  pushPromoEnabled: boolean;
  emailPromoEnabled: boolean;
  darkTheme: boolean;
  language: string;
}

export interface SubscriptionInfo {
  isActive: boolean;
  planName: string;
  priceMonthly: number;
  renewalDate: string;
  benefits: string[];
}

export interface TrackingInfo {
  orderId: string;
  trackingCode: string;
  carrier: string;
  carrierUrl?: string;
  currentStatus: OrderStatus;
  estimatedDelivery: string;
  timeline: OrderStatusEntry[];
}

export interface ReturnInfo {
  returnId: string;
  orderId: string;
  status: string;
  productId: string;
  quantity: number;
  reason: string;
  description: string;
  createdAt: string;
  instructions: string;
}

export type StaticPageType = 'about' | 'terms' | 'privacy';

export function formatAddressLine1(a: Address): string {
  return `${a.street}, ${a.number}${a.complement ? ` — ${a.complement}` : ''}`;
}

export function formatAddressLine2(a: Address): string {
  const cep = i18n.t('cepLabel', { ns: 'address', zip: a.zipCode });
  return i18n.t('line2', {
    ns: 'address',
    neighborhood: a.neighborhood,
    city: a.city,
    state: a.state,
    cep,
  });
}

export function paymentDisplayName(pm: PaymentMethod): string {
  const brandKey =
    pm.brand === 'VISA'
      ? 'visa'
      : pm.brand === 'MASTERCARD'
        ? 'mastercard'
        : pm.brand === 'ELO'
          ? 'elo'
          : pm.brand === 'AMEX'
            ? 'amex'
            : 'unknown';
  const brand = i18n.t(`brands.${brandKey}`, { ns: 'payment' });
  return i18n.t('displayName', { ns: 'payment', brand, lastFour: pm.lastFour });
}
