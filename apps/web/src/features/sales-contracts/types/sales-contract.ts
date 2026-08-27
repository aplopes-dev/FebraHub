export type RecurrenceFrequency =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export type RecurrenceDuration =
  | { mode: "forever" }
  | { mode: "until_date"; untilDate: string }
  | { mode: "times"; times: number };

export type PaymentStatus = "paid" | "open" | "overdue";

export type SalesContractItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type SalesContract = {
  id: string;
  number: number;
  customerId: string;
  customerName: string;
  customerCategoryId: string | null;
  sellerId: string;
  sellerName: string;
  startDate: string;
  /** `null` = término indefinido. */
  endDate: string | null;
  statusId: string;
  statusDetail: string;
  notes: string;
  items: SalesContractItem[];
  firstDueDate: string;
  frequency: RecurrenceFrequency;
  duration: RecurrenceDuration;
  paymentMethodId: string;
  currentPaymentStatus: PaymentStatus;
  nextDueDate: string | null;
  totalAmount: number;
  createdAt: string;
  deletedAt?: string | null;
};

export type SalesContractListTab = "active" | "deleted";

export type SalesContractListFilters = {
  statusIds: string[];
  customerId: string | null;
  customerCategoryId: string | null;
  /** ISO `yyyy-MM-dd` inclusive. */
  dueFrom: string | null;
  dueTo: string | null;
  productIds: string[];
  paymentStatuses: PaymentStatus[];
};

export type SalesContractSortOption =
  | "number_desc"
  | "number_asc"
  | "start_date_desc"
  | "start_date_asc"
  | "amount_desc"
  | "amount_asc"
  | "next_due_asc"
  | "next_due_desc";

export type SalesContractTabCounts = Record<SalesContractListTab, number>;

export type SalesContractListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type SalesContractListParams = {
  tab: SalesContractListTab;
  search: string;
  filters: SalesContractListFilters;
  sort: SalesContractSortOption;
  page: number;
  perPage: number;
};

export type SalesContractListResult = {
  data: SalesContract[];
  meta: SalesContractListMeta;
  tabCounts: SalesContractTabCounts;
};

export type ContractInstallment = {
  id: string;
  contractId: string;
  contractNumber: number;
  sequence: number;
  dueDate: string;
  amount: number;
  status: PaymentStatus;
  paymentMethodId: string;
  createdAt: string;
};
