import { useQuery } from '@tanstack/react-query';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import {
  fetchDashboardTicketMedio,
  type DashboardTicketMedioParams,
} from '../services/dashboard.api.service';
import type { DashboardTicketMedioResult } from '../types/clinic-dashboard';
import { DASHBOARD_QUERY_WITH_PLACEHOLDER } from '../lib/dashboard-query-options';

export const dashboardTicketMedioKeys = {
  all: (clinicId: string) =>
    ['clinic-dashboard-ticket-medio', clinicId] as const,
  detail: (clinicId: string, params: DashboardTicketMedioParams) =>
    [...dashboardTicketMedioKeys.all(clinicId), params] as const,
};

const EMPTY: DashboardTicketMedioResult = {
  rendimento: { currentAverageCents: 0, points: [] },
  lucratividade: { currentAverageCents: 0, points: [] },
  years: [],
};

export function useDashboardTicketMedioQuery(
  params: DashboardTicketMedioParams,
  options?: { enabled?: boolean },
) {
  const { clinicId, isReady } = useClinicId();
  const enabled = (options?.enabled ?? true) && isReady;

  const query = useQuery({
    queryKey: dashboardTicketMedioKeys.detail(clinicId, params),
    queryFn: () => fetchDashboardTicketMedio(clinicId, params),
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
