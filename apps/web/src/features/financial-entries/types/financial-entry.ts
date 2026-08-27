/** "Contas a receber" ou "Contas a pagar" — unificados nesta mesma tela. */
export type FinancialEntryOperation = "receivable" | "payable";

/** Se o valor já foi efetivamente pago/recebido (derivado da soma dos pagamentos). */
export type FinancialEntryStatus = "pending" | "paid";

/**
 * Enum histórico (D11) — até 2026-08-07 era a única origem do select de
 * Forma de pagamento; spec `007-financeiro-ajustes-ui` US3 trocou o select
 * para `usePaymentMethodOptionsQuery` (cadastro real). Este mapa **continua
 * existindo só como fallback de rótulo** para lançamentos antigos cujo
 * `payment.paymentMethodId` ainda guarda um desses 7 valores em vez de um
 * `PaymentMethod.id` real — ver `resolvePaymentMethodLabel` em
 * `lib/financial-entry-format.ts` e o Edge Case correspondente na spec.
 * Nunca mais usado para popular um select.
 */
export const FINANCIAL_ENTRY_PAYMENT_METHODS = [
  "dinheiro",
  "pix",
  "debito",
  "credito",
  "boleto",
  "deposito",
  "transferencia",
] as const;
export type FinancialEntryPaymentMethod =
  (typeof FINANCIAL_ENTRY_PAYMENT_METHODS)[number];

export const FINANCIAL_ENTRY_PAYMENT_METHOD_LABELS: Record<
  FinancialEntryPaymentMethod,
  string
> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  debito: "Cartão de débito",
  credito: "Cartão de crédito",
  boleto: "Boleto",
  deposito: "Depósito",
  transferencia: "Transferência",
};

export type FinancialEntryPayment = {
  id: string;
  amount: number;
  /** ISO date `yyyy-MM-dd`. */
  paidAt: string;
  /** Valor de `FINANCIAL_ENTRY_PAYMENT_METHODS` ("" enquanto não escolhido). */
  paymentMethodId: string;
  /** Bandeira do cartão — texto livre, sem cadastro (D12). */
  cardBrandId: string | null;
};

/** Rateio do lançamento entre categorias financeiras + centro de custo. */
export type FinancialEntryAllocation = {
  id: string;
  categoryId: string;
  costCenterId: string;
  amount: number;
  percentage: number;
};

export type FinancialEntryAttachment = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  /** ISO date-time. */
  createdAt: string;
};

export type FinancialEntryPartyKind = "customer" | "supplier";

export type FinancialEntry = {
  id: string;
  operation: FinancialEntryOperation;
  /** Valor base do lançamento (sem taxas/multas). */
  baseAmount: number;
  fees: number;
  fines: number;
  bankAccountId: string;
  /** ISO date `yyyy-MM-dd`. */
  competenceDate: string;
  /** ISO date `yyyy-MM-dd`. */
  dueDate: string;
  description: string;
  partyKind: FinancialEntryPartyKind | null;
  partyId: string | null;
  partyName: string;
  note: string;
  payments: FinancialEntryPayment[];
  allocations: FinancialEntryAllocation[];
  attachments: FinancialEntryAttachment[];
  createdBy: string;
  createdAt: string;
  /** Vem do backend (soma dos pagamentos vs. total) — nunca derivado no cliente. */
  status: FinancialEntryStatus;
  /** Categoria da primeira linha de rateio, ou "Múltiplas categorias" — só na listagem. */
  categoryLabel: string | null;
  /** `true` quando vinculado a um pedido de venda — o formulário trava por completo (FR-016). */
  readOnly: boolean;
  /**
   * Motor de recebíveis do contrato de cartões
   * (`specs/erp/005-card-receivables-engine/`). `null`/`false` em
   * lançamentos manuais e em vendas fechadas antes desta entrega.
   */
  grossAmount: number | null;
  acquirerFee: number | null;
  installmentSequence: number | null;
  installmentCount: number | null;
  /** `true` quando gerado sem contrato/método de cartão correspondente (FR-005). */
  cardSettlementFallback: boolean;
};

export type FinancialEntryListFilters = {
  operations: FinancialEntryOperation[];
  statuses: FinancialEntryStatus[];
  categoryIds: string[];
  costCenterIds: string[];
  /** ISO date `yyyy-MM-dd` (vencimento, inclusive). */
  dueFrom: string | null;
  dueTo: string | null;
};

export type FinancialEntrySortOption =
  | "due_date_asc"
  | "due_date_desc"
  | "amount_desc"
  | "amount_asc"
  | "created_at_desc";

export const FINANCIAL_ENTRY_LIST_TABS = ["active", "deleted"] as const;
export type FinancialEntryListTab = (typeof FINANCIAL_ENTRY_LIST_TABS)[number];

export const FINANCIAL_ENTRY_TAB_LABELS: Record<FinancialEntryListTab, string> = {
  active: "Ativos",
  deleted: "Excluídos",
};

export type FinancialEntryTabCounts = Record<FinancialEntryListTab, number>;

export type FinancialEntryListParams = {
  search: string;
  filters: FinancialEntryListFilters;
  sort: FinancialEntrySortOption;
  tab: FinancialEntryListTab;
  page: number;
  perPage: number;
};

export type FinancialEntryListResult = {
  data: FinancialEntry[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  tabCounts: FinancialEntryTabCounts;
};

export const FINANCIAL_ENTRY_OPERATION_LABELS: Record<
  FinancialEntryOperation,
  string
> = {
  receivable: "Contas a receber",
  payable: "Contas a pagar",
};

export const FINANCIAL_ENTRY_SORT_OPTIONS: {
  value: FinancialEntrySortOption;
  label: string;
}[] = [
  { value: "due_date_asc", label: "Vencimento mais próximo" },
  { value: "due_date_desc", label: "Vencimento mais distante" },
  { value: "amount_desc", label: "Maior valor" },
  { value: "amount_asc", label: "Menor valor" },
  { value: "created_at_desc", label: "Criação mais recente" },
];

/** Rótulo do status conforme o tipo de operação (Pago/Recebido/Pendente). */
export function statusLabel(
  operation: FinancialEntryOperation,
  status: FinancialEntryStatus,
): string {
  if (status === "pending") return "Pendente";
  return operation === "payable" ? "Pago" : "Recebido";
}
