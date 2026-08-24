import type { CashFlowPeriodFilter } from '@/features/clinic/financeiro/types';
import { PAYMENT_METHOD_OPTIONS } from '@/features/clinic/financeiro/lib/payment-method-labels';
import type { DashboardPaymentMethodKey } from '../types/clinic-dashboard';

export const TRANSACTIONS_PATH = '/financeiro/transacoes';

const PAYMENT_METHOD_VALUES = new Set(
  PAYMENT_METHOD_OPTIONS.map((option) => option.value),
);

export type TransactionsDeepLinkState = {
  period: CashFlowPeriodFilter;
  startDate: string | null;
  endDate: string | null;
  viewMode: 'payment_method' | 'transactions';
  filters: {
    types: ('income' | 'expense')[];
    paymentMethods: string[];
  };
};

function isCashFlowPeriod(value: string | null): value is CashFlowPeriodFilter {
  return (
    value === 'all' ||
    value === 'today' ||
    value === 'this_week' ||
    value === 'this_month' ||
    value === 'last_month' ||
    value === 'last_30_days' ||
    value === 'next_30_days' ||
    value === 'custom'
  );
}

function parseCsvParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function isYyyyMmDd(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isPaymentMethod(value: string): value is DashboardPaymentMethodKey {
  return PAYMENT_METHOD_VALUES.has(
    value as (typeof PAYMENT_METHOD_OPTIONS)[number]['value'],
  );
}

/** Monta URL de Transações filtrada por Receitas + meio de pagamento. */
export function buildPaymentMethodTransactionsHref(input: {
  paymentMethod: DashboardPaymentMethodKey;
  period: CashFlowPeriodFilter;
  startDate?: string;
  endDate?: string;
}): string {
  const qs = new URLSearchParams({
    types: 'income',
    paymentMethods: input.paymentMethod,
    view: 'transactions',
    period: input.period,
  });
  if (
    input.period === 'custom' &&
    input.startDate &&
    input.endDate &&
    isYyyyMmDd(input.startDate) &&
    isYyyyMmDd(input.endDate)
  ) {
    qs.set('startDate', input.startDate);
    qs.set('endDate', input.endDate);
  }
  return `${TRANSACTIONS_PATH}?${qs.toString()}`;
}

/**
 * Lê query params iniciais da página de Transações.
 * Retorna `null` se não houver params válidos de deep-link.
 */
export function parseTransactionsDeepLink(
  searchParams: URLSearchParams,
): TransactionsDeepLinkState | null {
  const typesRaw = parseCsvParam(searchParams.get('types')).filter(
    (t): t is 'income' | 'expense' => t === 'income' || t === 'expense',
  );
  const paymentMethodsRaw = parseCsvParam(
    searchParams.get('paymentMethods'),
  ).filter(isPaymentMethod);
  const periodRaw = searchParams.get('period');
  const startDateRaw = searchParams.get('startDate');
  const endDateRaw = searchParams.get('endDate');
  const viewRaw = searchParams.get('view');

  const hasAny =
    typesRaw.length > 0 ||
    paymentMethodsRaw.length > 0 ||
    (periodRaw !== null && periodRaw.length > 0) ||
    viewRaw === 'transactions' ||
    viewRaw === 'payment_method';

  if (!hasAny) return null;

  const period: CashFlowPeriodFilter =
    periodRaw && isCashFlowPeriod(periodRaw) ? periodRaw : 'this_month';

  const startDate =
    startDateRaw && isYyyyMmDd(startDateRaw) ? startDateRaw : null;
  const endDate = endDateRaw && isYyyyMmDd(endDateRaw) ? endDateRaw : null;

  return {
    period,
    startDate,
    endDate,
    viewMode: viewRaw === 'payment_method' ? 'payment_method' : 'transactions',
    filters: {
      types: typesRaw,
      paymentMethods: paymentMethodsRaw,
    },
  };
}
