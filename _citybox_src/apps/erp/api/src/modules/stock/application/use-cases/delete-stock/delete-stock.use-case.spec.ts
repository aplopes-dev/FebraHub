import { DeleteStockUseCase } from './delete-stock.use-case';
import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../../tenancy/tests/tenancy-test-factory';
import { StockNotFoundError } from '../../../domain/errors/stock-not-found.error';
import { StockNotRemovableError } from '../../../domain/errors/stock-not-removable.error';
import {
  makeRepositories,
  makeStock,
  STOCK_ID,
} from '../../../tests/stocks-test-factory';
import { InMemoryStockMovementRepository } from '../../../tests/in-memory-stock-movement.repository';

describe('DeleteStockUseCase', () => {
  function setup() {
    const repos = makeRepositories();
    const stockMovementRepository = new InMemoryStockMovementRepository();
    const useCase = new DeleteStockUseCase(
      repos.stockRepository,
      stockMovementRepository,
    );
    return { ...repos, stockMovementRepository, useCase };
  }

  it('remove o estoque', async () => {
    const { useCase, stockRepository } = setup();
    await stockRepository.save(makeStock());

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: STOCK_ID,
    });

    const stored = await stockRepository.findById(ORGANIZATION_ID, STOCK_ID);
    expect(stored).toBeNull();
  });

  it('bloqueia exclusão do estoque padrão', async () => {
    const { useCase, stockRepository } = setup();
    await stockRepository.save(makeStock({ isDefault: true }));

    const error = await useCase
      .execute({ organizationId: ORGANIZATION_ID, id: STOCK_ID })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(StockNotRemovableError);
    expect((error as StockNotRemovableError).externalMessage).toMatch(
      /padrão/i,
    );

    const stored = await stockRepository.findById(ORGANIZATION_ID, STOCK_ID);
    expect(stored).not.toBeNull();
  });

  it('bloqueia exclusão do estoque provisionado pelo sistema', async () => {
    const { useCase, stockRepository } = setup();
    await stockRepository.save(
      makeStock({ systemKey: 'stock-principal', isSystem: true }),
    );

    await expect(
      useCase.execute({ organizationId: ORGANIZATION_ID, id: STOCK_ID }),
    ).rejects.toBeInstanceOf(StockNotRemovableError);

    const stored = await stockRepository.findById(ORGANIZATION_ID, STOCK_ID);
    expect(stored).not.toBeNull();
  });

  it('responde 404 para estoque inexistente', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ organizationId: ORGANIZATION_ID, id: STOCK_ID }),
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

  it('bloqueia exclusão de depósito referenciado por compra/inventário/OP', async () => {
    // Compra pendente não gera movimento, então passava em hasMovementsOrBalance
    // e estourava a FK `Restrict` no delete → 500.
    const { useCase, stockRepository } = setup();
    await stockRepository.save(makeStock());
    stockRepository.dependentStockIds.add(STOCK_ID);

    await expect(
      useCase.execute({ organizationId: ORGANIZATION_ID, id: STOCK_ID }),
    ).rejects.toBeInstanceOf(StockNotRemovableError);

    expect(stockRepository.stocks.has(STOCK_ID)).toBe(true);
  });
});
