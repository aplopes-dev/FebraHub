import type { SaleOrder } from '../../../../../sales/domain/entities/sale-order.entity';

export class PosSalePresenter {
  static toHttpSingle(saleOrder: SaleOrder) {
    return {
      data: {
        id: saleOrder.id,
        number: saleOrder.number,
        totalCents: saleOrder.totalCents,
        consumerDocument: saleOrder.consumerDocument,
        customerId: saleOrder.customerId,
        customerName: saleOrder.customerName,
        status: saleOrder.status,
        channelId: saleOrder.channelId,
        sellerId: saleOrder.sellerId,
        sellerName: saleOrder.sellerName,
        createdByName: saleOrder.createdByName,
        notes: saleOrder.notes,
        deliveryFeeCents: saleOrder.deliveryFeeCents,
        discountsCents: saleOrder.discountsCents,
        stockMovementId: saleOrder.stockMovementId,
        createdAt: saleOrder.createdAt.toISOString(),
        lines: saleOrder.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
        })),
        payments: saleOrder.payments.map((payment) => ({
          id: payment.id,
          amountCents: payment.amountCents,
          methodId: payment.methodId,
          cardPaymentType: payment.cardPaymentType ?? null,
          brand: payment.brand ?? null,
          installments: payment.installments ?? null,
        })),
      },
    };
  }
}
