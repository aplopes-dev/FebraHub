import { apiFetch, clearAuthTokens, saveAccessToken, saveRefreshToken } from './http';
import type {
  ApiAddress,
  ApiAddressInput,
  ApiAppliedCoupon,
  ApiAuthData,
  ApiBanner,
  ApiCart,
  ApiCartItemInput,
  ApiCategory,
  ApiChatMessage,
  ApiCheckoutPreviewExtended,
  ApiCheckoutSession,
  ApiCheckoutSessionData,
  ApiCoupon,
  ApiEnvelope,
  ApiFaqItem,
  ApiFavoritesData,
  ApiFiltersMetadata,
  ApiHealthResponse,
  ApiHomeData,
  ApiMockRootResponse,
  ApiNotification,
  ApiOrder,
  ApiPaymentInput,
  ApiPaymentMethod,
  ApiPaymentResult,
  ApiProduct,
  ApiReturnDetail,
  ApiReview,
  ApiReviewsListData,
  ApiSettings,
  ApiShippingOption,
  ApiStaticPage,
  ApiSubscription,
  ApiTicket,
  ApiTracking,
  ApiUser,
  ApiZipLookup,
} from './types';

/**
 * Desembrulha o envelope `{ data }` padrão. Use nos endpoints que só precisam
 * do payload; os que precisam de `meta` (paginação) chamam `apiFetch` direto.
 */
async function unwrap<T>(path: string, init?: RequestInit, auth = true): Promise<T> {
  const res = await apiFetch<ApiEnvelope<T>>(path, init, auth);
  return res.data;
}

