import { CreateStockMovementUseCase } from './create-stock-movement.use-case';
import { MovementCategoryTypeMismatchError } from '../../../domain/errors/movement-category-type-mismatch.error';
import { ProductNotTrackableError } from '../../../domain/errors/product-not-trackable.error';
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
const CATEGORY_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const PRODUCT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

describe('CreateStockMovementUseCase', () => {
  function setup() {
    const stockRepository = new InMemoryStockRepository();
    const movementCategoryRepository = new InMemoryMovementCategoryRepository();
    const stockMovementRepository = new InMemoryStockMovementRepository();
    const stockProductLookup = new InMemoryStockProductLookup();

    const useCase = new CreateStockMovementUseCase(
      stockMovementRepository,
      stockRepository,
      movementCategoryRepository,
      stockProductLookup,
    );

    return {
      useCase,
      stockRepository,
      movementCategoryRepository,
      stockMovementRepository,
      stockProductLookup,
    };
  }

  async function seed(repos: ReturnType<typeof setup>) {
    await repos.stockRepository.save(
      makeStock({ id: STOCK_ID, branchIds: [BRANCH_ID] }),
    );
    await repos.movementCategoryRepository.save(
      makeMovementCategory({
        id: CATEGORY_ID,
        type: 'entrada',
        code: 'CM-004',
        branchIds: [BRANCH_ID],
      }),
    );
    repos.stockProductLookup.set({
      id: PRODUCT_ID,
      trackStock: true,
      deletedAt: null,
    });
    repos.stockMovementRepository.setProductMeta(PRODUCT_ID, {
      name: 'Produto A',
      sku: 'SKU-A',
    });
  }

  function baseInput(
    overrides: Partial<{
      type: 'entrada' | 'saida';
      categoryId: string;
    }> = {},
  ) {
    return {
      organizationId: ORGANIZATION_ID,
      stockId: STOCK_ID,
      categoryId: overrides.categoryId ?? CATEGORY_ID,
      type: overrides.type ?? ('entrada' as const),
      operatedAt: new Date('2026-07-28T12:00:00.000Z'),
      createdByUserId: USER_ID,
      lines: [{ productId: PRODUCT_ID, quantity: '2', costCents: 1500 }],
    };
  }

  it('cria entrada e atualiza saldo', async () => {
    const repos = setup();
    await seed(repos);

    const movement = await repos.useCase.execute(baseInput());

    expect(movement.type).toBe('entrada');
    expect(movement.lines).toHaveLength(1);
    const qty = await repos.stockMovementRepository.getBalanceQuantity(
      ORGANIZATION_ID,
      STOCK_ID,
      PRODUCT_ID,
    );
    expect(qty).toBe('2');
  });

  it('permite saída com saldo insuficiente e deixa saldo negativo', async () => {
    const repos = setup();
    await seed(repos);
    await repos.movementCategoryRepository.save(
      makeMovementCategory({
        id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        type: 'saida',
        code: 'CM-001',
        branchIds: [BRANCH_ID],
      }),
    );

    const movement = await repos.useCase.execute(
      baseInput({
        type: 'saida',
        categoryId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      }),
    );

    expect(movement.type).toBe('saida');
    const qty = await repos.stockMovementRepository.getBalanceQuantity(
      ORGANIZATION_ID,
      STOCK_ID,
      PRODUCT_ID,
    );
    expect(qty).toBe('-2');
  });

  it('rejeita categoria com type incompatível', async () => {
    const repos = setup();
    await seed(repos);
    await repos.movementCategoryRepository.save(
      makeMovementCategory({
        id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        type: 'saida',
        code: 'CM-001',
        branchIds: [BRANCH_ID],
      }),
    );

    await expect(
      repos.useCase.execute(
        baseInput({
          type: 'entrada',
          categoryId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        }),
      ),
    ).rejects.toBeInstanceOf(MovementCategoryTypeMismatchError);
  });

  it('rejeita produto sem trackStock', async () => {
    const repos = setup();
    await seed(repos);
    repos.stockProductLookup.set({
      id: PRODUCT_ID,
      trackStock: false,
      deletedAt: null,
    });

    await expect(repos.useCase.execute(baseInput())).rejects.toBeInstanceOf(
      ProductNotTrackableError,
    );
  });

  it('permite saída quando há saldo', async () => {
    const repos = setup();
    await seed(repos);
    await repos.useCase.execute(baseInput());

    const saidaCategoryId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
    await repos.movementCategoryRepository.save(
      makeMovementCategory({
        id: saidaCategoryId,
        type: 'saida',
        code: 'CM-001',
        branchIds: [BRANCH_ID],
      }),
    );

    await repos.useCase.execute(
      baseInput({ type: 'saida', categoryId: saidaCategoryId }),
    );

    const qty = await repos.stockMovementRepository.getBalanceQuantity(
      ORGANIZATION_ID,
      STOCK_ID,
      PRODUCT_ID,
    );
    expect(qty).toBe('0');
  });
});
