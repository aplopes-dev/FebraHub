import type { SessionUser } from '@/features/shared/session/types';
import { imoveisFetch } from '@/lib/imoveis-api';
import type {
  FinancialPeriod,
  FinancialSummary,
  PersonalCommissionEntry,
  RentalPayoutRow,
} from '../types';

function buildSummaryQuery(
  user: SessionUser,
  period?: FinancialPeriod,
  actorAgentId?: string,
): string {
  const q = new URLSearchParams();
  q.set('organizationType', user.organization.type);
  /** API força escopo do corretor; passar agentId real quando disponível. */
  if (actorAgentId) {
    q.set('actorAgentId', actorAgentId);
  } else if (user.organization.type === 'SINGLE_AGENT' && user.id) {
    q.set('actorAgentId', user.id);
  }
  if (period?.from) q.set('from', period.from);
  if (period?.to) q.set('to', period.to);
  return `?${q.toString()}`;
}

export async function getFinancialSummary(
  user: SessionUser,
  period?: FinancialPeriod,
  actorAgentId?: string,
): Promise<FinancialSummary> {
  const res = await imoveisFetch<{ data: FinancialSummary }>(
    `/v1/finance/summary${buildSummaryQuery(user, period, actorAgentId)}`,
  );
  return res.data;
}

export async function listPersonalCommissions(
  agentId: string,
): Promise<readonly PersonalCommissionEntry[]> {
  const q = new URLSearchParams({ agentId });
  const res = await imoveisFetch<{ data: PersonalCommissionEntry[] }>(
    `/v1/finance/commissions?${q.toString()}`,
  );
  return res.data;
}

export async function listRentalPayouts(): Promise<readonly RentalPayoutRow[]> {
  const res = await imoveisFetch<{ data: RentalPayoutRow[] }>(
    '/v1/finance/rental-payouts',
  );
  return res.data;
}
