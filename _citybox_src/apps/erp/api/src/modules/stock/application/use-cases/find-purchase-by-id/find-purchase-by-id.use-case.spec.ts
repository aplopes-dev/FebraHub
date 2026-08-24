import { CreatePurchaseUseCase } from '../create-purchase/create-purchase.use-case';
import { FindPurchaseByIdUseCase } from './find-purchase-by-id.use-case';
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

describe('FindPurchaseByIdUseCase', () => {
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
    const findUseCase = new FindPurchaseByIdUseCase(purchaseRepository);

    return {
      createUseCase,
      findUseCase,
      purchaseRepository,
      stockRepository,
      supplierRepository,
      stockProductLookup,
    };
  }

  async function seed(repos: ReturnType<typeof setup>) {
    await repos.stockRepository.save(
      makeStock({ id: STOCK_ID, name: 'Depósito Centro' }),
    );
    await repos.supplierRepository.save(
      makeSupplier({ id: SUPPLIER_ID, name: 'Distribuidora Bahia' }),
    );
    repos.purchaseRepository.setStockName(STOCK_ID, 'Depósito Centro');
    repos.purchaseRepository.setSupplierName(
      SUPPLIER_ID,
      'Distribuidora Bahia',
    );
    repos.purchaseRepository.setProductMeta(PRODUCT_ID, {
      name: 'Refrigerante',
      sku: 'SKU-001',
    });
    repos.stockProductLookup.set({
      id: PRODUCT_ID,
      trackStock: true,
      deletedAt: null,
    });
  }

  it('devolve a compra com nomes enriquecidos', async () => {
    const repos = setup();
    await seed(repos);

    const created = await repos.createUseCase.execute({
      organizationId: ORGANIZATION_ID,
      stockId: STOCK_ID,
      supplierId: SUPPLIER_ID,
      deliveryStatus: 'pending',
      purchasedAt: new Date(),
      createdByUserId: USER_ID,
      lines: [{ productId: PRODUCT_ID, quantity: '5', costCents: 300 }],
    });

    const detail = await repos.findUseCase.execute({
      organizationId: ORGANIZATION_ID,
      id: created.id,
    });

    expect(detail.stockName).toBe('Depósito Centro');
    expect(detail.supplierName).toBe('Distribuidora Bahia');
    expect(detail.lines).toHaveLength(1);
    expect(detail.lines[0].productName).toBe('Refrigerante');
    expect(detail.lines[0].productSku).toBe('SKU-001');
  });

  it('bloqueia compra inexistente', async () => {
    const repos = setup();
    await seed(repos);

    await expect(
      repos.findUseCase.execute({
        organizationId: ORGANIZATION_ID,
        id: MISSING_PURCHASE,
      }),
    ).rejects.toBeInstanceOf(PurchaseNotFoundError);
  });
});
