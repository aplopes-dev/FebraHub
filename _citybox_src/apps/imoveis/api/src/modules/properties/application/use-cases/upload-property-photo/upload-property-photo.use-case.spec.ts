import { UploadPropertyPhotoUseCase } from './upload-property-photo.use-case';
import { InMemoryPropertyRepository } from '../../../infrastructure/database/in-memory-property.repository';
import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { PropertyNotFoundError } from '../../../domain/errors/property-not-found.error';
import { PropertyPhotoLimitError } from '../../../domain/errors/property-photo-limit.error';
import { MAX_PROPERTY_PHOTOS } from './upload-property-photo.use-case';

const STORE = 'store-1';

const PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

describe('UploadPropertyPhotoUseCase', () => {
  let repo: InMemoryPropertyRepository;
  let storage: InMemoryObjectStorage;
  let useCase: UploadPropertyPhotoUseCase;

  beforeEach(() => {
    repo = new InMemoryPropertyRepository();
    storage = new InMemoryObjectStorage();
    useCase = new UploadPropertyPhotoUseCase(repo, storage);
  });

  it('armazena foto no MinIO e persiste metadados', async () => {
    const property = await repo.create({
      storeId: STORE,
      name: 'Casa',
      type: 'house',
      status: 'available',
      listingType: 'sale',
    });

    const updated = await useCase.execute({
      storeId: STORE,
      propertyId: property.id,
      buffer: PNG_BUFFER,
      declaredMimeType: 'image/png',
    });

    expect(updated.photos).toHaveLength(1);
    const photo = updated.photos[0];
    expect(photo.mimeType).toBe('image/png');
    expect(photo.objectKey).toBe(
      `${STORE}/properties/${property.id}/photos/${photo.id}.png`,
    );
    expect(await storage.exists(photo.objectKey)).toBe(true);
  });

  it('permite 20 fotos por imóvel', () => {
    expect(MAX_PROPERTY_PHOTOS).toBe(20);
  });

  it('lança PropertyPhotoLimitError ao atingir o limite', async () => {
    const property = await repo.create({
      storeId: STORE,
      name: 'Casa',
      type: 'house',
      status: 'available',
      listingType: 'sale',
    });

    for (let i = 0; i < MAX_PROPERTY_PHOTOS; i++) {
      await useCase.execute({
        storeId: STORE,
        propertyId: property.id,
        buffer: PNG_BUFFER,
        declaredMimeType: 'image/png',
      });
    }

    await expect(
      useCase.execute({
        storeId: STORE,
        propertyId: property.id,
        buffer: PNG_BUFFER,
        declaredMimeType: 'image/png',
      }),
    ).rejects.toBeInstanceOf(PropertyPhotoLimitError);
  });

  it('lança PropertyNotFoundError quando o imóvel não existe', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        propertyId: 'missing',
        buffer: PNG_BUFFER,
        declaredMimeType: 'image/png',
      }),
    ).rejects.toBeInstanceOf(PropertyNotFoundError);
  });
});
