import { PLACEHOLDER_STORE } from '@/features/shared';
import type { PosOrder } from '../types/order';
import type { ReceiptData } from '../types/receipt';

/**
 * Pedidos já registrados não guardam valor recebido/troco — usamos o total
 * do pedido como valor recebido e sem desconto, igual ao recibo gerado logo
 * após o pagamento no PDV.
 */
export function buildOrderReceiptData(order: PosOrder): ReceiptData {
  return {
    orderId: order.id,
    paidAtIso: order.date,
    storeName: PLACEHOLDER_STORE.name,
    storeAddress: PLACEHOLDER_STORE.address,
    storeLogoUrl: PLACEHOLDER_STORE.logoUrl,
    salespersonName: 'Operador PDV',
    customerName: order.customerName !== '-' ? order.customerName : null,
    items: order.items,
    subtotalCents: order.totalCents,
    discountCents: 0,
    totalCents: order.totalCents,
    receivedCents: order.totalCents,
    changeCents: 0,
    paymentMethod: order.paymentMethod,
  };
}
