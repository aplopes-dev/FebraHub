import type { StockTransferListItemDto } from "@/features/stock-transfers/api/stock-transfer.dto";
import type { StockTransferListItem } from "@/features/stock-transfers/types/stock-transfer";

export function toStockTransferListItem(
  dto: StockTransferListItemDto,
): StockTransferListItem {
  return {
    id: dto.id,
    status: dto.status,
    fromWarehouseId: dto.fromStockId,
    toWarehouseId: dto.toStockId,
    fromWarehouseName: dto.fromStockName,
    toWarehouseName: dto.toStockName,
    operatedAt: dto.operatedAt.slice(0, 10),
    carrierId: dto.carrierId ?? undefined,
    responsibleName: dto.responsibleName,
    notes: dto.notes,
    lines: [],
    createdAt: dto.createdAt,
    cancelledAt: dto.cancelledAt ?? undefined,
  };
}
