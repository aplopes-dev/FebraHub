export type CashFlowPeriodFilter =
  | 'all'
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'last_30_days'
  | 'next_30_days'
  | 'custom';

export interface FinancialEntry {
  id: string;
  type: 'income' | 'expense';
  status: 'pending' | 'paid' | 'received' | 'cancelled';
  origin: 'manual' | 'appointment';
  description: string;
  value: number;
  dueDate: string;
  paidAt: string | null;
  paidValue: number | null;
  paymentMethod: string | null;
  observation: string | null;
  hasReceipt: boolean;
  isOverdue: boolean;
  installmentNumber: number | null;
  totalInstallments: number | null;
  categoryId: string | null;
  category: { id: string; name: string; color: string } | null;
  incomeCategoryId: string | null;
  incomeCategory: { id: string; name: string; color: string } | null;
  account: { id: string; name: string } | null;
  clientId: string | null;
  client: { id: string; name: string } | null;
  createdAt: string;
}

export interface FinancialStats {
  income: { received: number; toReceive: number; total: number };
  expense: { paid: number; toPay: number; total: number };
  balance: { current: number; projected: number };
}

export interface CashFlowFilters {
  types: ('income' | 'expense')[];
  statuses: ('paid' | 'unpaid' | 'scheduled')[];
  hasReceipt: 'with' | 'without' | 'all';
  cashRegisters: string[];
  paymentMethods: string[];
  categories: string[];
}

export type TransactionsViewMode = 'payment_method' | 'transactions';

export interface TransactionsFilters {
  types: ('income' | 'expense')[];
  statuses: ('paid' | 'scheduled')[];
  cashRegisters: string[];
  paymentMethods: string[];
}

export interface PaymentMethodSummary {
  method: string;
  income: number;
  expense: number;
  balance: number;
}

export interface FinancialAccount {
  id: string;
  name: string;
  type: 'cash' | 'checking' | 'savings';
  isActive: boolean;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
}

export interface IncomeCategory {
  id: string;
  name: string;
  color: string;
}

export const EMPTY_CASH_FLOW_FILTERS: CashFlowFilters = {
  types: [],
  statuses: [],
  hasReceipt: 'all',
  cashRegisters: [],
  paymentMethods: [],
  categories: [],
};

export const EMPTY_TRANSACTIONS_FILTERS: TransactionsFilters = {
  types: [],
  statuses: [],
  cashRegisters: [],
  paymentMethods: [],
};

export const PERIOD_OPTIONS: { value: CashFlowPeriodFilter; label: string }[] =
  [
    { value: 'all', label: 'Todos os períodos' },
    { value: 'today', label: 'Hoje' },
    { value: 'this_week', label: 'Desta semana' },
    { value: 'this_month', label: 'Desse mês' },
    { value: 'last_month', label: 'Do mês passado' },
    { value: 'last_30_days', label: 'Últimos 30 dias' },
    { value: 'next_30_days', label: 'Próximos 30 dias' },
    { value: 'custom', label: 'Escolher período' },
  ];

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'credit', label: 'Crédito' },
  { value: 'debit', label: 'Débito' },
  { value: 'pix', label: 'PIX' },
  { value: 'transfer', label: 'Transferência' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'check', label: 'Cheque' },
];
