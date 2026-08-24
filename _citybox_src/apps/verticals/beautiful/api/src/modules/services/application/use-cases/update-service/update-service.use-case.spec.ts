import { InMemoryServiceRepository } from '../../../tests/in-memory-service.repository';
import { ServiceEntity } from '../../../domain/entities/service.entity';
import { UpdateServiceUseCase } from './update-service.use-case';

const STORE_ID = '019c0000-0000-7000-8000-000000000001';
const OTHER_STORE_ID = '019c0000-0000-7000-8000-000000000002';

describe('UpdateServiceUseCase', () => {
  let serviceRepository: InMemoryServiceRepository;
  let sut: UpdateServiceUseCase;
  let service: ServiceEntity;

  beforeEach(async () => {
    serviceRepository = new InMemoryServiceRepository();
    sut = new UpdateServiceUseCase(serviceRepository);

    service = ServiceEntity.create({
      storeId: STORE_ID,
      name: 'Corte',
      durationMinutes: 30,
      price: 50,
      active: true,
      professionalIds: ['00000000-0000-4000-8000-000000000001'],
    });
    await serviceRepository.save(service);
  });

  it('should update scalar fields without changing professionalIds projection', async () => {
    const result = await sut.execute({
      storeId: STORE_ID,
      id: service.id,
      name: 'Corte Atualizado',
    });

    expect(result.name).toBe('Corte Atualizado');
    expect(result.professionalIds).toEqual([
      '00000000-0000-4000-8000-000000000001',
    ]);
  });

  it('should not find service from another store (anti-IDOR)', async () => {
    await expect(
      sut.execute({
        storeId: OTHER_STORE_ID,
        id: service.id,
        name: 'Hack',
      }),
    ).rejects.toThrow();
  });
});
