import { UploadProductImageUseCase } from './upload-product-image.use-case';
import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import {
  makeProduct,
  makeRepositories,
  STORE_ID,
} from '../../../tests/catalog-test-factory';

const PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

describe('UploadProductImageUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    await repos.seedSupport();
    const storage = new InMemoryObjectStorage();
    const upload = new UploadProductImageUseCase(
      repos.productRepository,
      storage,
    );
    return { ...repos, storage, upload };
  }

  it('stores image and sets the object key on the product', async () => {
    const { upload, productRepository, storage } = await setup();
    const product = makeProduct();
    await productRepository.save(product);

    const updated = await upload.execute({
      organizationId: STORE_ID,
      productId: product.id,
      buffer: PNG_BUFFER,
      declaredMimeType: 'image/png',
    });

    expect(updated.hasImage()).toBe(true);
    expect(updated.imageUrl).toBe(
      `${STORE_ID}/catalogo/products/${product.id}.png`,
    );
    expect(await storage.exists(updated.imageUrl!)).toBe(true);
  });

  it('replaces a previous image when re-uploading', async () => {
    const { upload, productRepository, storage } = await setup();
    const product = makeProduct();
    await productRepository.save(product);
    await upload.execute({
      organizationId: STORE_ID,
      productId: product.id,
      buffer: PNG_BUFFER,
      declaredMimeType: 'image/png',
    });

    const reUploaded = await upload.execute({
      organizationId: STORE_ID,
      productId: product.id,
      buffer: PNG_BUFFER,
      declaredMimeType: 'image/png',
    });

    expect(reUploaded.hasImage()).toBe(true);
    expect(await storage.exists(reUploaded.imageUrl!)).toBe(true);
  });

  it('throws ProductNotFoundError when the product does not exist', async () => {
    const { upload } = await setup();
    await expect(
      upload.execute({
        organizationId: STORE_ID,
        productId: '99999999-9999-4999-8999-999999999999',
        buffer: PNG_BUFFER,
        declaredMimeType: 'image/png',
      }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });
});
