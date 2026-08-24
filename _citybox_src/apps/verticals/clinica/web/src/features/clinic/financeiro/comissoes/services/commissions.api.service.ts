import { clinicaFetch } from '@/features/clinic/shared/api';
import type { CommissionPayFormValues, CommissionSummaryRow } from '../types/commission-financial.types';
import {
  mapApiCommissionSummaryToUi,
  type ApiCommissionSummary,
  type ApiListMeta,
} from '../lib/commission-api-mappers';

export type ListCommissionsParams = {
  page?: number;
  perPage?: number;
  startDate?: string;
  endDate?: string;
  professionalId?: string;
  memberId?: string;
  search?: string;
};

export type CommissionsPage = {
  data: CommissionSummaryRow[];
  meta: ApiListMeta;
};

export type CreateCommissionPaymentInput = {
  memberId: string;
  accrualIds: string[];
  values: CommissionPayFormValues;
};

type ListEnvelope = {
  data: ApiCommissionSummary[];
  meta: ApiListMeta;
};

type DetailEnvelope = {
  data: ApiCommissionSummary;
};

type PaymentCreatedEnvelope = {
  data: {
    id: string;
    netCents: number;
    memberName: string;
  };
};

function buildListQuery(params: ListCommissionsParams): string {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page ?? 1));
  qs.set('perPage', String(params.perPage ?? 100));
  if (params.startDate) qs.set('startDate', params.startDate);
  if (params.endDate) qs.set('endDate', params.endDate);
  const memberId = params.memberId ?? params.professionalId;
  if (memberId) qs.set('memberId', memberId);
  if (params.search?.trim()) qs.set('search', params.search.trim());
  return qs.toString();
}

export async function listOpenCommissions(
  storeId: string,
  params: ListCommissionsParams = {},
): Promise<CommissionsPage> {
  const res = await clinicaFetch<ListEnvelope>(
    storeId,
    `/v1/commissions/open?${buildListQuery(params)}`,
  );
  return {
    data: res.data.map(mapApiCommissionSummaryToUi),
    meta: res.meta,
  };
}

export async function getOpenCommissionDetail(
  storeId: string,
  memberId: string,
  params: { startDate?: string; endDate?: string } = {},
): Promise<CommissionSummaryRow> {
  const qs = new URLSearchParams();
  if (params.startDate) qs.set('startDate', params.startDate);
  if (params.endDate) qs.set('endDate', params.endDate);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const res = await clinicaFetch<DetailEnvelope>(
    storeId,
    `/v1/commissions/open/${memberId}${suffix}`,
  );
  return mapApiCommissionSummaryToUi(res.data);
}

export async function listCommissionHistory(
  storeId: string,
  params: ListCommissionsParams = {},
): Promise<CommissionsPage> {
  const res = await clinicaFetch<ListEnvelope>(
    storeId,
    `/v1/commissions/history?${buildListQuery(params)}`,
  );
  return {
    data: res.data.map(mapApiCommissionSummaryToUi),
    meta: res.meta,
  };
}

export async function getCommissionHistoryDetail(
  storeId: string,
  memberId: string,
  params: { startDate?: string; endDate?: string } = {},
): Promise<CommissionSummaryRow> {
  const qs = new URLSearchParams();
  if (params.startDate) qs.set('startDate', params.startDate);
  if (params.endDate) qs.set('endDate', params.endDate);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const res = await clinicaFetch<DetailEnvelope>(
    storeId,
    `/v1/commissions/history/${memberId}${suffix}`,
  );
  return mapApiCommissionSummaryToUi(res.data);
}

export async function createCommissionPayment(
  storeId: string,
  input: CreateCommissionPaymentInput,
): Promise<{ id: string; netCents: number; memberName: string }> {
  const discountCents = input.values.hasDiscount
    ? input.values.discountCents
    : 0;

  const res = await clinicaFetch<PaymentCreatedEnvelope>(
    storeId,
    '/v1/commissions/payments',
    {
      method: 'POST',
      body: JSON.stringify({
        memberId: input.memberId,
        accrualIds: input.accrualIds,
        description: input.values.description,
        paymentDate: input.values.paymentDate,
        accountId: input.values.accountId,
        paymentMethod: input.values.paymentMethod,
        discountCents,
        observation: input.values.observation || null,
      }),
    },
  );

  return {
    id: res.data.id,
    netCents: res.data.netCents,
    memberName: res.data.memberName,
  };
}

/** Extrai ids das linhas de accrual dos grupos de regra em aberto. */
export function collectOpenAccrualIds(row: CommissionSummaryRow): string[] {
  return row.ruleGroups.flatMap((group) => group.rows.map((r) => r.id));
}
