import { useQuery } from '@tanstack/react-query';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import {
  fetchDashboardPatientDemographics,
  type DashboardPatientDemographicsParams,
} from '../services/dashboard.api.service';
import type { DashboardPatientDemographicsResult } from '../types/clinic-dashboard';
import { DASHBOARD_QUERY_WITH_PLACEHOLDER } from '../lib/dashboard-query-options';

export const dashboardPatientDemographicsKeys = {
  all: (clinicId: string) =>
    ['clinic-dashboard-patient-demographics', clinicId] as const,
  detail: (clinicId: string, params: DashboardPatientDemographicsParams) =>
    [...dashboardPatientDemographicsKeys.all(clinicId), params] as const,
};

const EMPTY: DashboardPatientDemographicsResult = {
  filteredTotalCount: 0,
  totalCount: 0,
  ageSeries: [],
  genderShares: [],
};

export function useDashboardPatientDemographicsQuery(
  params: DashboardPatientDemographicsParams = {},
  options?: { enabled?: boolean },
) {
  const { clinicId, isReady } = useClinicId();
  const enabled = (options?.enabled ?? true) && isReady;

  const query = useQuery({
    queryKey: dashboardPatientDemographicsKeys.detail(clinicId, params),
    queryFn: () => fetchDashboardPatientDemographics(clinicId, params),
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
