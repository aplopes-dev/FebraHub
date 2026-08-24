import { InMemoryServiceRepository } from '../../../tests/in-memory-service.repository';
import { ServiceEntity } from '../../../domain/entities/service.entity';
import { ListServicesUseCase } from './list-services.use-case';

const STORE_ID = '019c0000-0000-7000-8000-000000000001';

function makeService(
  name: string,
  options?: { active?: boolean; price?: number; duration?: number },
): ServiceEntity {
  return ServiceEntity.create({
    storeId: STORE_ID,
    name,
    categories: ['Cabelo'],
    durationMinutes: options?.duration ?? 30,
    price: options?.price ?? 50,
    active: options?.active ?? true,
  });
}

describe('ListServicesUseCase', () => {
  let repository: InMemoryServiceRepository;
  let sut: ListServicesUseCase;

  beforeEach(async () => {
    repository = new InMemoryServiceRepository();
    sut = new ListServicesUseCase(repository);

    for (const name of ['Corte', 'Barba', 'Coloração', 'Hidratação']) {
      await repository.save(makeService(name));
    }
  });

  it('paginates services in the store', async () => {
    const result = await sut.execute({ storeId: STORE_ID, page: 1, perPage: 2 });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(2);
    expect(result.totalPages).toBe(2);
  });

  it('computes store-wide stats independent of pagination', async () => {
    await repository.save(makeService('Inativo', { active: false, price: 100 }));

    const result = await sut.execute({ storeId: STORE_ID, page: 1, perPage: 2 });

    expect(result.stats.totalServices).toBe(5);
    expect(result.stats.activeCount).toBe(4);
    expect(result.stats.inactiveCount).toBe(1);
    expect(result.stats.averagePrice).toBe(60);
  });
});
