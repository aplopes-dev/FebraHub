import { http, type HttpHandler } from 'msw';
import {
  buildPreview,
  findCoupon,
  subtotalForItems,
  syncCheckoutCoupon,
  toAppliedCoupon,
} from '../checkout-logic';
import { buildCart, db, findProduct, persistDb } from '../db';
import { errorResponse, ok, noContent, parseJson, requireAuth } from './shared';

export const cartHandlers: HttpHandler[] = [
  http.get('*/me/cart', ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;
    return ok(buildCart());
  }),

  http.delete('*/me/cart', ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;
    db.cart.clear();
    syncCheckoutCoupon(null);
    persistDb();
    return noContent();
  }),

  http.post('*/me/cart/items', async ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const body = await parseJson<{ productId?: string; quantity?: number }>(request);
    if (!body?.productId) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.required', 'productId');
    }
    if (!findProduct(body.productId)) {
      return errorResponse(404, 'NOT_FOUND', 'notFound.product');
    }

    const qty = body.quantity ?? 1;
    const current = db.cart.get(body.productId) ?? 0;
    db.cart.set(body.productId, current + qty);
    persistDb();

    return ok(buildCart());
  }),

  http.patch('*/me/cart/items/:id', async ({ request, params }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const productId = String(params.id);
    const body = await parseJson<{ quantity?: number }>(request);
    if (body?.quantity == null) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.invalidQuantity', 'quantity');
    }

    if (body.quantity === 0) {
      db.cart.delete(productId);
      persistDb();
      return ok(buildCart());
    }

    if (body.quantity < 1) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.invalidQuantity', 'quantity');
    }

    if (!db.cart.has(productId)) {
      return errorResponse(404, 'NOT_FOUND', 'notFound.cartItem');
    }

    db.cart.set(productId, body.quantity);
    persistDb();
    return ok(buildCart());
  }),

  http.delete('*/me/cart/items/:id', ({ request, params }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    db.cart.delete(String(params.id));
    persistDb();
    return ok(buildCart());
  }),

  http.post('*/me/cart/coupon', async ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const body = await parseJson<{ code?: string }>(request);
    if (!body?.code?.trim()) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.required', 'code');
    }

    const coupon = findCoupon(body.code);
    if (!coupon) {
      return errorResponse(404, 'COUPON_NOT_FOUND', 'notFound.coupon');
    }

    const subtotal = subtotalForItems(buildCart().items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
    })));
    const appliedCoupon = toAppliedCoupon(coupon, subtotal);
    syncCheckoutCoupon(appliedCoupon);
    persistDb();

    const session = { ...db.checkoutSession };
    const preview = buildPreview(session);

    return ok({
      appliedCoupon,
      cart: buildCart(),
      preview,
    });
  }),
];
