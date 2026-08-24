import { clinicaFetch } from '@/features/clinic/shared/api';
import type { ReportBudgetRow } from '../types/clinic-reports';

export type ReportApprovedBudgetsListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ReportApprovedBudgetsListParams = {
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
};

type ReportApprovedBudgetsEnvelope = {
  data: ReportBudgetRow[];
  meta: ReportApprovedBudgetsListMeta;
};

function buildQuery(params: ReportApprovedBudgetsListParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set('startDate', params.startDate);
  searchParams.set('endDate', params.endDate);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) {
    searchParams.set('perPage', String(params.perPage));
  }
  return `?${searchParams.toString()}`;
}

export async function listReportApprovedBudgets(
  storeId: string,
  params: ReportApprovedBudgetsListParams,
): Promise<{ items: ReportBudgetRow[]; meta: ReportApprovedBudgetsListMeta }> {
  const res = await clinicaFetch<ReportApprovedBudgetsEnvelope>(
    storeId,
    `/v1/reports/approved-budgets${buildQuery(params)}`,
  );
  return { items: res.data, meta: res.meta };
}

/** Carrega todas as páginas do período (exportação PDF). */
export async function listAllReportApprovedBudgets(
  storeId: string,
  params: Omit<ReportApprovedBudgetsListParams, 'page' | 'perPage'>,
): Promise<ReportBudgetRow[]> {
  const perPage = 100;
  let page = 1;
  const items: ReportBudgetRow[] = [];

  for (;;) {
    const result = await listReportApprovedBudgets(storeId, {
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
