import type {
  Inventory,
  InventoryLine,
  InventoryListItem,
} from "@/features/stock-inventory/types/inventory";
import type {
  InventoryDetailDto,
  InventoryLineDto,
  InventoryListItemDto,
} from "@/features/stock-inventory/api/inventory.dto";

function toNumber(raw: string): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function toInventoryLine(dto: InventoryLineDto): InventoryLine {
  return {
    productId: dto.productId,
    systemQuantity: toNumber(dto.systemQuantity),
    countedQuantity: toNumber(dto.countedQuantity),
    unit: dto.unit ?? "un",
    productName: dto.productName,
    productSku: dto.productSku,
  };
}

export function toInventoryListItem(dto: InventoryListItemDto): InventoryListItem {
  return {
    id: dto.id,
    stockId: dto.stockId,
    name: dto.name,
    status: dto.status,
    createdAt: dto.createdAt,
    completedAt: dto.completedAt,
    lines: [],
    itemsCount: dto.itemsCount,
    divergentCount: dto.divergentCount,
  };
}

export function toInventoryDetail(dto: InventoryDetailDto): Inventory {
  return {
    id: dto.id,
    stockId: dto.stockId,
    name: dto.name,
    status: dto.status,
    createdAt: dto.createdAt,
    completedAt: dto.completedAt,
    lines: dto.lines.map(toInventoryLine),
    itemsCount: dto.itemsCount,
    divergentCount: dto.divergentCount,
  };
}
