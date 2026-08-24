import { useQuery } from '@tanstack/react-query';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import {
  fetchDashboardAppointmentsDetails,
  type DashboardAppointmentsDetailsParams,
} from '../services/dashboard.api.service';
import { DASHBOARD_QUERY_WITH_PLACEHOLDER } from '../lib/dashboard-query-options';

export const dashboardAppointmentsDetailsKeys = {
  all: (clinicId: string) =>
    ['clinic-dashboard-appointments-details', clinicId] as const,
  list: (clinicId: string, params: DashboardAppointmentsDetailsParams) =>
    [...dashboardAppointmentsDetailsKeys.all(clinicId), params] as const,
};

export function useDashboardAppointmentsDetailsQuery(
  params: DashboardAppointmentsDetailsParams,
  options?: { enabled?: boolean },
) {
  const { clinicId, isReady } = useClinicId();
  const enabled = (options?.enabled ?? true) && isReady;

  const query = useQuery({
    queryKey: dashboardAppointmentsDetailsKeys.list(clinicId, params),
    queryFn: () => fetchDashboardAppointmentsDetails(clinicId, params),
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
