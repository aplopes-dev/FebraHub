import { clinicaFetch } from '@/features/clinic/shared/api';
import type { ReportSalesBySpecialtyRow } from '../types/clinic-reports';

export type ReportSalesBySpecialtyListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ReportSalesBySpecialtyListParams = {
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
};

type ReportSalesBySpecialtyEnvelope = {
  data: ReportSalesBySpecialtyRow[];
  meta: ReportSalesBySpecialtyListMeta;
};

function buildQuery(params: ReportSalesBySpecialtyListParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set('startDate', params.startDate);
  searchParams.set('endDate', params.endDate);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) {
    searchParams.set('perPage', String(params.perPage));
  }
  return `?${searchParams.toString()}`;
}

export async function listReportSalesBySpecialty(
  storeId: string,
  params: ReportSalesBySpecialtyListParams,
): Promise<{
  items: ReportSalesBySpecialtyRow[];
  meta: ReportSalesBySpecialtyListMeta;
}> {
  const res = await clinicaFetch<ReportSalesBySpecialtyEnvelope>(
    storeId,
    `/v1/reports/sales-by-specialty${buildQuery(params)}`,
  );
  return { items: res.data, meta: res.meta };
}

/** Carrega todas as páginas do período (exportação PDF). */
export async function listAllReportSalesBySpecialty(
  storeId: string,
  params: Omit<ReportSalesBySpecialtyListParams, 'page' | 'perPage'>,
): Promise<ReportSalesBySpecialtyRow[]> {
  const perPage = 100;
  let page = 1;
  const items: ReportSalesBySpecialtyRow[] = [];

  for (;;) {
    const result = await listReportSalesBySpecialty(storeId, {
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
