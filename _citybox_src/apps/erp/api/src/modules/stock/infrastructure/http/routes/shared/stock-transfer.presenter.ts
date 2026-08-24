import type { StockTransfer } from '../../../../domain/entities/stock-transfer.entity';
import type { StockTransferListItem } from '../../../../domain/repositories/stock-transfer.repository.interface';
import type { ListStockTransfersResult } from '../../../../application/dtos/stock-transfer.dto';

export class StockTransferPresenter {
  static toHttpListItem(item: StockTransferListItem) {
    const { transfer } = item;
    return {
      id: transfer.id,
      status: transfer.status,
      fromStockId: transfer.fromStockId,
      toStockId: transfer.toStockId,
      fromStockName: item.fromStockName,
      toStockName: item.toStockName,
      operatedAt: transfer.operatedAt.toISOString(),
      carrierId: transfer.carrierId,
      responsibleName: transfer.responsibleName,
      notes: transfer.notes,
      itemsCount: transfer.itemsCount,
      createdAt: transfer.createdAt.toISOString(),
      cancelledAt: transfer.cancelledAt?.toISOString() ?? null,
    };
  }

  static toHttpList(result: ListStockTransfersResult) {
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

  static toHttpCreated(transfer: StockTransfer) {
    return {
      data: {
        id: transfer.id,
        status: transfer.status,
        fromStockId: transfer.fromStockId,
        toStockId: transfer.toStockId,
        operatedAt: transfer.operatedAt.toISOString(),
        carrierId: transfer.carrierId,
        responsibleName: transfer.responsibleName,
        notes: transfer.notes,
        itemsCount: transfer.itemsCount,
        outboundMovementId: transfer.outboundMovementId,
        inboundMovementId: transfer.inboundMovementId,
        createdAt: transfer.createdAt.toISOString(),
        lines: transfer.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          batch: line.batch,
        })),
      },
    };
  }

  static toHttpCancelled(transfer: StockTransfer) {
    return {
      data: {
        id: transfer.id,
        status: transfer.status,
        cancelledAt: transfer.cancelledAt?.toISOString() ?? null,
      },
    };
  }
}
