import { useQuery } from '@tanstack/react-query';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import {
  fetchDashboardPatientAcquisition,
  type DashboardPatientAcquisitionParams,
} from '../services/dashboard.api.service';
import type { DashboardPatientAcquisitionResult } from '../types/clinic-dashboard';
import { DASHBOARD_QUERY_WITH_PLACEHOLDER } from '../lib/dashboard-query-options';

export const dashboardPatientAcquisitionKeys = {
  all: (clinicId: string) =>
    ['clinic-dashboard-patient-acquisition', clinicId] as const,
  detail: (clinicId: string, params: DashboardPatientAcquisitionParams) =>
    [...dashboardPatientAcquisitionKeys.all(clinicId), params] as const,
};

const EMPTY: DashboardPatientAcquisitionResult = {
  totalCount: 0,
  aggregates: [],
  years: [],
};

export function useDashboardPatientAcquisitionQuery(
  params: DashboardPatientAcquisitionParams,
  options?: { enabled?: boolean },
) {
  const { clinicId, isReady } = useClinicId();
  const enabled = (options?.enabled ?? true) && isReady;

  const query = useQuery({
    queryKey: dashboardPatientAcquisitionKeys.detail(clinicId, params),
    queryFn: () => fetchDashboardPatientAcquisition(clinicId, params),
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
