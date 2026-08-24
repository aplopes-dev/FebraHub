import type { ProductionOrderTabCounts } from "@/features/production/types/production";

/** Espelha `ProductionOrderPresenter.toHttpListItem` (`production-order.presenter.ts`). */
export type ProductionOrderListItemDto = {
  id: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  productId: string;
  productName: string;
  productSku: string;
  /** Decimal string. */
  plannedQuantity: string;
  producedQuantity: string | null;
  sourceStockId: string;
  sourceStockName: string;
  destinationStockId: string;
  destinationStockName: string;
  expectedDate: string;
  observation: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
};

export type ProductionOrderListResponseDto = {
  data: ProductionOrderListItemDto[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
  tabCounts: ProductionOrderTabCounts;
};

/** Insumo calculado pela API — `ComputedInsumo` em `application/dtos/production-order.dto.ts`. */
export type ProductionInsumoDto = {
  componentProductId: string;
  name: string;
  unit: string;
  quantityPerUnit: string;
  totalQuantity: string;
  unitCostCents: number;
  totalCostCents: number;
};

/** Espelha `ProductionOrderPresenter.toHttpDetail`. */
export type ProductionOrderDetailDto = ProductionOrderListItemDto & {
  updatedAt: string;
  outboundMovementId: string | null;
  inboundMovementId: string | null;
  insumos: ProductionInsumoDto[];
};

export type ProductionOrderDetailResponseDto = {
  data: ProductionOrderDetailDto;
};

/** Espelha `ProductionOrderPresenter.toHttpSingle` — resposta de create/start/cancel/finalize. */
export type ProductionOrderSingleDto = {
  id: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  productId: string;
  plannedQuantity: string;
  producedQuantity: string | null;
  sourceStockId: string;
  destinationStockId: string;
  expectedDate: string;
  observation: string | null;
  outboundMovementId: string | null;
  inboundMovementId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductionOrderSingleResponseDto = {
  data: ProductionOrderSingleDto;
};

/** Espelha `ProductionOrderPresenter.toHttpHistoryItem`. */
export type ProductionHistoryEntryDto = {
  id: string;
  kind: "system" | "comment";
  title: string;
  description: string | null;
  userName: string;
  createdAt: string;
};

export type ProductionHistoryListResponseDto = {
  data: ProductionHistoryEntryDto[];
};

/** Payload de `CreateProductionOrderHttpDto`. */
export type CreateProductionOrderPayload = {
  productId: string;
  plannedQuantity: string;
  sourceStockId: string;
  destinationStockId: string;
  expectedDate: string;
  observation?: string;
};

/** Payload de `FinalizeProductionOrderHttpDto`. */
export type FinalizeProductionOrderPayload = {
  producedQuantity: string;
  observation?: string;
};

/** Payload de `AddProductionHistoryCommentHttpDto`. */
export type AddProductionHistoryCommentPayload = {
  description: string;
};
