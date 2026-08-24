import { Injectable } from '@nestjs/common';
import { ApiError, badRequest, notFound } from '../common/envelope.js';
import { money } from '../common/money.js';
import { InjectService } from '../common/inject.js';
import { getConsumerClient } from '../database/consumer.js';
import { PRODUCT_INCLUDE, toApiProduct } from '../catalog/product.presenter.js';
import type { ConsumerUserRecord } from '../users/users.service.js';
import { CartService } from '../cart/cart.service.js';
import {
  buildPreview,
  couponApplicability,
  freeShippingMessage,
  parseDeliveryDays,
  toApiAddress,
  toApiCoupon,
  toApiShippingOption,
  toAppliedCoupon,
  type AddressRow,
  type ApiCart,
  type ApiCheckoutPreviewExtended,
  type ApiCheckoutSessionView,
  type CouponRow,
  type SessionLike,
  type ShippingOptionRow,
} from './checkout.pricing.js';
import { buildPaymentResult, type StoredPayment } from './payment.presenter.js';
import { toApiOrder } from '../orders/order.presenter.js';
import { CoreOrdersService } from '../orders/core-orders.service.js';

const DEFAULT_SHIPPING_OPTION_ID = 'express';
const PLACEHOLDER_QR_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export interface CheckoutSessionRow {
  userId: string;
  selectedAddressId: string | null;
  shippingOptionId: string | null;
  couponCode: string | null;
  paymentType: string | null;
  paymentMethodId: string | null;
  boletoCpf: string | null;
}

export interface SessionPatchInput {
  selectedAddressId?: string | null;
  shippingOptionId?: string | null;
  paymentType?: string | null;
  paymentMethodId?: string | null;
  boletoCpf?: string | null;
}

export interface CartItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  addressId?: string;
  shippingOptionId?: string;
  couponCode?: string | null;
  payment?: { type?: string; paymentMethodId?: string; cpf?: string };
  items?: CartItemInput[];
  buyNow?: boolean;
}

interface PricingContext {
  cart: ApiCart;
  items: CartItemInput[];
  subtotal: number;
  itemCount: number;
  coupon: CouponRow | null;
  shippingOption: ShippingOptionRow | null;
  address: AddressRow | null;
}

@Injectable()
export class CheckoutService {
  private readonly db = getConsumerClient();

  constructor(
    @InjectService(CartService) private readonly cart: CartService,
    @InjectService(CoreOrdersService) private readonly coreOrders: CoreOrdersService,
  ) {}

  // ── Sessão ─────────────────────────────────────────────────────────────

  /** Cria a sessão default (endereço default + frete express + PIX) se não existir. */
  private async ensureSession(user: ConsumerUserRecord): Promise<CheckoutSessionRow> {
    const existing = await this.db.checkoutSession.findUnique({ where: { userId: user.id } });
    if (existing) return existing;

    const [defaultAddress, options] = await Promise.all([
      this.db.address.findFirst({ where: { userId: user.id, isDefault: true } }),
      this.activeShippingOptions(),
    ]);
    const shippingOptionId =
      options.find((o) => o.id === DEFAULT_SHIPPING_OPTION_ID)?.id ?? options[0]?.id ?? null;
    const cartCoupon = await this.cart.couponCode(user.id);
    return this.db.checkoutSession.create({
      data: {
        userId: user.id,
        selectedAddressId: defaultAddress?.id ?? null,
        shippingOptionId,
        couponCode: cartCoupon,
        paymentType: 'PIX',
      },
    });
  }

  async getSessionData(user: ConsumerUserRecord) {
    const session = await this.ensureSession(user);
    return this.buildSessionData(user, session);
  }

  async patchSession(user: ConsumerUserRecord, patch: SessionPatchInput) {
    const session = await this.ensureSession(user);
    const updated = await this.db.checkoutSession.update({
      where: { userId: user.id },
      data: {
        ...(patch.selectedAddressId !== undefined && {
          selectedAddressId: patch.selectedAddressId,
        }),
        ...(patch.shippingOptionId !== undefined && { shippingOptionId: patch.shippingOptionId }),
        ...(patch.paymentType !== undefined && { paymentType: patch.paymentType }),
        ...(patch.paymentMethodId !== undefined && { paymentMethodId: patch.paymentMethodId }),
        ...(patch.boletoCpf !== undefined && { boletoCpf: patch.boletoCpf }),
      },
    });
    return this.buildSessionData(user, { ...session, ...updated });
  }

