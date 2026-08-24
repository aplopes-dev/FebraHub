import { useQuery } from '@tanstack/react-query';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import {
  fetchDashboardPaymentMethods,
  type DashboardPaymentMethodsParams,
} from '../services/dashboard.api.service';
import type { DashboardPaymentMethodsResult } from '../types/clinic-dashboard';
import { DASHBOARD_QUERY_WITH_PLACEHOLDER } from '../lib/dashboard-query-options';

export const dashboardPaymentMethodsKeys = {
  all: (clinicId: string) =>
    ['clinic-dashboard-payment-methods', clinicId] as const,
  detail: (clinicId: string, params: DashboardPaymentMethodsParams) =>
    [...dashboardPaymentMethodsKeys.all(clinicId), params] as const,
};

const EMPTY: DashboardPaymentMethodsResult = {
  totalCents: 0,
  items: [],
};

export function useDashboardPaymentMethodsQuery(
  params: DashboardPaymentMethodsParams,
  options?: { enabled?: boolean },
) {
  const { clinicId, isReady } = useClinicId();
  const enabled = (options?.enabled ?? true) && isReady;

  const query = useQuery({
    queryKey: dashboardPaymentMethodsKeys.detail(clinicId, params),
    queryFn: () => fetchDashboardPaymentMethods(clinicId, params),
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
