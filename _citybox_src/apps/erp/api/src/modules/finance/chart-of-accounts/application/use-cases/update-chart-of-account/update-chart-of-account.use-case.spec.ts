import { UpdateChartOfAccountUseCase } from './update-chart-of-account.use-case';
import { ChartOfAccountNameTakenError } from '../../../domain/errors/chart-of-account-name-taken.error';
import { ChartOfAccountNotFoundError } from '../../../domain/errors/chart-of-account-not-found.error';
import { FinancialGroupNotFoundError } from '../../../../financial-groups/domain/errors/financial-group-not-found.error';
import {
  CHART_OF_ACCOUNT_ID,
  makeChartOfAccount,
  makeFinancialGroup,
  makeRepositories,
  MISSING_FINANCIAL_GROUP_ID,
  ORGANIZATION_ID,
  OTHER_CHART_OF_ACCOUNT_ID,
  OTHER_FINANCIAL_GROUP_ID,
  seedGroupAndAccount,
} from '../../../tests/chart-of-accounts-test-factory';

describe('UpdateChartOfAccountUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new UpdateChartOfAccountUseCase(
      repos.accountRepository,
      repos.financialGroupRepository,
    );
    return { ...repos, useCase };
  }

  it('atualiza nome, grupo e disponibilidade no PDV', async () => {
    const { useCase, ...repos } = setup();
    await seedGroupAndAccount(repos);
    await repos.financialGroupRepository.save(
      makeFinancialGroup({
        id: OTHER_FINANCIAL_GROUP_ID,
        name: 'Despesas administrativas',
        type: 'despesa',
      }),
    );

    const item = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: CHART_OF_ACCOUNT_ID,
      name: 'Aluguel',
      financialGroupId: OTHER_FINANCIAL_GROUP_ID,
      availableForPdv: true,
    });

    expect(item.account.name).toBe('Aluguel');
    expect(item.account.financialGroupId).toBe(OTHER_FINANCIAL_GROUP_ID);
    expect(item.account.availableForPdv).toBe(true);
    expect(item.financialGroupName).toBe('Despesas administrativas');
    expect(item.financialGroupType).toBe('despesa');
  });

  it('rejeita conta inexistente', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: CHART_OF_ACCOUNT_ID,
        name: 'Aluguel',
        financialGroupId: OTHER_FINANCIAL_GROUP_ID,
        availableForPdv: false,
      }),
    ).rejects.toBeInstanceOf(ChartOfAccountNotFoundError);
  });

  it('rejeita nome que já é de outra conta', async () => {
    const { useCase, ...repos } = setup();
    const { group } = await seedGroupAndAccount(repos);
    await repos.accountRepository.save(
      makeChartOfAccount({
        id: OTHER_CHART_OF_ACCOUNT_ID,
        name: 'Aluguel',
        financialGroupId: group.id,
      }),
    );

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: CHART_OF_ACCOUNT_ID,
        name: 'aluguel',
        financialGroupId: group.id,
        availableForPdv: false,
      }),
    ).rejects.toBeInstanceOf(ChartOfAccountNameTakenError);
  });

  it('rejeita grupo financeiro inexistente', async () => {
    const { useCase, ...repos } = setup();
    await seedGroupAndAccount(repos);

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: CHART_OF_ACCOUNT_ID,
        name: 'Vendas no balcão',
        financialGroupId: MISSING_FINANCIAL_GROUP_ID,
        availableForPdv: false,
      }),
    ).rejects.toBeInstanceOf(FinancialGroupNotFoundError);
  });
});
