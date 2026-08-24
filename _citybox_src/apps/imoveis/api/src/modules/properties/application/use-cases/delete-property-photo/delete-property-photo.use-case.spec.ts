import { DeletePropertyPhotoUseCase } from './delete-property-photo.use-case';
import { UploadPropertyPhotoUseCase } from '../upload-property-photo/upload-property-photo.use-case';
import { InMemoryPropertyRepository } from '../../../infrastructure/database/in-memory-property.repository';
import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { PropertyNotFoundError } from '../../../domain/errors/property-not-found.error';
import { PropertyPhotoNotFoundError } from '../../../domain/errors/property-photo-not-found.error';

const STORE = 'store-1';

const PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

describe('DeletePropertyPhotoUseCase', () => {
  let repo: InMemoryPropertyRepository;
  let storage: InMemoryObjectStorage;
  let upload: UploadPropertyPhotoUseCase;
  let useCase: DeletePropertyPhotoUseCase;

  beforeEach(() => {
    repo = new InMemoryPropertyRepository();
    storage = new InMemoryObjectStorage();
    upload = new UploadPropertyPhotoUseCase(repo, storage);
    useCase = new DeletePropertyPhotoUseCase(repo, storage);
  });

  it('remove foto do storage e do repositório', async () => {
    const property = await repo.create({
      storeId: STORE,
      name: 'Casa',
      type: 'house',
      status: 'available',
      listingType: 'sale',
    });
    const withPhoto = await upload.execute({
      storeId: STORE,
      propertyId: property.id,
      buffer: PNG_BUFFER,
      declaredMimeType: 'image/png',
    });
    const photo = withPhoto.photos[0];

    const updated = await useCase.execute({
      storeId: STORE,
      propertyId: property.id,
      photoId: photo.id,
    });

    expect(updated.photos).toHaveLength(0);
    expect(await storage.exists(photo.objectKey)).toBe(false);
  });

  it('lança PropertyPhotoNotFoundError quando a foto não existe', async () => {
    const property = await repo.create({
      storeId: STORE,
      name: 'Casa',
      type: 'house',
      status: 'available',
      listingType: 'sale',
    });

    await expect(
      useCase.execute({
        storeId: STORE,
        propertyId: property.id,
        photoId: 'missing',
      }),
    ).rejects.toBeInstanceOf(PropertyPhotoNotFoundError);
  });

  it('lança PropertyNotFoundError quando o imóvel não existe', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        propertyId: 'missing',
        photoId: 'any',
      }),
    ).rejects.toBeInstanceOf(PropertyNotFoundError);
  });
});
