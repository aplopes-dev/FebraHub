export type PurchaseDeliveryStatus = "pending" | "received";

export type PurchaseListTab = "active" | "deleted";

export type PurchaseStatusFilter = "all" | PurchaseDeliveryStatus;

/** Status do item na compra (independente do status da entrega da compra). */
export type PurchaseLineStatus = "pending" | "received" | "cancelled";

export type PurchaseLine = {
  productId: string;
  quantity: number;
  costPrice: number;
  /** Padrão ao adicionar: pendente. */
  status: PurchaseLineStatus;
};

/** Alocação de rateio financeiro — UI local, não enviada à API. */
export type PurchaseAllocation = {
  id: string;
  categoryId: string;
  costCenterId: string;
  amount: number;
  percentage: number;
};

/** Pagamento — UI local (aba Financeiro ainda não existe), não enviado à API. */
export type PurchasePayment = {
  id: string;
  paymentMethodId: string;
  bankAccountId: string;
  allocations: PurchaseAllocation[];
};

export type PurchaseExtras = {
  carrierId: string;
  freight: number;
  discounts: number;
  otherExpenses: number;
};

/** Linha exibida na listagem — retornada por `GET /v1/purchases`. */
export type PurchaseListItem = {
  id: string;
  deliveryStatus: PurchaseDeliveryStatus;
  warehouseId: string;
  warehouseName: string;
  supplierId: string;
  supplierName: string;
  purchasedAt: string;
  series: string;
  invoiceNumber: string;
  itemsCount: number;
  totalAmount: number;
  stockMovementId: string | null;
  createdAt: string;
  deletedAt: string | null;
};

/** Linha de produto no detalhe da compra — inclui nome/SKU do produto. */
export type PurchaseDetailLine = PurchaseLine & {
  productName: string;
  productSku: string;
};

/** Compra completa — retornada por `GET /v1/purchases/:id`. */
export type PurchaseDetail = {
  id: string;
  deliveryStatus: PurchaseDeliveryStatus;
  warehouseId: string;
  warehouseName: string;
  supplierId: string;
  supplierName: string;
  purchasedAt: string;
  series: string;
  invoiceNumber: string;
  notes: string;
  lines: PurchaseDetailLine[];
  extras: PurchaseExtras;
  totalAmount: number;
  stockMovementId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type PurchaseTabCounts = Record<PurchaseListTab, number>;

export type PurchaseListFilters = {
  warehouseId: string | null;
  supplierId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
};

export type PurchaseListParams = {
  tab: PurchaseListTab;
  status: PurchaseStatusFilter;
  search: string;
  filters: PurchaseListFilters;
  page: number;
  perPage: number;
};

export type PurchaseListResult = {
  data: PurchaseListItem[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  tabCounts: PurchaseTabCounts;
};

export type PurchaseFormValues = {
  deliveryStatus: PurchaseDeliveryStatus;
  warehouseId: string;
  supplierId: string;
  purchasedAt: string;
  series: string;
  invoiceNumber: string;
  notes: string;
  lines: PurchaseLine[];
  payments: PurchasePayment[];
  extras: PurchaseExtras;
};

export type SupplierOption = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
};

export const PURCHASE_TAB_LABELS: Record<PurchaseListTab, string> = {
  active: "Ativas",
  deleted: "Excluídas",
};

export const PURCHASE_TAB_ORDER: PurchaseListTab[] = ["active", "deleted"];

export const PURCHASE_STATUS_LABELS: Record<PurchaseDeliveryStatus, string> = {
  pending: "Pendente",
  received: "Recebido",
};

export const PURCHASE_LINE_STATUS_LABELS: Record<PurchaseLineStatus, string> = {
  pending: "Pendente",
  received: "Recebido",
  cancelled: "Cancelado",
};

export const PURCHASE_STATUS_FILTER_LABELS: Record<
  PurchaseStatusFilter,
  string
> = {
  all: "Todos os status",
  pending: "Pendente",
  received: "Recebido",
};

export const PURCHASE_STATUS_FILTER_ORDER: PurchaseStatusFilter[] = [
  "all",
  "pending",
  "received",
];

export const PURCHASE_NOTES_MAX_LENGTH = 240;
