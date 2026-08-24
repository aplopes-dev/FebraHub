import { createPassThroughUnitOfWork } from '../../../../../shared/core/tests/pass-through-unit-of-work';
import { ListStoresUseCase } from './list-stores.use-case';
import { CreateStoreUseCase } from '../create-store/create-store.use-case';
import { InMemoryStoreRepository } from '../../../tests/in-memory-store.repository';
import { InMemorySubscriptionRepository } from '../../../../subscriptions/tests/in-memory-subscription.repository';
import { InMemoryPlanRepository } from '../../../../plans/tests/in-memory-plan.repository';
import { buildCreateStoreFixture } from '../../../tests/build-create-store-fixture';

describe('ListStoresUseCase', () => {
  let useCase: ListStoresUseCase;
  let storeRepo: InMemoryStoreRepository;

  beforeEach(async () => {
    storeRepo = new InMemoryStoreRepository();
    const subscriptionRepo = new InMemorySubscriptionRepository();
    const planRepo = new InMemoryPlanRepository();
    useCase = new ListStoresUseCase(storeRepo);

    const createStore = new CreateStoreUseCase(
      storeRepo,
      subscriptionRepo,
      planRepo,
      createPassThroughUnitOfWork(),
    );
    await createStore.execute(
      await buildCreateStoreFixture(planRepo, subscriptionRepo, {
        vertical: 'Comércio',
        tradeName: 'Maria Doces',
        slug: 'maria-doces',
      }),
    );
    await createStore.execute(
      await buildCreateStoreFixture(planRepo, subscriptionRepo, {
        vertical: 'Clínica',
        tradeName: 'Clínica Bem Estar',
        slug: 'clinica-bem-estar',
      }),
    );
  });

  it('should list all stores', async () => {
    const result = await useCase.execute({});

    expect(result.stores).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should filter by search on trade name', async () => {
    const result = await useCase.execute({ search: 'maria' });

    expect(result.stores).toHaveLength(1);
    expect(result.stores[0]?.tradeName).toBe('Maria Doces');
  });

  it('should filter by vertical', async () => {
    const result = await useCase.execute({ vertical: ['Clínica'] });

    expect(result.stores).toHaveLength(1);
    expect(result.stores[0]?.vertical).toBe('Clínica');
  });
});
