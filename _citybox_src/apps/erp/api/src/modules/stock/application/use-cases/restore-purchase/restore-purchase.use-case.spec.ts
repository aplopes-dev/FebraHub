import { CreatePurchaseUseCase } from '../create-purchase/create-purchase.use-case';
import { DeletePurchaseUseCase } from '../delete-purchase/delete-purchase.use-case';
import { RestorePurchaseUseCase } from './restore-purchase.use-case';
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
import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../../tenancy/tests/tenancy-test-factory';

const STOCK_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const SUPPLIER_ID = '99999999-9999-4999-8999-999999999999';
const PRODUCT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const MISSING_PURCHASE = '33333333-3333-4333-8333-333333333333';

describe('RestorePurchaseUseCase', () => {
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
    const deleteUseCase = new DeletePurchaseUseCase(purchaseRepository);
    const restoreUseCase = new RestorePurchaseUseCase(purchaseRepository);

    return {
      createUseCase,
      deleteUseCase,
      restoreUseCase,
      purchaseRepository,
      stockRepository,
      supplierRepository,
      stockMovementRepository,
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

  it('devolve a compra às abas ativas sem alterar saldo', async () => {
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

    await repos.deleteUseCase.execute({
      organizationId: ORGANIZATION_ID,
      id: created.id,
    });

    const restored = await repos.restoreUseCase.execute({
      organizationId: ORGANIZATION_ID,
      id: created.id,
    });

    expect(restored.deletedAt).toBeNull();

    const tabs = await repos.purchaseRepository.countByTabs(ORGANIZATION_ID);
    expect(tabs).toEqual({ active: 1, deleted: 0 });

    const balance = await repos.stockMovementRepository.getBalanceQuantity(
      ORGANIZATION_ID,
      STOCK_ID,
      PRODUCT_ID,
    );
    expect(balance).toBe('10');
  });

  it('é idempotente para compra já ativa', async () => {
    const repos = setup();
    await seed(repos);

    const created = await repos.createUseCase.execute({
      organizationId: ORGANIZATION_ID,
      stockId: STOCK_ID,
      supplierId: SUPPLIER_ID,
      deliveryStatus: 'pending',
      purchasedAt: new Date(),
      createdByUserId: USER_ID,
      lines: [{ productId: PRODUCT_ID, quantity: '1', costCents: 100 }],
    });

    const restored = await repos.restoreUseCase.execute({
      organizationId: ORGANIZATION_ID,
      id: created.id,
    });

    expect(restored.deletedAt).toBeNull();
  });

  it('responde 404 para compra inexistente ou de outra organização', async () => {
    const repos = setup();
    await seed(repos);

    await expect(
      repos.restoreUseCase.execute({
        organizationId: ORGANIZATION_ID,
        id: MISSING_PURCHASE,
      }),
    ).rejects.toBeInstanceOf(PurchaseNotFoundError);

    const created = await repos.createUseCase.execute({
      organizationId: ORGANIZATION_ID,
      stockId: STOCK_ID,
      supplierId: SUPPLIER_ID,
      deliveryStatus: 'pending',
      purchasedAt: new Date(),
      createdByUserId: USER_ID,
      lines: [{ productId: PRODUCT_ID, quantity: '1', costCents: 100 }],
    });

    await repos.deleteUseCase.execute({
      organizationId: ORGANIZATION_ID,
      id: created.id,
    });

    await expect(
      repos.restoreUseCase.execute({
        organizationId: OTHER_ORGANIZATION_ID,
        id: created.id,
      }),
    ).rejects.toBeInstanceOf(PurchaseNotFoundError);
  });
});
