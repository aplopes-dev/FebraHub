import { clinicaFetch } from '@/features/clinic/shared/api';
import type { ReportReferredPatientRow } from '../types/clinic-reports';

export type ReportReferredPatientsListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ReportReferredPatientsListParams = {
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
};

type ReportReferredPatientsEnvelope = {
  data: ReportReferredPatientRow[];
  meta: ReportReferredPatientsListMeta;
};

function buildQuery(params: ReportReferredPatientsListParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set('startDate', params.startDate);
  searchParams.set('endDate', params.endDate);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) {
    searchParams.set('perPage', String(params.perPage));
  }
  return `?${searchParams.toString()}`;
}

export async function listReportReferredPatients(
  storeId: string,
  params: ReportReferredPatientsListParams,
): Promise<{
  items: ReportReferredPatientRow[];
  meta: ReportReferredPatientsListMeta;
}> {
  const res = await clinicaFetch<ReportReferredPatientsEnvelope>(
    storeId,
    `/v1/reports/referred-patients${buildQuery(params)}`,
  );
  return { items: res.data, meta: res.meta };
}

/** Carrega todas as páginas do período (exportação PDF). */
export async function listAllReportReferredPatients(
  storeId: string,
  params: Omit<ReportReferredPatientsListParams, 'page' | 'perPage'>,
): Promise<ReportReferredPatientRow[]> {
  const perPage = 100;
  let page = 1;
  const items: ReportReferredPatientRow[] = [];

  for (;;) {
    const result = await listReportReferredPatients(storeId, {
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
