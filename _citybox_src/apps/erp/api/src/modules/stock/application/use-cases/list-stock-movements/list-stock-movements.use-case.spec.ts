import { ListStockMovementsUseCase } from './list-stock-movements.use-case';
import { CreateStockMovementUseCase } from '../create-stock-movement/create-stock-movement.use-case';
import { makeMovementCategory } from '../../../tests/movement-categories-test-factory';
import { makeStock } from '../../../tests/stocks-test-factory';
import { InMemoryStockRepository } from '../../../tests/in-memory-stock.repository';
import { InMemoryMovementCategoryRepository } from '../../../tests/in-memory-movement-category.repository';
import {
  InMemoryStockMovementRepository,
  InMemoryStockProductLookup,
} from '../../../tests/in-memory-stock-movement.repository';
import {
  BRANCH_ID,
  ORGANIZATION_ID,
} from '../../../../tenancy/tests/tenancy-test-factory';

const STOCK_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const ENTRADA_CAT = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const SAIDA_CAT = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const PRODUCT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

describe('ListStockMovementsUseCase', () => {
  async function setupWithMovements() {
    const stockRepository = new InMemoryStockRepository();
    const movementCategoryRepository = new InMemoryMovementCategoryRepository();
    const stockMovementRepository = new InMemoryStockMovementRepository();
    const stockProductLookup = new InMemoryStockProductLookup();

    await stockRepository.save(
      makeStock({ id: STOCK_ID, branchIds: [BRANCH_ID] }),
    );
    await movementCategoryRepository.save(
      makeMovementCategory({
        id: ENTRADA_CAT,
        type: 'entrada',
        code: 'CM-004',
        branchIds: [BRANCH_ID],
      }),
    );
    await movementCategoryRepository.save(
      makeMovementCategory({
        id: SAIDA_CAT,
        type: 'saida',
        code: 'CM-001',
        branchIds: [BRANCH_ID],
      }),
    );
    stockProductLookup.set({
      id: PRODUCT_ID,
      trackStock: true,
      deletedAt: null,
    });
    stockMovementRepository.setProductMeta(PRODUCT_ID, {
      name: 'Produto A',
      sku: 'SKU-A',
    });

    const create = new CreateStockMovementUseCase(
      stockMovementRepository,
      stockRepository,
      movementCategoryRepository,
      stockProductLookup,
    );
    const list = new ListStockMovementsUseCase(stockMovementRepository);

    await create.execute({
      organizationId: ORGANIZATION_ID,
      stockId: STOCK_ID,
      categoryId: ENTRADA_CAT,
      type: 'entrada',
      operatedAt: new Date('2026-07-28T10:00:00.000Z'),
      createdByUserId: USER_ID,
      lines: [{ productId: PRODUCT_ID, quantity: '5', costCents: 100 }],
    });
    await create.execute({
      organizationId: ORGANIZATION_ID,
      stockId: STOCK_ID,
      categoryId: SAIDA_CAT,
      type: 'saida',
      operatedAt: new Date('2026-07-28T11:00:00.000Z'),
      createdByUserId: USER_ID,
      lines: [{ productId: PRODUCT_ID, quantity: '2', costCents: 100 }],
    });

    return { list };
  }

  it('retorna tabCounts ignorando search', async () => {
    const { list } = await setupWithMovements();

    const result = await list.execute({
      organizationId: ORGANIZATION_ID,
      tab: 'entrada',
      search: 'inexistente',
      page: 1,
      perPage: 20,
    });

    expect(result.total).toBe(0);
    expect(result.tabCounts).toEqual({ all: 2, entrada: 1, saida: 1 });
  });

  it('filtra por tab saida', async () => {
    const { list } = await setupWithMovements();

    const result = await list.execute({
      organizationId: ORGANIZATION_ID,
      tab: 'saida',
      page: 1,
      perPage: 20,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.movement.type).toBe('saida');
  });
});