  private async buildSessionData(user: ConsumerUserRecord, session: CheckoutSessionRow) {
    const context = await this.loadPricingContext(user, session);
    const preview = this.previewFromContext(user, session, context);
    const appliedCoupon = context.coupon
      ? toAppliedCoupon(context.coupon, context.subtotal)
      : null;
    const sessionView: ApiCheckoutSessionView = {
      selectedAddressId: session.selectedAddressId,
      shippingOptionId: session.shippingOptionId,
      appliedCoupon,
      paymentType: session.paymentType,
      paymentMethodId: session.paymentMethodId,
      boletoCpf: session.boletoCpf,
      canConfirm: preview.canConfirm,
    };
    return { cart: context.cart, session: sessionView, preview };
  }

  // ── Contexto de preço ──────────────────────────────────────────────────

  private async activeShippingOptions(): Promise<ShippingOptionRow[]> {
    return this.db.shippingOption.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  private async findCoupon(code: string): Promise<CouponRow | null> {
    const normalized = code.trim().toUpperCase();
    return this.db.coupon.findFirst({
      where: { code: { equals: normalized, mode: 'insensitive' } },
    });
  }

  private async loadPricingContext(
    user: ConsumerUserRecord,
    session: CheckoutSessionRow,
    explicitItems?: CartItemInput[],
  ): Promise<PricingContext> {
    const cart = await this.cart.getCart(user.id);
    let items: CartItemInput[];
    let subtotal: number;
    let itemCount: number;
    if (explicitItems && explicitItems.length > 0) {
      items = explicitItems;
      const products = await this.db.product.findMany({
        where: { id: { in: explicitItems.map((i) => i.productId) } },
      });
      const priceById = new Map(products.map((p) => [p.id, money(p.price as never)]));
      subtotal = money(
        explicitItems.reduce(
          (sum, item) => sum + (priceById.get(item.productId) ?? 0) * item.quantity,
          0,
        ),
      );
      itemCount = explicitItems.reduce((sum, item) => sum + item.quantity, 0);
    } else {
      items = cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
      subtotal = cart.subtotal;
      itemCount = cart.itemCount;
    }

    const [coupon, options, address] = await Promise.all([
      session.couponCode ? this.findCoupon(session.couponCode) : Promise.resolve(null),
      this.activeShippingOptions(),
      session.selectedAddressId
        ? this.db.address.findFirst({
            where: { id: session.selectedAddressId, userId: user.id },
          })
        : Promise.resolve(null),
    ]);
    // Fallback do mock: id desconhecido cai na primeira opção.
    const shippingOption =
      options.find((o) => o.id === session.shippingOptionId) ?? options[0] ?? null;
    return { cart, items, subtotal, itemCount, coupon, shippingOption, address };
  }

  private previewFromContext(
    user: ConsumerUserRecord,
    session: SessionLike,
    context: PricingContext,
  ): ApiCheckoutPreviewExtended {
    return buildPreview({
      subtotal: context.subtotal,
      itemCount: context.itemCount,
      session,
      shippingOption: context.shippingOption,
      coupon: context.coupon,
      isPlus: user.isPlus,
      addressState: context.address?.state ?? null,
    });
  }

  // ── Frete ──────────────────────────────────────────────────────────────

  async shippingOptions(user: ConsumerUserRecord, addressId: string | undefined) {
    if (!addressId) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Campo obrigatório', 'addressId');
    }
    const address = await this.db.address.findFirst({
      where: { id: addressId, userId: user.id },
    });
    if (!address) throw notFound('Endereço não encontrado');

    const options = (await this.activeShippingOptions()).map((opt) => {
      const api = toApiShippingOption(opt);
      if (user.isPlus && address.state === 'SP' && opt.id === 'express') {
        return { ...api, price: 0 };
      }
      return api;
    });
    return { options, freeShippingMessage: freeShippingMessage(user.isPlus, address) };
  }

  // ── Cupons ─────────────────────────────────────────────────────────────

  async listCoupons(user: ConsumerUserRecord) {
    const [coupons, cart] = await Promise.all([
      this.db.coupon.findMany({ where: { active: true }, orderBy: { code: 'asc' } }),
      this.cart.getCart(user.id),
    ]);
    return { coupons: coupons.map((c) => toApiCoupon(c, cart.subtotal)) };
  }

