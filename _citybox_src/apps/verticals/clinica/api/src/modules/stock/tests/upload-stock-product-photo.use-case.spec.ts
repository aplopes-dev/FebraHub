import { UploadStockProductPhotoUseCase } from '../application/use-cases/products/upload-stock-product-photo.use-case';
import { randomUUID } from 'crypto';
import {
  InMemoryObjectStorage,
  InMemoryStockProductRepository,
  makePngBuffer,
} from './stock-test.fixtures';
import { StockProduct } from '../domain/entities/stock-product.entity';
import { StockProductObjectKeyPolicy } from '../application/policies/stock-product-object-key.policy';

describe('UploadStockProductPhotoUseCase', () => {
  it('uploads to storage and sets photoObjectKey on product', async () => {
    const storeId = 'store-1';
    const productId = randomUUID();

    const productRepo = new InMemoryStockProductRepository();
    productRepo.seedProduct(
      StockProduct.create(
        {
          storeId,
          name: 'Produto',
          category: 'cat',
          sku: null,
          supplierId: null,
          quantity: 1,
          minQuantity: 0,
          unitCostCents: 1000,
          photoObjectKey: null,
          photoMimeType: null,
        },
        productId,
      ),
    );

    const storage = new InMemoryObjectStorage();
    const useCase = new UploadStockProductPhotoUseCase(productRepo, storage);

    const buffer = makePngBuffer();
    const declaredMimeType = 'image/png';

    const updated = await useCase.execute({
      storeId,
      productId,
      buffer,
      declaredMimeType,
    });

    const expectedKey = StockProductObjectKeyPolicy.photoKey(
      storeId,
      productId,
      'image/png',
    );

    expect(storage).toBeDefined();
    expect(updated.photoObjectKey).toBe(expectedKey);
    expect(updated.photoMimeType).toBe('image/png');

    const stored = await storage.get(expectedKey);
    expect(stored.mimeType).toBe('image/png');
  });
});
