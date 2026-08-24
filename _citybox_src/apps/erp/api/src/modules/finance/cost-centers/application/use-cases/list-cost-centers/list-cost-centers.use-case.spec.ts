import { ListCostCentersUseCase } from './list-cost-centers.use-case';
import {
  COST_CENTER_ID,
  makeCostCenter,
  makeCostCenterRepositories,
  ORGANIZATION_ID,
  OTHER_COST_CENTER_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../tests/cost-centers-test-factory';

describe('ListCostCentersUseCase', () => {
  async function setup() {
    const repos = makeCostCenterRepositories();
    const useCase = new ListCostCentersUseCase(repos.costCenterRepository);

    await repos.costCenterRepository.save(
      makeCostCenter({ id: COST_CENTER_ID, name: 'Administrativo' }),
    );
    await repos.costCenterRepository.save(
      makeCostCenter({ id: OTHER_COST_CENTER_ID, name: 'Comercial' }),
    );
    await repos.costCenterRepository.softDelete(
      ORGANIZATION_ID,
      OTHER_COST_CENTER_ID,
      new Date(),
    );

    return { ...repos, useCase };
  }

  it('lista só os ativos por padrão e conta as duas abas', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({ organizationId: ORGANIZATION_ID });

    expect(result.items.map((item) => item.id)).toEqual([COST_CENTER_ID]);
    expect(result.total).toBe(1);
    expect(result.tabCounts).toEqual({ active: 1, deleted: 1 });
  });

  it('lista só os excluídos na aba "deleted"', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      tab: 'deleted',
    });

    expect(result.items.map((item) => item.id)).toEqual([OTHER_COST_CENTER_ID]);
    expect(result.total).toBe(1);
  });

  it('filtra pela busca sem mexer nos contadores das abas', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      search: 'admin',
    });

    expect(result.items.map((item) => item.name)).toEqual(['Administrativo']);
    expect(result.total).toBe(1);
    // Os contadores dizem quanto existe em cada aba, não quanto a busca achou.
    expect(result.tabCounts).toEqual({ active: 1, deleted: 1 });
  });

  it('não devolve centro de custo de outra organização', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: OTHER_ORGANIZATION_ID,
    });

    expect(result.items).toHaveLength(0);
    expect(result.tabCounts).toEqual({ active: 0, deleted: 0 });
  });
});
