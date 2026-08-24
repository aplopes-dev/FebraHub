import { clinicaFetch } from '@/features/clinic/shared/api';
import type { ReportExcludedRevenueRow } from '../types/clinic-reports';

export type ReportExcludedRevenuesListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ReportExcludedRevenuesListParams = {
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
};

type ReportExcludedRevenuesEnvelope = {
  data: ReportExcludedRevenueRow[];
  meta: ReportExcludedRevenuesListMeta;
};

function buildQuery(params: ReportExcludedRevenuesListParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set('startDate', params.startDate);
  searchParams.set('endDate', params.endDate);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) {
    searchParams.set('perPage', String(params.perPage));
  }
  return `?${searchParams.toString()}`;
}

export async function listReportExcludedRevenues(
  storeId: string,
  params: ReportExcludedRevenuesListParams,
): Promise<{
  items: ReportExcludedRevenueRow[];
  meta: ReportExcludedRevenuesListMeta;
}> {
  const res = await clinicaFetch<ReportExcludedRevenuesEnvelope>(
    storeId,
    `/v1/reports/excluded-revenues${buildQuery(params)}`,
  );
  return { items: res.data, meta: res.meta };
}

/** Carrega todas as páginas do período (exportação PDF). */
export async function listAllReportExcludedRevenues(
  storeId: string,
  params: Omit<ReportExcludedRevenuesListParams, 'page' | 'perPage'>,
): Promise<ReportExcludedRevenueRow[]> {
  const perPage = 100;
  let page = 1;
  const items: ReportExcludedRevenueRow[] = [];

  for (;;) {
    const result = await listReportExcludedRevenues(storeId, {
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
