import { clinicaFetch } from '@/features/clinic/shared/api';
import type { ReportSalesByTreatmentRow } from '../types/clinic-reports';

export type ReportSalesByTreatmentListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ReportSalesByTreatmentListParams = {
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
};

type ReportSalesByTreatmentEnvelope = {
  data: ReportSalesByTreatmentRow[];
  meta: ReportSalesByTreatmentListMeta;
};

function buildQuery(params: ReportSalesByTreatmentListParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set('startDate', params.startDate);
  searchParams.set('endDate', params.endDate);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) {
    searchParams.set('perPage', String(params.perPage));
  }
  return `?${searchParams.toString()}`;
}

export async function listReportSalesByTreatment(
  storeId: string,
  params: ReportSalesByTreatmentListParams,
): Promise<{
  items: ReportSalesByTreatmentRow[];
  meta: ReportSalesByTreatmentListMeta;
}> {
  const res = await clinicaFetch<ReportSalesByTreatmentEnvelope>(
    storeId,
    `/v1/reports/sales-by-treatment${buildQuery(params)}`,
  );
  return { items: res.data, meta: res.meta };
}

/** Carrega todas as páginas do período (exportação PDF). */
export async function listAllReportSalesByTreatment(
  storeId: string,
  params: Omit<ReportSalesByTreatmentListParams, 'page' | 'perPage'>,
): Promise<ReportSalesByTreatmentRow[]> {
  const perPage = 100;
  let page = 1;
  const items: ReportSalesByTreatmentRow[] = [];

  for (;;) {
    const result = await listReportSalesByTreatment(storeId, {
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
