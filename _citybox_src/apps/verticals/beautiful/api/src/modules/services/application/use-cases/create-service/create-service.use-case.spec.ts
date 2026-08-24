import { InMemoryServiceRepository } from '../../../tests/in-memory-service.repository';
import { CreateServiceUseCase } from './create-service.use-case';

const STORE_ID = '019c0000-0000-7000-8000-000000000001';

describe('CreateServiceUseCase', () => {
  let serviceRepository: InMemoryServiceRepository;
  let sut: CreateServiceUseCase;

  beforeEach(() => {
    serviceRepository = new InMemoryServiceRepository();
    sut = new CreateServiceUseCase(serviceRepository);
  });

  it('should create a service with empty professionalIds (read-only projection)', async () => {
    const result = await sut.execute({
      storeId: STORE_ID,
      name: 'Corte Masculino',
      durationMinutes: 30,
      price: 50,
    });

    expect(result.id).toBeDefined();
    expect(result.storeId).toBe(STORE_ID);
    expect(result.name).toBe('Corte Masculino');
    expect(result.professionalIds).toEqual([]);
    expect(serviceRepository.items).toHaveLength(1);
  });
});
