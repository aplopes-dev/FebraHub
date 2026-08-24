import { DeletePropertyUseCase } from './delete-property.use-case';
import { UploadPropertyPhotoUseCase } from '../upload-property-photo/upload-property-photo.use-case';
import { PropertyNotFoundError } from '../../../domain/errors/property-not-found.error';
import { InMemoryPropertyRepository } from '../../../infrastructure/database/in-memory-property.repository';
import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';

const STORE = 'store-1';

const PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

describe('DeletePropertyUseCase', () => {
  it('remove imóvel existente e objetos no storage', async () => {
    const repo = new InMemoryPropertyRepository();
    const storage = new InMemoryObjectStorage();
    const upload = new UploadPropertyPhotoUseCase(repo, storage);
    const created = await repo.create({
      storeId: STORE,
      name: 'Para excluir',
      type: 'land',
      status: 'available',
      listingType: 'sale',
    });
    const withPhoto = await upload.execute({
      storeId: STORE,
      propertyId: created.id,
      buffer: PNG_BUFFER,
      declaredMimeType: 'image/png',
    });
    const objectKey = withPhoto.photos[0].objectKey;

    const useCase = new DeletePropertyUseCase(repo, storage);
    await useCase.execute({ storeId: STORE, id: created.id });

    const stored = await repo.findById(STORE, created.id);
    expect(stored).toBeNull();
    expect(await storage.exists(objectKey)).toBe(false);
  });

  it('lança PropertyNotFoundError quando id não existe', async () => {
    const repo = new InMemoryPropertyRepository();
    const storage = new InMemoryObjectStorage();
    const useCase = new DeletePropertyUseCase(repo, storage);

    await expect(
      useCase.execute({ storeId: STORE, id: 'missing' }),
    ).rejects.toBeInstanceOf(PropertyNotFoundError);
  });
});
