'use client';

import { useQuery } from '@tanstack/react-query';
import { useSessionUser } from '@/features/shared/session/hooks/use-session';
import { useCurrentAgentId } from '@/features/shared/session/hooks/use-current-agent-id';
import {
  getFinancialSummary,
  listPersonalCommissions,
  listRentalPayouts,
} from '../services/finance-service';
import type { FinancialPeriod } from '../types';
import { financeKeys } from './query-keys';

export function useFinancialSummary(period?: FinancialPeriod) {
  const user = useSessionUser();
  const agentId = useCurrentAgentId();

  return useQuery({
    queryKey: financeKeys.summary(
      agentId || user.id,
      user.organization.type,
      period as Record<string, unknown> | undefined,
    ),
    queryFn: () => getFinancialSummary(user, period, agentId || undefined),
    enabled: Boolean(agentId || user.organization.type === 'AGENCY'),
  });
}

export function usePersonalCommissions() {
  const agentId = useCurrentAgentId();

  return useQuery({
    queryKey: financeKeys.commissions(agentId),
    queryFn: () => listPersonalCommissions(agentId),
    enabled: Boolean(agentId),
  });
}

export function useRentalPayouts() {
  return useQuery({
    queryKey: financeKeys.payouts(),
    queryFn: () => listRentalPayouts(),
  });
}
