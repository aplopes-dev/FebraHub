import { clinicaFetch } from '@/features/clinic/shared/api';
import type { ReportBirthdayRow } from '../types/clinic-reports';

export type ReportBirthdaysListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type ReportBirthdaysListParams = {
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
  status?: 'active' | 'inactive';
};

type ReportBirthdaysEnvelope = {
  data: ReportBirthdayRow[];
  meta: ReportBirthdaysListMeta;
};

function buildQuery(params: ReportBirthdaysListParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set('startDate', params.startDate);
  searchParams.set('endDate', params.endDate);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.perPage !== undefined) {
    searchParams.set('perPage', String(params.perPage));
  }
  if (params.status) searchParams.set('status', params.status);
  return `?${searchParams.toString()}`;
}

export async function listReportBirthdays(
  storeId: string,
  params: ReportBirthdaysListParams,
): Promise<{ items: ReportBirthdayRow[]; meta: ReportBirthdaysListMeta }> {
  const res = await clinicaFetch<ReportBirthdaysEnvelope>(
    storeId,
    `/v1/reports/birthdays${buildQuery(params)}`,
  );
  return { items: res.data, meta: res.meta };
}

/** Carrega todas as páginas do período (exportação PDF). */
export async function listAllReportBirthdays(
  storeId: string,
  params: Omit<ReportBirthdaysListParams, 'page' | 'perPage'>,
): Promise<ReportBirthdayRow[]> {
  const perPage = 100;
  let page = 1;
  const items: ReportBirthdayRow[] = [];

  for (;;) {
    const result = await listReportBirthdays(storeId, {
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
