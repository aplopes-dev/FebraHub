import i18n, { tKey } from '@/i18n';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Context,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { cityboxApi } from '@/api/citybox-api';
import { ApiError, clearAuthTokens, loadAccessToken } from '@/api/http';
import {
  mapAddress,
  mapCartToRecord,
  mapCategory,
  mapChatMessage,
  mapCoupon,
  mapFaqItem,
  mapNotification,
  mapOrder,
  mapPaymentMethod,
  mapProduct,
  mapReview,
  mapShippingOption,
  mapUser,
} from '@/api/mappers';
import { SEED_AUTH_USER, SEED_CATEGORIES, SEED_HOME } from '@/api/seed/catalog';
import type { ApiAddressInput, ApiAppliedCoupon, ApiHomeSection, ApiPaymentType } from '@/api/types';
import type {
  Address,
  AppNotification,
  CartLine,
  Category,
  ChatMessage,
  Coupon,
  DecoratedProduct,
  FaqItem,
  Order,
  OrderInfo,
  PayMethod,
  PaymentMethod,
  Product,
  Review,
  ShippingOption,
  User,
} from '../types';
import { brlFull, intFmt } from '../utils/format';
import { routes } from '@/lib/routes';
import { favoritesStore } from '@/state/favorites-store';
import {
  DEFAULT_SEARCH_FILTERS,
  filterAndSortProducts,
  type SearchFilters,
} from '../utils/search';

/**
 * O estado global é dividido em fatias por domínio. Cada fatia tem seu próprio
 * Context memoizado, então um consumidor só re-renderiza quando a SUA fatia muda
 * (ex.: trocar de aba não re-renderiza quem só lê o carrinho). A orquestração
 * (login carrega tudo, checkout, etc.) continua centralizada no `AppProvider`.
 */
export interface UIContextValue {
  query: string;
  setQuery: (q: string) => void;
  /** Termo aplicado na listagem de busca (persiste após limpar o input). */
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  fFree: boolean;
  fFull: boolean;
  toggleFree: () => void;
  toggleFull: () => void;
  searchFilters: SearchFilters;
  setSearchFilters: (filters: SearchFilters) => void;
  resetSearchFilters: () => void;
  drawerOpen: boolean;
  filtersOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  openFilters: () => void;
  closeFilters: () => void;
  doSearch: (e?: React.FormEvent) => void;
  searchHistory: string[];
  addSearchHistory: (term: string) => void;
  clearSearchHistory: () => void;
}

