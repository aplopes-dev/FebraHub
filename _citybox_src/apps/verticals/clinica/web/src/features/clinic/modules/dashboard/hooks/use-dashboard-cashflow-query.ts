import { useQuery } from '@tanstack/react-query';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import {
  fetchDashboardCashflow,
  type DashboardCashflowParams,
} from '../services/dashboard.api.service';
import type { DashboardCashflowResult } from '../types/clinic-dashboard';
import { DASHBOARD_QUERY_WITH_PLACEHOLDER } from '../lib/dashboard-query-options';

export const dashboardCashflowKeys = {
  all: (clinicId: string) =>
    ['clinic-dashboard-cashflow', clinicId] as const,
  detail: (clinicId: string, params: DashboardCashflowParams) =>
    [...dashboardCashflowKeys.all(clinicId), params] as const,
};

const EMPTY: DashboardCashflowResult = {
  totals: { incomeCents: 0, expenseCents: 0, balanceCents: 0 },
  timeline: [],
  years: [],
};

export function useDashboardCashflowQuery(
  params: DashboardCashflowParams,
  options?: { enabled?: boolean },
) {
  const { clinicId, isReady } = useClinicId();
  const enabled = (options?.enabled ?? true) && isReady;

  const query = useQuery({
    queryKey: dashboardCashflowKeys.detail(clinicId, params),
    queryFn: () => fetchDashboardCashflow(clinicId, params),
    enabled,
    ...DASHBOARD_QUERY_WITH_PLACEHOLDER,
  });

  return {
    ...query,
    data: query.data ?? EMPTY,
    isLoading: query.isLoading || (enabled && !isReady),
    isError: query.isError,
  };
}
