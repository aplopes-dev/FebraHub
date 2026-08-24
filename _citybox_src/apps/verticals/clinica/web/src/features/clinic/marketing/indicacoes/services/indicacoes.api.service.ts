import { clinicaFetch } from '@/features/clinic/shared/api';
import type {
  IndicacoesKpis,
  IndicacoesPeriodMode,
  IndicacoesReferrer,
  IndicacoesReferredPatient,
} from '../types/indicacoes';

export type IndicacoesListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type IndicacoesPeriodParams = {
  periodMode: IndicacoesPeriodMode;
  year: number;
  month?: number;
};

export type ListIndicacoesReferredPatientsParams = IndicacoesPeriodParams & {
  page?: number;
  perPage?: number;
  sortOrder?: 'asc' | 'desc';
  referrerKind?: IndicacoesReferrer['kind'];
  referrerId?: string;
};

export type ListIndicacoesReferrersParams = IndicacoesPeriodParams & {
  page?: number;
  perPage?: number;
  sortBy?: 'totalReferrals' | 'approvedBudgetsCount';
  sortOrder?: 'asc' | 'desc';
};

type PaginatedEnvelope<T> = {
  data: T[];
  meta: IndicacoesListMeta;
};

type KpisEnvelope = {
  data: IndicacoesKpis;
};

function buildPeriodQuery(params: IndicacoesPeriodParams): URLSearchParams {
  const searchParams = new URLSearchParams();
  searchParams.set('periodMode', params.periodMode);
  searchParams.set('year', String(params.year));
  if (params.periodMode === 'monthly' && params.month != null) {
    searchParams.set('month', String(params.month));
  }
  return searchParams;
}

export async function getIndicacoesKpis(
  storeId: string,
  params: IndicacoesPeriodParams,
): Promise<IndicacoesKpis> {
  const query = buildPeriodQuery(params);
  const res = await clinicaFetch<KpisEnvelope>(
    storeId,
    `/v1/indicacoes/kpis?${query.toString()}`,
  );
  return res.data;
}

export async function listIndicacoesReferredPatients(
  storeId: string,
  params: ListIndicacoesReferredPatientsParams,
): Promise<{ items: IndicacoesReferredPatient[]; meta: IndicacoesListMeta }> {
  const query = buildPeriodQuery(params);
  if (params.page != null) query.set('page', String(params.page));
  if (params.perPage != null) query.set('perPage', String(params.perPage));
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params.referrerKind) query.set('referrerKind', params.referrerKind);
  if (params.referrerId) query.set('referrerId', params.referrerId);

  const res = await clinicaFetch<PaginatedEnvelope<IndicacoesReferredPatient>>(
    storeId,
    `/v1/indicacoes/referred-patients?${query.toString()}`,
  );
  return { items: res.data, meta: res.meta };
}

export async function listAllIndicacoesReferredPatients(
  storeId: string,
  params: Omit<ListIndicacoesReferredPatientsParams, 'page' | 'perPage'>,
): Promise<IndicacoesReferredPatient[]> {
  const perPage = 100;
  let page = 1;
  const items: IndicacoesReferredPatient[] = [];

  for (;;) {
    const result = await listIndicacoesReferredPatients(storeId, {
      ...params,
      page,
      perPage,
    });
    items.push(...result.items);
    if (page >= result.meta.totalPages || result.items.length === 0) break;
    page += 1;
  }

  return items;
}

export async function listIndicacoesReferrers(
  storeId: string,
  params: ListIndicacoesReferrersParams,
): Promise<{ items: IndicacoesReferrer[]; meta: IndicacoesListMeta }> {
  const query = buildPeriodQuery(params);
  if (params.page != null) query.set('page', String(params.page));
  if (params.perPage != null) query.set('perPage', String(params.perPage));
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  const res = await clinicaFetch<PaginatedEnvelope<IndicacoesReferrer>>(
    storeId,
    `/v1/indicacoes/referrers?${query.toString()}`,
  );
  return { items: res.data, meta: res.meta };
}
