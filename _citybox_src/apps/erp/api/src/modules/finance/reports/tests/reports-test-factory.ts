import { ORGANIZATION_ID } from '../../../tenancy/tests/tenancy-test-factory';
import { InMemoryFinancialGroupRepository } from '../../financial-groups/tests/in-memory-financial-group.repository';
import { InMemoryChartOfAccountRepository } from '../../chart-of-accounts/tests/in-memory-chart-of-account.repository';
import { InMemoryCostCenterRepository } from '../../cost-centers/tests/in-memory-cost-center.repository';
import {
  InMemoryFinanceReportRepository,
  type InMemoryAllocationRow,
} from './in-memory-finance-report.repository';

export { ORGANIZATION_ID };

export const CHART_OF_ACCOUNT_ID = 'a1111111-1111-4111-8111-111111111111';
export const COST_CENTER_ID = 'c1111111-1111-4111-8111-111111111111';

/**
 * Compõe os 4 repositórios in-memory que o `get-income-statement`/
 * `get-cost-center-analysis` precisam — reaproveita os 3 já existentes de
 * `financial-groups`/`chart-of-accounts`/`cost-centers` (mesmo padrão de
 * reuso cross-módulo de `chart-of-accounts-test-factory.ts`).
 */
export function makeReportRepositories() {
  const financialGroupRepository = new InMemoryFinancialGroupRepository();
  const chartOfAccountRepository = new InMemoryChartOfAccountRepository(
    financialGroupRepository,
  );
  const costCenterRepository = new InMemoryCostCenterRepository();
  const financeReportRepository = new InMemoryFinanceReportRepository();

  return {
    financialGroupRepository,
    chartOfAccountRepository,
    costCenterRepository,
    financeReportRepository,
  };
}

export function makeAllocation(
  overrides: Partial<InMemoryAllocationRow> = {},
): InMemoryAllocationRow {
  return {
    organizationId: overrides.organizationId ?? ORGANIZATION_ID,
    chartOfAccountId: overrides.chartOfAccountId ?? CHART_OF_ACCOUNT_ID,
    costCenterId: overrides.costCenterId ?? COST_CENTER_ID,
    amountCents: overrides.amountCents ?? 10000,
    competenceDate: overrides.competenceDate ?? new Date('2026-08-15'),
    deletedAt: overrides.deletedAt ?? null,
    operation: overrides.operation ?? 'payable',
  };
}