export interface AuthContextValue {
  user: User;
  isLoggedIn: boolean;
  login: (account: string, password: string) => Promise<string | null>;
  loginWithGoogle: () => Promise<string | null>;
  register: (
    name: string,
    email: string,
    phone: string,
    password: string,
    confirm: string,
  ) => Promise<string | null>;
  logout: () => void;
  updateProfile: (name: string, email: string, phone: string) => void;
  hasSeenOnboarding: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export interface CatalogContextValue {
  products: Product[];
  categories: Category[];
  homeSections: ApiHomeSection[];
  offerProducts: DecoratedProduct[];
  bestSellerProducts: DecoratedProduct[];
  apiReady: boolean;
  apiError: string | null;
  faqItems: FaqItem[];
  decorate: (p: Product) => DecoratedProduct;
  getProduct: (id: string) => DecoratedProduct;
  openProduct: (id: string) => void;
  searchList: DecoratedProduct[];
  averageRating: (productId: string) => number;
  reviews: Record<string, Review[]>;
  addReview: (review: Review, synced?: boolean) => void;
}

export interface CartContextValue {
  cart: Record<string, number>;
  cartCount: number;
  cartTotal: number;
  cartLines: CartLine[];
  addToCart: (id: string) => void;
  changeQty: (id: string, delta: number) => void;
  removeLine: (id: string) => void;
  buyNow: (id: string) => void;
  addCurrentToCart: (id: string) => void;
  buyAgainOrder: (orderId: string) => Promise<void>;
}

export interface CheckoutContextValue {
  addresses: Address[];
  selectedAddress: Address | null;
  addAddress: (address: Address) => void;
  editAddress: (address: Address) => void;
  removeAddress: (id: string) => void;
  selectAddress: (id: string) => void;
  paymentMethods: PaymentMethod[];
  selectedPayment: PaymentMethod | null;
  addPaymentMethod: (pm: PaymentMethod) => void;
  removePaymentMethod: (id: string) => void;
  selectPayment: (id: string) => void;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => string | null;
  removeCoupon: () => void;
  coupons: Coupon[];
  selectedShipping: ShippingOption;
  setSelectedShipping: (opt: ShippingOption) => void;
  shippingOptions: ShippingOption[];
  pay: PayMethod;
  setPay: (p: PayMethod) => void;
  boletoCpf: string;
  setBoletoCpf: (cpf: string) => void;
  placeOrder: () => void;
  order: OrderInfo | null;
}

export interface OrdersContextValue {
  orders: Order[];
  advanceOrderStatus: () => void;
}

export interface EngagementContextValue {
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  chatMessages: ChatMessage[];
  sendChatMessage: (text: string) => void;
}

/** União de todas as fatias (referência da superfície completa do estado). */
export type AppContextValue = UIContextValue &
  AuthContextValue &
  CatalogContextValue &
  CartContextValue &
  CheckoutContextValue &
  OrdersContextValue &
  EngagementContextValue;

const UIContext = createContext<UIContextValue | null>(null);
const AuthContext = createContext<AuthContextValue | null>(null);
const CatalogContext = createContext<CatalogContextValue | null>(null);
const CartContext = createContext<CartContextValue | null>(null);
const CheckoutContext = createContext<CheckoutContextValue | null>(null);
const OrdersContext = createContext<OrdersContextValue | null>(null);
const EngagementContext = createContext<EngagementContextValue | null>(null);

const ONBOARDING_STORAGE_KEY = 'citybox.hasSeenOnboarding';

const DEFAULT_SHIPPING: ShippingOption = {
  id: 'standard',
  name: i18n.t('shipping.defaultName', { ns: 'checkout' }),
  deliveryEstimate: i18n.t('shipping.defaultEstimate', { ns: 'checkout' }),
  price: 0,
};

/** Produto-fallback estável para `getProduct` antes do catálogo carregar. */
const FALLBACK_PRODUCT: Product = mapProduct(SEED_HOME.products[0]);

function readOnboardingFlag(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function addressToInput(address: Address): ApiAddressInput {
  return {
    label: address.label,
    zipCode: address.zipCode,
    street: address.street,
    number: address.number,
    complement: address.complement,
    neighborhood: address.neighborhood,
    city: address.city,
    state: address.state,
    isDefault: address.isDefault,
  };
}

function appliedCouponToCoupon(c: ApiAppliedCoupon): Coupon {
  return {
    code: c.code,
    description: c.code,
    type: c.type,
    value: c.value,
    expiry: '',
  };
}

function payMethodToApiType(pay: PayMethod): ApiPaymentType {
  if (pay === 'pix') return 'PIX';
  if (pay === 'card') return 'CARD';
  return 'BOLETO';
}

function decorateProduct(p: Product): DecoratedProduct {
  const parts = brlFull(p.amount).split(',');
  const r = Math.round(p.rating);
  return {
    ...p,
    priceInt: parts[0],
    priceCents: parts[1],
    originalFmt: `R$ ${intFmt(p.original)}`,
    discountFmt: i18n.t('pricing.percentOff', { ns: 'common', percent: p.discount }),
    reviewsFmt: `(${intFmt(p.reviews)})`,
    ratingFmt: p.rating.toFixed(1),
    starsFull: '★'.repeat(r),
    starsEmpty: '☆'.repeat(5 - r),
  };
}

function computeTotal(cart: Record<string, number>, products: Product[]): number {
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = products.find((x) => x.id === id);
    return sum + (p ? p.amount * qty : 0);
  }, 0);
}

function productsForSection(sectionId: string, sections: ApiHomeSection[], products: Product[]): Product[] {
  const section = sections.find((s) => s.id === sectionId);
  if (!section) return products;
  return section.productIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => !!p);
}

