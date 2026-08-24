import { ListProductStockMovementsUseCase } from './list-product-stock-movements.use-case';
import { StockNotFoundError } from '../../../domain/errors/stock-not-found.error';
import { StockMovement } from '../../../domain/entities/stock-movement.entity';
import { InMemoryStockRepository } from '../../../tests/in-memory-stock.repository';
import { InMemoryStockMovementRepository } from '../../../tests/in-memory-stock-movement.repository';
import { makeStock } from '../../../tests/stocks-test-factory';
import {
  BRANCH_ID,
  ORGANIZATION_ID,
} from '../../../../tenancy/tests/tenancy-test-factory';

const STOCK_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const OTHER_STOCK_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const CATEGORY_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const PRODUCT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER_PRODUCT_ID = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1';
const USER_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

describe('ListProductStockMovementsUseCase', () => {
  function setup() {
    const stockRepository = new InMemoryStockRepository();
    const stockMovementRepository = new InMemoryStockMovementRepository();
    const useCase = new ListProductStockMovementsUseCase(
      stockRepository,
      stockMovementRepository,
    );
    return { useCase, stockRepository, stockMovementRepository };
  }

  it('lista apenas as linhas do produto no estoque informado', async () => {
    const repos = setup();
    await repos.stockRepository.save(
      makeStock({ id: STOCK_ID, branchIds: [BRANCH_ID] }),
    );

    await repos.stockMovementRepository.createWithBalances(
      StockMovement.create({
        organizationId: ORGANIZATION_ID,
        stockId: STOCK_ID,
        categoryId: CATEGORY_ID,
        type: 'entrada',
        operatedAt: new Date('2026-07-28T12:00:00.000Z'),
        createdByUserId: USER_ID,
        lines: [{ productId: PRODUCT_ID, quantity: '2', costCents: 1500 }],
      }),
    );
    await repos.stockMovementRepository.createWithBalances(
      StockMovement.create({
        organizationId: ORGANIZATION_ID,
        stockId: STOCK_ID,
        categoryId: CATEGORY_ID,
        type: 'entrada',
        operatedAt: new Date('2026-07-28T13:00:00.000Z'),
        createdByUserId: USER_ID,
        lines: [{ productId: OTHER_PRODUCT_ID, quantity: '1', costCents: 900 }],
      }),
    );

    const lines = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      stockId: STOCK_ID,
      productId: PRODUCT_ID,
    });

    expect(lines).toHaveLength(1);
    expect(lines[0]?.quantity).toBe('2');
  });

  it('lança StockNotFoundError quando o estoque não existe', async () => {
    const repos = setup();

    await expect(
      repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        stockId: OTHER_STOCK_ID,
        productId: PRODUCT_ID,
      }),
    ).rejects.toBeInstanceOf(StockNotFoundError);
  });
});
