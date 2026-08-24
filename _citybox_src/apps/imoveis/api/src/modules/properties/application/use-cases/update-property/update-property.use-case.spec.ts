import { UpdatePropertyUseCase } from './update-property.use-case';
import { PropertyNotFoundError } from '../../../domain/errors/property-not-found.error';
import { InMemoryPropertyRepository } from '../../../infrastructure/database/in-memory-property.repository';

const STORE = 'store-1';

describe('UpdatePropertyUseCase', () => {
  it('atualiza imóvel existente', async () => {
    const repo = new InMemoryPropertyRepository();
    const created = await repo.create({
      storeId: STORE,
      name: 'Antigo',
      type: 'house',
      status: 'available',
      listingType: 'sale',
    });

    const useCase = new UpdatePropertyUseCase(repo);
    const result = await useCase.execute({
      storeId: STORE,
      id: created.id,
      name: 'Atualizado',
      type: 'house',
      status: 'reserved',
      listingType: 'sale',
    });

    expect(result.name).toBe('Atualizado');
    expect(result.status).toBe('reserved');
  });

  it('lança PropertyNotFoundError quando id não existe', async () => {
    const repo = new InMemoryPropertyRepository();
    const useCase = new UpdatePropertyUseCase(repo);

    await expect(
      useCase.execute({
        storeId: STORE,
        id: 'missing',
        name: 'X',
        type: 'house',
        status: 'available',
        listingType: 'sale',
      }),
    ).rejects.toBeInstanceOf(PropertyNotFoundError);
  });
});
