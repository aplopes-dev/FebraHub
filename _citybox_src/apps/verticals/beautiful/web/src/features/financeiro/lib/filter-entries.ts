import type {
  CashFlowFilters,
  FinancialEntry,
  FinancialStats,
  PaymentMethodSummary,
  TransactionsFilters,
} from '../types';
import { PAYMENT_METHOD_OPTIONS } from '../types';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatCurrencyFromCents(cents: number): string {
  return formatCurrency(cents / 100);
}

export function paymentMethodLabel(method: string | null): string {
  if (!method) return '—';
  return (
    PAYMENT_METHOD_OPTIONS.find((o) => o.value === method)?.label ?? method
  );
}

export function computeStatsFromEntries(
  entries: FinancialEntry[],
): FinancialStats {
  let incomeReceived = 0;
  let incomeToReceive = 0;
  let expensePaid = 0;
  let expenseToPay = 0;

  for (const e of entries) {
    if (e.status === 'cancelled') continue;
    if (e.type === 'income') {
      if (e.status === 'received') incomeReceived += e.value;
      else incomeToReceive += e.value;
    } else if (e.status === 'paid') {
      expensePaid += e.value;
    } else {
      expenseToPay += e.value;
    }
  }

  return {
    income: {
      received: incomeReceived,
      toReceive: incomeToReceive,
      total: incomeReceived + incomeToReceive,
    },
    expense: {
      paid: expensePaid,
      toPay: expenseToPay,
      total: expensePaid + expenseToPay,
    },
    balance: {
      current: incomeReceived - expensePaid,
      projected:
        incomeReceived + incomeToReceive - (expensePaid + expenseToPay),
    },
  };
}

function isScheduled(entry: FinancialEntry, today: string): boolean {
  return entry.status === 'pending' && entry.dueDate > today;
}

export function filterCashFlowEntries(
  entries: FinancialEntry[],
  range: { startDate: string; endDate: string },
  filters: CashFlowFilters,
): FinancialEntry[] {
  const today = new Date().toISOString().slice(0, 10);

  return entries.filter((entry) => {
    if (entry.dueDate < range.startDate || entry.dueDate > range.endDate) {
      return false;
    }
    if (filters.types.length > 0 && !filters.types.includes(entry.type)) {
      return false;
    }
    if (filters.statuses.length > 0) {
      const match = filters.statuses.some((status) => {
        if (status === 'paid') {
          return entry.status === 'paid' || entry.status === 'received';
        }
        if (status === 'unpaid') {
          return entry.status === 'pending' && !isScheduled(entry, today);
        }
        if (status === 'scheduled') {
          return isScheduled(entry, today);
        }
        return false;
      });
      if (!match) return false;
    }
    if (filters.hasReceipt === 'with' && !entry.hasReceipt) return false;
    if (filters.hasReceipt === 'without' && entry.hasReceipt) return false;
    if (
      filters.cashRegisters.length > 0 &&
      (!entry.account || !filters.cashRegisters.includes(entry.account.id))
    ) {
      return false;
    }
    if (
      filters.paymentMethods.length > 0 &&
      (!entry.paymentMethod ||
        !filters.paymentMethods.includes(entry.paymentMethod))
    ) {
      return false;
    }
    if (filters.categories.length > 0) {
      const catId = entry.categoryId ?? entry.incomeCategoryId;
      if (!catId || !filters.categories.includes(catId)) return false;
    }
    return true;
  });
}

/** Transações: só liquidados no período (paidAt). */
export function filterTransactionEntries(
  entries: FinancialEntry[],
  range: { startDate: string; endDate: string },
  filters: TransactionsFilters,
): FinancialEntry[] {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().slice(0, 10);

  return entries.filter((entry) => {
    const settled =
      entry.status === 'paid' || entry.status === 'received';
    if (!settled || !entry.paidAt) return false;

    const scheduledOnly = filters.statuses.includes('scheduled');
    if (scheduledOnly) {
      if (entry.paidAt < tomorrowIso) return false;
    } else if (entry.paidAt < range.startDate || entry.paidAt > range.endDate) {
      return false;
    }

    if (filters.types.length > 0 && !filters.types.includes(entry.type)) {
      return false;
    }
    if (
      filters.statuses.includes('paid') &&
      !filters.statuses.includes('scheduled') &&
      entry.paidAt > today
    ) {
      return false;
    }
    if (
      filters.cashRegisters.length > 0 &&
      (!entry.account || !filters.cashRegisters.includes(entry.account.id))
    ) {
      return false;
    }
    if (
      filters.paymentMethods.length > 0 &&
      (!entry.paymentMethod ||
        !filters.paymentMethods.includes(entry.paymentMethod))
    ) {
      return false;
    }
    return true;
  });
}

export function aggregateByPaymentMethod(
  entries: FinancialEntry[],
): PaymentMethodSummary[] {
  const map = new Map<string, PaymentMethodSummary>();

  for (const entry of entries) {
    const method = entry.paymentMethod ?? 'unknown';
    const row = map.get(method) ?? {
      method,
      income: 0,
      expense: 0,
      balance: 0,
    };
    if (entry.type === 'income') {
      row.income += entry.paidValue ?? entry.value;
    } else {
      row.expense += entry.paidValue ?? entry.value;
    }
    row.balance = row.income - row.expense;
    map.set(method, row);
  }

  return [...map.values()].sort((a, b) => b.balance - a.balance);
}
