import { ListCarriersUseCase } from './list-carriers.use-case';
import {
  makeCnpj,
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../../../tenancy/tests/tenancy-test-factory';
import {
  CARRIER_ID,
  makeCarrier,
  makeRepositories,
  OTHER_CARRIER_ID,
} from '../../../tests/carriers-test-factory';

describe('ListCarriersUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    const useCase = new ListCarriersUseCase(repos.carrierRepository);

    await repos.carrierRepository.save(
      makeCarrier({ id: CARRIER_ID, name: 'Transportadora Bahia' }),
    );
    await repos.carrierRepository.save(
      makeCarrier({
        id: OTHER_CARRIER_ID,
        name: 'Maria Entregas',
        document: makeCnpj(21),
      }).softDelete(),
    );

    return { ...repos, useCase };
  }

  it('lista só as ativas por padrão e conta as duas abas', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({ organizationId: ORGANIZATION_ID });

    expect(result.items.map((c) => c.id)).toEqual([CARRIER_ID]);
    expect(result.total).toBe(1);
    expect(result.tabCounts).toEqual({ active: 1, deleted: 1 });
  });

  it('lista só as excluídas na aba "deleted"', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      tab: 'deleted',
    });

    expect(result.items.map((c) => c.id)).toEqual([OTHER_CARRIER_ID]);
    expect(result.total).toBe(1);
  });

  it('filtra pela busca sem mexer nos contadores das abas', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      search: 'bahia',
    });

    expect(result.items.map((c) => c.name)).toEqual(['Transportadora Bahia']);
    expect(result.total).toBe(1);
    // Os contadores dizem quanto existe em cada aba, não quanto a busca achou.
    expect(result.tabCounts).toEqual({ active: 1, deleted: 1 });
  });

  it('não devolve transportadora de outra organização', async () => {
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
