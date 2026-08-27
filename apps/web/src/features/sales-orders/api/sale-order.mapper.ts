import type {
  SaleOrderDetailDto,
  SaleOrderListItemDto,
  SaveSaleOrderPayload,
} from "@/features/sales-orders/api/sale-order.dto";
import type {
  SaleOrder,
  SaleOrderChannelId,
} from "@/features/sales-orders/types/sale-order";
import type {
  SaleOrderFormValues,
  SaleOrderLine,
  SaleOrderPayment,
} from "@/features/sales-orders/types/sale-order-form";

const CENTS = 100;

export function centsToReais(cents: number): number {
  return cents / CENTS;
}

export function reaisToCents(reais: number): number {
  return Math.round(reais * CENTS);
}

export function toSaleOrderListItem(dto: SaleOrderListItemDto): SaleOrder {
  return {
    id: dto.id,
    number: dto.number,
    customerName: dto.customerName,
    totalAmount: centsToReais(dto.totalCents),
    status: dto.status,
    channelId: dto.channelId,
    createdBy: dto.createdByName,
    createdAt: dto.createdAt,
    deletedAt: dto.deletedAt,
    stockMovementId: dto.stockMovementId,
    warehouseId: dto.stockId ?? undefined,
    customerId: dto.customerId ?? undefined,
    sellerId: dto.sellerId ?? undefined,
    posDeliveryOrderId: dto.posDeliveryOrderId ?? null,
    posDeliveryOrderNumber: dto.posDeliveryOrderNumber ?? null,
    posDeliveryFulfillment: dto.posDeliveryFulfillment ?? null,
  };
}

export function toSaleOrderDetail(dto: SaleOrderDetailDto): SaleOrder {
  return {
    id: dto.id,
    number: dto.number,
    customerName: dto.customerName,
    totalAmount: centsToReais(dto.totalCents),
    status: dto.status,
    channelId: dto.channelId,
    createdBy: dto.createdByName,
    createdAt: dto.createdAt,
    deletedAt: dto.deletedAt,
    stockMovementId: dto.stockMovementId,
    warehouseId: dto.stockId ?? undefined,
    customerId: dto.customerId ?? undefined,
    sellerId: dto.sellerId ?? undefined,
    notes: dto.notes,
    deliveryFee: centsToReais(dto.deliveryFeeCents),
    discounts: centsToReais(dto.discountsCents),
    posDeliveryOrderId: dto.posDeliveryOrderId ?? null,
    posDeliveryOrderNumber: dto.posDeliveryOrderNumber ?? null,
    posDeliveryFulfillment: dto.posDeliveryFulfillment ?? null,
    lines: dto.lines.map(
      (line): SaleOrderLine => ({
        productId: line.productId,
        quantity: Number(line.quantity),
        unitPrice: centsToReais(line.unitPriceCents),
      }),
    ),
    payments: dto.payments.map(
      (payment, index): SaleOrderPayment => ({
        id: payment.id ?? `pay-${index}`,
        amount: centsToReais(payment.amountCents),
        paymentMethodId: payment.methodId,
        bankAccountId: payment.bankAccountId ?? "",
        cardPaymentType: payment.cardPaymentType ?? undefined,
        brand: payment.brand ?? undefined,
        installments: payment.installments ?? undefined,
      }),
    ),
  };
}

export function saleOrderToFormValues(order: SaleOrder): SaleOrderFormValues {
  return {
    warehouseId: order.warehouseId ?? "",
    customerId: order.customerId ?? "",
    soldAt: order.createdAt.slice(0, 10),
    status: order.status,
    sellerId: order.sellerId ?? "",
    notes: order.notes ?? "",
    lines: order.lines?.map((line) => ({ ...line })) ?? [],
    payments:
      order.payments?.map((payment) => ({ ...payment })) ?? [],
    deliveryFee: order.deliveryFee ?? 0,
    discounts: order.discounts ?? 0,
  };
}

export function formValuesToSavePayload(
  values: SaleOrderFormValues,
  customerName: string,
  sellerName: string,
  channelId: SaleOrderChannelId = "pdv",
): SaveSaleOrderPayload {
  return {
    customerId: values.customerId || null,
    customerName,
    stockId: values.warehouseId || null,
    status: values.status,
    channelId,
    sellerId: values.sellerId || null,
    sellerName,
    notes: values.notes,
    deliveryFeeCents: reaisToCents(values.deliveryFee),
    discountsCents: reaisToCents(values.discounts),
    lines: values.lines.map((line) => ({
      productId: line.productId,
      quantity: String(line.quantity),
      unitPriceCents: reaisToCents(line.unitPrice),
    })),
    payments: values.payments.map((payment) => ({
      amountCents: reaisToCents(payment.amount),
      methodId: payment.paymentMethodId,
      bankAccountId: payment.bankAccountId || null,
      cardPaymentType: payment.cardPaymentType,
      brand: payment.brand,
      installments: payment.installments,
    })),
  };
}
