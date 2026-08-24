import { GetProductImageUseCase } from './get-product-image.use-case';
import { UploadProductImageUseCase } from '../upload-product-image/upload-product-image.use-case';
import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { ProductHasNoImageError } from '../../../domain/errors/product-has-no-image.error';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import {
  makeProduct,
  makeRepositories,
  STORE_ID,
} from '../../../tests/catalog-test-factory';

const PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

describe('GetProductImageUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    await repos.seedSupport();
    const storage = new InMemoryObjectStorage();
    const upload = new UploadProductImageUseCase(
      repos.productRepository,
      storage,
    );
    const getImage = new GetProductImageUseCase(
      repos.productRepository,
      storage,
    );
    return { ...repos, storage, upload, getImage };
  }

  it('returns the stored buffer and mime type', async () => {
    const { upload, getImage, productRepository } = await setup();
    const product = makeProduct();
    await productRepository.save(product);
    await upload.execute({
      organizationId: STORE_ID,
      productId: product.id,
      buffer: PNG_BUFFER,
      declaredMimeType: 'image/png',
    });

    const result = await getImage.execute({
      organizationId: STORE_ID,
      productId: product.id,
    });

    expect(result.mimeType).toBe('image/png');
    expect(result.buffer.equals(PNG_BUFFER)).toBe(true);
  });

  it('throws ProductHasNoImageError when there is no image', async () => {
    const { getImage, productRepository } = await setup();
    const product = makeProduct();
    await productRepository.save(product);

    await expect(
      getImage.execute({
        organizationId: STORE_ID,
        productId: product.id,
      }),
    ).rejects.toBeInstanceOf(ProductHasNoImageError);
  });

  it('throws ProductNotFoundError when the product does not exist', async () => {
    const { getImage } = await setup();
    await expect(
      getImage.execute({
        organizationId: STORE_ID,
        productId: '99999999-9999-4999-8999-999999999999',
      }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });
});
