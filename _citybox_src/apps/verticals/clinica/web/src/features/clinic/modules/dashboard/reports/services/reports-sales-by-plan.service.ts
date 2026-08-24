import { clinicaFetch } from '@/features/clinic/shared/api';
import type { ReportSalesByPlanRow } from '../types/clinic-reports';

export type ReportSalesByPlanListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ReportSalesByPlanListParams = {
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
};

type ReportSalesByPlanEnvelope = {
  data: ReportSalesByPlanRow[];
  meta: ReportSalesByPlanListMeta;
};

function buildQuery(params: ReportSalesByPlanListParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set('startDate', params.startDate);
  searchParams.set('endDate', params.endDate);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) {
    searchParams.set('perPage', String(params.perPage));
  }
  return `?${searchParams.toString()}`;
}

export async function listReportSalesByPlan(
  storeId: string,
  params: ReportSalesByPlanListParams,
): Promise<{
  items: ReportSalesByPlanRow[];
  meta: ReportSalesByPlanListMeta;
}> {
  const res = await clinicaFetch<ReportSalesByPlanEnvelope>(
    storeId,
    `/v1/reports/sales-by-plan${buildQuery(params)}`,
  );
  return { items: res.data, meta: res.meta };
}

/** Carrega todas as páginas do período (exportação PDF). */
export async function listAllReportSalesByPlan(
  storeId: string,
  params: Omit<ReportSalesByPlanListParams, 'page' | 'perPage'>,
): Promise<ReportSalesByPlanRow[]> {
  const perPage = 100;
  let page = 1;
  const items: ReportSalesByPlanRow[] = [];

  for (;;) {
    const result = await listReportSalesByPlan(storeId, {
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
