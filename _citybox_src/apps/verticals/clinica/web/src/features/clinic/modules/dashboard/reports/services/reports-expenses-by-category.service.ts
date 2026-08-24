import { clinicaFetch } from '@/features/clinic/shared/api';
import type { ReportExpensesByCategoryRow } from '../types/clinic-reports';

export type ReportExpensesByCategoryListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ReportExpensesByCategoryListParams = {
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
};

type ReportExpensesByCategoryEnvelope = {
  data: ReportExpensesByCategoryRow[];
  meta: ReportExpensesByCategoryListMeta;
};

function buildQuery(params: ReportExpensesByCategoryListParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set('startDate', params.startDate);
  searchParams.set('endDate', params.endDate);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) {
    searchParams.set('perPage', String(params.perPage));
  }
  return `?${searchParams.toString()}`;
}

export async function listReportExpensesByCategory(
  storeId: string,
  params: ReportExpensesByCategoryListParams,
): Promise<{
  items: ReportExpensesByCategoryRow[];
  meta: ReportExpensesByCategoryListMeta;
}> {
  const res = await clinicaFetch<ReportExpensesByCategoryEnvelope>(
    storeId,
    `/v1/reports/expenses-by-category${buildQuery(params)}`,
  );
  return { items: res.data, meta: res.meta };
}

/** Carrega todas as páginas do período (exportação PDF). */
export async function listAllReportExpensesByCategory(
  storeId: string,
  params: Omit<ReportExpensesByCategoryListParams, 'page' | 'perPage'>,
): Promise<ReportExpensesByCategoryRow[]> {
  const perPage = 100;
  let page = 1;
  const items: ReportExpensesByCategoryRow[] = [];

  for (;;) {
    const result = await listReportExpensesByCategory(storeId, {
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