  /** Valida cupom contra o subtotal — lança os erros que o mock usa. */
  private async requireApplicableCoupon(code: string, subtotal: number): Promise<CouponRow> {
    const coupon = await this.findCoupon(code);
    if (!coupon || !coupon.active || coupon.expiry.getTime() < Date.now()) {
      throw new ApiError(404, 'COUPON_NOT_FOUND', 'Cupom inválido');
    }
    const { isApplicable, reason } = couponApplicability(coupon, subtotal);
    if (!isApplicable) throw badRequest(reason ?? 'Cupom inválido', 'code');
    return coupon;
  }

  /** POST /me/cart/coupon — aplica cupom no Cart+Session e devolve cart+preview. */
  async applyCartCoupon(user: ConsumerUserRecord, code: string | undefined) {
    if (!code?.trim()) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Campo obrigatório', 'code');
    }
    const session = await this.ensureSession(user);
    const cart = await this.cart.getCart(user.id);
    const coupon = await this.requireApplicableCoupon(code, cart.subtotal);

    await this.cart.setCouponCode(user.id, coupon.code);
    const updated = { ...session, couponCode: coupon.code };
    const context = await this.loadPricingContext(user, updated);
    return {
      appliedCoupon: toAppliedCoupon(coupon, cart.subtotal),
      cart: context.cart,
      preview: this.previewFromContext(user, updated, context),
    };
  }

  /** POST /checkout/coupons/validate. */
  async validateCoupon(
    user: ConsumerUserRecord,
    body: { code?: string; subtotal?: number; items?: CartItemInput[] },
  ) {
    if (!body.code?.trim()) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Campo obrigatório', 'code');
    }
    await this.ensureSession(user);
    const cart = await this.cart.getCart(user.id);
    const subtotal = body.subtotal ?? cart.subtotal;
    const coupon = await this.requireApplicableCoupon(body.code, subtotal);
    await this.cart.setCouponCode(user.id, coupon.code);
    return {
      coupon: toApiCoupon(coupon, subtotal),
      discountAmount: toAppliedCoupon(coupon, subtotal).discountAmount,
      isValid: true,
    };
  }

  /** DELETE /checkout/coupons. */
  async removeCoupon(user: ConsumerUserRecord) {
    const session = await this.ensureSession(user);
    await this.cart.setCouponCode(user.id, null);
    const updated = { ...session, couponCode: null };
    const context = await this.loadPricingContext(user, updated);
    return { appliedCoupon: null, preview: this.previewFromContext(user, updated, context) };
  }

  // ── Preview ────────────────────────────────────────────────────────────

  async preview(
    user: ConsumerUserRecord,
    body: {
      addressId?: string;
      shippingOptionId?: string;
      couponCode?: string | null;
      paymentType?: string;
      items?: CartItemInput[];
    },
  ): Promise<ApiCheckoutPreviewExtended> {
    const stored = await this.ensureSession(user);
    const session: CheckoutSessionRow = { ...stored };
    if (body.addressId) session.selectedAddressId = body.addressId;
    if (body.shippingOptionId) session.shippingOptionId = body.shippingOptionId;
    if (body.paymentType) session.paymentType = body.paymentType;
    if (body.couponCode) {
      const coupon = await this.findCoupon(body.couponCode);
      session.couponCode = coupon?.code ?? null;
    }
    const context = await this.loadPricingContext(user, session, body.items);
    return this.previewFromContext(user, session, context);
  }

  // ── Criação de pedido ──────────────────────────────────────────────────

  async createOrder(
    user: ConsumerUserRecord,
    body: CreateOrderInput,
    idempotencyKey: string | undefined,
    bearerToken?: string,
  ) {
    if (!idempotencyKey) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Idempotency-Key obrigatório', 'Idempotency-Key');
    }
    const existing = await this.db.order.findFirst({
      where: { idempotencyKey, userId: user.id },
      include: { items: true, statusHistory: { orderBy: { date: 'asc' } } },
    });
    if (existing) {
      const stored = existing.payment as unknown as StoredPayment;
      return { order: toApiOrder(existing), payment: stored.result };
    }

    if (!body.payment?.type) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Pagamento obrigatório', 'payment');
    }

    const storedSession = await this.ensureSession(user);
    const session: CheckoutSessionRow = { ...storedSession };
    if (body.addressId) session.selectedAddressId = body.addressId;
    if (body.shippingOptionId) session.shippingOptionId = body.shippingOptionId;
    if (body.couponCode) {
      const coupon = await this.findCoupon(body.couponCode);
      if (coupon) session.couponCode = coupon.code;
    }
    session.paymentType = body.payment.type;
    if (body.payment.paymentMethodId) session.paymentMethodId = body.payment.paymentMethodId;
    if (body.payment.cpf) session.boletoCpf = body.payment.cpf;

    const context = await this.loadPricingContext(user, session, body.items);
    const preview = this.previewFromContext(user, session, context);
    if (!preview.canConfirm) {
      throw new ApiError(422, 'VALIDATION_ERROR', preview.validationErrors.join('; '));
    }
    const address = context.address;
    if (!address) throw notFound('Endereço não encontrado');
    const shippingOption = context.shippingOption;

    // Snapshot dos produtos do pedido
    const products = await this.db.product.findMany({
      where: { id: { in: context.items.map((i) => i.productId) } },
      include: PRODUCT_INCLUDE,
    });
    const productById = new Map(products.map((p) => [p.id, p]));
    for (const item of context.items) {
      if (!productById.has(item.productId)) throw notFound('Produto não encontrado');
    }

    const orderId = `CB-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date();
    const deliveryDays = parseDeliveryDays(shippingOption?.deliveryEstimate ?? '');
    const deliveryDate = new Date(now.getTime() + deliveryDays * 86_400_000);
    const trackingCode = `BR${Math.floor(100000000 + Math.random() * 900900000)}CB`;
    const paymentMethodRow = session.paymentMethodId
      ? await this.db.paymentMethod.findFirst({
          where: { id: session.paymentMethodId, userId: user.id },
        })
      : null;

    const storedPayment = buildPaymentResult({
      type: body.payment.type,
      orderId,
      total: preview.total,
      paymentMethod: paymentMethodRow,
      paymentMethodId: session.paymentMethodId,
      qrPlaceholderBase64: PLACEHOLDER_QR_PNG,
    });

    const orderItemsData = context.items.map((item) => {
      const product = productById.get(item.productId)!;
      const unitPrice = money(product.price as never);
      return {
        productId: item.productId,
        productSnapshot: toApiProduct(product) as object,
        quantity: item.quantity,
        unitPrice,
        subtotal: money(unitPrice * item.quantity),
      };
    });

    await this.db.$transaction(async (tx) => {
      await tx.order.create({
        data: {
          id: orderId,
          userId: user.id,
          status: 'CONFIRMED',
          subtotal: preview.subtotal,
          shipping: preview.shipping,
          discount: preview.couponDiscount,
          pixDiscount: preview.pixDiscount,
          total: preview.total,
          deliveryDate,
          address: toApiAddress(address) as object,
          payment: storedPayment as unknown as object,
          trackingCode,
          carrier: 'CityBox Logística',
          idempotencyKey,
          items: { create: orderItemsData },
          statusHistory: {
            create: {
              status: 'CONFIRMED',
              date: now,
              location: `${address.city}, ${address.state}`,
            },
          },
        },
      });
      if (!body.buyNow) {
        await tx.cartItem.deleteMany({ where: { cartUserId: user.id } });
        await tx.cart.updateMany({ where: { userId: user.id }, data: { couponCode: null } });
      }
      await tx.checkoutSession.update({
        where: { userId: user.id },
        data: {
          shippingOptionId: DEFAULT_SHIPPING_OPTION_ID,
          couponCode: null,
          paymentType: 'PIX',
          paymentMethodId: null,
          boletoCpf: null,
        },
      });
      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'ORDER',
          title: 'Pedido confirmado',
          body: `Seu pedido ${orderId} foi confirmado.`,
          deepLink: null,
        },
      });
    });
    await this.cart.invalidate(user.id);

    // Espelha o pedido na marketplace-api core (fonte transacional; A-05).
    // Falha da core não bloqueia o consumidor — coreOrderId fica null p/ reconciliação.
    if (this.coreOrders.enabled && bearerToken) {
      const coreOrderId = await this.coreOrders.createOrder(
        bearerToken,
        process.env.CORE_STORE_ID ?? '00000000-0000-7000-8000-000000000001',
        orderItemsData.map((item) => {
          const product = productById.get(item.productId)!;
          return {
            sku: item.productId,
            name: product.name,
            quantity: item.quantity,
            price: item.unitPrice,
          };
        }),
        orderId,
      );
      if (coreOrderId) {
        await this.db.order.update({ where: { id: orderId }, data: { coreOrderId } });
      }
    }

    const created = await this.db.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true, statusHistory: { orderBy: { date: 'asc' } } },
    });
    return { order: toApiOrder(created), payment: storedPayment.result };
  }
}
