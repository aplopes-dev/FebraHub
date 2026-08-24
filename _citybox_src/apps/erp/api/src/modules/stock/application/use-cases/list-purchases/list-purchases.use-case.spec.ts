import { CreatePurchaseUseCase } from '../create-purchase/create-purchase.use-case';
import { DeletePurchaseUseCase } from '../delete-purchase/delete-purchase.use-case';
import { ListPurchasesUseCase } from './list-purchases.use-case';
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

describe('ListPurchasesUseCase', () => {
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
    const listUseCase = new ListPurchasesUseCase(purchaseRepository);

    return {
      createUseCase,
      deleteUseCase,
      listUseCase,
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

  it('lista com contadores de aba e filtro por status', async () => {
    const repos = setup();
    await seed(repos);

    const pending = await repos.createUseCase.execute({
      organizationId: ORGANIZATION_ID,
      stockId: STOCK_ID,
      supplierId: SUPPLIER_ID,
      deliveryStatus: 'pending',
      purchasedAt: new Date('2026-07-20T00:00:00.000Z'),
      createdByUserId: USER_ID,
      lines: [{ productId: PRODUCT_ID, quantity: '1', costCents: 100 }],
    });
    await repos.createUseCase.execute({
      organizationId: ORGANIZATION_ID,
      stockId: STOCK_ID,
      supplierId: SUPPLIER_ID,
      deliveryStatus: 'received',
      purchasedAt: new Date('2026-07-25T00:00:00.000Z'),
      createdByUserId: USER_ID,
      lines: [
        {
          productId: PRODUCT_ID,
          quantity: '2',
          costCents: 200,
          status: 'received',
        },
      ],
    });

    const all = await repos.listUseCase.execute({
      organizationId: ORGANIZATION_ID,
    });
    expect(all.total).toBe(2);
    expect(all.tabCounts).toEqual({ active: 2, deleted: 0 });
    // purchasedAt DESC
    expect(all.items[0].purchase.deliveryStatus).toBe('received');

    const onlyPending = await repos.listUseCase.execute({
      organizationId: ORGANIZATION_ID,
      status: 'pending',
    });
    expect(onlyPending.total).toBe(1);
    expect(onlyPending.items[0].purchase.id).toBe(pending.id);

    await repos.deleteUseCase.execute({
      organizationId: ORGANIZATION_ID,
      id: pending.id,
    });

    const activeAfterDelete = await repos.listUseCase.execute({
      organizationId: ORGANIZATION_ID,
    });
    expect(activeAfterDelete.total).toBe(1);
    expect(activeAfterDelete.tabCounts).toEqual({ active: 1, deleted: 1 });

    const deletedTab = await repos.listUseCase.execute({
      organizationId: ORGANIZATION_ID,
      tab: 'deleted',
    });
    expect(deletedTab.total).toBe(1);
    expect(deletedTab.items[0].purchase.id).toBe(pending.id);
  });
});
