import { DeleteChartOfAccountUseCase } from './delete-chart-of-account.use-case';
import { ChartOfAccountNotFoundError } from '../../../domain/errors/chart-of-account-not-found.error';
import { ChartOfAccountNotRemovableError } from '../../../domain/errors/chart-of-account-not-removable.error';
import {
  CHART_OF_ACCOUNT_ID,
  makeRepositories,
  ORGANIZATION_ID,
  seedGroupAndAccount,
} from '../../../tests/chart-of-accounts-test-factory';

describe('DeleteChartOfAccountUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new DeleteChartOfAccountUseCase(repos.accountRepository);
    return { ...repos, useCase };
  }

  it('marca a conta como excluída sem apagá-la', async () => {
    const { useCase, ...repos } = setup();
    const { accountRepository } = repos;
    await seedGroupAndAccount(repos);

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: CHART_OF_ACCOUNT_ID,
    });

    const stored = await accountRepository.findById(
      ORGANIZATION_ID,
      CHART_OF_ACCOUNT_ID,
    );
    expect(stored?.deletedAt).toBeInstanceOf(Date);
    expect(
      await accountRepository.count(ORGANIZATION_ID, { tab: 'active' }),
    ).toBe(0);
    expect(
      await accountRepository.count(ORGANIZATION_ID, { tab: 'deleted' }),
    ).toBe(1);
  });

  it('409 ao tentar excluir uma conta provisionada pelo sistema', async () => {
    const { useCase, ...repos } = setup();
    await seedGroupAndAccount(repos, {
      account: { systemKey: 'coa-vendas', isSystem: true },
    });

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: CHART_OF_ACCOUNT_ID,
      }),
    ).rejects.toBeInstanceOf(ChartOfAccountNotRemovableError);

    const stored = await repos.accountRepository.findById(
      ORGANIZATION_ID,
      CHART_OF_ACCOUNT_ID,
    );
    expect(stored?.deletedAt).toBeNull();
  });

  it('rejeita conta já excluída', async () => {
    const { useCase, ...repos } = setup();
    await seedGroupAndAccount(repos, {
      account: { deletedAt: new Date() },
    });

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: CHART_OF_ACCOUNT_ID,
      }),
    ).rejects.toBeInstanceOf(ChartOfAccountNotFoundError);
  });
});
