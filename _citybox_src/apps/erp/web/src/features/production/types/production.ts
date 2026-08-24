export type ProductionStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ProductionStatusTab = "all" | ProductionStatus;

/** Item de listagem — já vem com os nomes resolvidos (produto/estoques) pela API. */
export type ProductionOrder = {
  id: string;
  status: ProductionStatus;
  /** Produto final a ser fabricado (processo produtivo). */
  productId: string;
  productName: string;
  productSku: string;
  /** Quantidade planejada de produção. */
  plannedQuantity: number;
  /** Quantidade realmente produzida (preenchida na finalização). */
  producedQuantity: number | null;
  /** Estoque de onde saem os insumos. */
  sourceStockId: string;
  sourceStockName: string;
  /** Estoque para onde vai o produto pronto. */
  destinationStockId: string;
  destinationStockName: string;
  /** Data de previsão (yyyy-mm-dd). */
  expectedDate: string;
  observation: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  /** Data em que o pedido foi cancelado (não avançou na produção). */
  cancelledAt: string | null;
};

/** Insumo calculado pela API (ficha técnica × quantidade). */
export type ComputedInsumo = {
  componentProductId: string;
  name: string;
  unit: string;
  /** Quantidade por unidade (da ficha técnica). */
  quantityPerUnit: number;
  /** Quantidade total necessária = quantityPerUnit × quantidade. */
  totalQuantity: number;
  unitCostCents: number;
  /** Custo total = totalQuantity × unitCostCents. */
  totalCostCents: number;
};

/** Detalhe da ordem — inclui insumos calculados para a quantidade vigente. */
export type ProductionOrderDetail = ProductionOrder & {
  updatedAt: string;
  outboundMovementId: string | null;
  inboundMovementId: string | null;
  insumos: ComputedInsumo[];
};

export type ProductionOrderFormValues = {
  productId: string;
  plannedQuantity: number;
  sourceStockId: string;
  destinationStockId: string;
  expectedDate: string;
};

export const PRODUCTION_STATUS_LABELS: Record<ProductionStatus, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
};

/** A partir desses status é possível cancelar o pedido (antes da finalização). */
export const CANCELLABLE_STATUSES: ProductionStatus[] = ["pending", "in_progress"];

/** Evento da timeline de um pedido de produção — automático ou comentário manual. */
export type ProductionHistoryEntry = {
  id: string;
  kind: "system" | "comment";
  title: string;
  description: string | null;
  userName: string;
  createdAt: string;
};

export type ProductionOrderListParams = {
  tab: ProductionStatusTab;
  search: string;
  page: number;
  perPage: number;
};

export type ProductionOrderTabCounts = Record<ProductionStatusTab, number>;

export type ProductionOrderListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ProductionOrderListResult = {
  data: ProductionOrder[];
  meta: ProductionOrderListMeta;
  tabCounts: ProductionOrderTabCounts;
};
