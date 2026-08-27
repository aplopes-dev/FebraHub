export type StockTransferStatus = "active" | "cancelled";

export type StockTransferListTab = "active" | "cancelled";

export type StockTransferLine = {
  productId: string;
  quantity: number;
  batch?: string;
};

export type StockTransfer = {
  id: string;
  status: StockTransferStatus;
  fromWarehouseId: string;
  toWarehouseId: string;
  /** ISO date (yyyy-mm-dd). */
  operatedAt: string;
  carrierId?: string;
  responsibleName: string;
  notes: string;
  lines: StockTransferLine[];
  createdAt: string;
  cancelledAt?: string;
};

export type StockTransferListItem = StockTransfer & {
  fromWarehouseName: string;
  toWarehouseName: string;
};

export type StockTransferTabCounts = Record<StockTransferListTab, number>;

export type StockTransferListFilters = {
  fromWarehouseId: string | null;
  toWarehouseId: string | null;
};

export type StockTransferListParams = {
  tab: StockTransferListTab;
  search: string;
  filters: StockTransferListFilters;
  page: number;
  perPage: number;
};

export type StockTransferListResult = {
  data: StockTransferListItem[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  tabCounts: StockTransferTabCounts;
};

export type StockTransferFormValues = {
  fromWarehouseId: string;
  toWarehouseId: string;
  operatedAt: string;
  carrierId: string;
  responsibleName: string;
  notes: string;
  lines: StockTransferLine[];
};

export const STOCK_TRANSFER_TAB_LABELS: Record<StockTransferListTab, string> = {
  active: "Ativas",
  cancelled: "Canceladas",
};

export const STOCK_TRANSFER_TAB_ORDER: StockTransferListTab[] = [
  "active",
  "cancelled",
];

export const STOCK_TRANSFER_NOTES_MAX_LENGTH = 120;
