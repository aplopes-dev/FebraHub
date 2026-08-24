import { useQuery } from '@tanstack/react-query';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import {
  fetchDashboardBirthdays,
  type DashboardBirthdaysListParams,
} from '../services/dashboard.api.service';
import type { BirthdayPeriodFilter } from '../types/clinic-dashboard';
import { DASHBOARD_QUERY_FRESHNESS } from '../lib/dashboard-query-options';

export const dashboardBirthdaysKeys = {
  all: (clinicId: string) => ['clinic-dashboard-birthdays', clinicId] as const,
  list: (clinicId: string, params: DashboardBirthdaysListParams) =>
    [...dashboardBirthdaysKeys.all(clinicId), params] as const,
};

export function useDashboardBirthdaysQuery(
  params: DashboardBirthdaysListParams,
  options?: { enabled?: boolean },
) {
  const { clinicId, isReady } = useClinicId();
  const enabled = (options?.enabled ?? true) && isReady;

  const query = useQuery({
    queryKey: dashboardBirthdaysKeys.list(clinicId, params),
    queryFn: () => fetchDashboardBirthdays(clinicId, params),
    enabled,
    ...DASHBOARD_QUERY_FRESHNESS,
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

export type DashboardBirthdaysQueryPeriod = BirthdayPeriodFilter;
