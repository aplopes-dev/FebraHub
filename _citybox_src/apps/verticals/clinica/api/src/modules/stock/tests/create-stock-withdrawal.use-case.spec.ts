import { CreateStockWithdrawalUseCase } from '../application/use-cases/withdrawals/create-stock-withdrawal.use-case';
import { randomUUID } from 'crypto';
import {
  InMemoryStockMovementRepository,
  InMemoryStockProductRepository,
} from './stock-test.fixtures';
import { StockProduct } from '../domain/entities/stock-product.entity';
import { StockInsufficientQuantityError } from '../domain/errors/stock-insufficient-quantity.error';

describe('CreateStockWithdrawalUseCase', () => {
  it('throws when quantity is greater than available', async () => {
    const storeId = 'store-1';
    const productId = randomUUID();

    const productRepo = new InMemoryStockProductRepository();
    const movementRepo = new InMemoryStockMovementRepository(productRepo);

    productRepo.seedProduct(
      StockProduct.create(
        {
          storeId,
          name: 'Produto',
          category: 'cat',
          sku: null,
          supplierId: null,
          quantity: 5,
          minQuantity: 2,
          unitCostCents: 1000,
          photoObjectKey: null,
          photoMimeType: null,
        },
        productId,
      ),
    );

    const useCase = new CreateStockWithdrawalUseCase(movementRepo);

    await expect(
      useCase.execute({
        storeId,
        productId,
        quantity: 6,
        requestedById: null,
        requestedByName: null,
        notes: null,
        authorizedById: 'u1',
        authorizedByName: 'Usuário',
      }),
    ).rejects.toBeInstanceOf(StockInsufficientQuantityError);

    const productAfter = await productRepo.findById(storeId, productId);
    expect(productAfter?.quantity).toBe(5);
  });
});
