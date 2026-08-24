import { ListFinancialGroupsUseCase } from './list-financial-groups.use-case';
import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../../../tenancy/tests/tenancy-test-factory';
import {
  FINANCIAL_GROUP_ID,
  makeFinancialGroup,
  makeFinancialGroupRepositories,
  OTHER_FINANCIAL_GROUP_ID,
} from '../../../tests/financial-groups-test-factory';

describe('ListFinancialGroupsUseCase', () => {
  async function setup() {
    const repos = makeFinancialGroupRepositories();
    const useCase = new ListFinancialGroupsUseCase(repos.groupRepository);

    await repos.groupRepository.save(
      makeFinancialGroup({
        id: FINANCIAL_GROUP_ID,
        name: 'Vendas',
        type: 'receita',
      }),
    );
    await repos.groupRepository.save(
      makeFinancialGroup({
        id: OTHER_FINANCIAL_GROUP_ID,
        name: 'Impostos',
        type: 'despesa',
      }).softDelete(),
    );

    return { ...repos, useCase };
  }

  it('lista só os ativos por padrão e conta as duas abas', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({ organizationId: ORGANIZATION_ID });

    expect(result.items.map((group) => group.id)).toEqual([FINANCIAL_GROUP_ID]);
    expect(result.total).toBe(1);
    expect(result.tabCounts).toEqual({ active: 1, deleted: 1 });
  });

  it('lista só os excluídos na aba "deleted"', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      tab: 'deleted',
    });

    expect(result.items.map((group) => group.id)).toEqual([
      OTHER_FINANCIAL_GROUP_ID,
    ]);
    expect(result.total).toBe(1);
  });

  it('filtra por tipo sem mexer nos contadores das abas', async () => {
    const { useCase } = await setup();

    const receitas = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      type: 'receita',
    });
    const despesas = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      type: 'despesa',
    });

    expect(receitas.items.map((group) => group.name)).toEqual(['Vendas']);
    expect(despesas.items).toHaveLength(0);
    // Os contadores dizem quanto existe em cada aba, não quanto o filtro achou.
    expect(despesas.tabCounts).toEqual({ active: 1, deleted: 1 });
  });

  it('filtra pela busca sem mexer nos contadores das abas', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      search: 'vend',
    });

    expect(result.items.map((group) => group.name)).toEqual(['Vendas']);
    expect(result.tabCounts).toEqual({ active: 1, deleted: 1 });
  });

  it('não devolve grupo de outra organização', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: OTHER_ORGANIZATION_ID,
    });

    expect(result.items).toHaveLength(0);
    expect(result.tabCounts).toEqual({ active: 0, deleted: 0 });
  });

  it('normaliza a página pedida contra o total real', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      page: 99,
      perPage: 10,
    });

    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
  });
});