export const cityboxApi = {
  // ── Infra ──────────────────────────────────────────────────────────────

  getRoot() {
    return unwrap<ApiMockRootResponse>('/', {}, false);
  },

  getHealth() {
    return unwrap<ApiHealthResponse>('/health', {}, false);
  },

  // ── Auth & onboarding ──────────────────────────────────────────────────

  async login(account: string, password: string) {
    const data = await unwrap<ApiAuthData>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ account, password, hasSeenOnboarding: true }),
      },
      false,
    );
    saveAccessToken(data.accessToken);
    if (data.refreshToken) saveRefreshToken(data.refreshToken);
    return data;
  },

  async register(body: { name: string; email: string; phone: string; password: string }) {
    const data = await unwrap<ApiAuthData>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify(body) },
      false,
    );
    saveAccessToken(data.accessToken);
    if (data.refreshToken) saveRefreshToken(data.refreshToken);
    return data;
  },

  async loginGoogle() {
    const data = await unwrap<ApiAuthData>(
      '/auth/google',
      { method: 'POST', body: JSON.stringify({ idToken: 'mock-google' }) },
      false,
    );
    saveAccessToken(data.accessToken);
    if (data.refreshToken) saveRefreshToken(data.refreshToken);
    return data;
  },

  async logout() {
    try {
      await apiFetch<void>('/auth/logout', { method: 'POST', body: '{}' });
    } finally {
      clearAuthTokens();
    }
  },

  getSession() {
    return unwrap<{ user: ApiUser; accessToken?: string; isAuthenticated?: boolean }>(
      '/auth/session',
    );
  },

  forgotPassword(email: string) {
    return unwrap<{ message: string; sent: boolean }>(
      '/auth/forgot-password',
      { method: 'POST', body: JSON.stringify({ email }) },
      false,
    );
  },

  resetPassword(body: { token: string; password: string; confirmPassword: string }) {
    return unwrap<{ message: string }>(
      '/auth/reset-password',
      { method: 'POST', body: JSON.stringify(body) },
      false,
    );
  },

  refreshToken(refreshToken: string) {
    return unwrap<{ accessToken: string; expiresIn?: number }>(
      '/auth/refresh',
      { method: 'POST', body: JSON.stringify({ refreshToken }) },
      false,
    );
  },

  onboardingPreLogin(deviceId: string, hasSeenOnboarding: boolean) {
    return unwrap<{ hasSeenOnboarding: boolean }>(
      '/auth/onboarding',
      { method: 'POST', body: JSON.stringify({ deviceId, hasSeenOnboarding }) },
      false,
    );
  },

  onboardingPostLogin(hasSeenOnboarding: boolean) {
    return unwrap<{ hasSeenOnboarding: boolean }>('/me/onboarding', {
      method: 'PATCH',
      body: JSON.stringify({ hasSeenOnboarding }),
    });
  },

  // ── Perfil & conta ─────────────────────────────────────────────────────

  async getMe() {
    const { user } = await unwrap<{ user: ApiUser }>('/me');
    return user;
  },

  async updateMe(body: Partial<Pick<ApiUser, 'name' | 'email' | 'phone'>>) {
    const { user } = await unwrap<{ user: ApiUser }>('/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return user;
  },

  async deleteAccount(password: string, confirmation: string) {
    await apiFetch<void>('/me', {
      method: 'DELETE',
      body: JSON.stringify({ password, confirmation }),
    });
  },

  uploadAvatar(file: File | Blob) {
    const form = new FormData();
    form.append('file', file);
    return unwrap<{ avatarUrl: string }>('/me/avatar', { method: 'POST', body: form });
  },

  getSettings() {
    return unwrap<ApiSettings>('/me/settings');
  },

  updateSettings(body: Partial<ApiSettings>) {
    return unwrap<ApiSettings>('/me/settings', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  getSubscription() {
    return unwrap<ApiSubscription>('/me/subscription');
  },

  cancelSubscription(body?: { reason?: string; feedback?: string }) {
    return unwrap<{ isActive: boolean; cancelledAt?: string; accessUntil?: string }>(
      '/me/subscription/cancel',
      { method: 'POST', body: JSON.stringify(body ?? {}) },
    );
  },

  // ── Endereços ──────────────────────────────────────────────────────────

  async listAddresses() {
    const { addresses } = await unwrap<{ addresses: ApiAddress[] }>('/me/addresses');
    return addresses ?? [];
  },

  async createAddress(body: ApiAddressInput) {
    const { address } = await unwrap<{ address: ApiAddress }>('/me/addresses', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return address;
  },

  async updateAddress(addressId: string, body: ApiAddressInput) {
    const { address } = await unwrap<{ address: ApiAddress }>(
      `/me/addresses/${encodeURIComponent(addressId)}`,
      { method: 'PUT', body: JSON.stringify(body) },
    );
    return address;
  },

  async deleteAddress(addressId: string) {
    await apiFetch<void>(`/me/addresses/${encodeURIComponent(addressId)}`, {
      method: 'DELETE',
    });
  },

  async setDefaultAddress(addressId: string) {
    const { address } = await unwrap<{ address: ApiAddress }>(
      `/me/addresses/${encodeURIComponent(addressId)}/default`,
      { method: 'PATCH' },
    );
    return address;
  },

  lookupZip(zipCode: string) {
    return unwrap<ApiZipLookup>(`/addresses/zip/${encodeURIComponent(zipCode)}`, {}, false);
  },

  // ── Pagamentos (cartões) ───────────────────────────────────────────────

  async listPaymentMethods() {
    const { paymentMethods } = await unwrap<{ paymentMethods: ApiPaymentMethod[] }>(
      '/me/payment-methods',
    );
    return paymentMethods ?? [];
  },

  async createPaymentMethod(body: {
    number: string;
    holderName: string;
    expiry: string;
    cvv: string;
    label?: string;
    isDefault?: boolean;
  }) {
    const { paymentMethod } = await unwrap<{ paymentMethod: ApiPaymentMethod }>(
      '/me/payment-methods',
      { method: 'POST', body: JSON.stringify(body) },
    );
    return paymentMethod;
  },

  async deletePaymentMethod(paymentMethodId: string) {
    await apiFetch<void>(`/me/payment-methods/${encodeURIComponent(paymentMethodId)}`, {
      method: 'DELETE',
    });
  },

  setDefaultPaymentMethod(paymentMethodId: string) {
    return unwrap<{ paymentMethod: ApiPaymentMethod; paymentMethods: ApiPaymentMethod[] }>(
      `/me/payment-methods/${encodeURIComponent(paymentMethodId)}/default`,
      { method: 'PATCH' },
    );
  },

  // ── Catálogo & descoberta ──────────────────────────────────────────────

  getHome() {
    return unwrap<ApiHomeData>('/catalog/home', {}, false);
  },

  async listCategories() {
    const { categories } = await unwrap<{ categories: ApiCategory[] }>(
      '/catalog/categories',
      {},
      false,
    );
    return categories ?? [];
  },

  async getCategoryProducts(categoryId: string, params?: { page?: number; pageSize?: number }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
    const query = qs.toString();
    const res = await apiFetch<ApiEnvelope<{ category: ApiCategory; products: ApiProduct[] }>>(
      `/catalog/categories/${encodeURIComponent(categoryId)}/products${query ? `?${query}` : ''}`,
      {},
      false,
    );
    return {
      category: res.data.category,
      products: res.data.products ?? [],
      meta: res.meta,
    };
  },

  async searchProducts(params: {
    q?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    freeShipping?: boolean;
    express?: boolean;
    brand?: string;
    sortBy?: string;
    page?: number;
    pageSize?: number;
  }) {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.minPrice != null) qs.set('minPrice', String(params.minPrice));
    if (params.maxPrice != null) qs.set('maxPrice', String(params.maxPrice));
    if (params.minRating != null) qs.set('minRating', String(params.minRating));
    if (params.freeShipping) qs.set('freeShipping', 'true');
    if (params.express) qs.set('express', 'true');
    if (params.brand) qs.set('brand', params.brand);
    if (params.sortBy) qs.set('sortBy', params.sortBy);
    if (params.page) qs.set('page', String(params.page));
    if (params.pageSize) qs.set('pageSize', String(params.pageSize));
    const { products } = await unwrap<{ products: ApiProduct[] }>(
      `/catalog/search?${qs}`,
      {},
      false,
    );
    return products ?? [];
  },

  async getProduct(productId: string) {
    const { product } = await unwrap<{ product: ApiProduct }>(
      `/catalog/products/${encodeURIComponent(productId)}`,
      {},
      false,
    );
    return product;
  },

  getFiltersMetadata() {
    return unwrap<ApiFiltersMetadata>('/catalog/filters/metadata', {}, false);
  },

  searchSuggestions(q?: string) {
    const qs = q ? `?q=${encodeURIComponent(q)}` : '';
    return unwrap<{ suggestions: string[]; brands: string[] }>(
      `/catalog/search/suggestions${qs}`,
      {},
      false,
    );
  },

  async getReviews(productId: string, params?: { page?: number; pageSize?: number }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
    const query = qs.toString();
    const res = await apiFetch<ApiEnvelope<ApiReviewsListData>>(
      `/catalog/products/${encodeURIComponent(productId)}/reviews${query ? `?${query}` : ''}`,
      {},
      false,
    );
    return { ...res.data, meta: res.meta };
  },

  async createReview(
    productId: string,
    body: { rating: number; text: string; orderId?: string | null; photoUrls?: string[] },
  ) {
    const { review } = await unwrap<{ review: ApiReview }>(
      `/catalog/products/${encodeURIComponent(productId)}/reviews`,
      { method: 'POST', body: JSON.stringify(body) },
    );
    return review;
  },

  addReviewPhoto(productId: string, reviewId: string, file: File | Blob) {
    const form = new FormData();
    form.append('file', file);
    return unwrap<{ photoUrl: string; review: ApiReview }>(
      `/catalog/products/${encodeURIComponent(productId)}/reviews/${encodeURIComponent(reviewId)}/photos`,
      { method: 'POST', body: form },
    );
  },

  async getSearchHistory() {
    const { queries } = await unwrap<{ queries: string[] }>('/me/search-history');
    return queries ?? [];
  },

  async addSearchHistory(query: string) {
    const { queries } = await unwrap<{ queries: string[] }>('/me/search-history', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
    return queries ?? [];
  },

  async clearSearchHistory() {
    await apiFetch<void>('/me/search-history', { method: 'DELETE' });
  },

  // ── Favoritos ──────────────────────────────────────────────────────────

  listFavorites() {
    return unwrap<ApiFavoritesData>('/me/favorites');
  },

  async toggleFavorite(productId: string, isFavorite: boolean) {
    await apiFetch<void>(`/me/favorites/${encodeURIComponent(productId)}`, {
      method: 'PUT',
      body: JSON.stringify({ isFavorite }),
    });
  },

  // ── Carrinho ───────────────────────────────────────────────────────────

  getCart() {
    return unwrap<ApiCart>('/me/cart');
  },

  async clearCart() {
    await apiFetch<void>('/me/cart', { method: 'DELETE' });
  },

  addCartItem(productId: string, quantity = 1) {
    return unwrap<ApiCart>('/me/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  },

  updateCartItem(productId: string, quantity: number) {
    return unwrap<ApiCart>(`/me/cart/items/${encodeURIComponent(productId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  },

  removeCartItem(productId: string) {
    return unwrap<ApiCart>(`/me/cart/items/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
    });
  },

  applyCartCoupon(code: string) {
    return unwrap<{
      appliedCoupon: ApiAppliedCoupon;
      cart: ApiCart;
      preview: ApiCheckoutPreviewExtended;
    }>('/me/cart/coupon', { method: 'POST', body: JSON.stringify({ code }) });
  },

  // ── Checkout ───────────────────────────────────────────────────────────

  getCheckoutSession() {
    return unwrap<ApiCheckoutSessionData>('/checkout/session');
  },

  updateCheckoutSession(body: Partial<ApiCheckoutSession>) {
    return unwrap<ApiCheckoutSessionData>('/checkout/session', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  getShippingOptions(body: { addressId: string; items: ApiCartItemInput[] }) {
    return unwrap<{ options: ApiShippingOption[]; freeShippingMessage?: string | null }>(
      '/checkout/shipping-options',
      { method: 'POST', body: JSON.stringify(body) },
    );
  },

  async listCoupons() {
    const { coupons } = await unwrap<{ coupons: ApiCoupon[] }>('/me/coupons');
    return coupons ?? [];
  },

  validateCoupon(body: { code: string; subtotal: number; items?: ApiCartItemInput[] }) {
    return unwrap<{ coupon: ApiCoupon; discountAmount: number; isValid: boolean }>(
      '/checkout/coupons/validate',
      { method: 'POST', body: JSON.stringify(body) },
    );
  },

  removeCoupon() {
    return unwrap<{ appliedCoupon: ApiAppliedCoupon | null; preview: ApiCheckoutPreviewExtended }>(
      '/checkout/coupons',
      { method: 'DELETE' },
    );
  },

  checkoutPreview(body: {
    addressId?: string;
    shippingOptionId?: string;
    couponCode?: string | null;
    paymentType?: ApiCheckoutSession['paymentType'];
    items?: ApiCartItemInput[];
  }) {
    return unwrap<ApiCheckoutPreviewExtended>('/checkout/preview', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  createOrder(
    body: {
      addressId?: string;
      shippingOptionId?: string;
      couponCode?: string | null;
      payment: ApiPaymentInput;
      items?: ApiCartItemInput[];
      buyNow?: boolean;
    },
    idempotencyKey: string,
  ) {
    return unwrap<{ order: ApiOrder; payment: ApiPaymentResult }>('/checkout/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(body),
    });
  },

  // ── Pedidos & pós-compra ───────────────────────────────────────────────

  async listOrders(params?: { page?: number; pageSize?: number; status?: string }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
    if (params?.status) qs.set('status', params.status);
    const query = qs.toString();
    const res = await apiFetch<ApiEnvelope<{ orders: ApiOrder[] }>>(
      `/me/orders${query ? `?${query}` : ''}`,
    );
    return { orders: res.data.orders ?? [], meta: res.meta };
  },

  async getOrder(orderId: string, ifNoneMatch?: string) {
    const headers: Record<string, string> = {};
    if (ifNoneMatch) headers['If-None-Match'] = ifNoneMatch;
    const { order } = await unwrap<{ order: ApiOrder }>(
      `/me/orders/${encodeURIComponent(orderId)}`,
      { headers },
    );
    return order;
  },

  getTracking(orderId: string) {
    return unwrap<ApiTracking>(`/me/orders/${encodeURIComponent(orderId)}/tracking`);
  },

  async buyAgain(orderId: string) {
    const { cart } = await unwrap<{ cart: ApiCart }>(
      `/me/orders/${encodeURIComponent(orderId)}/buy-again`,
      { method: 'POST', body: '{}' },
    );
    return cart;
  },

  getInvoice(orderId: string) {
    return unwrap<{ invoiceUrl: string; nfKey?: string; issuedAt?: string }>(
      `/me/orders/${encodeURIComponent(orderId)}/invoice`,
    );
  },

  async cancelOrder(orderId: string, body: { reason: string; description?: string }) {
    const { order } = await unwrap<{ order: ApiOrder }>(
      `/me/orders/${encodeURIComponent(orderId)}/cancel`,
      { method: 'POST', body: JSON.stringify(body) },
    );
    return order;
  },

  createReturn(
    orderId: string,
    body: { item: ApiCartItemInput; reason: ApiReturnDetail['reason']; description?: string },
  ) {
    return unwrap<{ returnId: string; status: string; message?: string }>(
      `/me/orders/${encodeURIComponent(orderId)}/returns`,
      { method: 'POST', body: JSON.stringify(body) },
    );
  },

  getReturn(orderId: string, returnId: string) {
    return unwrap<ApiReturnDetail>(
      `/me/orders/${encodeURIComponent(orderId)}/returns/${encodeURIComponent(returnId)}`,
    );
  },

  // ── Engajamento ────────────────────────────────────────────────────────

  async getFaq() {
    const { topics } = await unwrap<{ topics: ApiFaqItem[] }>('/support/faq', {}, false);
    return topics ?? [];
  },

  async listNotifications(params?: { page?: number; pageSize?: number; unreadOnly?: boolean }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
    if (params?.unreadOnly) qs.set('unreadOnly', 'true');
    const query = qs.toString();
    const res = await apiFetch<
      ApiEnvelope<{ notifications: ApiNotification[]; unreadCount: number }>
    >(`/me/notifications${query ? `?${query}` : ''}`);
    return {
      notifications: res.data.notifications ?? [],
      unreadCount: res.data.unreadCount ?? 0,
      meta: res.meta,
    };
  },

  markNotificationRead(notificationId: string) {
    return unwrap<{ notification: ApiNotification; unreadCount: number }>(
      `/me/notifications/${encodeURIComponent(notificationId)}/read`,
      { method: 'PATCH' },
    );
  },

  markAllNotificationsRead() {
    return unwrap<{ unreadCount: number }>('/me/notifications/read-all', {
      method: 'POST',
      body: '{}',
    });
  },

  async getChatMessages(params?: { before?: string; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.before) qs.set('before', params.before);
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    const { messages } = await unwrap<{ messages: ApiChatMessage[] }>(
      `/me/support/chat/messages${query ? `?${query}` : ''}`,
    );
    return messages ?? [];
  },

  sendChatMessage(text: string) {
    return unwrap<{ userMessage: ApiChatMessage; agentMessage: ApiChatMessage }>(
      '/me/support/chat/messages',
      { method: 'POST', body: JSON.stringify({ text }) },
    );
  },

  async listTickets(params?: { page?: number; pageSize?: number }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
    const query = qs.toString() ? `?${qs}` : '';
    const { tickets } = await unwrap<{ tickets: ApiTicket[] }>(`/me/support/tickets${query}`);
    return tickets ?? [];
  },

  createTicket(body: { subject: string; message: string; orderId?: string }) {
    return unwrap<{ ticketId: string; status: string }>('/me/support/tickets', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // ── Conteúdo ───────────────────────────────────────────────────────────

  getStaticPage(slug: string) {
    return unwrap<ApiStaticPage>(`/content/pages/${encodeURIComponent(slug)}`, {}, false);
  },

  async getBanners() {
    const { banners } = await unwrap<{ banners: ApiBanner[] }>('/content/banners', {}, false);
    return banners ?? [];
  },
};
