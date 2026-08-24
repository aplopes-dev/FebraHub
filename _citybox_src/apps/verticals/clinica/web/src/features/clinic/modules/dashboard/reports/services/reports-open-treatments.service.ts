import { clinicaFetch } from '@/features/clinic/shared/api';
import type { ReportOpenTreatmentsWithoutAppointmentRow } from '../types/clinic-reports';

export type ReportOpenTreatmentsListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ReportOpenTreatmentsListParams = {
  page?: number;
  perPage?: number;
  status?: 'active' | 'inactive';
};

type ReportOpenTreatmentsEnvelope = {
  data: ReportOpenTreatmentsWithoutAppointmentRow[];
  meta: ReportOpenTreatmentsListMeta;
};

function buildQuery(params: ReportOpenTreatmentsListParams): string {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) {
    searchParams.set('perPage', String(params.perPage));
  }
  if (params.status) searchParams.set('status', params.status);
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export async function listReportOpenTreatmentsWithoutAppointment(
  storeId: string,
  params: ReportOpenTreatmentsListParams = {},
): Promise<{
  items: ReportOpenTreatmentsWithoutAppointmentRow[];
  meta: ReportOpenTreatmentsListMeta;
}> {
  const res = await clinicaFetch<ReportOpenTreatmentsEnvelope>(
    storeId,
    `/v1/reports/open-treatments-without-appointment${buildQuery(params)}`,
  );
  return { items: res.data, meta: res.meta };
}

/** Carrega todas as páginas (exportação PDF). */
export async function listAllReportOpenTreatmentsWithoutAppointment(
  storeId: string,
  params: Omit<ReportOpenTreatmentsListParams, 'page' | 'perPage'> = {},
): Promise<ReportOpenTreatmentsWithoutAppointmentRow[]> {
  const perPage = 100;
  let page = 1;
  const items: ReportOpenTreatmentsWithoutAppointmentRow[] = [];

  for (;;) {
    const result = await listReportOpenTreatmentsWithoutAppointment(storeId, {
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
