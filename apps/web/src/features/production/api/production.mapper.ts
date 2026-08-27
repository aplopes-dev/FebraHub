import type {
  ProductionHistoryEntryDto,
  ProductionInsumoDto,
  ProductionOrderDetailDto,
  ProductionOrderListItemDto,
} from "@/features/production/api/production.dto";
import type {
  ComputedInsumo,
  ProductionHistoryEntry,
  ProductionOrder,
  ProductionOrderDetail,
} from "@/features/production/types/production";

export function toProductionOrder(
  dto: ProductionOrderListItemDto,
): ProductionOrder {
  return {
    id: dto.id,
    status: dto.status,
    productId: dto.productId,
    productName: dto.productName,
    productSku: dto.productSku,
    plannedQuantity: Number(dto.plannedQuantity),
    producedQuantity:
      dto.producedQuantity != null ? Number(dto.producedQuantity) : null,
    sourceStockId: dto.sourceStockId,
    sourceStockName: dto.sourceStockName,
    destinationStockId: dto.destinationStockId,
    destinationStockName: dto.destinationStockName,
    expectedDate: dto.expectedDate.slice(0, 10),
    observation: dto.observation,
    createdAt: dto.createdAt,
    startedAt: dto.startedAt,
    completedAt: dto.completedAt,
    cancelledAt: dto.cancelledAt,
  };
}

export function toComputedInsumo(dto: ProductionInsumoDto): ComputedInsumo {
  return {
    componentProductId: dto.componentProductId,
    name: dto.name,
    unit: dto.unit,
    quantityPerUnit: Number(dto.quantityPerUnit),
    totalQuantity: Number(dto.totalQuantity),
    unitCostCents: dto.unitCostCents,
    totalCostCents: dto.totalCostCents,
  };
}

export function toProductionOrderDetail(
  dto: ProductionOrderDetailDto,
): ProductionOrderDetail {
  return {
    ...toProductionOrder(dto),
    updatedAt: dto.updatedAt,
    outboundMovementId: dto.outboundMovementId,
    inboundMovementId: dto.inboundMovementId,
    insumos: dto.insumos.map(toComputedInsumo),
  };
}

export function toProductionHistoryEntry(
  dto: ProductionHistoryEntryDto,
): ProductionHistoryEntry {
  return {
    id: dto.id,
    kind: dto.kind,
    title: dto.title,
    description: dto.description,
    userName: dto.userName,
    createdAt: dto.createdAt,
  };
}
