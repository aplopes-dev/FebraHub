'use client';

import { useQuery } from '@tanstack/react-query';
import { useSessionUser } from '@/features/shared/session/hooks/use-session';
import { useSessionAgentScope } from '@/features/shared/session/hooks/use-session-agent-scope';
import { getDashboardOverview } from '../services/dashboard-service';
import type { PerformancePeriod } from '../types';
import { dashboardKeys } from './query-keys';

export function useDashboardOverviewQuery(
  period: PerformancePeriod = 'monthly',
) {
  const user = useSessionUser();
  const { agentId, storeId, ready } = useSessionAgentScope();

  return useQuery({
    queryKey: dashboardKeys.overview(
      agentId || user.id,
      user.organization.type,
      period,
      storeId,
    ),
    queryFn: () => getDashboardOverview(user, period),
    // Só busca com membership resolvido — API filtra por scope.agentId da sessão.
    enabled: ready,
  });
}
