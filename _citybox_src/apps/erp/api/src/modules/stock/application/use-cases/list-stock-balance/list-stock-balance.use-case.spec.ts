import { ListStockBalanceUseCase } from './list-stock-balance.use-case';
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
const PRODUCT_OK = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PRODUCT_LOW = 'bbbbbbbb-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PRODUCT_EMPTY = 'cccccccc-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

describe('ListStockBalanceUseCase', () => {
  async function setup() {
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

    for (const [id, name, sku] of [
      [PRODUCT_OK, 'Produto OK', 'SKU-OK'],
      [PRODUCT_LOW, 'Produto Low', 'SKU-LOW'],
      [PRODUCT_EMPTY, 'Produto Empty', 'SKU-EMPTY'],
    ] as const) {
      stockProductLookup.set({ id, trackStock: true, deletedAt: null });
      stockMovementRepository.setProductMeta(id, { name, sku });
    }

    const create = new CreateStockMovementUseCase(
      stockMovementRepository,
      stockRepository,
      movementCategoryRepository,
      stockProductLookup,
    );
    const listBalance = new ListStockBalanceUseCase(
      stockRepository,
      stockMovementRepository,
    );

    await create.execute({
      organizationId: ORGANIZATION_ID,
      stockId: STOCK_ID,
      categoryId: ENTRADA_CAT,
      type: 'entrada',
      operatedAt: new Date(),
      createdByUserId: USER_ID,
      lines: [
        { productId: PRODUCT_OK, quantity: '10', costCents: 100 },
        { productId: PRODUCT_LOW, quantity: '3', costCents: 100 },
      ],
    });

    // Empty: create entrada then saida full for PRODUCT_EMPTY would need saida cat;
    // instead seed balance 0 via create entrada 0 is invalid — use direct balance set.
    stockMovementRepository.setBalance(
      ORGANIZATION_ID,
      STOCK_ID,
      PRODUCT_EMPTY,
      '0',
    );

    return { listBalance };
  }

  it('filtra por status low', async () => {
    const { listBalance } = await setup();

    const result = await listBalance.execute({
      organizationId: ORGANIZATION_ID,
      stockId: STOCK_ID,
      status: 'low',
      page: 1,
      perPage: 20,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.productId).toBe(PRODUCT_LOW);
    expect(result.items[0]?.status).toBe('low');
  });

  it('filtra por status empty', async () => {
    const { listBalance } = await setup();

    const result = await listBalance.execute({
      organizationId: ORGANIZATION_ID,
      stockId: STOCK_ID,
      status: 'empty',
      page: 1,
      perPage: 20,
    });

    expect(result.items.some((i) => i.productId === PRODUCT_EMPTY)).toBe(true);
    expect(result.items.every((i) => i.status === 'empty')).toBe(true);
  });
});
