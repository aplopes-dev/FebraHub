import { GetPropertyByIdUseCase } from './get-property-by-id.use-case';
import { PropertyNotFoundError } from '../../../domain/errors/property-not-found.error';
import { InMemoryPropertyRepository } from '../../../infrastructure/database/in-memory-property.repository';

const STORE = 'store-1';

describe('GetPropertyByIdUseCase', () => {
  it('retorna imóvel existente', async () => {
    const repo = new InMemoryPropertyRepository();
    const created = await repo.create({
      storeId: STORE,
      name: 'Villa Sul',
      type: 'villa',
      status: 'available',
      listingType: 'sale',
    });

    const useCase = new GetPropertyByIdUseCase(repo);
    const result = await useCase.execute({ storeId: STORE, id: created.id });

    expect(result.name).toBe('Villa Sul');
  });

  it('lança PropertyNotFoundError quando id não existe', async () => {
    const repo = new InMemoryPropertyRepository();
    const useCase = new GetPropertyByIdUseCase(repo);

    await expect(
      useCase.execute({ storeId: STORE, id: 'missing' }),
    ).rejects.toBeInstanceOf(PropertyNotFoundError);
  });
});
