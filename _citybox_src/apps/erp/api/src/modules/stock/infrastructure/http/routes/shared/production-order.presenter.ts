import type { ProductionOrder } from '../../../../domain/entities/production-order.entity';
import type { ProductionHistoryEntry } from '../../../../domain/entities/production-history-entry.entity';
import type { ProductionOrderListRow } from '../../../../domain/repositories/production-order.repository.interface';
import type {
  FindProductionOrderByIdResult,
  ListProductionOrdersResult,
} from '../../../../application/dtos/production-order.dto';

export class ProductionOrderPresenter {
  static toHttpListItem(row: ProductionOrderListRow) {
    const { order } = row;
    return {
      id: order.id,
      status: order.status,
      productId: order.productId,
      productName: row.productName,
      productSku: row.productSku,
      plannedQuantity: order.plannedQuantity,
      producedQuantity: order.producedQuantity,
      sourceStockId: order.sourceStockId,
      sourceStockName: row.sourceStockName,
      destinationStockId: order.destinationStockId,
      destinationStockName: row.destinationStockName,
      expectedDate: order.expectedDate.toISOString(),
      observation: order.observation,
      startedAt: order.startedAt?.toISOString() ?? null,
      completedAt: order.completedAt?.toISOString() ?? null,
      cancelledAt: order.cancelledAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
    };
  }

  static toHttpList(result: ListProductionOrdersResult) {
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

  static toHttpDetail(result: FindProductionOrderByIdResult) {
    const { order } = result;
    return {
      data: {
        id: order.id,
        status: order.status,
        productId: order.productId,
        productName: result.productName,
        productSku: result.productSku,
        plannedQuantity: order.plannedQuantity,
        producedQuantity: order.producedQuantity,
        sourceStockId: order.sourceStockId,
        sourceStockName: result.sourceStockName,
        destinationStockId: order.destinationStockId,
        destinationStockName: result.destinationStockName,
        expectedDate: order.expectedDate.toISOString(),
        observation: order.observation,
        outboundMovementId: order.outboundMovementId,
        inboundMovementId: order.inboundMovementId,
        startedAt: order.startedAt?.toISOString() ?? null,
        completedAt: order.completedAt?.toISOString() ?? null,
        cancelledAt: order.cancelledAt?.toISOString() ?? null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        insumos: result.insumos,
      },
    };
  }

  static toHttpSingle(order: ProductionOrder) {
    return {
      data: {
        id: order.id,
        status: order.status,
        productId: order.productId,
        plannedQuantity: order.plannedQuantity,
        producedQuantity: order.producedQuantity,
        sourceStockId: order.sourceStockId,
        destinationStockId: order.destinationStockId,
        expectedDate: order.expectedDate.toISOString(),
        observation: order.observation,
        outboundMovementId: order.outboundMovementId,
        inboundMovementId: order.inboundMovementId,
        startedAt: order.startedAt?.toISOString() ?? null,
        completedAt: order.completedAt?.toISOString() ?? null,
        cancelledAt: order.cancelledAt?.toISOString() ?? null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      },
    };
  }

  static toHttpHistoryItem(entry: ProductionHistoryEntry) {
    return {
      id: entry.id,
      kind: entry.kind,
      title: entry.title,
      description: entry.description,
      userName: entry.userName,
      createdAt: entry.createdAt.toISOString(),
    };
  }

  static toHttpHistoryList(entries: ProductionHistoryEntry[]) {
    return {
      data: entries.map((entry) => this.toHttpHistoryItem(entry)),
    };
  }
}
