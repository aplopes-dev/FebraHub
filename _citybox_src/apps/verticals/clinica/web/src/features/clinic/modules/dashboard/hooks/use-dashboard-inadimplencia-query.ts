import { useQuery } from '@tanstack/react-query';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import {
  fetchDashboardInadimplencia,
  type DashboardInadimplenciaParams,
} from '../services/dashboard.api.service';
import type { DashboardInadimplenciaResult } from '../types/clinic-dashboard';
import { DASHBOARD_QUERY_WITH_PLACEHOLDER } from '../lib/dashboard-query-options';

export const dashboardInadimplenciaKeys = {
  all: (clinicId: string) =>
    ['clinic-dashboard-inadimplencia', clinicId] as const,
  detail: (clinicId: string, params: DashboardInadimplenciaParams) =>
    [...dashboardInadimplenciaKeys.all(clinicId), params] as const,
};

const EMPTY: DashboardInadimplenciaResult = {
  totalDebtsCents: 0,
  unpaidCents: 0,
  receivedCents: 0,
  ratePercent: 0,
  years: [],
};

export function useDashboardInadimplenciaQuery(
  params: DashboardInadimplenciaParams,
  options?: { enabled?: boolean },
) {
  const { clinicId, isReady } = useClinicId();
  const enabled = (options?.enabled ?? true) && isReady;

  const query = useQuery({
    queryKey: dashboardInadimplenciaKeys.detail(clinicId, params),
    queryFn: () => fetchDashboardInadimplencia(clinicId, params),
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
