import type { ProductionOrder } from '../../domain/entities/production-order.entity';
import type { ProductionHistoryEntry } from '../../domain/entities/production-history-entry.entity';
import type {
  ProductionOrderListRow,
  ProductionOrderListTab,
  ProductionOrderTabCounts,
} from '../../domain/repositories/production-order.repository.interface';

export type CreateProductionOrderDto = {
  organizationId: string;
  productId: string;
  plannedQuantity: string;
  sourceStockId: string;
  destinationStockId: string;
  expectedDate: Date;
  observation?: string | null;
  createdByUserId: string;
  /** Nome do ator — denormalizado na linha do histórico (`ProductionHistoryEntry.userName`). */
  userName: string;
};

export type ListProductionOrdersDto = {
  organizationId: string;
  tab?: ProductionOrderListTab;
  search?: string;
  page?: number;
  perPage?: number;
};

export type ListProductionOrdersResult = {
  items: ProductionOrderListRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  tabCounts: ProductionOrderTabCounts;
};

export type FindProductionOrderByIdDto = {
  organizationId: string;
  id: string;
};

/** Insumo calculado (BOM × quantidade) para exibir no detalhe da ordem. */
export type ComputedInsumo = {
  componentProductId: string;
  name: string;
  unit: string;
  quantityPerUnit: string;
  totalQuantity: string;
  unitCostCents: number;
  totalCostCents: number;
};

export type FindProductionOrderByIdResult = {
  order: ProductionOrder;
  productName: string;
  productSku: string;
  sourceStockName: string;
  destinationStockName: string;
  insumos: ComputedInsumo[];
};

export type StartProductionOrderDto = {
  organizationId: string;
  id: string;
  userName: string;
};

export type CancelProductionOrderDto = {
  organizationId: string;
  id: string;
  userName: string;
};

export type FinalizeProductionOrderDto = {
  organizationId: string;
  id: string;
  producedQuantity: string;
  observation?: string;
  createdByUserId: string;
  userName: string;
};

export type ListProductionHistoryDto = {
  organizationId: string;
  orderId: string;
};

export type AddProductionHistoryCommentDto = {
  organizationId: string;
  orderId: string;
  description: string;
  userName: string;
};

export type { ProductionHistoryEntry };
