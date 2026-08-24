import { clinicaFetch } from '@/features/clinic/shared/api';
import type { ReportSalesByProfessionalRow } from '../types/clinic-reports';

export type ReportSalesByProfessionalListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ReportSalesByProfessionalListParams = {
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
};

type ReportSalesByProfessionalEnvelope = {
  data: ReportSalesByProfessionalRow[];
  meta: ReportSalesByProfessionalListMeta;
};

function buildQuery(params: ReportSalesByProfessionalListParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set('startDate', params.startDate);
  searchParams.set('endDate', params.endDate);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) {
    searchParams.set('perPage', String(params.perPage));
  }
  return `?${searchParams.toString()}`;
}

export async function listReportSalesByProfessional(
  storeId: string,
  params: ReportSalesByProfessionalListParams,
): Promise<{
  items: ReportSalesByProfessionalRow[];
  meta: ReportSalesByProfessionalListMeta;
}> {
  const res = await clinicaFetch<ReportSalesByProfessionalEnvelope>(
    storeId,
    `/v1/reports/sales-by-professional${buildQuery(params)}`,
  );
  return { items: res.data, meta: res.meta };
}

/** Carrega todas as páginas do período (exportação PDF). */
export async function listAllReportSalesByProfessional(
  storeId: string,
  params: Omit<ReportSalesByProfessionalListParams, 'page' | 'perPage'>,
): Promise<ReportSalesByProfessionalRow[]> {
  const perPage = 100;
  let page = 1;
  const items: ReportSalesByProfessionalRow[] = [];

  for (;;) {
    const result = await listReportSalesByProfessional(storeId, {
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
