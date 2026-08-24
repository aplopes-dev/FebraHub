import { ListChartOfAccountsUseCase } from './list-chart-of-accounts.use-case';
import {
  makeChartOfAccount,
  makeRepositories,
  ORGANIZATION_ID,
  OTHER_CHART_OF_ACCOUNT_ID,
  seedGroupAndAccount,
} from '../../../tests/chart-of-accounts-test-factory';

describe('ListChartOfAccountsUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    const useCase = new ListChartOfAccountsUseCase(repos.accountRepository);

    const { group } = await seedGroupAndAccount(repos, {
      account: { name: 'Vendas no balcão' },
    });
    await repos.accountRepository.save(
      makeChartOfAccount({
        id: OTHER_CHART_OF_ACCOUNT_ID,
        name: 'Aluguel',
        financialGroupId: group.id,
        deletedAt: new Date(),
      }),
    );

    return { ...repos, useCase };
  }

  it('lista só as ativas por padrão, com o grupo enriquecido', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({ organizationId: ORGANIZATION_ID });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].account.name).toBe('Vendas no balcão');
    expect(result.items[0].financialGroupName).toBe('Vendas');
    expect(result.items[0].financialGroupType).toBe('receita');
    expect(result.total).toBe(1);
  });

  it('lista só as excluídas na aba deleted', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      tab: 'deleted',
    });

    expect(result.items.map((item) => item.account.name)).toEqual(['Aluguel']);
  });

  it('conta as abas ignorando a busca', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      search: 'balcão',
    });

    expect(result.total).toBe(1);
    expect(result.tabCounts).toEqual({ active: 1, deleted: 1 });
  });
});
