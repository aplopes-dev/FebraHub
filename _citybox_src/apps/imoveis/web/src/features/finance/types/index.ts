/** Tipos do módulo financeiro (KPIs, config de comissão, livro-caixa). */

import type { OrganizationType } from '@/features/shared/session/types';
import type { RentalPayoutStatus } from '@/features/transactions/types';

export type CommissionSplitPercents = {
  agencyPercent: number;
  captorPercent: number;
  sellerPercent: number;
};

export type CommissionGlobalConfig = {
  defaultCommissionPercent: number;
  defaultSplit: CommissionSplitPercents;
};

export type AgentCommissionOverride = {
  agentId: string;
  captorPercentOverride: number;
  sellerPercentOverride?: number;
};

export type CommissionConfigState = {
  global: CommissionGlobalConfig;
  agentOverrides: readonly AgentCommissionOverride[];
};

export type ExpenseEntry = {
  id: string;
  label: string;
  amountCents: number;
  date: string;
  category: string;
};

export type LedgerEntry = {
  id: string;
  date: string;
  label: string;
  type: 'income' | 'expense';
  amountCents: number;
};

export type PersonalCommissionEntry = {
  transactionId: string;
  title: string;
  propertyName: string;
  role: 'captor' | 'seller' | 'agency';
  amountCents: number;
  status: 'pending' | 'released';
  date: string;
};

export type RentalPayoutRow = {
  transactionId: string;
  propertyName: string;
  tenantName: string;
  landlordName: string;
  rentCents: number;
  adminFeeCents: number;
  deductionsCents: number;
  payoutCents: number;
  status: RentalPayoutStatus;
  dueDay: number;
};

export type AgencyFinancialSummary = {
  organizationType: 'AGENCY';
  grossRevenueCents: number;
  commissionsToReleaseCents: number;
  overdueRentalsCount: number;
  estimatedNetProfitCents: number;
  dre: {
    revenueCents: number;
    commissionExpensesCents: number;
    adminFeesCents: number;
    operatingExpensesCents: number;
    netProfitCents: number;
  };
};

export type SingleAgentFinancialSummary = {
  organizationType: 'SINGLE_AGENT';
  grossRevenueCents: number;
  expensesCents: number;
  netProfitCents: number;
  ledger: readonly LedgerEntry[];
};

export type FinancialSummary =
  | AgencyFinancialSummary
  | SingleAgentFinancialSummary;

export type FinancialPeriod = {
  from?: string;
  to?: string;
};

export function isAgencySummary(
  summary: FinancialSummary,
): summary is AgencyFinancialSummary {
  return summary.organizationType === 'AGENCY';
}

export function isSingleAgentSummary(
  summary: FinancialSummary,
): summary is SingleAgentFinancialSummary {
  return summary.organizationType === 'SINGLE_AGENT';
}

export type SummaryForOrg<T extends OrganizationType> = T extends 'AGENCY'
  ? AgencyFinancialSummary
  : SingleAgentFinancialSummary;
