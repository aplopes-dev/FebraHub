export type CashFlowPeriodFilter =
  | "all"
  | "today"
  | "this_week"
  | "this_month"
  | "last_month"
  | "last_30_days"
  | "next_30_days"
  | "custom";

export interface FinancialEntry {
  id: string;
  type: "income" | "expense";
  status: "pending" | "paid" | "received" | "cancelled";
  origin: "manual" | "budget";
  description: string;
  value: number;
  dueDate: string;
  paidAt: string | null;
  paidValue: number | null;
  paymentMethod: string | null;
  paymentType: string | null;
  observation: string | null;
  hasReceipt: boolean;
  receiptUrl: string | null;
  isOverdue: boolean;
  installmentNumber: number | null;
  totalInstallments: number | null;
  recurrenceGroupId: string | null;
  categoryId: string | null;
  category: { id: string; name: string; color: string } | null;
  incomeCategoryId: string | null;
  incomeCategory: { id: string; name: string; color: string } | null;
  account: { id: string; name: string } | null;
  patientId: string | null;
  patient: { id: string; name: string; cpf: string | null } | null;
  budgetId: string | null;
  checkDate: string | null;
  checkName: string | null;
  checkNumber: string | null;
  checkBank: string | null;
  checkCpfCnpj: string | null;
  createdAt: string;
}

export interface FinancialStats {
  income: { received: number; toReceive: number; total: number };
  expense: { paid: number; toPay: number; total: number };
  balance: { current: number; projected: number };
}

export interface CashFlowFilters {
  types: ("income" | "expense")[];
  statuses: ("paid" | "unpaid" | "scheduled")[];
  hasReceipt: "with" | "without" | "all";
  cashRegisters: string[];
  paymentMethods: string[];
  categories: string[];
}

/** Visualização da aba Transações. */
export type TransactionsViewMode = "payment_method" | "transactions";

/** Filtros da aba Transações — subset do fluxo de caixa (sem NF / categoria / não pagas). */
export interface TransactionsFilters {
  types: ("income" | "expense")[];
  statuses: ("paid" | "scheduled")[];
  cashRegisters: string[];
  paymentMethods: string[];
}

export interface PaymentMethodSummary {
  method: string;
  income: number;
  expense: number;
  /** income − expense (despesa reduz o saldo). */
  balance: number;
}

export const EMPTY_TRANSACTIONS_FILTERS: TransactionsFilters = {
  types: [],
  statuses: [],
  cashRegisters: [],
  paymentMethods: [],
};
