import { useQuery } from '@tanstack/react-query';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import {
  fetchDashboardAppointments,
  type DashboardAppointmentsParams,
} from '../services/dashboard.api.service';
import type { DashboardAppointmentsResult } from '../types/clinic-dashboard';
import { DASHBOARD_QUERY_WITH_PLACEHOLDER } from '../lib/dashboard-query-options';

export const dashboardAppointmentsKeys = {
  all: (clinicId: string) =>
    ['clinic-dashboard-appointments', clinicId] as const,
  detail: (clinicId: string, params: DashboardAppointmentsParams) =>
    [...dashboardAppointmentsKeys.all(clinicId), params] as const,
};

const EMPTY: DashboardAppointmentsResult = {
  summary: {
    realizedCount: 0,
    missedCancelledCount: 0,
    totalCount: 0,
    attendanceRate: 0,
  },
  timeline: [],
  categories: [],
  years: [],
};

export function useDashboardAppointmentsQuery(
  params: DashboardAppointmentsParams,
  options?: { enabled?: boolean },
) {
  const { clinicId, isReady } = useClinicId();
  const enabled = (options?.enabled ?? true) && isReady;

  const query = useQuery({
    queryKey: dashboardAppointmentsKeys.detail(clinicId, params),
    queryFn: () => fetchDashboardAppointments(clinicId, params),
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
