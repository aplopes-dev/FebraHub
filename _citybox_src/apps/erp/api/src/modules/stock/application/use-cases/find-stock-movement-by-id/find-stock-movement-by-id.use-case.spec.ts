import { FindStockMovementByIdUseCase } from './find-stock-movement-by-id.use-case';
import { StockMovementNotFoundError } from '../../../domain/errors/stock-movement-not-found.error';
import { StockMovement } from '../../../domain/entities/stock-movement.entity';
import { InMemoryStockMovementRepository } from '../../../tests/in-memory-stock-movement.repository';
import { ORGANIZATION_ID } from '../../../../tenancy/tests/tenancy-test-factory';

const MOVEMENT_ID = '12121212-1212-4212-8212-121212121212';
const STOCK_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const CATEGORY_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const PRODUCT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

describe('FindStockMovementByIdUseCase', () => {
  function setup() {
    const stockMovementRepository = new InMemoryStockMovementRepository();
    const useCase = new FindStockMovementByIdUseCase(stockMovementRepository);
    return { useCase, stockMovementRepository };
  }

  it('retorna o detalhe da movimentação', async () => {
    const repos = setup();
    const movement = StockMovement.create(
      {
        organizationId: ORGANIZATION_ID,
        stockId: STOCK_ID,
        categoryId: CATEGORY_ID,
        type: 'entrada',
        operatedAt: new Date('2026-07-28T12:00:00.000Z'),
        createdByUserId: USER_ID,
        lines: [{ productId: PRODUCT_ID, quantity: '2', costCents: 1500 }],
      },
      MOVEMENT_ID,
    );
    await repos.stockMovementRepository.createWithBalances(movement);
    repos.stockMovementRepository.setProductMeta(PRODUCT_ID, {
      name: 'Produto A',
      sku: 'SKU-A',
    });

    const detail = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: MOVEMENT_ID,
    });

    expect(detail.movement.id).toBe(MOVEMENT_ID);
    expect(detail.lines).toHaveLength(1);
    expect(detail.lines[0]?.productName).toBe('Produto A');
  });

  it('lança StockMovementNotFoundError quando não existe', async () => {
    const repos = setup();

    await expect(
      repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: MOVEMENT_ID,
      }),
    ).rejects.toBeInstanceOf(StockMovementNotFoundError);
  });

  it('lança StockMovementNotFoundError quando é de outra organização', async () => {
    const repos = setup();
    const movement = StockMovement.create(
      {
        organizationId: ORGANIZATION_ID,
        stockId: STOCK_ID,
        categoryId: CATEGORY_ID,
        type: 'entrada',
        operatedAt: new Date('2026-07-28T12:00:00.000Z'),
        createdByUserId: USER_ID,
        lines: [{ productId: PRODUCT_ID, quantity: '2', costCents: 1500 }],
      },
      MOVEMENT_ID,
    );
    await repos.stockMovementRepository.createWithBalances(movement);

    await expect(
      repos.useCase.execute({
        organizationId: '22222222-2222-4222-8222-222222222222',
        id: MOVEMENT_ID,
      }),
    ).rejects.toBeInstanceOf(StockMovementNotFoundError);
  });
});