function cartItemsFromRecord(cart: Record<string, number>) {
  return Object.entries(cart).map(([productId, quantity]) => ({ productId, quantity }));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const loadedReviewsRef = useRef(new Set<string>());
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [homeSections, setHomeSections] = useState<ApiHomeSection[]>(SEED_HOME.sections);
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [apiReady, setApiReady] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [pay, setPay] = useState<PayMethod>('pix');
  const [fFree, setFFree] = useState(false);
  const [fFull, setFFull] = useState(false);
  const [searchFilters, setSearchFiltersState] = useState<SearchFilters>(DEFAULT_SEARCH_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [user, setUser] = useState<User>(() => mapUser(SEED_AUTH_USER));
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [reviews, setReviews] = useState<Record<string, Review[]>>({});
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption>(DEFAULT_SHIPPING);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(readOnboardingFlag);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [boletoCpf, setBoletoCpf] = useState('');

  // Espelho do estado mais recente para callbacks ESTÁVEIS: os handlers leem
  // `latest.current.*` em vez de fechar sobre o estado. Assim sua identidade
  // nunca muda e uma fatia não invalida a outra (ex.: mexer no carrinho não
  // re-renderiza os consumidores de checkout via identidade de `placeOrder`).
  const latest = useRef({
    isLoggedIn, cart, coupons, addresses, paymentMethods, orders, user,
    query, appliedCoupon, selectedAddress, selectedPayment, selectedShipping, pay, boletoCpf,
  });
  latest.current = {
    isLoggedIn, cart, coupons, addresses, paymentMethods, orders, user,
    query, appliedCoupon, selectedAddress, selectedPayment, selectedShipping, pay, boletoCpf,
  };

  const loadShippingOptions = useCallback(
    async (addressId: string, items: { productId: string; quantity: number }[], sessionShippingId?: string | null) => {
      const shipRes = await cityboxApi.getShippingOptions({ addressId, items });
      const opts = shipRes.options.map(mapShippingOption);
      if (opts.length === 0) return;
      setShippingOptions(opts);
      setSelectedShipping((prev) => opts.find((o) => o.id === sessionShippingId) ?? opts.find((o) => o.id === prev.id) ?? opts[0]);
    },
    [],
  );

  const syncAuthenticatedState = useCallback(async () => {
    const [
      cartRes,
      favRes,
      addrRes,
      meRes,
      ordersRes,
      notifRes,
      pmRes,
      couponsRes,
      chatRes,
      historyRes,
      sessionRes,
      subRes,
    ] = await Promise.all([
      cityboxApi.getCart().catch(() => null),
      cityboxApi.listFavorites().catch(() => null),
      cityboxApi.listAddresses().catch(() => []),
      cityboxApi.getMe().catch(() => null),
      cityboxApi.listOrders().catch(() => ({ orders: [] as Awaited<ReturnType<typeof cityboxApi.listOrders>>['orders'] })),
      cityboxApi.listNotifications().catch(() => ({ notifications: [], unreadCount: 0 })),
      cityboxApi.listPaymentMethods().catch(() => []),
      cityboxApi.listCoupons().catch(() => []),
      cityboxApi.getChatMessages().catch(() => []),
      cityboxApi.getSearchHistory().catch(() => []),
      cityboxApi.getCheckoutSession().catch(() => null),
      cityboxApi.getSubscription().catch(() => null),
    ]);

    if (meRes) {
      setUser(mapUser(meRes));
    } else if (subRes) {
      setUser((prev) => ({ ...prev, isPlus: subRes.isActive }));
    }

    if (cartRes) {
      setCart(mapCartToRecord(cartRes));
    }

    if (favRes) {
      favoritesStore.setAll(favRes.productIds ?? []);
    }

    let defaultAddr: Address | null = null;
    if (addrRes.length > 0) {
      const mapped = addrRes.map(mapAddress);
      setAddresses(mapped);
      defaultAddr = mapped.find((a) => a.isDefault) ?? mapped[0] ?? null;
      setSelectedAddress(defaultAddr);
    }

    if (ordersRes.orders.length > 0) {
      setOrders(ordersRes.orders.map(mapOrder));
    }

    if (notifRes.notifications.length > 0) {
      setNotifications(notifRes.notifications.map(mapNotification));
    }

    if (pmRes.length > 0) {
      const mapped = pmRes.map(mapPaymentMethod);
      setPaymentMethods(mapped);
      setSelectedPayment(mapped.find((p) => p.isDefault) ?? mapped[0] ?? null);
    }

    if (couponsRes.length > 0) {
      setCoupons(couponsRes.map(mapCoupon));
    }

    if (chatRes.length > 0) {
      setChatMessages(chatRes.map(mapChatMessage));
    }

    if (historyRes.length > 0) {
      setSearchHistory(historyRes);
    }

    if (sessionRes?.session.appliedCoupon) {
      setAppliedCoupon(appliedCouponToCoupon(sessionRes.session.appliedCoupon));
    }

    const cartItems =
      cartRes?.items?.map((item) => ({ productId: item.productId, quantity: item.quantity })) ?? [];
    if (defaultAddr && cartItems.length > 0) {
      await loadShippingOptions(defaultAddr.id, cartItems, sessionRes?.session.shippingOptionId).catch(() => undefined);
    }
  }, [loadShippingOptions]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        if (loadAccessToken()) {
          try {
            const session = await cityboxApi.getSession();
            if (!cancelled && session.user) {
              setUser(mapUser(session.user));
              setIsLoggedIn(true);
            }
          } catch {
            clearAuthTokens();
          }
        }

        const [home, cats, faq] = await Promise.all([
          cityboxApi.getHome(),
          cityboxApi.listCategories(),
          cityboxApi.getFaq(),
        ]);

        if (cancelled) return;

        setProducts(home.products.map(mapProduct));
        setHomeSections(home.sections);
        setCategories(cats.map(mapCategory));
        setFaqItems(faq.map(mapFaqItem));

        if (loadAccessToken()) {
          await syncAuthenticatedState();
        }
      } catch {
        if (!cancelled) {
          setProducts(SEED_HOME.products.map(mapProduct));
          setHomeSections(SEED_HOME.sections);
          setCategories(SEED_CATEGORIES.map(mapCategory));
          setApiError('errors.loadData');
        }
      } finally {
        if (!cancelled) setApiReady(true);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [syncAuthenticatedState]);

  useEffect(() => {
    if (!isLoggedIn || !selectedAddress) return;
    const items = cartItemsFromRecord(cart);
    if (items.length === 0) return;
    void loadShippingOptions(selectedAddress.id, items).catch(() => undefined);
  }, [cart, isLoggedIn, loadShippingOptions, selectedAddress]);

  const toTop = useCallback(() => {
    window.scrollTo(0, 0);
  }, []);

  const decorate = useCallback((p: Product) => decorateProduct(p), []);

  const cartCount = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);
  const cartTotal = useMemo(() => computeTotal(cart, products), [cart, products]);

  const offerProducts = useMemo(() => {
    const list = productsForSection('daily-deals', homeSections, products);
    return (list.length ? list : products.slice(0, 4)).map(decorate);
  }, [homeSections, products, decorate]);

  const bestSellerProducts = useMemo(() => {
    const list = productsForSection('best-sellers', homeSections, products);
    return (list.length ? list : [...products].reverse().slice(0, 4)).map(decorate);
  }, [homeSections, products, decorate]);

  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const p = products.find((x) => x.id === id);
          if (!p) return null;
          const d = decorate(p);
          return { ...d, qty, lineTotalFmt: `R$ ${brlFull(p.amount * qty)}` };
        })
        .filter((line): line is CartLine => line != null),
    [cart, products, decorate],
  );

  const searchList = useMemo(() => {
    const filtered = filterAndSortProducts(products, searchQuery, searchFilters);
    const legacyFiltered = filtered.filter((p) => {
      if (fFull && !p.full) return false;
      if (fFree && p.amount < 99) return false;
      return true;
    });
    return legacyFiltered.map(decorate);
  }, [products, searchQuery, searchFilters, fFull, fFree, decorate]);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const updateProfile = useCallback((name: string, email: string, phone: string) => {
    const prev = latest.current.user;
    const next: User = {
      ...prev,
      name,
      email,
      phone,
      avatarInitial: name.charAt(0).toUpperCase() || prev.avatarInitial,
    };
    setUser(next);
    if (latest.current.isLoggedIn) {
      void cityboxApi.updateMe({ name, email, phone }).catch(() => setUser(prev));
    }
  }, []);

  const addAddress = useCallback(
    (address: Address) => {
      setAddresses((prev) => {
        const list = address.isDefault ? prev.map((a) => ({ ...a, isDefault: false })) : [...prev];
        return [...list, address];
      });
      if (address.isDefault) setSelectedAddress(address);

      if (latest.current.isLoggedIn) {
        void cityboxApi
          .createAddress(addressToInput(address))
          .then((created) => {
            const mapped = mapAddress(created);
            setAddresses((prev) => prev.map((a) => (a.id === address.id ? mapped : a)));
            if (address.isDefault) setSelectedAddress(mapped);
          })
          .catch(() => {
            setAddresses((prev) => prev.filter((a) => a.id !== address.id));
            setSelectedAddress((prev) => (prev?.id === address.id ? null : prev));
          });
      }
    },
    [],
  );

  const editAddress = useCallback(
    (address: Address) => {
      setAddresses((prev) => {
        let list = [...prev];
        if (address.isDefault) list = list.map((a) => ({ ...a, isDefault: false }));
        const idx = list.findIndex((a) => a.id === address.id);
        if (idx >= 0) list[idx] = address;
        return list;
      });
      if (address.isDefault) setSelectedAddress(address);

      if (latest.current.isLoggedIn) {
        void cityboxApi
          .updateAddress(address.id, addressToInput(address))
          .then((updated) => {
            const mapped = mapAddress(updated);
            setAddresses((prev) => prev.map((a) => (a.id === address.id ? mapped : a)));
            if (address.isDefault) setSelectedAddress(mapped);
          })
          .catch(() => undefined);
      }
    },
    [],
  );

  const removeAddress = useCallback((id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    setSelectedAddress((prev) => (prev?.id === id ? null : prev));

    if (latest.current.isLoggedIn) {
      void cityboxApi.deleteAddress(id).catch(() => undefined);
    }
  }, []);

  const selectAddress = useCallback((id: string) => {
    const addr = latest.current.addresses.find((a) => a.id === id);
    if (addr) {
      setSelectedAddress(addr);
      if (latest.current.isLoggedIn) {
        void cityboxApi.updateCheckoutSession({ selectedAddressId: id }).catch(() => undefined);
      }
    }
  }, []);

  const addPaymentMethod = useCallback(
    (pm: PaymentMethod) => {
      setPaymentMethods((prev) => {
        const list = pm.isDefault ? prev.map((p) => ({ ...p, isDefault: false })) : [...prev];
        return [...list, pm];
      });
      if (pm.isDefault) setSelectedPayment(pm);

      if (latest.current.isLoggedIn) {
        void cityboxApi
          .createPaymentMethod({
            number: `424242424242${pm.lastFour}`,
            holderName: pm.holderName,
            expiry: pm.expiry,
            cvv: '123',
            label: pm.label,
            isDefault: pm.isDefault,
          })
          .then((created) => {
            const mapped = mapPaymentMethod(created);
            setPaymentMethods((prev) => prev.map((p) => (p.id === pm.id ? mapped : p)));
            if (pm.isDefault) setSelectedPayment(mapped);
          })
          .catch(() => {
            setPaymentMethods((prev) => prev.filter((p) => p.id !== pm.id));
            setSelectedPayment((prev) => (prev?.id === pm.id ? null : prev));
          });
      }
    },
    [],
  );

  const removePaymentMethod = useCallback((id: string) => {
    setPaymentMethods((prev) => prev.filter((p) => p.id !== id));
    setSelectedPayment((prev) => (prev?.id === id ? null : prev));

    if (latest.current.isLoggedIn) {
      void cityboxApi.deletePaymentMethod(id).catch(() => undefined);
    }
  }, []);

  const selectPayment = useCallback((id: string) => {
    const pm = latest.current.paymentMethods.find((p) => p.id === id);
    if (pm) {
      setSelectedPayment(pm);
      if (latest.current.isLoggedIn) {
        void cityboxApi.updateCheckoutSession({ paymentMethodId: id }).catch(() => undefined);
      }
    }
  }, []);

  const applyCoupon = useCallback((code: string): string | null => {
    const trimmed = code.trim();
    if (!trimmed) return 'coupons.codeRequired';

    const found = latest.current.coupons.find(
      (c) => c.code.toUpperCase() === trimmed.toUpperCase(),
    );
    if (!found) return 'coupons.invalid';

    // Otimista com o cupom real conhecido; reconcilia com o servidor.
    setAppliedCoupon(found);
    if (latest.current.isLoggedIn) {
      void cityboxApi
        .applyCartCoupon(trimmed)
        .then((res) => {
          setAppliedCoupon(appliedCouponToCoupon(res.appliedCoupon));
          setCart(mapCartToRecord(res.cart));
        })
        .catch(() => setAppliedCoupon(null));
    }
    return null;
  }, []);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    if (latest.current.isLoggedIn) {
      void cityboxApi.removeCoupon().catch(() => undefined);
    }
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    if (latest.current.isLoggedIn) {
      void cityboxApi.markNotificationRead(id).catch(() => undefined);
    }
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (latest.current.isLoggedIn) {
      void cityboxApi.markAllNotificationsRead().catch(() => undefined);
    }
  }, []);

  const sendChatMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const tempId = `temp-${Date.now()}`;
      setChatMessages((prev) => [
        ...prev,
        { id: tempId, text: trimmed, isAgent: false, time: i18n.t('time.now', { ns: 'common' }) },
      ]);

      if (latest.current.isLoggedIn) {
        void cityboxApi
          .sendChatMessage(trimmed)
          .then(({ userMessage, agentMessage }) => {
            setChatMessages((prev) => [
              ...prev.filter((m) => m.id !== tempId),
              mapChatMessage(userMessage),
              mapChatMessage(agentMessage),
            ]);
          })
          .catch(() => {
            setChatMessages((prev) => prev.filter((m) => m.id !== tempId));
          });
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `agent-${Date.now()}`,
            text: i18n.t('autoReply', { ns: 'chat' }),
            isAgent: true,
            time: i18n.t('time.now', { ns: 'common' }),
          },
        ]);
      }
    },
    [],
  );

  const buyAgainOrder = useCallback(async (orderId: string) => {
    if (latest.current.isLoggedIn) {
      const cartRes = await cityboxApi.buyAgain(orderId);
      setCart(mapCartToRecord(cartRes));
      return;
    }
    const order = latest.current.orders.find((o) => o.id === orderId);
    if (!order) return;
    setCart((prev) => {
      const next = { ...prev };
      for (const { id, qty } of order.productIds) {
        next[id] = (next[id] ?? 0) + qty;
      }
      return next;
    });
  }, []);

  const addReview = useCallback((review: Review, synced = false) => {
    setReviews((prev) => ({
      ...prev,
      [review.productId]: [...(prev[review.productId] ?? []), review],
    }));

    if (latest.current.isLoggedIn && !synced) {
      void cityboxApi
        .createReview(review.productId, {
          rating: review.rating,
          text: review.text,
          photoUrls: review.photoUrls,
        })
        .then((created) => {
          setReviews((prev) => ({
            ...prev,
            [review.productId]: (prev[review.productId] ?? []).map((r) =>
              r.id === review.id ? mapReview(created) : r,
            ),
          }));
        })
        .catch(() => {
          setReviews((prev) => ({
            ...prev,
            [review.productId]: (prev[review.productId] ?? []).filter((r) => r.id !== review.id),
          }));
        });
    }
  }, []);

  const addSearchHistory = useCallback((term: string) => {
    const t = term.trim();
    if (!t) return;
    setSearchHistory((prev) =>
      [t, ...prev.filter((h) => h.toLowerCase() !== t.toLowerCase())].slice(0, 10),
    );
    if (latest.current.isLoggedIn) {
      void cityboxApi.addSearchHistory(t).catch(() => undefined);
    }
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    if (latest.current.isLoggedIn) {
      void cityboxApi.clearSearchHistory().catch(() => undefined);
    }
  }, []);

  const setSearchFilters = useCallback((filters: SearchFilters) => {
    setSearchFiltersState(filters);
    setFFree(filters.freeShippingOnly);
    setFFull(filters.expressOnly);
  }, []);

  const resetSearchFilters = useCallback(() => {
    setSearchFiltersState(DEFAULT_SEARCH_FILTERS);
    setFFree(false);
    setFFull(false);
  }, []);

  const averageRating = useCallback(
    (productId: string): number => {
      const list = reviews[productId] ?? [];
      if (list.length === 0) return 0;
      return list.reduce((sum, r) => sum + r.rating, 0) / list.length;
    },
    [reviews],
  );

  const advanceOrderStatus = useCallback(() => {
    if (!latest.current.isLoggedIn) return;
    void cityboxApi
      .listOrders()
      .then(({ orders: fresh }) => {
        if (fresh.length > 0) {
          setOrders(fresh.map(mapOrder));
        }
      })
      .catch(() => undefined);
  }, []);

  const setPayWithSync = useCallback((p: PayMethod) => {
    setPay(p);
    if (latest.current.isLoggedIn) {
      void cityboxApi
        .updateCheckoutSession({ paymentType: payMethodToApiType(p) })
        .catch(() => undefined);
    }
  }, []);

  const setSelectedShippingWithSync = useCallback((opt: ShippingOption) => {
    setSelectedShipping(opt);
    if (latest.current.isLoggedIn) {
      void cityboxApi
        .updateCheckoutSession({ shippingOptionId: opt.id })
        .catch(() => undefined);
    }
  }, []);

  const login = useCallback(
    async (account: string, password: string): Promise<string | null> => {
      const trimmedAccount = account.trim();
      const trimmedPassword = password.trim();
      if (!trimmedAccount || !trimmedPassword) return 'errors.login.credentialsRequired';
      if (trimmedPassword.length < 4) return 'errors.login.passwordMinLength';

      try {
        const auth = await cityboxApi.login(trimmedAccount, trimmedPassword);
        setUser(mapUser(auth.user));
        setIsLoggedIn(true);
        await syncAuthenticatedState();
        return null;
      } catch (e) {
        if (e instanceof ApiError) return e.message || 'errors.login.invalid';
        return 'errors.login.serverConnection';
      }
    },
    [syncAuthenticatedState],
  );

  const loginWithGoogle = useCallback(async (): Promise<string | null> => {
    try {
      const auth = await cityboxApi.loginGoogle();
      setUser(mapUser(auth.user));
      setIsLoggedIn(true);
      await syncAuthenticatedState();
      return null;
    } catch {
      return 'errors.login.googleConnection';
    }
  }, [syncAuthenticatedState]);

  const register = useCallback(
    async (
      name: string,
      email: string,
      phone: string,
      password: string,
      confirm: string,
    ): Promise<string | null> => {
      if (!name.trim()) return 'errors.register.nameRequired';
      if (!email.trim().includes('@')) return 'errors.register.invalidEmail';
      if (!phone.trim()) return 'errors.register.phoneRequired';
      if (password.length < 6) return 'errors.register.passwordMinLength';
      if (password !== confirm) return 'errors.register.passwordMismatch';

      try {
        const auth = await cityboxApi.register({ name, email, phone, password });
        setUser(mapUser(auth.user));
        setIsLoggedIn(true);
        await syncAuthenticatedState();
        return null;
      } catch (e) {
        if (e instanceof ApiError) {
          if (e.status === 409) return 'errors.register.emailTaken';
          if (e.message) return e.message;
        }
        return 'errors.register.failed';
      }
    },
    [syncAuthenticatedState],
  );

  const resetAuthenticatedData = useCallback(() => {
    setCart({});
    favoritesStore.clear();
    setAddresses([]);
    setSelectedAddress(null);
    setPaymentMethods([]);
    setSelectedPayment(null);
    setAppliedCoupon(null);
    setCoupons([]);
    setNotifications([]);
    setChatMessages([]);
    setOrders([]);
    setSearchHistory([]);
    setShippingOptions([]);
    setSelectedShipping(DEFAULT_SHIPPING);
    setReviews({});
    setOrder(null);
    loadedReviewsRef.current.clear();
  }, []);

  const logout = useCallback(() => {
    void (async () => {
      await cityboxApi.logout();
      setIsLoggedIn(false);
      resetAuthenticatedData();
      navigate(routes.home);
      toTop();
    })();
  }, [navigate, resetAuthenticatedData, toTop]);

  const syncCartFromApi = useCallback(async () => {
    const cartRes = await cityboxApi.getCart();
    setCart(mapCartToRecord(cartRes));
  }, []);

  const addToCart = useCallback(
    (id: string) => {
      if (latest.current.isLoggedIn) {
        void cityboxApi
          .addCartItem(id, 1)
          .then(() => syncCartFromApi())
          .catch(() => {
            setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
          });
      } else {
        setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
      }
    },
    [syncCartFromApi],
  );

  const changeQty = useCallback(
    (id: string, delta: number) => {
      const nextQty = Math.max(1, (latest.current.cart[id] || 1) + delta);
      if (latest.current.isLoggedIn) {
        void cityboxApi
          .updateCartItem(id, nextQty)
          .then(() => syncCartFromApi())
          .catch(() => {
            setCart((prev) => ({ ...prev, [id]: nextQty }));
          });
      } else {
        setCart((prev) => ({ ...prev, [id]: nextQty }));
      }
    },
    [syncCartFromApi],
  );

  const removeLine = useCallback(
    (id: string) => {
      if (latest.current.isLoggedIn) {
        void cityboxApi
          .removeCartItem(id)
          .then(() => syncCartFromApi())
          .catch(() => {
            setCart((prev) => {
              const next = { ...prev };
              delete next[id];
              return next;
            });
          });
      } else {
        setCart((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    },
    [syncCartFromApi],
  );

  const openProduct = useCallback(
    (id: string) => {
      setDrawerOpen(false);
      setFiltersOpen(false);
      navigate(routes.product(id));
      toTop();
    },
    [navigate, toTop],
  );

  const buyNow = useCallback(
    (id: string) => {
      addToCart(id);
      setDrawerOpen(false);
      navigate(routes.checkout);
      toTop();
    },
    [addToCart, navigate, toTop],
  );

  const addCurrentToCart = useCallback(
    (id: string) => {
      addToCart(id);
      setDrawerOpen(false);
      navigate(routes.cart);
      toTop();
    },
    [addToCart, navigate, toTop],
  );

  const placeOrder = useCallback(() => {
    const idempotencyKey =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `order-${Date.now()}`;

    void (async () => {
      const { cart, selectedAddress, selectedShipping, appliedCoupon, pay, selectedPayment, boletoCpf } =
        latest.current;
      try {
        const result = await cityboxApi.createOrder(
          {
            addressId: selectedAddress?.id,
            shippingOptionId: selectedShipping.id,
            couponCode: appliedCoupon?.code ?? null,
            payment: {
              type: payMethodToApiType(pay),
              paymentMethodId: pay === 'card' ? selectedPayment?.id : undefined,
              cpf: pay === 'boleto' ? boletoCpf.replace(/\D/g, '') : undefined,
            },
            items: cartItemsFromRecord(cart),
          },
          idempotencyKey,
        );

        const created = mapOrder(result.order);
        setOrder({ no: created.id, totalFmt: `R$ ${brlFull(created.total)}` });
        setOrders((prev) => [created, ...prev]);
        setAppliedCoupon(null);
        setCart({});
        await syncCartFromApi();
        navigate(routes.confirmation);
        toTop();
      } catch (err) {
        console.error('[placeOrder] API error:', err);
        setApiError('errors.placeOrder');
      }
    })();
  }, [navigate, syncCartFromApi, toTop]);

  const doSearch = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const term = latest.current.query.trim();
      addSearchHistory(term);
      setSearchQuery(term);
      setQuery('');
      setDrawerOpen(false);
      navigate(routes.search);
      toTop();
    },
    [navigate, toTop, addSearchHistory],
  );

  const getProduct = useCallback(
    (id: string) => {
      if (!loadedReviewsRef.current.has(id)) {
        loadedReviewsRef.current.add(id);
        void cityboxApi
          .getReviews(id)
          .then((res) => {
            const list = (res.reviews ?? []).map(mapReview);
            if (list.length > 0) {
              setReviews((prev) => ({ ...prev, [id]: list }));
            }
          })
          .catch(() => undefined);
      }
      return decorate(products.find((p) => p.id === id) ?? products[0] ?? FALLBACK_PRODUCT);
    },
    [products, decorate],
  );

  const completeOnboarding = useCallback(() => {
    setHasSeenOnboarding(true);
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      /* ignore */
    }
    void cityboxApi.onboardingPreLogin('web', true).catch(() => undefined);
    if (latest.current.isLoggedIn) {
      void cityboxApi.onboardingPostLogin(true).catch(() => undefined);
    }
  }, []);

  const resetOnboarding = useCallback(() => {
    setHasSeenOnboarding(false);
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleFree = useCallback(() => {
    setFFree((v) => {
      const next = !v;
      setSearchFiltersState((f) => ({ ...f, freeShippingOnly: next }));
      return next;
    });
  }, []);

  const toggleFull = useCallback(() => {
    setFFull((v) => {
      const next = !v;
      setSearchFiltersState((f) => ({ ...f, expressOnly: next }));
      return next;
    });
  }, []);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const openFilters = useCallback(() => setFiltersOpen(true), []);
  const closeFilters = useCallback(() => setFiltersOpen(false), []);

  const uiValue = useMemo<UIContextValue>(
    () => ({
      query, setQuery, searchQuery, setSearchQuery, fFree, fFull, toggleFree, toggleFull, searchFilters, setSearchFilters,
      resetSearchFilters, drawerOpen, filtersOpen, openDrawer, closeDrawer, openFilters,
      closeFilters, doSearch, searchHistory, addSearchHistory, clearSearchHistory,
    }),
    [
      query, setQuery, searchQuery, setSearchQuery, fFree, fFull, toggleFree, toggleFull, searchFilters, setSearchFilters,
      resetSearchFilters, drawerOpen, filtersOpen, openDrawer, closeDrawer, openFilters,
      closeFilters, doSearch, searchHistory, addSearchHistory, clearSearchHistory,
    ],
  );

  const authValue = useMemo<AuthContextValue>(
    () => ({
      user, isLoggedIn, login, loginWithGoogle, register, logout, updateProfile,
      hasSeenOnboarding, completeOnboarding, resetOnboarding,
    }),
    [
      user, isLoggedIn, login, loginWithGoogle, register, logout, updateProfile,
      hasSeenOnboarding, completeOnboarding, resetOnboarding,
    ],
  );

  const catalogValue = useMemo<CatalogContextValue>(
    () => ({
      products, categories, homeSections, offerProducts, bestSellerProducts, apiReady, apiError,
      faqItems, decorate, getProduct, openProduct, searchList, averageRating, reviews, addReview,
    }),
    [
      products, categories, homeSections, offerProducts, bestSellerProducts, apiReady, apiError,
      faqItems, decorate, getProduct, openProduct, searchList, averageRating, reviews, addReview,
    ],
  );

  const cartValue = useMemo<CartContextValue>(
    () => ({
      cart, cartCount, cartTotal, cartLines, addToCart, changeQty, removeLine, buyNow,
      addCurrentToCart, buyAgainOrder,
    }),
    [
      cart, cartCount, cartTotal, cartLines, addToCart, changeQty, removeLine, buyNow,
      addCurrentToCart, buyAgainOrder,
    ],
  );

  const checkoutValue = useMemo<CheckoutContextValue>(
    () => ({
      addresses, selectedAddress, addAddress, editAddress, removeAddress, selectAddress,
      paymentMethods, selectedPayment, addPaymentMethod, removePaymentMethod, selectPayment,
      appliedCoupon, applyCoupon, removeCoupon, coupons, selectedShipping,
      setSelectedShipping: setSelectedShippingWithSync, shippingOptions, pay,
      setPay: setPayWithSync, boletoCpf, setBoletoCpf, placeOrder, order,
    }),
    [
      addresses, selectedAddress, addAddress, editAddress, removeAddress, selectAddress,
      paymentMethods, selectedPayment, addPaymentMethod, removePaymentMethod, selectPayment,
      appliedCoupon, applyCoupon, removeCoupon, coupons, selectedShipping,
      setSelectedShippingWithSync, shippingOptions, pay, setPayWithSync, boletoCpf, setBoletoCpf,
      placeOrder, order,
    ],
  );

  const ordersValue = useMemo<OrdersContextValue>(
    () => ({ orders, advanceOrderStatus }),
    [orders, advanceOrderStatus],
  );

  const engagementValue = useMemo<EngagementContextValue>(
    () => ({
      notifications, unreadNotificationCount, markNotificationRead, markAllNotificationsRead,
      chatMessages, sendChatMessage,
    }),
    [
      notifications, unreadNotificationCount, markNotificationRead, markAllNotificationsRead,
      chatMessages, sendChatMessage,
    ],
  );

  return (
    <UIContext.Provider value={uiValue}>
      <AuthContext.Provider value={authValue}>
        <CatalogContext.Provider value={catalogValue}>
          <CartContext.Provider value={cartValue}>
            <CheckoutContext.Provider value={checkoutValue}>
              <OrdersContext.Provider value={ordersValue}>
                <EngagementContext.Provider value={engagementValue}>
                  {children}
                </EngagementContext.Provider>
              </OrdersContext.Provider>
            </CheckoutContext.Provider>
          </CartContext.Provider>
        </CatalogContext.Provider>
      </AuthContext.Provider>
    </UIContext.Provider>
  );
}

function useSlice<T>(ctx: Context<T | null>, hook: string): T {
  const value = useContext(ctx);
  if (!value) throw new Error(tKey('errors.hook.appProvider', { hook }));
  return value;
}

export const useUI = () => useSlice(UIContext, 'useUI');
export const useAuth = () => useSlice(AuthContext, 'useAuth');
export const useCatalog = () => useSlice(CatalogContext, 'useCatalog');
export const useCart = () => useSlice(CartContext, 'useCart');
export const useCheckout = () => useSlice(CheckoutContext, 'useCheckout');
export const useOrders = () => useSlice(OrdersContext, 'useOrders');
export const useEngagement = () => useSlice(EngagementContext, 'useEngagement');
