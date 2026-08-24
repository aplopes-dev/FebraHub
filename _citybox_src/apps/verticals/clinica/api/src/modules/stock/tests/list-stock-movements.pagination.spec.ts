import { ListStockMovementsUseCase } from '../application/use-cases/movements/list-stock-movements.use-case';
import {
  InMemoryStockMovementRepository,
  InMemoryStockProductRepository,
} from './stock-test.fixtures';
import type { StockMovementListItem } from '../domain/repositories/stock-movement.repository';

describe('ListStockMovementsUseCase', () => {
  it('paginates with correct meta', async () => {
    const storeId = 'store-1';
    const productId = 'product-1';

    const productRepo = new InMemoryStockProductRepository();
    const movementRepo = new InMemoryStockMovementRepository(productRepo);

    const movements: StockMovementListItem[] = Array.from({ length: 5 }).map(
      (_, i) => ({
        id: `mov-${i + 1}`,
        type: i % 2 === 0 ? 'entry' : 'withdrawal',
        quantity: 1 + i,
        notes: null,
        createdAt: new Date(Date.now() - i * 60_000).toISOString(),
        product: { id: productId, name: 'Produto', photoUrl: null },
        requestedBy: null,
        authorizedBy: { id: 'u1', name: 'Usuário' },
      }),
    );

    movementRepo.seedMovement(movements, storeId);

    const useCase = new ListStockMovementsUseCase(movementRepo);
    const page1 = await useCase.execute({
      storeId,
      type: undefined,
      productId: undefined,
      startDate: undefined,
      endDate: undefined,
      page: 1,
      perPage: 2,
    });

    expect(page1.items).toHaveLength(2);
    expect(page1.total).toBe(5);
    expect(page1.totalPages).toBe(3);

    const page3 = await useCase.execute({
      storeId,
      type: undefined,
      productId: undefined,
      startDate: undefined,
      endDate: undefined,
      page: 3,
      perPage: 2,
    });
    expect(page3.items).toHaveLength(1);
  });

  it('includes movements on the end date through end of day', async () => {
    const storeId = 'store-1';
    const productId = 'product-1';

    const productRepo = new InMemoryStockProductRepository();
    const movementRepo = new InMemoryStockMovementRepository(productRepo);

    const movements: StockMovementListItem[] = [
      {
        id: 'mov-1',
        type: 'withdrawal',
        quantity: 2,
        notes: null,
        createdAt: '2026-07-08T16:36:00.000Z',
        product: { id: productId, name: 'Produto', photoUrl: null },
        requestedBy: null,
        authorizedBy: { id: 'u1', name: 'Usuário' },
      },
    ];

    movementRepo.seedMovement(movements, storeId);

    const useCase = new ListStockMovementsUseCase(movementRepo);
    const result = await useCase.execute({
      storeId,
      type: 'withdrawal',
      productId: undefined,
      startDate: '2026-07-07',
      endDate: '2026-07-08',
      page: 1,
      perPage: 20,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('mov-1');
  });
});
