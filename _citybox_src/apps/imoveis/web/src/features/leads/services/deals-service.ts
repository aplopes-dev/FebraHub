/**
 * Negócios CRM (funil) — consome imoveis-api `/v1/deals`.
 */
import { ImoveisApiError, imoveisFetch } from '@/lib/imoveis-api';
import type {
  DealDetail,
  DealStage,
  ListDealsParams,
  ListDealsResult,
} from '../types';

function csv(values?: readonly string[]): string | undefined {
  if (!values || values.length === 0) return undefined;
  return values.join(',');
}

function buildListQuery(params: ListDealsParams): string {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.perPage) q.set('perPage', String(params.perPage));
  if (params.search?.trim()) q.set('search', params.search.trim());
  if (params.leadId) q.set('leadId', params.leadId);
  if (params.propertyId) q.set('propertyId', params.propertyId);
  if (params.agentId) q.set('agentId', params.agentId);
  const status = csv(params.status);
  if (status) q.set('status', status);
  const stage = csv(params.stage);
  if (stage) q.set('stage', stage);
  const qs = q.toString();
  return qs ? `?${qs}` : '';
}

export async function listDeals(
  params: ListDealsParams = {},
): Promise<ListDealsResult> {
  return imoveisFetch<ListDealsResult>(`/v1/deals${buildListQuery(params)}`);
}

export async function getDealById(id: string): Promise<DealDetail | null> {
  try {
    const res = await imoveisFetch<{ data: DealDetail }>(`/v1/deals/${id}`);
    return res.data;
  } catch (err) {
    if (err instanceof ImoveisApiError && err.status === 404) return null;
    throw err;
  }
}

export async function updateDealStage(
  id: string,
  stage: DealStage,
): Promise<DealDetail | null> {
  try {
    const res = await imoveisFetch<{ data: DealDetail }>(`/v1/deals/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage }),
    });
    return res.data;
  } catch (err) {
    if (err instanceof ImoveisApiError && err.status === 404) return null;
    throw err;
  }
}
