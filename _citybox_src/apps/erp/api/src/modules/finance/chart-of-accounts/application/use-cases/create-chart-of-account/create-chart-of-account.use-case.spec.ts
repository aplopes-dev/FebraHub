import { CreateChartOfAccountUseCase } from './create-chart-of-account.use-case';
import { ChartOfAccountNameTakenError } from '../../../domain/errors/chart-of-account-name-taken.error';
import { FinancialGroupNotFoundError } from '../../../../financial-groups/domain/errors/financial-group-not-found.error';
import {
  FINANCIAL_GROUP_ID,
  makeFinancialGroup,
  makeRepositories,
  MISSING_FINANCIAL_GROUP_ID,
  ORGANIZATION_ID,
  seedGroupAndAccount,
} from '../../../tests/chart-of-accounts-test-factory';

describe('CreateChartOfAccountUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new CreateChartOfAccountUseCase(
      repos.accountRepository,
      repos.financialGroupRepository,
    );
    return { ...repos, useCase };
  }

  it('cria a conta com o grupo resolvido e PDV desligado por padrão', async () => {
    const { useCase, financialGroupRepository } = setup();
    await financialGroupRepository.save(makeFinancialGroup());

    const item = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      name: '  Vendas no balcão  ',
      financialGroupId: FINANCIAL_GROUP_ID,
    });

    expect(item.account.name).toBe('Vendas no balcão');
    expect(item.account.availableForPdv).toBe(false);
    expect(item.account.deletedAt).toBeNull();
    expect(item.financialGroupName).toBe('Vendas');
    expect(item.financialGroupType).toBe('receita');
  });

  it('rejeita nome já usado na organização', async () => {
    const { useCase, ...repos } = setup();
    await seedGroupAndAccount(repos, { account: { name: 'Vendas no balcão' } });

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        name: 'vendas no balcão',
        financialGroupId: FINANCIAL_GROUP_ID,
      }),
    ).rejects.toBeInstanceOf(ChartOfAccountNameTakenError);
  });

  it('rejeita grupo financeiro inexistente', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        name: 'Vendas no balcão',
        financialGroupId: MISSING_FINANCIAL_GROUP_ID,
      }),
    ).rejects.toBeInstanceOf(FinancialGroupNotFoundError);
  });

  it('rejeita grupo financeiro excluído', async () => {
    const { useCase, financialGroupRepository } = setup();
    await financialGroupRepository.save(makeFinancialGroup().softDelete());

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        name: 'Vendas no balcão',
        financialGroupId: FINANCIAL_GROUP_ID,
      }),
    ).rejects.toBeInstanceOf(FinancialGroupNotFoundError);
  });
});
