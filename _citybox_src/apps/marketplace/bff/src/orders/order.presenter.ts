import { money } from '../common/money.js';
import type { ApiAddressShape, ApiProductShape } from '../checkout/checkout.pricing.js';
import type { StoredPayment } from '../checkout/payment.presenter.js';

export interface OrderStatusEntryRow {
  status: string;
  date: Date;
  location: string | null;
}

export interface OrderItemRow {
  productId: string;
  productSnapshot: unknown;
  quantity: number;
  unitPrice: unknown;
  subtotal: unknown;
}

export interface OrderRow {
  id: string;
  status: string;
  subtotal: unknown;
  shipping: unknown;
  discount: unknown;
  pixDiscount: unknown;
  total: unknown;
  deliveryDate: Date;
  address: unknown;
  payment: unknown;
  trackingCode: string | null;
  carrier: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemRow[];
  statusHistory: OrderStatusEntryRow[];
}

export function toApiOrderItem(row: OrderItemRow) {
  return {
    productId: row.productId,
    product: row.productSnapshot as ApiProductShape,
    quantity: row.quantity,
    unitPrice: money(row.unitPrice as never),
    subtotal: money(row.subtotal as never),
  };
}

export function toApiStatusEntry(entry: OrderStatusEntryRow) {
  return {
    status: entry.status,
    date: entry.date.toISOString(),
    location: entry.location ?? undefined,
  };
}

/**
 * deliveryDate no contrato é texto de exibição (mock: "amanhã até 22h" /
 * "entregue") — web e iOS renderizam a string como veio.
 */
export function deliveryLabel(status: string, deliveryDate: Date): string {
  if (status === 'DELIVERED') return 'entregue';
  if (status === 'CANCELLED') return '—';
  const dd = String(deliveryDate.getDate()).padStart(2, '0');
  const mm = String(deliveryDate.getMonth() + 1).padStart(2, '0');
  return `até ${dd}/${mm}`;
}

/** Molda Order (+items/statusHistory) no shape ApiOrder do contrato. */
export function toApiOrder(row: OrderRow) {
  const payment = row.payment as StoredPayment | null;
  const discount = money(row.discount as never);
  const pixDiscount = money(row.pixDiscount as never);
  return {
    id: row.id,
    items: row.items.map(toApiOrderItem),
    status: row.status,
    deliveryDate: deliveryLabel(row.status, row.deliveryDate),
    address: row.address as ApiAddressShape,
    paymentMethod: payment?.method,
    subtotal: money(row.subtotal as never),
    shipping: money(row.shipping as never),
    // Mock apresenta discount = cupom + PIX (checkout-logic.ts#createOrderFromRequest)
    discount: money(discount + pixDiscount),
    pixDiscount,
    total: money(row.total as never),
    trackingCode: row.trackingCode,
    carrier: row.carrier,
    statusHistory: [...row.statusHistory]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(toApiStatusEntry),
    createdAt: row.createdAt.toISOString(),
  };
}

/** ETag fraco baseado no updatedAt (suporte a If-None-Match / 304). */
export function orderEtag(row: { updatedAt: Date }): string {
  return `W/"${row.updatedAt.getTime()}"`;
}
