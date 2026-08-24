import type { FinancialEntry, FinancialStats } from '../types';

export type FinancialEntryApiResponse = {
  id: string;
  type: 'income' | 'expense';
  status: 'pending' | 'paid' | 'received' | 'cancelled';
  source: 'manual' | 'appointment_complete';
  description: string;
  valueCents: number;
  dueDate: string;
  paidAt: string | null;
  paidValueCents: number | null;
  paymentMethod: string | null;
  paymentType: string | null;
  observation: string | null;
  accountId: string | null;
  account: { id: string; name: string } | null;
  categoryId: string | null;
  category: { id: string; name: string; color: string } | null;
  incomeCategoryId: string | null;
  incomeCategory: { id: string; name: string; color: string } | null;
  clientId: string | null;
  client: { id: string; name: string } | null;
  installmentNumber: number | null;
  totalInstallments: number | null;
  recurrenceGroupId: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FinancialStatsApiResponse = {
  income: { received: number; toReceive: number; total: number };
  expense: { paid: number; toPay: number; total: number };
  balance: { current: number; projected: number };
};

export function brlToCents(value: number): number {
  return Math.round(value * 100);
}

export function centsToBrl(cents: number): number {
  return cents / 100;
}

function mapOrigin(
  source: FinancialEntryApiResponse['source'],
): FinancialEntry['origin'] {
  return source === 'appointment_complete' ? 'appointment' : 'manual';
}

export function toFinancialEntryUi(
  api: FinancialEntryApiResponse,
): FinancialEntry {
  return {
    id: api.id,
    type: api.type,
    status: api.status,
    origin: mapOrigin(api.source),
    description: api.description,
    value: centsToBrl(api.valueCents),
    dueDate: api.dueDate,
    paidAt: api.paidAt,
    paidValue:
      api.paidValueCents !== null && api.paidValueCents !== undefined
        ? centsToBrl(api.paidValueCents)
        : null,
    paymentMethod: api.paymentMethod,
    observation: api.observation,
    hasReceipt: false,
    isOverdue: api.isOverdue,
    installmentNumber: api.installmentNumber,
    totalInstallments: api.totalInstallments,
    categoryId: api.categoryId,
    category: api.category,
    incomeCategoryId: api.incomeCategoryId,
    incomeCategory: api.incomeCategory,
    account: api.account,
    clientId: api.clientId,
    client: api.client,
    createdAt: api.createdAt.slice(0, 10),
  };
}

export function toFinancialStatsUi(
  api: FinancialStatsApiResponse,
): FinancialStats {
  return {
    income: {
      received: centsToBrl(api.income.received),
      toReceive: centsToBrl(api.income.toReceive),
      total: centsToBrl(api.income.total),
    },
    expense: {
      paid: centsToBrl(api.expense.paid),
      toPay: centsToBrl(api.expense.toPay),
      total: centsToBrl(api.expense.total),
    },
    balance: {
      current: centsToBrl(api.balance.current),
      projected: centsToBrl(api.balance.projected),
    },
  };
}
