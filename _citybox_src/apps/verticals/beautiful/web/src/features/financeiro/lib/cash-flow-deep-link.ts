import type { CashFlowFilters, CashFlowPeriodFilter } from '../types';
import { EMPTY_CASH_FLOW_FILTERS } from '../types';

export const CASH_FLOW_PATH = '/financeiro/fluxo-de-caixa';

export type CashFlowDeepLinkState = {
  period: CashFlowPeriodFilter;
  startDate?: string;
  endDate?: string;
  filters: CashFlowFilters;
};

const PERIODS: readonly CashFlowPeriodFilter[] = [
  'all',
  'today',
  'this_week',
  'this_month',
  'last_month',
  'last_30_days',
  'next_30_days',
  'custom',
];

function isCashFlowPeriod(value: string): value is CashFlowPeriodFilter {
  return (PERIODS as readonly string[]).includes(value);
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

export type BuildCashFlowHrefInput = {
  period: CashFlowPeriodFilter;
  startDate?: string;
  endDate?: string;
  types?: CashFlowFilters['types'];
  statuses?: CashFlowFilters['statuses'];
  paymentMethods?: string[];
  cashRegisters?: string[];
  categories?: string[];
};

/** URL do Fluxo de caixa com filtros (ex.: Ver em Transações). */
export function buildCashFlowHref(input: BuildCashFlowHrefInput): string {
  const qs = new URLSearchParams();
  qs.set('period', input.period);

  if (input.period === 'custom' && input.startDate && input.endDate) {
    qs.set('startDate', input.startDate);
    qs.set('endDate', input.endDate);
  }

  if (input.types && input.types.length > 0) {
    qs.set('types', input.types.join(','));
  }
  if (input.statuses && input.statuses.length > 0) {
    qs.set('statuses', input.statuses.join(','));
  }
  if (input.paymentMethods && input.paymentMethods.length > 0) {
    qs.set('paymentMethods', input.paymentMethods.join(','));
  }
  if (input.cashRegisters && input.cashRegisters.length > 0) {
    qs.set('cashRegisters', input.cashRegisters.join(','));
  }
  if (input.categories && input.categories.length > 0) {
    qs.set('categories', input.categories.join(','));
  }

  return `${CASH_FLOW_PATH}?${qs.toString()}`;
}

type SearchParamsLike = { get(name: string): string | null };

function hasDeepLinkParams(searchParams: SearchParamsLike): boolean {
  return (
    Boolean(searchParams.get('period')) ||
    Boolean(searchParams.get('startDate')) ||
    Boolean(searchParams.get('endDate')) ||
    Boolean(searchParams.get('types')) ||
    Boolean(searchParams.get('statuses')) ||
    Boolean(searchParams.get('paymentMethods')) ||
    Boolean(searchParams.get('cashRegisters')) ||
    Boolean(searchParams.get('categories'))
  );
}

/**
 * Lê query params iniciais do fluxo de caixa.
 * Retorna `null` se não houver params de deep-link.
 */
export function parseCashFlowDeepLink(
  searchParams: SearchParamsLike,
): CashFlowDeepLinkState | null {
  if (!hasDeepLinkParams(searchParams)) return null;

  const periodRaw = searchParams.get('period');
  const period: CashFlowPeriodFilter =
    periodRaw && isCashFlowPeriod(periodRaw) ? periodRaw : 'this_month';

  const startDateRaw = searchParams.get('startDate');
  const endDateRaw = searchParams.get('endDate');
  const startDate =
    startDateRaw && isYyyyMmDd(startDateRaw) ? startDateRaw : undefined;
  const endDate =
    endDateRaw && isYyyyMmDd(endDateRaw) ? endDateRaw : undefined;

  const types = parseCsvParam(searchParams.get('types')).filter(
    (t): t is 'income' | 'expense' => t === 'income' || t === 'expense',
  );
  const statuses = parseCsvParam(searchParams.get('statuses')).filter(
    (s): s is 'paid' | 'unpaid' | 'scheduled' =>
      s === 'paid' || s === 'unpaid' || s === 'scheduled',
  );

  return {
    period,
    startDate,
    endDate,
    filters: {
      ...EMPTY_CASH_FLOW_FILTERS,
      types,
      statuses,
      paymentMethods: parseCsvParam(searchParams.get('paymentMethods')),
      cashRegisters: parseCsvParam(searchParams.get('cashRegisters')),
      categories: parseCsvParam(searchParams.get('categories')),
    },
  };
}
