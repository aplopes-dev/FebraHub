import { getTeamAgentName } from '@/features/shared/constants/agents';
import { imoveisFetch } from '@/lib/imoveis-api';
import type {
  TransactionStatus,
  TransactionType,
} from '../types';

export type TransactionsReportPeriod = {
  from?: string;
  to?: string;
};

export type TransactionsReportStatusRow = {
  status: TransactionStatus;
  label: string;
  count: number;
  grossValueCents: number;
  commissionCents: number;
};

export type TransactionsReportTypeRow = {
  type: TransactionType;
  label: string;
  count: number;
  grossValueCents: number;
  commissionCents: number;
};

export type TransactionsReportAgentRow = {
  agentId: string;
  agentName: string;
  dealsCount: number;
  commissionCents: number;
};

export type TransactionsReport = {
  totalCount: number;
  totalGrossValueCents: number;
  totalCommissionCents: number;
  completedCount: number;
  byStatus: TransactionsReportStatusRow[];
  byType: TransactionsReportTypeRow[];
  byAgent: TransactionsReportAgentRow[];
};

function buildReportQuery(period?: TransactionsReportPeriod): string {
  const q = new URLSearchParams();
  if (period?.from) q.set('from', period.from);
  if (period?.to) q.set('to', period.to);
  const qs = q.toString();
  return qs ? `?${qs}` : '';
}

export async function getTransactionsReport(
  period?: TransactionsReportPeriod,
): Promise<TransactionsReport> {
  const res = await imoveisFetch<{ data: TransactionsReport }>(
    `/v1/transactions/report${buildReportQuery(period)}`,
  );
  return {
    ...res.data,
    byAgent: res.data.byAgent.map((row) => ({
      ...row,
      agentName: getTeamAgentName(row.agentId),
    })),
  };
}
