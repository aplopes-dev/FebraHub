export interface ApiEnvelope<T> {
  data: T;
  meta?: ApiPageMeta;
  errors?: Array<{ code: string; message: string; field?: string | null }>;
}

export interface ApiProduct {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  originalPrice?: number | null;
  discountPercent?: number | null;
  rating: number;
  reviewCount: number;
  isFreeShipping: boolean;
  isExpress: boolean;
  category: string;
  categoryId: string;
  brand?: string;
  specs?: Record<string, string>;
}

export interface ApiCategory {
  id: string;
  name: string;
  icon: string;
  colorHex: string;
}

export interface ApiHomeSection {
  id: string;
  title: string;
  productIds: string[];
}

export interface ApiHomeData {
  sections: ApiHomeSection[];
  products: ApiProduct[];
}

export interface ApiUser {
  id?: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string | null;
  avatarInitial: string;
  isPlus: boolean;
  hasSeenOnboarding?: boolean;
}

export interface ApiAuthData {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  user: ApiUser;
}

export interface ApiCartItem {
  productId: string;
  quantity: number;
  product?: ApiProduct;
}

export interface ApiCart {
  items: ApiCartItem[];
  itemCount: number;
  subtotal: number;
}

export interface ApiFavoritesData {
  productIds: string[];
  products: ApiProduct[];
}

