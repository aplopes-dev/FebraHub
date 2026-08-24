import { clinicaFetch } from '@/features/clinic/shared/api';
import type { ReportBudgetRow } from '../types/clinic-reports';

export type ReportOpenBudgetsListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ReportOpenBudgetsListParams = {
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
};

type ReportOpenBudgetsEnvelope = {
  data: ReportBudgetRow[];
  meta: ReportOpenBudgetsListMeta;
};

function buildQuery(params: ReportOpenBudgetsListParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set('startDate', params.startDate);
  searchParams.set('endDate', params.endDate);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) {
    searchParams.set('perPage', String(params.perPage));
  }
  return `?${searchParams.toString()}`;
}

export async function listReportOpenBudgets(
  storeId: string,
  params: ReportOpenBudgetsListParams,
): Promise<{ items: ReportBudgetRow[]; meta: ReportOpenBudgetsListMeta }> {
  const res = await clinicaFetch<ReportOpenBudgetsEnvelope>(
    storeId,
    `/v1/reports/open-budgets${buildQuery(params)}`,
  );
  return { items: res.data, meta: res.meta };
}

/** Carrega todas as páginas do período (exportação PDF). */
export async function listAllReportOpenBudgets(
  storeId: string,
  params: Omit<ReportOpenBudgetsListParams, 'page' | 'perPage'>,
): Promise<ReportBudgetRow[]> {
  const perPage = 100;
  let page = 1;
  const items: ReportBudgetRow[] = [];

  for (;;) {
    const result = await listReportOpenBudgets(storeId, {
      ...params,
      page,
      perPage,
    });
    items.push(...result.items);
    if (page >= result.meta.totalPages || result.items.length === 0) {
      break;
    }
    page += 1;
  }

  return items;
}
