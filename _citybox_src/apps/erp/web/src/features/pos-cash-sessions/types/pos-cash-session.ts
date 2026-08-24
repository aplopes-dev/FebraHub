export type PosCashPeriodPreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "this_month"
  | "custom";

export type PosCashPeriod = {
  preset: PosCashPeriodPreset;
  /** ISO `yyyy-MM-dd` quando preset = custom. */
  customFrom: string | null;
  customTo: string | null;
};

export type PosCashSessionFilters = {
  posRegisterId: string;
  sellerName: string;
  operatorName: string;
  period: PosCashPeriod;
};

export type PosCashSession = {
  id: string;
  posRegisterId: string;
  posRegisterName: string;
  /** Identificação do caixa na sessão (ex.: "CX-01"). */
  cashBoxLabel: string;
  openedAt: string;
  closedAt: string | null;
  sellerName: string;
  /** Quem abriu / opera o turno no PDV. */
  operatorName: string;
  openingBalanceCents: number;
  closingBalanceCents: number | null;
  declaredReceiptsCents: number;
  salesCount: number;
  /** Contagem de sangrias no turno (mock / futuro API). */
  withdrawalCount: number;
};

export type PosCashMovementType = "withdrawal" | "reinforcement";

/** Sangria ou reforço de gaveta dentro da sessão. */
export type PosCashMovement = {
  id: string;
  sessionId: string;
  type: PosCashMovementType;
  amountCents: number;
  reason: string;
  /** Quem lançou no PDV. */
  operatorName: string;
  /** Quem autorizou (ex.: gerente sem permissão no caixa). */
  authorizedByName: string | null;
  at: string;
};

export type PosCashSaleProduct = {
  id: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
};

export type PosCashSalePayment = {
  id: string;
  paidAt: string;
  method: string;
  amountCents: number;
};

export type PosCashSale = {
  id: string;
  sessionId: string;
  /** Número sequencial do turno — UI mostra `#${number}`. */
  number: number;
  customerName: string;
  sellerName: string;
  /** Quem digitou a venda no PDV. */
  operatorName: string;
  startedAt: string;
  endedAt: string;
  amountCents: number;
  /** Método principal exibido na lista. */
  paymentMethod: string;
  /** Rótulo de status da venda (não é natureza fiscal). */
  statusLabel: string;
  products: PosCashSaleProduct[];
  payments: PosCashSalePayment[];
};

export type PosCashClosingMethodRow = {
  method: string;
  informedCents: number;
  registeredCents: number;
};

export type PosCashClosingReport = {
  sessionId: string;
  posRegisterName: string;
  cashBoxLabel: string;
  openedAt: string;
  closedAt: string | null;
  openingBalanceCents: number;
  closingBalanceCents: number | null;
  salesCount: number;
  canceledSalesCount: number;
  informedTotalCents: number;
  methods: PosCashClosingMethodRow[];
};

export type PosCashSessionListParams = {
  filters: PosCashSessionFilters;
  page: number;
  perPage: number;
};

export type PosCashSessionListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type PosCashSessionListResult = {
  data: PosCashSession[];
  meta: PosCashSessionListMeta;
};

export type PosCashSaleListParams = {
  sessionId: string;
  page: number;
  perPage: number;
};

export type PosCashSaleListResult = {
  data: PosCashSale[];
  meta: PosCashSessionListMeta;
};

export function createEmptyPosCashFilters(): PosCashSessionFilters {
  return {
    posRegisterId: "",
    sellerName: "",
    operatorName: "",
    period: {
      preset: "today",
      customFrom: null,
      customTo: null,
    },
  };
}
