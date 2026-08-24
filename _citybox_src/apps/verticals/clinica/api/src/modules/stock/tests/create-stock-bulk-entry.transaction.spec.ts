import { CreateStockBulkEntryUseCase } from '../application/use-cases/entries/create-stock-bulk-entry.use-case';
import { randomUUID } from 'crypto';
import {
  InMemoryStockMovementRepository,
  InMemoryStockProductRepository,
} from './stock-test.fixtures';
import { StockProduct } from '../domain/entities/stock-product.entity';
import { StockProductNotFoundError } from '../domain/errors/stock-product-not-found.error';

describe('CreateStockBulkEntryUseCase (transactional behavior)', () => {
  it('rolls back if any product id is missing', async () => {
    const storeId = 'store-1';
    const okProductId = randomUUID();
    const missingProductId = randomUUID();

    const productRepo = new InMemoryStockProductRepository();
    productRepo.seedProduct(
      StockProduct.create(
        {
          storeId,
          name: 'Produto OK',
          category: 'cat',
          sku: null,
          supplierId: null,
          quantity: 10,
          minQuantity: 0,
          unitCostCents: 1000,
          photoObjectKey: null,
          photoMimeType: null,
        },
        okProductId,
      ),
    );

    const movementRepo = new InMemoryStockMovementRepository(productRepo);
    const useCase = new CreateStockBulkEntryUseCase(movementRepo);

    await expect(
      useCase.execute({
        storeId,
        items: [
          { productId: okProductId, quantity: 5 },
          { productId: missingProductId, quantity: 7 },
        ],
        authorizedById: 'u1',
        authorizedByName: 'Usuário',
      }),
    ).rejects.toBeInstanceOf(StockProductNotFoundError);

    const productAfter = await productRepo.findById(storeId, okProductId);
    expect(productAfter?.quantity).toBe(10);
  });
});
