import type { CashFlowFilters, CashFlowPeriodFilter } from '@/features/clinic/financeiro/types';
import { formatLocalDateString } from '@/features/clinic/agenda/lib/local-date';

export const CASH_FLOW_OVERDUE_PATH = '/financeiro/fluxo-de-caixa';

export type CashFlowDeepLinkState = {
  period: CashFlowPeriodFilter;
  startDate: string;
  endDate: string;
  filters: Pick<CashFlowFilters, 'types' | 'statuses' | 'categories'>;
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

/** Ontem no calendário local. */
export function getYesterdayLocalDate(referenceDate: Date = new Date()): string {
  const yesterday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() - 1,
  );
  return formatLocalDateString(yesterday);
}

/** Um ano antes da referência (início amplo para listar atrasados). */
export function getOverdueStartDate(referenceDate: Date = new Date()): string {
  const start = new Date(
    referenceDate.getFullYear() - 1,
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  return formatLocalDateString(start);
}

/** Monta URL do fluxo de caixa filtrado por receitas + atrasadas (até ontem). */
export function buildOverdueIncomeCashFlowHref(referenceDate: Date = new Date()): string {
  const endDate = getYesterdayLocalDate(referenceDate);
  const startDate = getOverdueStartDate(referenceDate);
  const qs = new URLSearchParams({
    types: 'income',
    statuses: 'unpaid',
    period: 'custom',
    startDate,
    endDate,
  });
  return `${CASH_FLOW_OVERDUE_PATH}?${qs.toString()}`;
}

/** Monta URL do fluxo de caixa filtrado por despesas + categoria de despesa. */
export function buildExpenseCategoryCashFlowHref(input: {
  categoryId: string;
  startDate: string;
  endDate: string;
}): string {
  const qs = new URLSearchParams({
    types: 'expense',
    categories: input.categoryId,
    period: 'custom',
    startDate: input.startDate,
    endDate: input.endDate,
  });
  return `${CASH_FLOW_OVERDUE_PATH}?${qs.toString()}`;
}

/**
 * Lê query params iniciais do fluxo de caixa.
 * Retorna `null` se não houver params válidos de deep-link.
 */
export function parseCashFlowDeepLink(
  searchParams: URLSearchParams,
): CashFlowDeepLinkState | null {
  const typesRaw = parseCsvParam(searchParams.get('types')).filter(
    (t): t is 'income' | 'expense' => t === 'income' || t === 'expense',
  );
  const statusesRaw = parseCsvParam(searchParams.get('statuses')).filter(
    (s): s is 'paid' | 'unpaid' | 'scheduled' =>
      s === 'paid' || s === 'unpaid' || s === 'scheduled',
  );
  const categoriesRaw = parseCsvParam(searchParams.get('categories'));
  const periodRaw = searchParams.get('period');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const hasAny =
    typesRaw.length > 0 ||
    statusesRaw.length > 0 ||
    categoriesRaw.length > 0 ||
    (periodRaw !== null && periodRaw.length > 0) ||
    (startDate !== null && startDate.length > 0) ||
    (endDate !== null && endDate.length > 0);

  if (!hasAny) return null;

  const period: CashFlowPeriodFilter =
    periodRaw && isCashFlowPeriod(periodRaw) ? periodRaw : 'custom';

  const resolvedStart =
    startDate && isYyyyMmDd(startDate) ? startDate : getOverdueStartDate();
  const resolvedEnd =
    endDate && isYyyyMmDd(endDate) ? endDate : getYesterdayLocalDate();

  return {
    period,
    startDate: resolvedStart,
    endDate: resolvedEnd,
    filters: {
      types: typesRaw,
      statuses: statusesRaw,
      categories: categoriesRaw,
    },
  };
}
