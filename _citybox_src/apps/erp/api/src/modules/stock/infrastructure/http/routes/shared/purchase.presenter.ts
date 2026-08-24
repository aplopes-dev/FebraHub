import type { Purchase } from '../../../../domain/entities/purchase.entity';
import type {
  PurchaseDetail,
  PurchaseListItem,
} from '../../../../domain/repositories/purchase.repository.interface';
import type { ListPurchasesResult } from '../../../../application/dtos/purchase.dto';

export class PurchasePresenter {
  static toHttpListItem(item: PurchaseListItem) {
    const { purchase } = item;
    return {
      id: purchase.id,
      stockId: purchase.stockId,
      stockName: item.stockName,
      supplierId: purchase.supplierId,
      supplierName: item.supplierName,
      carrierId: purchase.carrierId,
      carrierName: item.carrierName,
      deliveryStatus: purchase.deliveryStatus,
      purchasedAt: purchase.purchasedAt.toISOString(),
      series: purchase.series,
      invoiceNumber: purchase.invoiceNumber,
      itemsCount: purchase.itemsCount,
      totalCents: purchase.totalCents,
      stockMovementId: purchase.stockMovementId,
      deletedAt: purchase.deletedAt?.toISOString() ?? null,
      createdAt: purchase.createdAt.toISOString(),
    };
  }

  static toHttpList(result: ListPurchasesResult) {
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

  static toHttpDetail(detail: PurchaseDetail) {
    const { purchase } = detail;
    return {
      data: {
        id: purchase.id,
        stockId: purchase.stockId,
        stockName: detail.stockName,
        supplierId: purchase.supplierId,
        supplierName: detail.supplierName,
        carrierId: purchase.carrierId,
        carrierName: detail.carrierName,
        deliveryStatus: purchase.deliveryStatus,
        purchasedAt: purchase.purchasedAt.toISOString(),
        series: purchase.series,
        invoiceNumber: purchase.invoiceNumber,
        notes: purchase.notes,
        freightCents: purchase.freightCents,
        discountsCents: purchase.discountsCents,
        otherExpensesCents: purchase.otherExpensesCents,
        linesTotalCents: purchase.linesTotalCents,
        totalCents: purchase.totalCents,
        stockMovementId: purchase.stockMovementId,
        deletedAt: purchase.deletedAt?.toISOString() ?? null,
        createdAt: purchase.createdAt.toISOString(),
        updatedAt: purchase.updatedAt.toISOString(),
        lines: detail.lines.map((line) => ({
          productId: line.productId,
          productName: line.productName,
          productSku: line.productSku,
          quantity: line.quantity,
          costCents: line.costCents,
          status: line.status,
        })),
      },
    };
  }

  static toHttpSingle(purchase: Purchase) {
    return {
      data: {
        id: purchase.id,
        stockId: purchase.stockId,
        supplierId: purchase.supplierId,
        carrierId: purchase.carrierId,
        deliveryStatus: purchase.deliveryStatus,
        purchasedAt: purchase.purchasedAt.toISOString(),
        series: purchase.series,
        invoiceNumber: purchase.invoiceNumber,
        notes: purchase.notes,
        freightCents: purchase.freightCents,
        discountsCents: purchase.discountsCents,
        otherExpensesCents: purchase.otherExpensesCents,
        linesTotalCents: purchase.linesTotalCents,
        totalCents: purchase.totalCents,
        stockMovementId: purchase.stockMovementId,
        deletedAt: purchase.deletedAt?.toISOString() ?? null,
        createdAt: purchase.createdAt.toISOString(),
        updatedAt: purchase.updatedAt.toISOString(),
        lines: purchase.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          costCents: line.costCents,
          status: line.status,
        })),
      },
    };
  }
}
