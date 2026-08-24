import { Injectable } from '@nestjs/common';
import { ApiError, notFound } from '../common/envelope.js';
import { InjectService } from '../common/inject.js';
import { getConsumerClient } from '../database/consumer.js';
import { CartService } from '../cart/cart.service.js';
import type { ConsumerUserRecord } from '../users/users.service.js';
import { orderEtag, toApiOrder, type OrderRow } from './order.presenter.js';

const CANCELLABLE = new Set(['CONFIRMED', 'PREPARING']);
const ORDER_INCLUDE = {
  items: true,
  statusHistory: { orderBy: { date: 'asc' as const } },
} as const;

const RETURN_INSTRUCTIONS = 'Você receberá instruções por e-mail em até 24h.';

const TIMELINE_DESCRIPTION: Record<string, string> = {
  CONFIRMED: 'Pedido confirmado',
  DELIVERED: 'Pedido entregue',
};

export interface CreateReturnInput {
  item?: { productId?: string; quantity?: number };
  reason?: string;
  description?: string;
}

@Injectable()
export class OrdersService {
  private readonly db = getConsumerClient();

  constructor(@InjectService(CartService) private readonly cart: CartService) {}

  /** Pedido escopado ao usuário — 404 se não existir ou for de outro user. */
  private async requireOrder(user: ConsumerUserRecord, orderId: string) {
    const order = await this.db.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: ORDER_INCLUDE,
    });
    if (!order) throw notFound('Pedido não encontrado');
    return order;
  }

  async list(
    user: ConsumerUserRecord,
    params: { page?: number; pageSize?: number; status?: string },
  ) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
    const where = { userId: user.id, ...(params.status && { status: params.status }) };
    const [rows, total] = await Promise.all([
      this.db.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.db.order.count({ where }),
    ]);
    return { orders: rows.map(toApiOrder), meta: { page, pageSize, total } };
  }

  async get(user: ConsumerUserRecord, orderId: string) {
    const order = await this.requireOrder(user, orderId);
    return { order: toApiOrder(order), etag: orderEtag(order) };
  }

  /** ApiTracking sintético coerente com o statusHistory (mock orders.ts#buildTracking). */
  async tracking(user: ConsumerUserRecord, orderId: string) {
    const order = await this.requireOrder(user, orderId);
    const api = toApiOrder(order);
    return {
      orderId: order.id,
      trackingCode: order.trackingCode ?? '',
      carrier: order.carrier ?? 'CityBox Logística',
      carrierUrl: `https://rastreio.citybox.com.br/${order.trackingCode ?? ''}`,
      currentStatus: order.status,
      estimatedDelivery: api.deliveryDate,
      timeline: api.statusHistory.map((entry) => ({
        status: entry.status,
        date: entry.date,
        location: entry.location,
        description: TIMELINE_DESCRIPTION[entry.status] ?? 'Atualização de status',
      })),
      mapPlaceholderUrl: 'https://cdn.citybox.com.br/maps/tracking-placeholder.png',
    };
  }

  /** Re-adiciona os itens do pedido ao carrinho (só produtos ainda published). */
  async buyAgain(user: ConsumerUserRecord, orderId: string) {
    const order = await this.requireOrder(user, orderId);
    const cart = await this.cart.addOrderItems(
      user.id,
      order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    );
    return { cart };
  }

  async invoice(user: ConsumerUserRecord, orderId: string) {
    const order = await this.requireOrder(user, orderId);
    return {
      invoiceUrl: `https://cdn.citybox.com.br/invoices/${order.id}.pdf`,
      nfKey: `3524${order.id.replace(/\D/g, '').padStart(44, '0')}`.slice(0, 44),
      issuedAt: order.createdAt.toISOString(),
    };
  }

  async cancel(
    user: ConsumerUserRecord,
    orderId: string,
    body: { reason?: string; description?: string },
  ) {
    const order = await this.requireOrder(user, orderId);
    if (!CANCELLABLE.has(order.status)) {
      throw new ApiError(422, 'ORDER_NOT_CANCELLABLE', 'Pedido não pode ser cancelado');
    }
    if (!body.reason?.trim()) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Motivo obrigatório', 'reason');
    }
    const updated = await this.db.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        statusHistory: {
          create: { status: 'CANCELLED', date: new Date(), location: 'Cancelado' },
        },
      },
      include: ORDER_INCLUDE,
    });
    return { order: toApiOrder(updated as OrderRow) };
  }

  async createReturn(user: ConsumerUserRecord, orderId: string, body: CreateReturnInput) {
    const order = await this.requireOrder(user, orderId);
    if (!body.item?.productId || !body.reason) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Campo obrigatório', 'reason');
    }
    const [detail] = await this.db.$transaction([
      this.db.returnRequest.create({
        data: {
          orderId: order.id,
          userId: user.id,
          productId: body.item.productId,
          quantity: body.item.quantity ?? 1,
          reason: body.reason,
          description: body.description ?? '',
          status: 'REQUESTED',
          instructions: RETURN_INSTRUCTIONS,
        },
      }),
      this.db.order.update({
        where: { id: order.id },
        data: {
          status: 'RETURN_REQUESTED',
          statusHistory: { create: { status: 'RETURN_REQUESTED', date: new Date() } },
        },
      }),
    ]);
    return { returnId: detail.id, status: detail.status, message: detail.instructions };
  }

  async getReturn(user: ConsumerUserRecord, orderId: string, returnId: string) {
    const detail = await this.db.returnRequest.findFirst({
      where: { id: returnId, orderId, userId: user.id },
    });
    if (!detail) throw notFound('Devolução não encontrada');
    return {
      returnId: detail.id,
      orderId: detail.orderId,
      status: detail.status,
      item: { productId: detail.productId, quantity: detail.quantity },
      reason: detail.reason,
      description: detail.description,
      createdAt: detail.createdAt.toISOString(),
      instructions: detail.instructions ?? RETURN_INSTRUCTIONS,
    };
  }
}