export interface ApiAddress {
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

export interface ApiFaqItem {
  question: string;
  answer: string;
}

export type ApiOrderStatus =
  | 'CONFIRMED'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED';

export type ApiCouponType = 'PERCENT' | 'FIXED';
export type ApiNotificationType = 'ORDER' | 'PROMO' | 'SYSTEM';
export type ApiCardBrand = 'VISA' | 'MASTERCARD' | 'ELO' | 'AMEX' | 'UNKNOWN';
export type ApiReturnReason =
  | 'DEFECT'
  | 'WRONG_ITEM'
  | 'REGRET_7_DAYS'
  | 'NOT_AS_EXPECTED'
  | 'OTHER';
export type ApiPaymentType = 'PIX' | 'CARD' | 'BOLETO';

export interface ApiOrderItem {
  productId: string;
  product?: ApiProduct;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ApiOrderStatusEntry {
  status: ApiOrderStatus;
  date: string;
  location?: string;
}

export interface ApiOrderPaymentMethod {
  type: ApiPaymentType;
  displayName: string;
  label?: string;
}

export interface ApiOrder {
  id: string;
  items: ApiOrderItem[];
  status: ApiOrderStatus;
  deliveryDate: string;
  address?: ApiAddress;
  paymentMethod?: ApiOrderPaymentMethod;
  subtotal: number;
  shipping: number;
  discount: number;
  pixDiscount?: number;
  total: number;
  trackingCode?: string | null;
  carrier?: string | null;
  statusHistory: ApiOrderStatusEntry[];
  createdAt?: string;
}

export interface ApiTrackingTimelineEntry {
  status: ApiOrderStatus;
  date: string;
  location?: string;
  description?: string;
}

export interface ApiTracking {
  orderId: string;
  trackingCode: string;
  carrier: string;
  carrierUrl?: string;
  currentStatus: ApiOrderStatus;
  estimatedDelivery: string;
  timeline: ApiTrackingTimelineEntry[];
  mapPlaceholderUrl?: string;
}

export interface ApiReturnDetail {
  returnId: string;
  orderId: string;
  status: string;
  item: { productId: string; quantity: number };
  reason: ApiReturnReason;
  description: string;
  createdAt: string;
  instructions?: string;
}

export interface ApiNotification {
  id: string;
  type: ApiNotificationType;
  title: string;
  body: string;
  date: string;
  isRead: boolean;
  deepLink?: string | null;
}

export interface ApiChatMessage {
  id: string;
  text: string;
  isAgent: boolean;
  time: string;
}

export interface ApiCoupon {
  code: string;
  description: string;
  type: ApiCouponType;
  value: number;
  expiry: string;
  isApplicable?: boolean;
  reason?: string | null;
}

export interface ApiPaymentMethod {
  id: string;
  brand: ApiCardBrand;
  lastFour: string;
  expiry: string;
  holderName: string;
  label: string;
  isDefault: boolean;
}

export interface ApiShippingOption {
  id: string;
  name: string;
  deliveryEstimate: string;
  price: number;
  isExpress?: boolean;
}

export interface ApiReview {
  id: string;
  productId: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  photoUrls?: string[];
}

export interface ApiSubscription {
  isActive: boolean;
  planName: string;
  priceMonthly: number;
  renewalDate: string;
  benefits: string[];
}

export interface ApiSettings {
  pushOrdersEnabled: boolean;
  pushPromoEnabled: boolean;
  emailPromoEnabled: boolean;
  darkTheme: boolean;
  language: string;
}

export interface ApiStaticPage {
  slug: string;
  title: string;
  content: string;
  updatedAt?: string;
}

export interface ApiBannerAction {
  type: string;
  query?: string;
}

export interface ApiBanner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  action?: ApiBannerAction;
}

export interface ApiFiltersSortOption {
  value: string;
  label: string;
}

export interface ApiFiltersFlag {
  key: string;
  label: string;
}

export interface ApiFiltersMetadata {
  brands: string[];
  priceRange: { min: number; max: number };
  sortOptions: ApiFiltersSortOption[];
  ratingOptions: number[];
  flags: ApiFiltersFlag[];
}

export interface ApiAppliedCoupon {
  code: string;
  type: ApiCouponType;
  value: number;
  discountAmount: number;
}

export interface ApiCheckoutSession {
  selectedAddressId?: string | null;
  shippingOptionId?: string | null;
  appliedCoupon?: ApiAppliedCoupon | null;
  paymentType?: ApiPaymentType;
  paymentMethodId?: string | null;
  boletoCpf?: string | null;
  canConfirm?: boolean;
}

export interface ApiCheckoutPreview {
  subtotal: number;
  shipping: number;
  couponDiscount: number;
  pixDiscount: number;
  total: number;
}

export interface ApiTicket {
  ticketId: string;
  status: string;
  subject?: string;
  message?: string;
  orderId?: string | null;
  createdAt?: string;
}

export interface ApiAddressInput {
  label: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  isDefault?: boolean;
}

export interface ApiCartItemInput {
  productId: string;
  quantity: number;
}

export interface ApiPaymentInput {
  type: ApiPaymentType;
  paymentMethodId?: string;
  cpf?: string;
}

export interface ApiPaymentResult {
  type: ApiPaymentType;
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
  paymentMethodId?: string | null;
  displayName?: string | null;
  authorizationCode?: string | null;
  pixQrCodeBase64?: string | null;
  pixCopyPaste?: string | null;
  barcode?: string | null;
  digitableLine?: string | null;
  dueDate?: string | null;
  pdfUrl?: string | null;
  expiresAt?: string | null;
}

export interface ApiCheckoutSessionData {
  cart: ApiCart;
  session: ApiCheckoutSession;
  preview: ApiCheckoutPreviewExtended;
}

export interface ApiReviewsListData {
  averageRating: number;
  totalCount: number;
  distribution: Record<string, number>;
  reviews: ApiReview[];
}

export interface ApiZipLookup {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface ApiPageMeta {
  page?: number;
  pageSize?: number;
  total?: number;
}

export interface ApiHealthResponse {
  status: string;
}

export interface ApiMockRootResponse {
  status: string;
  message: string;
  docs?: string;
}

export interface ApiCheckoutPreviewExtended extends ApiCheckoutPreview {
  pixDiscountPercent?: number;
  installmentOptions?: Array<{
    count: number;
    value: number;
    hasInterest: boolean;
  }>;
  canConfirm?: boolean;
  validationErrors?: string[];
}
