import type { StockMovementReason } from "./stock-movement-reason";

export type StockMovementType = "entrada" | "saida";

export type StockMovementListTab = "all" | "entrada" | "saida";

export type StockMovementLine = {
  productId: string;
  quantity: number;
  costPrice: number;
};

export type StockMovement = {
  id: string;
  type: StockMovementType;
  reason: StockMovementReason;
  /** Só em `reason: "manual"` — nos fluxos automáticos o motivo é o próprio `reason`. */
  categoryId: string | null;
  warehouseId: string;
  /** ISO date (yyyy-mm-dd). */
  operatedAt: string;
  lines: StockMovementLine[];
  createdAt: string;
  /** Usuário que executou a movimentação. */
  userName: string;
};

export type StockMovementListItem = StockMovement & {
  categoryName: string | null;
  warehouseName: string;
  itemsCount: number;
  totalCost: number;
};

export type StockMovementTabCounts = Record<StockMovementListTab, number>;

export type StockMovementListParams = {
  tab: StockMovementListTab;
  search: string;
  reason: StockMovementReason | null;
  page: number;
  perPage: number;
};

export type StockMovementListResult = {
  data: StockMovementListItem[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  tabCounts: StockMovementTabCounts;
};

export type StockMovementFormValues = {
  type: StockMovementType;
  categoryId: string;
  warehouseId: string;
  operatedAt: string;
  lines: StockMovementLine[];
};

export type MovementCategory = {
  id: string;
  name: string;
};

export const STOCK_MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  entrada: "Entrada de estoque",
  saida: "Saída de estoque",
};

export const STOCK_MOVEMENT_TAB_LABELS: Record<StockMovementListTab, string> = {
  all: "Todos",
  entrada: "Entradas",
  saida: "Saídas",
};

export const STOCK_MOVEMENT_TAB_ORDER: StockMovementListTab[] = [
  "all",
  "entrada",
  "saida",
];
