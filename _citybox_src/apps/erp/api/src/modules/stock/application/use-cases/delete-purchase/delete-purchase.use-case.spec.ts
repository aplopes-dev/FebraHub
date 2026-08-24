import { CreatePurchaseUseCase } from '../create-purchase/create-purchase.use-case';
import { DeletePurchaseUseCase } from './delete-purchase.use-case';
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

describe('DeletePurchaseUseCase', () => {
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

    return {
      createUseCase,
      deleteUseCase,
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

  it('exclui (soft-delete) sem estornar o saldo', async () => {
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

    const balanceBefore =
      await repos.stockMovementRepository.getBalanceQuantity(
        ORGANIZATION_ID,
        STOCK_ID,
        PRODUCT_ID,
      );
    expect(balanceBefore).toBe('10');

    await repos.deleteUseCase.execute({
      organizationId: ORGANIZATION_ID,
      id: created.id,
    });

    const detail = await repos.purchaseRepository.findById(
      ORGANIZATION_ID,
      created.id,
    );
    expect(detail?.purchase.deletedAt).toBeTruthy();

    const balanceAfter = await repos.stockMovementRepository.getBalanceQuantity(
      ORGANIZATION_ID,
      STOCK_ID,
      PRODUCT_ID,
    );
    expect(balanceAfter).toBe('10');
  });

  it('bloqueia compra inexistente', async () => {
    const repos = setup();
    await seed(repos);

    await expect(
      repos.deleteUseCase.execute({
        organizationId: ORGANIZATION_ID,
        id: MISSING_PURCHASE,
      }),
    ).rejects.toBeInstanceOf(PurchaseNotFoundError);
  });

  it('bloqueia excluir novamente uma compra já excluída', async () => {
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

    await repos.deleteUseCase.execute({
      organizationId: ORGANIZATION_ID,
      id: created.id,
    });

    await expect(
      repos.deleteUseCase.execute({
        organizationId: ORGANIZATION_ID,
        id: created.id,
      }),
    ).rejects.toBeInstanceOf(PurchaseNotFoundError);
  });
});
