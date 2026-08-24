import type { StockMovement } from '../../../../domain/entities/stock-movement.entity';
import type {
  ListStockBalanceResult,
  ListStockMovementsResult,
  ProductStockMovementLine,
  StockMovementDetail,
} from '../../../../application/dtos/stock-movement.dto';
import type { StockMovementListItem } from '../../../../domain/repositories/stock-movement.repository.interface';

export class StockMovementPresenter {
  static toHttpListItem(item: StockMovementListItem) {
    const { movement } = item;
    return {
      id: movement.id,
      type: movement.type,
      reason: movement.reason,
      categoryId: movement.categoryId,
      categoryName: item.categoryName,
      stockId: movement.stockId,
      stockName: item.stockName,
      operatedAt: movement.operatedAt.toISOString(),
      itemsCount: movement.itemsCount,
      totalCostCents: movement.totalCostCents,
      userName: item.userName,
      createdAt: movement.createdAt.toISOString(),
    };
  }

  static toHttpList(result: ListStockMovementsResult) {
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

  static toHttpDetail(detail: StockMovementDetail) {
    return {
      data: {
        ...this.toHttpListItem(detail),
        sourceType: detail.movement.sourceType,
        sourceId: detail.movement.sourceId,
        lines: detail.lines,
      },
    };
  }

  static toHttpCreated(movement: StockMovement) {
    return {
      data: {
        id: movement.id,
        type: movement.type,
        reason: movement.reason,
        categoryId: movement.categoryId,
        stockId: movement.stockId,
        operatedAt: movement.operatedAt.toISOString(),
        itemsCount: movement.itemsCount,
        totalCostCents: movement.totalCostCents,
        createdAt: movement.createdAt.toISOString(),
      },
    };
  }

  static toHttpBalance(result: ListStockBalanceResult) {
    return {
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }

  static toHttpProductMovements(lines: ProductStockMovementLine[]) {
    return {
      data: lines.map((line) => ({
        movementId: line.movementId,
        type: line.type,
        reason: line.reason,
        categoryName: line.categoryName,
        operatedAt: line.operatedAt.toISOString(),
        quantity: line.quantity,
        costCents: line.costCents,
      })),
    };
  }
}
