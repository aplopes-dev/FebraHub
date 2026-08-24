import type { SaleOrder } from '../../../../domain/entities/sale-order.entity';
import type { SaleOrderDetail } from '../../../../domain/repositories/sale-order.repository.interface';
import type {
  ListSaleOrdersResult,
  SaleOrderListItemDto,
} from '../../../../application/dtos/sale-order.dto';

export class SaleOrderPresenter {
  static toHttpListItem(item: SaleOrderListItemDto) {
    const { saleOrder } = item;
    return {
      id: saleOrder.id,
      number: saleOrder.number,
      customerId: saleOrder.customerId,
      customerName: saleOrder.customerName,
      consumerDocument: saleOrder.consumerDocument,
      stockId: saleOrder.stockId,
      stockName: item.stockName,
      status: saleOrder.status,
      channelId: saleOrder.channelId,
      sellerName: saleOrder.sellerName,
      totalCents: saleOrder.totalCents,
      stockMovementId: saleOrder.stockMovementId,
      posDeliveryOrderId: item.posDeliveryOrderId ?? null,
      posDeliveryOrderNumber: item.posDeliveryOrderNumber ?? null,
      posDeliveryFulfillment: item.posDeliveryFulfillment ?? null,
      deletedAt: saleOrder.deletedAt?.toISOString() ?? null,
      createdAt: saleOrder.createdAt.toISOString(),
      // spec erp/029 (FR-010) — habilita o botão de baixar XML/DANFE nas
      // telas de Vendas e Pedidos de venda sem uma chamada extra por linha.
      nfeIssuance: item.nfeIssuance,
    };
  }

  static toHttpList(result: ListSaleOrdersResult) {
    return {
      data: result.items.map((item) => this.toHttpListItem(item)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
      tabCounts: result.tabCounts,
    };
  }

  static toHttpDetail(detail: SaleOrderDetail) {
    const { saleOrder } = detail;
    return {
      data: {
        id: saleOrder.id,
        number: saleOrder.number,
        customerId: saleOrder.customerId,
        customerName: saleOrder.customerName,
        consumerDocument: saleOrder.consumerDocument,
        stockId: saleOrder.stockId,
        stockName: detail.stockName,
        status: saleOrder.status,
        channelId: saleOrder.channelId,
        sellerId: saleOrder.sellerId,
        sellerName: saleOrder.sellerName,
        createdByName: saleOrder.createdByName,
        notes: saleOrder.notes,
        deliveryFeeCents: saleOrder.deliveryFeeCents,
        discountsCents: saleOrder.discountsCents,
        totalCents: saleOrder.totalCents,
        stockMovementId: saleOrder.stockMovementId,
        posDeliveryOrderId: detail.posDeliveryOrderId,
        posDeliveryOrderNumber: detail.posDeliveryOrderNumber,
        posDeliveryFulfillment: detail.posDeliveryFulfillment,
        deletedAt: saleOrder.deletedAt?.toISOString() ?? null,
        createdAt: saleOrder.createdAt.toISOString(),
        updatedAt: saleOrder.updatedAt.toISOString(),
        lines: detail.lines.map((line) => ({
          productId: line.productId,
          // Linha de serviço (sem produto) usa `description` como rótulo
          // (spec erp/031 D1) — `productName` fica `null` nesse caso.
          productName: line.productName ?? line.description,
          productSku: line.productSku,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
          subtotalCents: line.subtotalCents,
        })),
        payments: saleOrder.payments.map((payment) => ({
          id: payment.id,
          amountCents: payment.amountCents,
          methodId: payment.methodId,
          bankAccountId: payment.bankAccountId,
          cardPaymentType: payment.cardPaymentType ?? null,
          brand: payment.brand ?? null,
          installments: payment.installments ?? null,
        })),
      },
    };
  }

  static toHttpSingle(saleOrder: SaleOrder) {
    return {
      data: {
        id: saleOrder.id,
        number: saleOrder.number,
        customerId: saleOrder.customerId,
        customerName: saleOrder.customerName,
        consumerDocument: saleOrder.consumerDocument,
        stockId: saleOrder.stockId,
        status: saleOrder.status,
        channelId: saleOrder.channelId,
        sellerId: saleOrder.sellerId,
        sellerName: saleOrder.sellerName,
        createdByName: saleOrder.createdByName,
        notes: saleOrder.notes,
        deliveryFeeCents: saleOrder.deliveryFeeCents,
        discountsCents: saleOrder.discountsCents,
        totalCents: saleOrder.totalCents,
        stockMovementId: saleOrder.stockMovementId,
        deletedAt: saleOrder.deletedAt?.toISOString() ?? null,
        createdAt: saleOrder.createdAt.toISOString(),
        updatedAt: saleOrder.updatedAt.toISOString(),
        lines: saleOrder.lines.map((line) => ({
          productId: line.productId,
          description: line.description,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
        })),
        payments: saleOrder.payments.map((payment) => ({
          id: payment.id,
          amountCents: payment.amountCents,
          methodId: payment.methodId,
          bankAccountId: payment.bankAccountId,
          cardPaymentType: payment.cardPaymentType ?? null,
          brand: payment.brand ?? null,
          installments: payment.installments ?? null,
        })),
      },
    };
  }
}
