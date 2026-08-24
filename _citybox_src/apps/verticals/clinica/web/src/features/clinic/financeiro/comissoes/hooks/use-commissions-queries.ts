'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { ClinicaApiError } from '@/features/clinic/shared/api';
import { invalidateClinicDashboardQueries } from '@/features/clinic/modules/dashboard/lib/invalidate-clinic-dashboard-queries';
import { useStore } from '@/lib/store-context';
import {
  collectOpenAccrualIds,
  createCommissionPayment,
  getCommissionHistoryDetail,
  getOpenCommissionDetail,
  listCommissionHistory,
  listOpenCommissions,
  type ListCommissionsParams,
} from '../services/commissions.api.service';
import type {
  CommissionPayFormValues,
  CommissionSummaryRow,
} from '../types/commission-financial.types';

export const commissionsKeys = {
  all: (storeId: string) => ['clinic-commissions', storeId] as const,
  open: (storeId: string, params: ListCommissionsParams) =>
    [...commissionsKeys.all(storeId), 'open', params] as const,
  openDetail: (
    storeId: string,
    memberId: string,
    params: { startDate?: string; endDate?: string },
  ) => [...commissionsKeys.all(storeId), 'open-detail', memberId, params] as const,
  history: (storeId: string, params: ListCommissionsParams) =>
    [...commissionsKeys.all(storeId), 'history', params] as const,
  historyDetail: (
    storeId: string,
    memberId: string,
    params: { startDate?: string; endDate?: string },
  ) => [...commissionsKeys.all(storeId), 'history-detail', memberId, params] as const,
};

export function useOpenCommissionsQuery(
  params: ListCommissionsParams,
  options?: { enabled?: boolean },
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: commissionsKeys.open(storeId ?? '', params),
    queryFn: () => listOpenCommissions(storeId!, params),
    enabled: Boolean(storeId) && (options?.enabled ?? true),
    staleTime: 0,
    refetchOnMount: 'always',
    placeholderData: keepPreviousData,
  });
}

export function useOpenCommissionDetailQuery(
  memberId: string | null,
  params: { startDate?: string; endDate?: string },
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: commissionsKeys.openDetail(storeId ?? '', memberId ?? '', params),
    queryFn: () => getOpenCommissionDetail(storeId!, memberId!, params),
    enabled: Boolean(storeId) && Boolean(memberId) && enabled,
  });
}

export function useCommissionHistoryQuery(
  params: ListCommissionsParams,
  options?: { enabled?: boolean },
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: commissionsKeys.history(storeId ?? '', params),
    queryFn: () => listCommissionHistory(storeId!, params),
    enabled: Boolean(storeId) && (options?.enabled ?? true),
    staleTime: 0,
    refetchOnMount: 'always',
    placeholderData: keepPreviousData,
  });
}

export function useCommissionHistoryDetailQuery(
  memberId: string | null,
  params: { startDate?: string; endDate?: string },
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: commissionsKeys.historyDetail(
      storeId ?? '',
      memberId ?? '',
      params,
    ),
    queryFn: () => getCommissionHistoryDetail(storeId!, memberId!, params),
    enabled: Boolean(storeId) && Boolean(memberId) && enabled,
  });
}

export function useCreateCommissionPaymentMutation() {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      row,
      values,
    }: {
      row: CommissionSummaryRow;
      values: CommissionPayFormValues;
    }) => {
      const accrualIds = collectOpenAccrualIds(row);
      if (accrualIds.length === 0) {
        throw new Error('Não há comissões em aberto para pagar neste período.');
      }
      return createCommissionPayment(storeId!, {
        memberId: row.professionalId,
        accrualIds,
        values,
      });
    },
    onSuccess: () => {
      if (!storeId) return;
      void queryClient.invalidateQueries({
        queryKey: commissionsKeys.all(storeId),
      });
      invalidateClinicDashboardQueries(queryClient);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ClinicaApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Não foi possível pagar a comissão.';
      toast.error(message);
    },
  });
}
