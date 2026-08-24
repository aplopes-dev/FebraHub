import { clinicaFetch } from '@/features/clinic/shared/api';
import type { ReportBudgetRow } from '../types/clinic-reports';

export type ReportRejectedBudgetsListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ReportRejectedBudgetsListParams = {
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
};

type ReportRejectedBudgetsEnvelope = {
  data: ReportBudgetRow[];
  meta: ReportRejectedBudgetsListMeta;
};

function buildQuery(params: ReportRejectedBudgetsListParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set('startDate', params.startDate);
  searchParams.set('endDate', params.endDate);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) {
    searchParams.set('perPage', String(params.perPage));
  }
  return `?${searchParams.toString()}`;
}

export async function listReportRejectedBudgets(
  storeId: string,
  params: ReportRejectedBudgetsListParams,
): Promise<{ items: ReportBudgetRow[]; meta: ReportRejectedBudgetsListMeta }> {
  const res = await clinicaFetch<ReportRejectedBudgetsEnvelope>(
    storeId,
    `/v1/reports/rejected-budgets${buildQuery(params)}`,
  );
  return { items: res.data, meta: res.meta };
}

/** Carrega todas as páginas do período (exportação PDF). */
export async function listAllReportRejectedBudgets(
  storeId: string,
  params: Omit<ReportRejectedBudgetsListParams, 'page' | 'perPage'>,
): Promise<ReportBudgetRow[]> {
  const perPage = 100;
  let page = 1;
  const items: ReportBudgetRow[] = [];

  for (;;) {
    const result = await listReportRejectedBudgets(storeId, {
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
