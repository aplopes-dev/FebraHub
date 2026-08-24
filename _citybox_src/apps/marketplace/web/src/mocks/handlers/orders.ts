import { http, type HttpHandler } from 'msw';
import i18n from '@/i18n';
import type { ApiReturnDetail, ApiTracking } from '@/api/types';
import { buildCart, db, nextId, persistDb } from '../db';
import { maybeAdvanceOrder } from '../checkout-logic';
import { errorResponse, ok, okWithMeta, parseJson, requireAuth } from './shared';

const CANCELLABLE: Set<string> = new Set(['CONFIRMED', 'PREPARING']);

function orderEtag(orderId: string, status: string): string {
  return `"${orderId}-${status}"`;
}

function buildTracking(order: (typeof db.orders)[number]): ApiTracking {
  return {
    orderId: order.id,
    trackingCode: order.trackingCode ?? '',
    carrier: order.carrier ?? i18n.t('orders.carrier', { ns: 'api' }),
    carrierUrl: `https://rastreio.citybox.com.br/${order.trackingCode}`,
    currentStatus: order.status,
    estimatedDelivery: order.deliveryDate,
    timeline: order.statusHistory.map((entry) => ({
      status: entry.status,
      date: entry.date,
      location: entry.location,
      description:
        entry.status === 'CONFIRMED'
          ? i18n.t('orders.confirmedDescription', { ns: 'api' })
          : entry.status === 'DELIVERED'
            ? i18n.t('orders.deliveredDescription', { ns: 'api' })
            : i18n.t('orders.statusUpdate', { ns: 'api' }),
    })),
    mapPlaceholderUrl: 'https://cdn.citybox.com.br/maps/tracking-placeholder.png',
  };
}

export const ordersHandlers: HttpHandler[] = [
  http.get('*/me/orders', ({ request }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
    const status = url.searchParams.get('status');

    let orders = db.orders.map((o) => maybeAdvanceOrder({ ...o }));
    if (status) {
      orders = orders.filter((o) => o.status === status);
    }

    const start = (page - 1) * pageSize;
    const slice = orders.slice(start, start + pageSize);

    return okWithMeta({ orders: slice }, { page, pageSize, total: orders.length });
  }),

  http.get('*/me/orders/:orderId', ({ request, params }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const orderId = String(params.orderId);
    const idx = db.orders.findIndex((o) => o.id === orderId);
    if (idx < 0) {
      return errorResponse(404, 'NOT_FOUND', 'notFound.order');
    }

    const advanced = maybeAdvanceOrder({ ...db.orders[idx] });
    db.orders[idx] = advanced;

    const etag = orderEtag(orderId, advanced.status);
    const ifNoneMatch = request.headers.get('If-None-Match');
    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag } });
    }

    return ok(
      { order: advanced },
      {
        headers: {
          ETag: etag,
          'Last-Modified': new Date().toUTCString(),
        },
      },
    );
  }),

  http.get('*/me/orders/:orderId/tracking', ({ request, params }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const order = db.orders.find((o) => o.id === String(params.orderId));
    if (!order) {
      return errorResponse(404, 'NOT_FOUND', 'notFound.order');
    }
    return ok(buildTracking(maybeAdvanceOrder({ ...order })));
  }),

  http.post('*/me/orders/:orderId/buy-again', ({ request, params }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const order = db.orders.find((o) => o.id === String(params.orderId));
    if (!order) {
      return errorResponse(404, 'NOT_FOUND', 'notFound.order');
    }

    for (const item of order.items) {
      const current = db.cart.get(item.productId) ?? 0;
      db.cart.set(item.productId, current + item.quantity);
    }
    persistDb();
    return ok({ cart: buildCart() });
  }),

  http.get('*/me/orders/:orderId/invoice', ({ request, params }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const orderId = String(params.orderId);
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) {
      return errorResponse(404, 'NOT_FOUND', 'notFound.order');
    }

    return ok({
      invoiceUrl: `https://cdn.citybox.com.br/invoices/${orderId}.pdf`,
      nfKey: `3524${orderId.replace(/\D/g, '').padStart(44, '0')}`.slice(0, 44),
      issuedAt: order.createdAt ?? new Date().toISOString(),
    });
  }),

  http.post('*/me/orders/:orderId/cancel', async ({ request, params }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const orderId = String(params.orderId);
    const idx = db.orders.findIndex((o) => o.id === orderId);
    if (idx < 0) {
      return errorResponse(404, 'NOT_FOUND', 'notFound.order');
    }

    const order = db.orders[idx];
    if (!CANCELLABLE.has(order.status)) {
      return errorResponse(422, 'ORDER_NOT_CANCELLABLE', 'orders.notCancellable');
    }

    const body = await parseJson<{ reason?: string; description?: string }>(request);
    if (!body?.reason?.trim()) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.reasonRequired', 'reason');
    }

    db.orders[idx] = {
      ...order,
      status: 'CANCELLED',
      statusHistory: [
        ...order.statusHistory,
        {
          status: 'CANCELLED',
          date: new Date().toISOString(),
          location: i18n.t('orders.cancelledLocation', { ns: 'api' }),
        },
      ],
    };
    persistDb();
    return ok({ order: db.orders[idx] });
  }),

  http.post('*/me/orders/:orderId/returns', async ({ request, params }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const orderId = String(params.orderId);
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) {
      return errorResponse(404, 'NOT_FOUND', 'notFound.order');
    }

    const body = await parseJson<{
      item?: { productId: string; quantity: number };
      reason?: ApiReturnDetail['reason'];
      description?: string;
    }>(request);

    if (!body?.item?.productId || !body?.reason) {
      return errorResponse(422, 'VALIDATION_ERROR', 'validation.required', 'reason');
    }

    const returnId = nextId('RET');
    const detail: ApiReturnDetail = {
      returnId,
      orderId,
      status: 'REQUESTED',
      item: body.item,
      reason: body.reason,
      description: body.description ?? '',
      createdAt: new Date().toISOString(),
      instructions: i18n.t('orders.returnInstructions', { ns: 'api' }),
    };
    db.returns.push(detail);

    const idx = db.orders.findIndex((o) => o.id === orderId);
    if (idx >= 0) {
      db.orders[idx] = { ...db.orders[idx], status: 'RETURN_REQUESTED' };
    }
    persistDb();

    return ok(
      {
        returnId,
        status: 'REQUESTED',
        message: detail.instructions,
      },
      { status: 201 },
    );
  }),

  http.get('*/me/orders/:orderId/returns/:returnId', ({ request, params }) => {
    const unauthorized = requireAuth(request);
    if (unauthorized) return unauthorized;

    const detail = db.returns.find(
      (r) => r.returnId === String(params.returnId) && r.orderId === String(params.orderId),
    );
    if (!detail) {
      return errorResponse(404, 'NOT_FOUND', 'notFound.return');
    }
    return ok(detail);
  }),
];
