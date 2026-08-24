import { SeedClinicDemoTeamUseCase } from './seed-clinic-demo-team.use-case';
import { InMemoryStoreRepository } from '../../../tests/in-memory-store.repository';
import { InMemoryStoreDetailRepository } from '../../../tests/in-memory-store-detail.repository';
import { Store } from '../../../domain/entities/store.entity';

describe('SeedClinicDemoTeamUseCase', () => {
  it('é no-op para Clínica (equipe demo nasce no worker clinic.store-setup)', async () => {
    const storeRepo = new InMemoryStoreRepository();
    const detailRepo = new InMemoryStoreDetailRepository();
    const store = Store.create({
      vertical: 'Clínica',
      tradeName: 'Clínica Demo',
      slug: 'clinica-demo',
      timezone: 'America/Sao_Paulo',
      personType: null,
      responsibleName: null,
      billingEmail: null,
    });
    await storeRepo.save(store);

    const useCase = new SeedClinicDemoTeamUseCase(storeRepo, detailRepo);
    const result = await useCase.execute({ storeId: store.id });

    expect(result.createdUsernames).toEqual([]);
    expect(result.skippedUsernames).toEqual([]);
  });

  it('skips non-Clínica vertical', async () => {
    const storeRepo = new InMemoryStoreRepository();
    const detailRepo = new InMemoryStoreDetailRepository();
    const store = Store.create({
      vertical: 'Comércio',
      tradeName: 'Comércio Demo',
      slug: 'comercio-demo',
      timezone: 'America/Sao_Paulo',
      personType: null,
      responsibleName: null,
      billingEmail: null,
    });
    await storeRepo.save(store);

    const useCase = new SeedClinicDemoTeamUseCase(storeRepo, detailRepo);
    const result = await useCase.execute({ storeId: store.id });
    expect(result.createdUsernames).toEqual([]);
  });
});
