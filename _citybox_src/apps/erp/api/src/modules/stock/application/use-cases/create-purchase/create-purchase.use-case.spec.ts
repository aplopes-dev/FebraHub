import { CreatePurchaseUseCase } from './create-purchase.use-case';
import { StockNotFoundError } from '../../../domain/errors/stock-not-found.error';
import { ProductNotTrackableError } from '../../../domain/errors/product-not-trackable.error';
import { SupplierNotFoundError } from '../../../suppliers/domain/errors/supplier-not-found.error';
import { makeStock } from '../../../tests/stocks-test-factory';
import { InMemoryStockRepository } from '../../../tests/in-memory-stock.repository';
import {
  InMemoryStockMovementRepository,
  InMemoryStockProductLookup,
} from '../../../tests/in-memory-stock-movement.repository';
import { InMemoryPurchaseRepository } from '../../../tests/in-memory-purchase.repository';
import { InMemorySupplierRepository } from '../../../suppliers/tests/in-memory-supplier.repository';
import { makeSupplier } from '../../../suppliers/tests/suppliers-test-factory';
import { InMemoryCarrierRepository } from '../../../carriers/tests/in-memory-carrier.repository';
import { ORGANIZATION_ID } from '../../../../tenancy/tests/tenancy-test-factory';

const STOCK_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const SUPPLIER_ID = '99999999-9999-4999-8999-999999999999';
const PRODUCT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const MISSING_STOCK = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const MISSING_SUPPLIER = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const NON_TRACKABLE_PRODUCT = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

describe('CreatePurchaseUseCase', () => {
  function setup() {
    const stockRepository = new InMemoryStockRepository();
    const supplierRepository = new InMemorySupplierRepository();
    const carrierRepository = new InMemoryCarrierRepository();
    const stockMovementRepository = new InMemoryStockMovementRepository();
    const stockProductLookup = new InMemoryStockProductLookup();
    const purchaseRepository = new InMemoryPurchaseRepository(
      stockMovementRepository,
    );

    const useCase = new CreatePurchaseUseCase(
      purchaseRepository,
      stockRepository,
      supplierRepository,
      carrierRepository,
      stockProductLookup,
    );

    return {
      useCase,
      stockRepository,
      supplierRepository,
      carrierRepository,
      stockMovementRepository,
      stockProductLookup,
      purchaseRepository,
    };
  }

  async function seed(repos: ReturnType<typeof setup>) {
    await repos.stockRepository.save(makeStock({ id: STOCK_ID }));
    await repos.supplierRepository.save(makeSupplier({ id: SUPPLIER_ID }));
    repos.stockProductLookup.set({
      id: PRODUCT_ID,
      trackStock: true,
      deletedAt: null,
    });
    repos.stockProductLookup.set({
      id: NON_TRACKABLE_PRODUCT,
      trackStock: false,
      deletedAt: null,
    });
  }

  it('cria compra pendente sem gerar movimento', async () => {
    const repos = setup();
    await seed(repos);

    const purchase = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      stockId: STOCK_ID,
      supplierId: SUPPLIER_ID,
      deliveryStatus: 'pending',
      purchasedAt: new Date('2026-07-28T00:00:00.000Z'),
      createdByUserId: USER_ID,
      lines: [{ productId: PRODUCT_ID, quantity: '10', costCents: 500 }],
    });

    expect(purchase.deliveryStatus).toBe('pending');
    expect(purchase.stockMovementId).toBeNull();
    expect(repos.stockMovementRepository.movements.size).toBe(0);

    const balance = await repos.stockMovementRepository.getBalanceQuantity(
      ORGANIZATION_ID,
      STOCK_ID,
      PRODUCT_ID,
    );
    expect(balance).toBe('0');
  });

  it('cria compra recebida com linhas recebidas e aumenta o saldo uma vez', async () => {
    const repos = setup();
    await seed(repos);

    const purchase = await repos.useCase.execute({
      organizationId: ORGANIZATION_ID,
      stockId: STOCK_ID,
      supplierId: SUPPLIER_ID,
      deliveryStatus: 'received',
      purchasedAt: new Date('2026-07-28T00:00:00.000Z'),
      createdByUserId: USER_ID,
      lines: [
        {
          productId: PRODUCT_ID,
          quantity: '10',
          costCents: 500,
          status: 'received',
        },
      ],
    });

    expect(purchase.stockMovementId).toBeTruthy();
    expect(repos.stockMovementRepository.movements.size).toBe(1);

    const balance = await repos.stockMovementRepository.getBalanceQuantity(
      ORGANIZATION_ID,
      STOCK_ID,
      PRODUCT_ID,
    );
    expect(balance).toBe('10');
  });

  it('bloqueia estoque inexistente', async () => {
    const repos = setup();
    await seed(repos);

    await expect(
      repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        stockId: MISSING_STOCK,
        supplierId: SUPPLIER_ID,
        deliveryStatus: 'pending',
        purchasedAt: new Date(),
        createdByUserId: USER_ID,
        lines: [{ productId: PRODUCT_ID, quantity: '1', costCents: 100 }],
      }),
    ).rejects.toBeInstanceOf(StockNotFoundError);
  });

  it('bloqueia fornecedor inexistente', async () => {
    const repos = setup();
    await seed(repos);

    await expect(
      repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        stockId: STOCK_ID,
        supplierId: MISSING_SUPPLIER,
        deliveryStatus: 'pending',
        purchasedAt: new Date(),
        createdByUserId: USER_ID,
        lines: [{ productId: PRODUCT_ID, quantity: '1', costCents: 100 }],
      }),
    ).rejects.toBeInstanceOf(SupplierNotFoundError);
  });

  it('bloqueia produto sem controle de estoque', async () => {
    const repos = setup();
    await seed(repos);

    await expect(
      repos.useCase.execute({
        organizationId: ORGANIZATION_ID,
        stockId: STOCK_ID,
        supplierId: SUPPLIER_ID,
        deliveryStatus: 'pending',
        purchasedAt: new Date(),
        createdByUserId: USER_ID,
        lines: [
          { productId: NON_TRACKABLE_PRODUCT, quantity: '1', costCents: 100 },
        ],
      }),
    ).rejects.toBeInstanceOf(ProductNotTrackableError);
  });
});
