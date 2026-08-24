import { CreatePurchaseUseCase } from '../create-purchase/create-purchase.use-case';
import { UpdatePurchaseUseCase } from './update-purchase.use-case';
import { PurchaseAlreadyReceivedError } from '../../../domain/errors/purchase-already-received.error';
import { PurchaseNotFoundError } from '../../../domain/errors/purchase-not-found.error';
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
const MISSING_PURCHASE = '33333333-3333-4333-8333-333333333333';

describe('UpdatePurchaseUseCase', () => {
  function setup() {
    const stockRepository = new InMemoryStockRepository();
    const supplierRepository = new InMemorySupplierRepository();
    const carrierRepository = new InMemoryCarrierRepository();
    const stockMovementRepository = new InMemoryStockMovementRepository();
    const stockProductLookup = new InMemoryStockProductLookup();
    const purchaseRepository = new InMemoryPurchaseRepository(
      stockMovementRepository,
    );

    const createUseCase = new CreatePurchaseUseCase(
      purchaseRepository,
      stockRepository,
      supplierRepository,
      carrierRepository,
      stockProductLookup,
    );
    const updateUseCase = new UpdatePurchaseUseCase(
      purchaseRepository,
      stockRepository,
      supplierRepository,
      carrierRepository,
      stockProductLookup,
    );

    return {
      createUseCase,
      updateUseCase,
      stockMovementRepository,
      purchaseRepository,
      stockRepository,
      supplierRepository,
      stockProductLookup,
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
  }

  it('bloqueia atualização de compra que já gerou entrada no estoque', async () => {
    const repos = setup();
    await seed(repos);

    const created = await repos.createUseCase.execute({
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
    expect(created.stockMovementId).toBeTruthy();
    expect(repos.stockMovementRepository.movements.size).toBe(1);

    await expect(
      repos.updateUseCase.execute({
        organizationId: ORGANIZATION_ID,
        id: created.id,
        stockId: STOCK_ID,
        supplierId: SUPPLIER_ID,
        deliveryStatus: 'pending',
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
      }),
    ).rejects.toBeInstanceOf(PurchaseAlreadyReceivedError);

    expect(repos.stockMovementRepository.movements.size).toBe(1);
  });

  it('atualizar compra pendente para recebida gera o movimento', async () => {
    const repos = setup();
    await seed(repos);

    const created = await repos.createUseCase.execute({
      organizationId: ORGANIZATION_ID,
      stockId: STOCK_ID,
      supplierId: SUPPLIER_ID,
      deliveryStatus: 'pending',
      purchasedAt: new Date('2026-07-28T00:00:00.000Z'),
      createdByUserId: USER_ID,
      lines: [{ productId: PRODUCT_ID, quantity: '10', costCents: 500 }],
    });
    expect(repos.stockMovementRepository.movements.size).toBe(0);

    const updated = await repos.updateUseCase.execute({
      organizationId: ORGANIZATION_ID,
      id: created.id,
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

    expect(updated.stockMovementId).toBeTruthy();
    expect(repos.stockMovementRepository.movements.size).toBe(1);
  });

  it('bloqueia compra inexistente', async () => {
    const repos = setup();
    await seed(repos);

    await expect(
      repos.updateUseCase.execute({
        organizationId: ORGANIZATION_ID,
        id: MISSING_PURCHASE,
        stockId: STOCK_ID,
        supplierId: SUPPLIER_ID,
        deliveryStatus: 'pending',
        purchasedAt: new Date(),
        createdByUserId: USER_ID,
        lines: [{ productId: PRODUCT_ID, quantity: '1', costCents: 100 }],
      }),
    ).rejects.toBeInstanceOf(PurchaseNotFoundError);
  });
});
