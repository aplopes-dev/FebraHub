import { FindStockByIdUseCase } from './find-stock-by-id.use-case';
import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../../tenancy/tests/tenancy-test-factory';
import { StockNotFoundError } from '../../../domain/errors/stock-not-found.error';
import {
  makeRepositories,
  makeStock,
  STOCK_ID,
} from '../../../tests/stocks-test-factory';

describe('FindStockByIdUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const useCase = new FindStockByIdUseCase(repos.stockRepository);
    return { ...repos, useCase };
  }

  it('devolve o estoque da organização ativa', async () => {
    const { useCase, stockRepository } = setup();
    await stockRepository.save(makeStock());

    const stock = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: STOCK_ID,
    });

    expect(stock.id).toBe(STOCK_ID);
    expect(stock.name).toBe('Depósito Centro');
  });

  it('responde 404 para estoque inexistente', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: STOCK_ID,
      }),
    ).rejects.toBeInstanceOf(StockNotFoundError);
  });

  it('responde 404 para estoque de outra organização', async () => {
    const { useCase, stockRepository } = setup();
    await stockRepository.save(makeStock());

    await expect(
      useCase.execute({
        organizationId: OTHER_ORGANIZATION_ID,
        id: STOCK_ID,
      }),
    ).rejects.toBeInstanceOf(StockNotFoundError);
  });
});
