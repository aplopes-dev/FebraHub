import { ListPropertiesUseCase } from './list-properties.use-case';
import { InMemoryPropertyRepository } from '../../../infrastructure/database/in-memory-property.repository';

const STORE = 'store-1';

describe('ListPropertiesUseCase', () => {
  it('lista imóveis paginados com filtros', async () => {
    const repo = new InMemoryPropertyRepository();
    await repo.create({
      storeId: STORE,
      name: 'Casa Centro',
      city: 'Ilhéus',
      state: 'BA',
      type: 'house',
      status: 'available',
      listingType: 'sale',
      negotiable: true,
    });
    await repo.create({
      storeId: STORE,
      name: 'Apt Praia',
      city: 'Ilhéus',
      state: 'BA',
      type: 'apartment',
      status: 'occupied',
      listingType: 'rent',
      negotiable: false,
    });

    const useCase = new ListPropertiesUseCase(repo);
    const result = await useCase.execute({
      storeId: STORE,
      status: ['available'],
      negotiable: ['yes'],
      page: 1,
      perPage: 10,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.name).toBe('Casa Centro');
    expect(result.total).toBe(1);
  });

  it('rejeita filtros inválidos', async () => {
    const repo = new InMemoryPropertyRepository();
    const useCase = new ListPropertiesUseCase(repo);

    await expect(
      useCase.execute({ storeId: STORE, status: ['invalid-status'] }),
    ).rejects.toMatchObject({ context: 'ListPropertiesUseCase' });
  });

  it('isola por storeId', async () => {
    const repo = new InMemoryPropertyRepository();
    await repo.create({
      storeId: 'other-store',
      name: 'Outro',
      type: 'house',
      status: 'available',
      listingType: 'sale',
    });

    const useCase = new ListPropertiesUseCase(repo);
    const result = await useCase.execute({ storeId: STORE });

    expect(result.items).toHaveLength(0);
  });
});
