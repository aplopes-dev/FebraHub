import type {
  PurchaseDetailDto,
  PurchaseListItemDto,
  SavePurchasePayload,
} from "@/features/purchases/api/purchase.dto";
import type {
  PurchaseDetail,
  PurchaseFormValues,
  PurchaseListItem,
} from "@/features/purchases/types/purchase";

function toReais(cents: number): number {
  return cents / 100;
}

function toCents(reais: number): number {
  return Math.round(reais * 100);
}

export function toPurchaseListItem(dto: PurchaseListItemDto): PurchaseListItem {
  return {
    id: dto.id,
    deliveryStatus: dto.deliveryStatus,
    warehouseId: dto.stockId,
    warehouseName: dto.stockName,
    supplierId: dto.supplierId,
    supplierName: dto.supplierName,
    purchasedAt: dto.purchasedAt.slice(0, 10),
    series: dto.series,
    invoiceNumber: dto.invoiceNumber,
    itemsCount: dto.itemsCount,
    totalAmount: toReais(dto.totalCents),
    stockMovementId: dto.stockMovementId,
    createdAt: dto.createdAt,
    deletedAt: dto.deletedAt,
  };
}

export function toPurchaseDetail(dto: PurchaseDetailDto): PurchaseDetail {
  return {
    id: dto.id,
    deliveryStatus: dto.deliveryStatus,
    warehouseId: dto.stockId,
    warehouseName: dto.stockName,
    supplierId: dto.supplierId,
    supplierName: dto.supplierName,
    purchasedAt: dto.purchasedAt.slice(0, 10),
    series: dto.series,
    invoiceNumber: dto.invoiceNumber,
    notes: dto.notes,
    lines: dto.lines.map((line) => ({
      productId: line.productId,
      productName: line.productName,
      productSku: line.productSku,
      quantity: Number(line.quantity),
      costPrice: toReais(line.costCents),
      status: line.status,
    })),
    extras: {
      carrierId: dto.carrierId ?? "",
      freight: toReais(dto.freightCents),
      discounts: toReais(dto.discountsCents),
      otherExpenses: toReais(dto.otherExpensesCents),
    },
    totalAmount: toReais(dto.totalCents),
    stockMovementId: dto.stockMovementId,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    deletedAt: dto.deletedAt,
  };
}

export function toSavePurchasePayload(
  values: PurchaseFormValues,
): SavePurchasePayload {
  const carrierId = values.extras.carrierId.trim();
  const series = values.series.trim();
  const invoiceNumber = values.invoiceNumber.trim();
  const notes = values.notes.trim();

  return {
    stockId: values.warehouseId,
    supplierId: values.supplierId,
    ...(carrierId ? { carrierId } : {}),
    deliveryStatus: values.deliveryStatus,
    purchasedAt: values.purchasedAt,
    ...(series ? { series } : {}),
    ...(invoiceNumber ? { invoiceNumber } : {}),
    ...(notes ? { notes } : {}),
    freightCents: toCents(values.extras.freight),
    discountsCents: toCents(values.extras.discounts),
    otherExpensesCents: toCents(values.extras.otherExpenses),
    lines: values.lines.map((line) => ({
      productId: line.productId,
      quantity: String(line.quantity),
      costCents: toCents(line.costPrice),
      status: line.status,
    })),
  };
}
