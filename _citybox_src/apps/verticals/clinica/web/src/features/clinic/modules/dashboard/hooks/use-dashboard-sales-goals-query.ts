import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import {
  fetchDashboardSalesGoals,
  upsertDashboardSalesGoal,
  type UpsertDashboardSalesGoalParams,
} from '../services/dashboard.api.service';
import type { DashboardSalesGoalsSummary } from '../types/clinic-dashboard';
import { DASHBOARD_QUERY_FRESHNESS } from '../lib/dashboard-query-options';
import { invalidateClinicDashboardQueries } from '../lib/invalidate-clinic-dashboard-queries';

export const EMPTY_DASHBOARD_SALES_GOALS_SUMMARY: DashboardSalesGoalsSummary = {
  goalCents: null,
  startDate: null,
  realizedCents: 0,
  soldTodayCents: 0,
  reached: false,
  dailySales: [],
};

export const dashboardSalesGoalsKeys = {
  all: (clinicId: string) =>
    ['clinic-dashboard-sales-goals', clinicId] as const,
};

export function useDashboardSalesGoalsQuery(options?: { enabled?: boolean }) {
  const { clinicId, isReady } = useClinicId();
  const enabled = (options?.enabled ?? true) && isReady;

  const query = useQuery({
    queryKey: dashboardSalesGoalsKeys.all(clinicId),
    queryFn: () => fetchDashboardSalesGoals(clinicId),
    enabled,
    ...DASHBOARD_QUERY_FRESHNESS,
  });

  return {
    ...query,
    summary: query.data ?? EMPTY_DASHBOARD_SALES_GOALS_SUMMARY,
    isLoading: query.isLoading || (enabled && !isReady),
    isError: query.isError,
  };
}

export function useUpsertDashboardSalesGoalMutation() {
  const { clinicId } = useClinicId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpsertDashboardSalesGoalParams) =>
      upsertDashboardSalesGoal(clinicId, params),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: dashboardSalesGoalsKeys.all(clinicId),
      });
      invalidateClinicDashboardQueries(queryClient);
    },
  });
}
