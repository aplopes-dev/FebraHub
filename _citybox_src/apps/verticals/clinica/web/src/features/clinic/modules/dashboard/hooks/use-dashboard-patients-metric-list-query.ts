import { useQuery } from '@tanstack/react-query';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import {
  fetchDashboardPatientsByMetric,
  type DashboardPatientsListParams,
} from '../services/dashboard.api.service';
import { DASHBOARD_QUERY_WITH_PLACEHOLDER } from '../lib/dashboard-query-options';

export const dashboardPatientsMetricListKeys = {
  all: (clinicId: string) =>
    ['clinic-dashboard-patients-metric-list', clinicId] as const,
  list: (clinicId: string, params: DashboardPatientsListParams) =>
    [...dashboardPatientsMetricListKeys.all(clinicId), params] as const,
};

export function useDashboardPatientsMetricListQuery(
  params: DashboardPatientsListParams,
  options?: { enabled?: boolean },
) {
  const { clinicId, isReady } = useClinicId();
  const enabled = (options?.enabled ?? true) && isReady;

  const query = useQuery({
    queryKey: dashboardPatientsMetricListKeys.list(clinicId, params),
    queryFn: () => fetchDashboardPatientsByMetric(clinicId, params),
    enabled,
    ...DASHBOARD_QUERY_WITH_PLACEHOLDER,
  });

  return {
    ...query,
    items: query.data?.items ?? [],
    meta: query.data?.meta ?? {
      total: 0,
      page: params.page ?? 1,
      perPage: params.perPage ?? 20,
      totalPages: 0,
    },
    isLoading: query.isLoading || (enabled && !isReady),
    isError: query.isError,
  };
}
