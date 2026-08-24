import { ReorderPropertyPhotosUseCase } from './reorder-property-photos.use-case';
import { InMemoryPropertyRepository } from '../../../infrastructure/database/in-memory-property.repository';
import { PropertyNotFoundError } from '../../../domain/errors/property-not-found.error';

const STORE = 'store-1';

describe('ReorderPropertyPhotosUseCase', () => {
  let repo: InMemoryPropertyRepository;
  let useCase: ReorderPropertyPhotosUseCase;

  beforeEach(() => {
    repo = new InMemoryPropertyRepository();
    useCase = new ReorderPropertyPhotosUseCase(repo);
  });

  async function seedWithPhotos() {
    const property = await repo.create({
      storeId: STORE,
      name: 'Casa',
      type: 'house',
      status: 'available',
      listingType: 'sale',
    });
    const first = await repo.addPhoto(STORE, property.id, {
      id: 'photo-a',
      objectKey: 'a.webp',
      mimeType: 'image/webp',
    });
    const second = await repo.addPhoto(STORE, property.id, {
      id: 'photo-b',
      objectKey: 'b.webp',
      mimeType: 'image/webp',
    });
    const third = await repo.addPhoto(STORE, property.id, {
      id: 'photo-c',
      objectKey: 'c.webp',
      mimeType: 'image/webp',
    });
    return { property, first, second, third };
  }

  it('reordena fotos e define a primeira como capa (sortOrder 0)', async () => {
    const { property } = await seedWithPhotos();

    const updated = await useCase.execute({
      storeId: STORE,
      propertyId: property.id,
      photoIds: ['photo-c', 'photo-a', 'photo-b'],
    });

    expect(updated.photos.map((photo) => photo.id)).toEqual([
      'photo-c',
      'photo-a',
      'photo-b',
    ]);
    expect(updated.photos.map((photo) => photo.sortOrder)).toEqual([0, 1, 2]);
  });

  it('aceita lista vazia quando o imóvel não tem fotos', async () => {
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
      photoIds: [],
    });

    expect(updated.photos).toEqual([]);
  });

  it('completa a ordem quando o form manda só a capa e o restante', async () => {
    const { property } = await seedWithPhotos();

    const updated = await useCase.execute({
      storeId: STORE,
      propertyId: property.id,
      photoIds: ['photo-c', 'photo-a'],
    });

    expect(updated.photos.map((photo) => photo.id)).toEqual([
      'photo-c',
      'photo-a',
      'photo-b',
    ]);
  });

  it('ignora ids desconhecidos e duplicados', async () => {
    const { property } = await seedWithPhotos();

    const updated = await useCase.execute({
      storeId: STORE,
      propertyId: property.id,
      photoIds: ['photo-c', 'photo-c', 'photo-x', 'photo-a', 'photo-b'],
    });

    expect(updated.photos.map((photo) => photo.id)).toEqual([
      'photo-c',
      'photo-a',
      'photo-b',
    ]);
  });

  it('lança PropertyNotFoundError quando o imóvel não existe', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        propertyId: 'missing',
        photoIds: [],
      }),
    ).rejects.toBeInstanceOf(PropertyNotFoundError);
  });
});
