import type { CashFlowFilters, TransactionsFilters } from '../types';
import type {
  ByPaymentMethodParams,
  ListEntriesParams,
} from '../services/financial-service';

function tomorrowIso(): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function onlyScheduledSelected(filters: TransactionsFilters): boolean {
  return (
    filters.statuses.length === 1 && filters.statuses[0] === 'scheduled'
  );
}

/** Mapeia filtros do Fluxo de caixa → query da beautiful-api. */
export function buildCashFlowApiParams(input: {
  startDate: string;
  endDate: string;
  filters: CashFlowFilters;
  page?: number;
  perPage?: number;
}): ListEntriesParams {
  const apiStatuses: string[] = [];
  if (input.filters.statuses.includes('paid')) {
    apiStatuses.push('paid', 'received');
  }
  if (
    input.filters.statuses.includes('unpaid') ||
    input.filters.statuses.includes('scheduled')
  ) {
    apiStatuses.push('pending');
  }

  const params: ListEntriesParams = {
    startDate: input.startDate,
    endDate: input.endDate,
    dateField: 'dueDate',
    page: input.page ?? 1,
    perPage: input.perPage ?? 100,
    sortBy: 'dueDate',
    sortOrder: 'desc',
  };

  if (input.filters.types.length > 0) {
    params.types = input.filters.types.join(',');
  }
  if (apiStatuses.length > 0) {
    params.statuses = [...new Set(apiStatuses)].join(',');
  }
  if (input.filters.cashRegisters.length > 0) {
    params.accountIds = input.filters.cashRegisters.join(',');
  }
  if (input.filters.paymentMethods.length > 0) {
    params.paymentMethods = input.filters.paymentMethods.join(',');
  }
  if (input.filters.categories.length > 0) {
    params.categoryIds = input.filters.categories.join(',');
  }

  return params;
}

/**
 * Refina pending após a API: unpaid = vencido/hoje; scheduled = futuro.
 * hasReceipt não existe na API — filtro local (sempre false por enquanto).
 */
export function refineCashFlowEntriesClientSide<
  T extends {
    status: string;
    dueDate: string;
    hasReceipt: boolean;
  },
>(entries: T[], filters: CashFlowFilters): T[] {
  const today = new Date().toISOString().slice(0, 10);
  const wantsPaid = filters.statuses.includes('paid');
  const wantsUnpaid = filters.statuses.includes('unpaid');
  const wantsScheduled = filters.statuses.includes('scheduled');
  const statusFilterActive = wantsPaid || wantsUnpaid || wantsScheduled;

  return entries.filter((entry) => {
    if (filters.hasReceipt === 'with' && !entry.hasReceipt) return false;
    if (filters.hasReceipt === 'without' && entry.hasReceipt) return false;

    if (!statusFilterActive) return true;

    const isSettled = entry.status === 'paid' || entry.status === 'received';
    const isPending = entry.status === 'pending';
    const isScheduled = isPending && entry.dueDate > today;
    const isUnpaid = isPending && entry.dueDate <= today;

    const match =
      (wantsPaid && isSettled) ||
      (wantsUnpaid && isUnpaid) ||
      (wantsScheduled && isScheduled);

    return match;
  });
}

/** Transações: só liquidados; período por paidAt. */
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
    dateField: 'paidAt',
    statuses: 'paid,received',
    sortBy: 'dueDate',
    sortOrder: 'desc',
    page: input.page ?? 1,
    perPage: input.perPage ?? 100,
  };

  if (input.filters.types.length > 0) {
    params.types = input.filters.types.join(',');
  }
  if (input.filters.cashRegisters.length > 0) {
    params.accountIds = input.filters.cashRegisters.join(',');
  }
  if (input.filters.paymentMethods.length > 0) {
    params.paymentMethods = input.filters.paymentMethods.join(',');
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
