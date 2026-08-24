import { CreateInventoryUseCase } from './create-inventory.use-case';
import { ProductNotTrackableError } from '../../../domain/errors/product-not-trackable.error';
import { StockNotFoundError } from '../../../domain/errors/stock-not-found.error';
import { makeStock } from '../../../tests/stocks-test-factory';
import { InMemoryInventoryRepository } from '../../../tests/in-memory-inventory.repository';
import { InMemoryStockRepository } from '../../../tests/in-memory-stock.repository';
import {
  InMemoryStockMovementRepository,
  InMemoryStockProductLookup,
} from '../../../tests/in-memory-stock-movement.repository';
import {
  BRANCH_ID,
  ORGANIZATION_ID,
} from '../../../../tenancy/tests/tenancy-test-factory';

const STOCK_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const PRODUCT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PRODUCT_B = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const USER_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

describe('CreateInventoryUseCase', () => {
  function setup() {
    const stockRepository = new InMemoryStockRepository();
    const stockMovementRepository = new InMemoryStockMovementRepository();
    const stockProductLookup = new InMemoryStockProductLookup();
    const inventoryRepository = new InMemoryInventoryRepository(
      stockMovementRepository,
    );

    const useCase = new CreateInventoryUseCase(
      inventoryRepository,
      stockRepository,
      stockMovementRepository,
      stockProductLookup,
    );

    return {
      useCase,
      stockRepository,
      stockMovementRepository,
      stockProductLookup,
      inventoryRepository,
    };
  }

  async function seed(repos: ReturnType<typeof setup>) {
    await repos.stockRepository.save(
      makeStock({ id: STOCK_ID, branchIds: [BRANCH_ID] }),
    );
    for (const id of [PRODUCT_A, PRODUCT_B]) {
      repos.stockProductLookup.set({
        id,
        trackStock: true,
        deletedAt: null,
      });
      repos.inventoryRepository.setProductMeta(id, {
        name: `Produto ${id.slice(0, 4)}`,
        sku: `SKU-${id.slice(0, 4)}`,
      });
    }
  }

  it('sem divergência: só snapshot, sem movimentos', async () => {
    const repos = setup();
    await seed(repos);
    repos.inventoryRepository.seedBalance(
      repos.stockMovementRepository,
      STOCK_ID,
      PRODUCT_A,
      '10',
    );

    const result = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      stockId: STOCK_ID,
      name: 'Inventário sem diff',
      createdByUserId: USER_ID,
      lines: [{ productId: PRODUCT_A, countedQuantity: '10' }],
    });

    expect(result.inventory.status).toBe('completed');
    expect(result.divergentCount).toBe(0);
    expect(result.inventory.lines[0].systemQuantity).toBe('10');
    expect(repos.stockMovementRepository.movements.size).toBe(0);
    const qty = await repos.stockMovementRepository.getBalanceQuantity(
      ORGANIZATION_ID,
      STOCK_ID,
      PRODUCT_A,
    );
    expect(qty).toBe('10');
  });

  it('sobra gera movimento de entrada', async () => {
    const repos = setup();
    await seed(repos);
    repos.inventoryRepository.seedBalance(
      repos.stockMovementRepository,
      STOCK_ID,
      PRODUCT_A,
      '5',
    );

    const result = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      stockId: STOCK_ID,
      name: 'Inventário sobra',
      createdByUserId: USER_ID,
      lines: [{ productId: PRODUCT_A, countedQuantity: '8' }],
    });

    expect(result.divergentCount).toBe(1);
    expect(repos.stockMovementRepository.movements.size).toBe(1);
    const movement = [...repos.stockMovementRepository.movements.values()][0];
    expect(movement.type).toBe('entrada');
    expect(movement.sourceType).toBe('inventory');
    expect(movement.sourceId).toBe(result.inventory.id);
    expect(movement.lines[0].quantity).toBe('3');
    expect(movement.lines[0].costCents).toBe(0);

    const qty = await repos.stockMovementRepository.getBalanceQuantity(
      ORGANIZATION_ID,
      STOCK_ID,
      PRODUCT_A,
    );
    expect(qty).toBe('8');
  });

  it('falta gera movimento de saída', async () => {
    const repos = setup();
    await seed(repos);
    repos.inventoryRepository.seedBalance(
      repos.stockMovementRepository,
      STOCK_ID,
      PRODUCT_A,
      '10',
    );

    const result = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      stockId: STOCK_ID,
      name: 'Inventário falta',
      createdByUserId: USER_ID,
      lines: [{ productId: PRODUCT_A, countedQuantity: '7' }],
    });

    expect(result.divergentCount).toBe(1);
    const movement = [...repos.stockMovementRepository.movements.values()][0];
    expect(movement.type).toBe('saida');
    expect(movement.lines[0].quantity).toBe('3');

    const qty = await repos.stockMovementRepository.getBalanceQuantity(
      ORGANIZATION_ID,
      STOCK_ID,
      PRODUCT_A,
    );
    expect(qty).toBe('7');
  });

  it('mistura sobra e falta gera até 2 movimentos', async () => {
    const repos = setup();
    await seed(repos);
    repos.inventoryRepository.seedBalance(
      repos.stockMovementRepository,
      STOCK_ID,
      PRODUCT_A,
      '5',
    );
    repos.inventoryRepository.seedBalance(
      repos.stockMovementRepository,
      STOCK_ID,
      PRODUCT_B,
      '10',
    );

    await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      stockId: STOCK_ID,
      name: 'Inventário misto',
      createdByUserId: USER_ID,
      lines: [
        { productId: PRODUCT_A, countedQuantity: '8' },
        { productId: PRODUCT_B, countedQuantity: '6' },
      ],
    });

    expect(repos.stockMovementRepository.movements.size).toBe(2);
  });

  it('produto sem trackStock → 422 (ProductNotTrackable)', async () => {
    const repos = setup();
    await seed(repos);
    repos.stockProductLookup.set({
      id: PRODUCT_A,
      trackStock: false,
      deletedAt: null,
    });

    await expect(
      repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        stockId: STOCK_ID,
        name: 'Inv',
        createdByUserId: USER_ID,
        lines: [{ productId: PRODUCT_A, countedQuantity: '1' }],
      }),
    ).rejects.toBeInstanceOf(ProductNotTrackableError);
  });

  it('stock inválido → 404', async () => {
    const repos = setup();
    await seed(repos);

    await expect(
      repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        stockId: '99999999-9999-4999-8999-999999999999',
        name: 'Inv',
        createdByUserId: USER_ID,
        lines: [{ productId: PRODUCT_A, countedQuantity: '1' }],
      }),
    ).rejects.toBeInstanceOf(StockNotFoundError);
  });

  describe('saldo de sistema negativo', () => {
    // O ledger admite saldo negativo de propósito (saída sem estoque
    // suficiente é permitida), e o inventário é o único mecanismo para
    // corrigi-lo. Validar `systemQuantity` como não-negativo bloqueava a
    // contagem exatamente nesse caso.

    it('contagem sobre saldo negativo funciona e gera entrada até o contado', async () => {
      const repos = setup();
      await seed(repos);
      repos.inventoryRepository.seedBalance(
        repos.stockMovementRepository,
        STOCK_ID,
        PRODUCT_A,
        '-3',
      );

      const result = await repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        stockId: STOCK_ID,
        name: 'Inventário corrigindo negativo',
        createdByUserId: USER_ID,
        lines: [{ productId: PRODUCT_A, countedQuantity: '5' }],
      });

      expect(result.inventory.lines[0].systemQuantity).toBe('-3');
      expect(result.divergentCount).toBe(1);

      const qty = await repos.stockMovementRepository.getBalanceQuantity(
        ORGANIZATION_ID,
        STOCK_ID,
        PRODUCT_A,
      );
      expect(Number(qty)).toBe(5);
    });

    it('um produto negativo não derruba a contagem inteira', async () => {
      const repos = setup();
      await seed(repos);
      repos.inventoryRepository.seedBalance(
        repos.stockMovementRepository,
        STOCK_ID,
        PRODUCT_A,
        '-2',
      );
      repos.inventoryRepository.seedBalance(
        repos.stockMovementRepository,
        STOCK_ID,
        PRODUCT_B,
        '10',
      );

      const result = await repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        stockId: STOCK_ID,
        name: 'Inventário misto',
        createdByUserId: USER_ID,
        lines: [
          { productId: PRODUCT_A, countedQuantity: '0' },
          { productId: PRODUCT_B, countedQuantity: '10' },
        ],
      });

      expect(result.inventory.lines).toHaveLength(2);
      expect(
        Number(
          await repos.stockMovementRepository.getBalanceQuantity(
            ORGANIZATION_ID,
            STOCK_ID,
            PRODUCT_A,
          ),
        ),
      ).toBe(0);
    });

    it('quantidade contada negativa continua rejeitada', async () => {
      const repos = setup();
      await seed(repos);
      repos.inventoryRepository.seedBalance(
        repos.stockMovementRepository,
        STOCK_ID,
        PRODUCT_A,
        '10',
      );

      await expect(
        repos.useCase.execute({
          organizationId: ORGANIZATION_ID,
          stockId: STOCK_ID,
          name: 'Inventário inválido',
          createdByUserId: USER_ID,
          lines: [{ productId: PRODUCT_A, countedQuantity: '-1' }],
        }),
      ).rejects.toThrow(/Invalid inventory countedQuantity/);
    });
  });
});
