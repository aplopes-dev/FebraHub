import { useQuery } from '@tanstack/react-query';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import {
  fetchDashboardCommissions,
  type DashboardCommissionsParams,
} from '../services/dashboard.api.service';
import type { DashboardCommissionsResult } from '../types/clinic-dashboard';
import { DASHBOARD_QUERY_WITH_PLACEHOLDER } from '../lib/dashboard-query-options';

export const dashboardCommissionsKeys = {
  all: (clinicId: string) =>
    ['clinic-dashboard-commissions', clinicId] as const,
  detail: (clinicId: string, params: DashboardCommissionsParams) =>
    [...dashboardCommissionsKeys.all(clinicId), params] as const,
};

const EMPTY: DashboardCommissionsResult = {
  netTotalCents: 0,
  byTrigger: [],
  byType: [],
  ranking: [],
  years: [],
};

export function useDashboardCommissionsQuery(
  params: DashboardCommissionsParams,
  options?: { enabled?: boolean },
) {
  const { clinicId, isReady } = useClinicId();
  const enabled = (options?.enabled ?? true) && isReady;

  const query = useQuery({
    queryKey: dashboardCommissionsKeys.detail(clinicId, params),
    queryFn: () => fetchDashboardCommissions(clinicId, params),
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
