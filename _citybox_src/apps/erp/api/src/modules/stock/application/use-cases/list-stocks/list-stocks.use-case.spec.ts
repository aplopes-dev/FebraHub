import { ListStocksUseCase } from './list-stocks.use-case';
import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../../tenancy/tests/tenancy-test-factory';
import {
  makeRepositories,
  makeStock,
  OTHER_STOCK_ID,
  STOCK_ID,
} from '../../../tests/stocks-test-factory';

describe('ListStocksUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    const useCase = new ListStocksUseCase(
      repos.stockRepository,
      repos.stockMovementRepository,
    );

    await repos.stockRepository.save(
      makeStock({ id: STOCK_ID, name: 'Depósito Centro' }),
    );
    await repos.stockRepository.save(
      makeStock({ id: OTHER_STOCK_ID, name: 'Estoque Loja' }),
    );

    return { ...repos, useCase };
  }

  it('lista ordenado por nome', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({ organizationId: ORGANIZATION_ID });

    expect(result.items.map((s) => s.name)).toEqual([
      'Depósito Centro',
      'Estoque Loja',
    ]);
    expect(result.total).toBe(2);
  });

  it('filtra pela busca (nome, case-insensitive)', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      search: 'loja',
    });

    expect(result.items.map((s) => s.name)).toEqual(['Estoque Loja']);
    expect(result.total).toBe(1);
  });

  it('não devolve estoque de outra organização', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: OTHER_ORGANIZATION_ID,
    });

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
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
