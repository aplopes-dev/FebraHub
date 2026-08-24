import { addDays, format } from "date-fns";

import type {
  ByPaymentMethodParams,
  ListEntriesParams,
} from "../services/financial.types";
import type { FinancialStats, TransactionsFilters } from "../types";
import type { PaymentMethodSummary } from "../types";
import type { PaymentMethodAggregateRow } from "../services/financial.types";

function tomorrowIso(): string {
  return format(addDays(new Date(), 1), "yyyy-MM-dd");
}

function onlyScheduledSelected(filters: TransactionsFilters): boolean {
  return (
    filters.statuses.length === 1 && filters.statuses[0] === "scheduled"
  );
}

/**
 * Mapeia filtros da aba Transações → query da clinica-api.
 * Sempre liquidados (`paid`/`received`); período por `paidAt`.
 */
export function buildTransactionsApiParams(input: {
  startDate: string;
  endDate: string;
  filters: TransactionsFilters;
  page?: number;
  perPage?: number;
}): ListEntriesParams {
  const params: ListEntriesParams = {
    startDate: input.startDate,
    endDate: input.endDate,
    dateField: "paidAt",
    statuses: "paid,received",
    sortBy: "dueDate",
    sortOrder: "desc",
  };

  if (input.page !== undefined) params.page = input.page;
  if (input.perPage !== undefined) params.perPage = input.perPage;

  if (input.filters.types.length > 0) {
    params.types = input.filters.types.join(",");
  }
  if (input.filters.cashRegisters.length > 0) {
    params.accountIds = input.filters.cashRegisters.join(",");
  }
  if (input.filters.paymentMethods.length > 0) {
    params.paymentMethods = input.filters.paymentMethods.join(",");
  }
  if (onlyScheduledSelected(input.filters)) {
    params.paidAtFrom = tomorrowIso();
  }

  return params;
}

export function buildTransactionsByMethodApiParams(input: {
  startDate: string;
  endDate: string;
  filters: TransactionsFilters;
}): ByPaymentMethodParams {
  const list = buildTransactionsApiParams(input);
  return {
    startDate: list.startDate,
    endDate: list.endDate,
    dateField: list.dateField,
    paidAtFrom: list.paidAtFrom,
    paidAtTo: list.paidAtTo,
    types: list.types,
    accountIds: list.accountIds,
    paymentMethods: list.paymentMethods,
  };
}

export function toPaymentMethodSummary(
  row: PaymentMethodAggregateRow,
): PaymentMethodSummary {
  return {
    method: row.paymentMethod,
    income: row.incomeCents / 100,
    expense: row.expenseCents / 100,
    balance: row.balanceCents / 100,
  };
}

export function statsFromPaymentMethodSummaries(
  rows: PaymentMethodSummary[],
): FinancialStats {
  let incomeReceived = 0;
  let expensePaid = 0;
  for (const row of rows) {
    incomeReceived += row.income;
    expensePaid += row.expense;
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
