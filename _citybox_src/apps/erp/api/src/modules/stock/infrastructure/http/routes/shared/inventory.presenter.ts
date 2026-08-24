import type { Inventory } from '../../../../domain/entities/inventory.entity';
import type {
  InventoryDetail,
  InventoryListItem,
} from '../../../../domain/repositories/inventory.repository.interface';
import type {
  CreateInventoryResult,
  ListInventoriesResult,
} from '../../../../application/dtos/inventory.dto';

export class InventoryPresenter {
  static toHttpListItem(item: InventoryListItem) {
    const { inventory } = item;
    return {
      id: inventory.id,
      stockId: inventory.stockId,
      name: inventory.name,
      status: inventory.status,
      createdAt: inventory.createdAt.toISOString(),
      completedAt: inventory.completedAt?.toISOString() ?? null,
      itemsCount: item.itemsCount,
      divergentCount: item.divergentCount,
    };
  }

  static toHttpList(result: ListInventoriesResult) {
    return {
      data: result.items.map((item) => this.toHttpListItem(item)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }

  static toHttpDetail(detail: InventoryDetail) {
    const { inventory } = detail;
    return {
      data: {
        id: inventory.id,
        stockId: inventory.stockId,
        name: inventory.name,
        status: inventory.status,
        createdAt: inventory.createdAt.toISOString(),
        completedAt: inventory.completedAt?.toISOString() ?? null,
        itemsCount: inventory.itemsCount,
        divergentCount: inventory.divergentCount,
        lines: detail.lines.map((line) => ({
          productId: line.productId,
          productName: line.productName,
          productSku: line.productSku,
          unit: line.unit,
          systemQuantity: line.systemQuantity,
          countedQuantity: line.countedQuantity,
        })),
      },
    };
  }

  static toHttpCreated(result: CreateInventoryResult) {
    const { inventory } = result;
    return {
      data: {
        id: inventory.id,
        stockId: inventory.stockId,
        name: inventory.name,
        status: inventory.status,
        createdAt: inventory.createdAt.toISOString(),
        completedAt: inventory.completedAt?.toISOString() ?? null,
        itemsCount: result.itemsCount,
        divergentCount: result.divergentCount,
        lines: inventory.lines.map((line) => ({
          productId: line.productId,
          systemQuantity: line.systemQuantity,
          countedQuantity: line.countedQuantity,
        })),
      },
    };
  }

  static toHttpCreatedFromEntity(inventory: Inventory) {
    return this.toHttpCreated({
      inventory,
      itemsCount: inventory.itemsCount,
      divergentCount: inventory.divergentCount,
    });
  }
}
