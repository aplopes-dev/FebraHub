import { http, type HttpHandler } from 'msw';
import {
  buildCheckoutSessionData,
  buildPreview,
  createOrderFromRequest,
  findCoupon,
  freeShippingMessage,
  resolveItems,
  subtotalForItems,
  syncCheckoutCoupon,
  toAppliedCoupon,
} from '../checkout-logic';
import { db, MOCK_SHIPPING_OPTIONS, persistDb } from '../db';
import { errorResponse, ok, parseJson, requireAuth } from './shared';

export const checkoutHandlers: HttpHandler[] = [
  http.get('*/checkout/session', ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;
    return ok(buildCheckoutSessionData());
  }),

  http.patch('*/checkout/session', async ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const body = await parseJson<{
      selectedAddressId?: string | null;
      shippingOptionId?: string | null;
      paymentType?: typeof db.checkoutSession.paymentType;
      paymentMethodId?: string | null;
      boletoCpf?: string | null;
    }>(request);

    if (body?.selectedAddressId !== undefined) {
      db.checkoutSession.selectedAddressId = body.selectedAddressId;
    }
    if (body?.shippingOptionId !== undefined) {
      db.checkoutSession.shippingOptionId = body.shippingOptionId;
    }
    if (body?.paymentType !== undefined) {
      db.checkoutSession.paymentType = body.paymentType;
    }
    if (body?.paymentMethodId !== undefined) {
      db.checkoutSession.paymentMethodId = body.paymentMethodId;
    }
    if (body?.boletoCpf !== undefined) {
      db.checkoutSession.boletoCpf = body.boletoCpf;
    }

    persistDb();
    return ok(buildCheckoutSessionData());
  }),

  http.post('*/checkout/shipping-options', async ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const body = await parseJson<{ addressId?: string; items?: { productId: string; quantity: number }[] }>(
      request,
    );
    if (!body?.addressId) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.required', 'addressId');
    }

    const address = db.addresses.find((a) => a.id === body.addressId);
    if (!address) {
      return errorResponse(404, 'NOT_FOUND', 'notFound.address');
    }

    const options = MOCK_SHIPPING_OPTIONS.map((opt) => {
      if (db.user.isPlus && address.state === 'SP' && opt.id === 'express') {
        return { ...opt, price: 0 };
      }
      return opt;
    });

    return ok({
      options,
      freeShippingMessage: freeShippingMessage(body.addressId),
    });
  }),

  http.get('*/me/coupons', ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;
    return ok({ coupons: db.coupons });
  }),

  http.post('*/checkout/coupons/validate', async ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const body = await parseJson<{
      code?: string;
      subtotal?: number;
      items?: { productId: string; quantity: number }[];
    }>(request);
    if (!body?.code?.trim()) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.required', 'code');
    }

    const coupon = findCoupon(body.code);
    if (!coupon) {
      return errorResponse(404, 'COUPON_NOT_FOUND', 'notFound.coupon');
    }

    const subtotal =
      body.subtotal ??
      subtotalForItems(resolveItems(body.items));
    const discountAmount = toAppliedCoupon(coupon, subtotal).discountAmount;

    syncCheckoutCoupon(toAppliedCoupon(coupon, subtotal));
    persistDb();

    return ok({
      coupon,
      discountAmount,
      isValid: true,
    });
  }),

  http.delete('*/checkout/coupons', ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    syncCheckoutCoupon(null);
    persistDb();

    const preview = buildPreview(db.checkoutSession);
    return ok({ appliedCoupon: null, preview });
  }),

  http.post('*/checkout/preview', async ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const body = await parseJson<{
      addressId?: string;
      shippingOptionId?: string;
      couponCode?: string | null;
      paymentType?: typeof db.checkoutSession.paymentType;
      items?: { productId: string; quantity: number }[];
    }>(request);

    const session = { ...db.checkoutSession };
    if (body?.addressId) session.selectedAddressId = body.addressId;
    if (body?.shippingOptionId) session.shippingOptionId = body.shippingOptionId;
    if (body?.paymentType) session.paymentType = body.paymentType;
    if (body?.couponCode) {
      const coupon = findCoupon(body.couponCode);
      session.appliedCoupon = coupon
        ? toAppliedCoupon(coupon, subtotalForItems(resolveItems(body.items)))
        : null;
    }

    return ok(buildPreview(session, body?.items));
  }),

  http.post('*/checkout/orders', async ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const idempotencyKey = request.headers.get('Idempotency-Key');
    if (!idempotencyKey) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.idempotencyKeyRequired', 'Idempotency-Key');
    }

    const existingOrderId = db.idempotencyOrders.get(idempotencyKey);
    if (existingOrderId) {
      const order = db.orders.find((o) => o.id === existingOrderId);
      if (order) {
        return ok(
          {
            order,
            payment: {
              type: order.paymentMethod?.type ?? 'PIX',
              status: 'APPROVED' as const,
            },
          },
          { status: 201 },
        );
      }
    }

    const body = await parseJson<{
      addressId?: string;
      shippingOptionId?: string;
      couponCode?: string | null;
      payment?: { type?: string; paymentMethodId?: string; cpf?: string };
      items?: { productId: string; quantity: number }[];
      buyNow?: boolean;
    }>(request);

    if (!body?.payment?.type) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.paymentRequired', 'payment');
    }

    const result = createOrderFromRequest({
      addressId: body.addressId,
      shippingOptionId: body.shippingOptionId,
      couponCode: body.couponCode,
      payment: {
        type: body.payment.type as 'PIX' | 'CARD' | 'BOLETO',
        paymentMethodId: body.payment.paymentMethodId,
        cpf: body.payment.cpf,
      },
      items: body.items,
      buyNow: body.buyNow,
    });

    db.idempotencyOrders.set(idempotencyKey, result.order.id);
    persistDb();

    return ok(result, { status: 201 });
  }),
];
