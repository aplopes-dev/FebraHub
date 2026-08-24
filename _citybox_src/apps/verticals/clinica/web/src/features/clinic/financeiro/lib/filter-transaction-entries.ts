import type { FinancialEntry, TransactionsFilters } from "../types";

export interface FilterTransactionEntriesParams {
  entries: FinancialEntry[];
  startDate: string;
  endDate: string;
  filters: TransactionsFilters;
  /** Data de referência (yyyy-MM-dd) para "agendadas". Default: hoje local. */
  today?: string;
}

function todayIso(): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function isSettled(entry: FinancialEntry): boolean {
  return entry.status === "paid" || entry.status === "received";
}

function matchesStatus(
  entry: FinancialEntry,
  statuses: TransactionsFilters["statuses"],
  today: string,
): boolean {
  // Transações: só lançamentos já processados no fluxo de caixa (pago/recebido).
  if (!isSettled(entry)) return false;

  if (statuses.length === 0) return true;

  const paidDate = entry.paidAt?.substring(0, 10);
  const isScheduled = Boolean(paidDate && paidDate > today);

  return statuses.some((status) => {
    if (status === "paid") return true;
    // "Agendadas" entre os já liquidados: data de pagamento futura.
    if (status === "scheduled") return isScheduled;
    return false;
  });
}

/**
 * Filtra lançamentos mock por período + filtros da aba Transações.
 * Base: apenas status `paid` / `received` (já constados no fluxo de caixa).
 */
export function filterTransactionEntries({
  entries,
  startDate,
  endDate,
  filters,
  today = todayIso(),
}: FilterTransactionEntriesParams): FinancialEntry[] {
  return entries.filter((entry) => {
    if (entry.status === "cancelled") return false;
    if (!isSettled(entry)) return false;

    if (entry.dueDate < startDate || entry.dueDate > endDate) return false;

    if (filters.types.length > 0 && !filters.types.includes(entry.type)) {
      return false;
    }

    if (!matchesStatus(entry, filters.statuses, today)) return false;

    if (filters.cashRegisters.length > 0) {
      const accountId = entry.account?.id;
      if (!accountId || !filters.cashRegisters.includes(accountId)) {
        return false;
      }
    }

    if (filters.paymentMethods.length > 0) {
      if (
        !entry.paymentMethod ||
        !filters.paymentMethods.includes(entry.paymentMethod)
      ) {
        return false;
      }
    }

    return true;
  });
}

export function computeStatsFromEntries(entries: FinancialEntry[]) {
  let incomeReceived = 0;
  let expensePaid = 0;

  for (const e of entries) {
    if (!isSettled(e)) continue;
    if (e.type === "income") {
      incomeReceived += e.value;
    } else {
      expensePaid += e.value;
    }
  }

  return {
    income: {
      received: incomeReceived,
      toReceive: 0,
      total: incomeReceived,
    },
    expense: {
      paid: expensePaid,
      toPay: 0,
      total: expensePaid,
    },
    balance: {
      current: incomeReceived - expensePaid,
      projected: incomeReceived - expensePaid,
    },
  };
}
