import type { FinancialGroup } from '../../financial-groups/domain/entities/financial-group.entity';
import {
  FINANCIAL_GROUP_ID,
  makeFinancialGroup,
  ORGANIZATION_ID,
  OTHER_FINANCIAL_GROUP_ID,
} from '../../financial-groups/tests/financial-groups-test-factory';
import { InMemoryFinancialGroupRepository } from '../../financial-groups/tests/in-memory-financial-group.repository';
import { ChartOfAccount } from '../domain/entities/chart-of-account.entity';
import { InMemoryChartOfAccountRepository } from './in-memory-chart-of-account.repository';

export {
  FINANCIAL_GROUP_ID,
  makeFinancialGroup,
  ORGANIZATION_ID,
  OTHER_FINANCIAL_GROUP_ID,
};

export const MISSING_FINANCIAL_GROUP_ID =
  'f9999999-9999-4999-8999-999999999999';

export const CHART_OF_ACCOUNT_ID = 'a1111111-1111-4111-8111-111111111111';
export const OTHER_CHART_OF_ACCOUNT_ID = 'a2222222-2222-4222-8222-222222222222';

export type ChartOfAccountOverrides = Partial<{
  id: string;
  organizationId: string;
  name: string;
  financialGroupId: string;
  availableForPdv: boolean;
  systemKey: string | null;
  isSystem: boolean;
  deletedAt: Date | null;
}>;

export function makeChartOfAccount(
  overrides: ChartOfAccountOverrides = {},
): ChartOfAccount {
  return ChartOfAccount.create(
    {
      organizationId: overrides.organizationId ?? ORGANIZATION_ID,
      name: overrides.name ?? 'Vendas no balcão',
      financialGroupId: overrides.financialGroupId ?? FINANCIAL_GROUP_ID,
      availableForPdv: overrides.availableForPdv ?? false,
      systemKey: overrides.systemKey ?? null,
      isSystem: overrides.isSystem ?? false,
      deletedAt: overrides.deletedAt ?? null,
    },
    overrides.id ?? CHART_OF_ACCOUNT_ID,
  );
}

/**
 * Repositórios in-memory já ligados: o de contas enriquece a listagem lendo o
 * de grupos financeiros, como o join do Prisma faz em produção.
 */
export function makeRepositories() {
  const financialGroupRepository = new InMemoryFinancialGroupRepository();
  const accountRepository = new InMemoryChartOfAccountRepository(
    financialGroupRepository,
  );
  return { accountRepository, financialGroupRepository };
}

type Repositories = ReturnType<typeof makeRepositories>;

/** Grava um grupo financeiro e uma conta do plano apontando para ele. */
export async function seedGroupAndAccount(
  repositories: Repositories,
  overrides: {
    group?: Parameters<typeof makeFinancialGroup>[0];
    account?: ChartOfAccountOverrides;
  } = {},
): Promise<{ group: FinancialGroup; account: ChartOfAccount }> {
  const group = makeFinancialGroup(overrides.group);
  await repositories.financialGroupRepository.save(group);

  const account = makeChartOfAccount({
    financialGroupId: group.id,
    ...overrides.account,
  });
  await repositories.accountRepository.save(account);

  return { group, account };
}
