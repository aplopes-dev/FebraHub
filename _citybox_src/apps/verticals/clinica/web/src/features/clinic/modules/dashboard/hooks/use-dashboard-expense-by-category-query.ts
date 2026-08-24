import { useQuery } from '@tanstack/react-query';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import {
  fetchDashboardExpenseByCategory,
  type DashboardExpenseByCategoryParams,
} from '../services/dashboard.api.service';
import type { DashboardExpenseByCategoryResult } from '../types/clinic-dashboard';
import { DASHBOARD_QUERY_WITH_PLACEHOLDER } from '../lib/dashboard-query-options';

export const dashboardExpenseByCategoryKeys = {
  all: (clinicId: string) =>
    ['clinic-dashboard-expense-by-category', clinicId] as const,
  detail: (clinicId: string, params: DashboardExpenseByCategoryParams) =>
    [...dashboardExpenseByCategoryKeys.all(clinicId), params] as const,
};

const EMPTY: DashboardExpenseByCategoryResult = {
  totalCents: 0,
  items: [],
  years: [],
};

export function useDashboardExpenseByCategoryQuery(
  params: DashboardExpenseByCategoryParams,
  options?: { enabled?: boolean },
) {
  const { clinicId, isReady } = useClinicId();
  const enabled = (options?.enabled ?? true) && isReady;

  const query = useQuery({
    queryKey: dashboardExpenseByCategoryKeys.detail(clinicId, params),
    queryFn: () => fetchDashboardExpenseByCategory(clinicId, params),
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
