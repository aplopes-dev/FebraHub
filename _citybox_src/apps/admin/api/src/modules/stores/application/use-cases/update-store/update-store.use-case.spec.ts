import { createPassThroughUnitOfWork } from '../../../../../shared/core/tests/pass-through-unit-of-work';
import { UpdateStoreUseCase } from './update-store.use-case';
import { createNoopStoreEventsPublisher } from '../../../tests/noop-store-events.publisher';
import { CreateStoreUseCase } from '../create-store/create-store.use-case';
import { InMemoryStoreRepository } from '../../../tests/in-memory-store.repository';
import { InMemoryStoreDetailRepository } from '../../../tests/in-memory-store-detail.repository';
import { InMemorySubscriptionRepository } from '../../../../subscriptions/tests/in-memory-subscription.repository';
import { InMemoryPlanRepository } from '../../../../plans/tests/in-memory-plan.repository';
import { buildCreateStoreFixture } from '../../../tests/build-create-store-fixture';
import { StoreImmutableFieldError } from '../../../domain/errors/store-immutable-field.error';
import type { StoreEventsPublisher } from '../../../../../shared/infra/messaging/store-events.publisher';
import { mapStoreToPlatformEvent } from '../../../../../shared/infra/messaging/store-platform-event.mapper';

const TEST_ACTOR = 'test.admin · test@citybox.local';

describe('UpdateStoreUseCase', () => {
  let useCase: UpdateStoreUseCase;
  let storeRepo: InMemoryStoreRepository;
  let detailRepo: InMemoryStoreDetailRepository;
  let subscriptionRepo: InMemorySubscriptionRepository;
  let planRepo: InMemoryPlanRepository;
  let storeId: string;

  beforeEach(async () => {
    storeRepo = new InMemoryStoreRepository();
    subscriptionRepo = new InMemorySubscriptionRepository();
    planRepo = new InMemoryPlanRepository();
    detailRepo = new InMemoryStoreDetailRepository();
    useCase = new UpdateStoreUseCase(
      storeRepo,
      detailRepo,
      createNoopStoreEventsPublisher(),
      createPassThroughUnitOfWork(),
    );

    const createStore = new CreateStoreUseCase(
      storeRepo,
      subscriptionRepo,
      planRepo,
      createPassThroughUnitOfWork(),
    );
    const dto = await buildCreateStoreFixture(planRepo, subscriptionRepo);
    const store = await createStore.execute(dto);
    storeId = store.store.id;
  });

  it('should update editable fields', async () => {
    const updated = await useCase.execute({
      id: storeId,
      vertical: 'Comércio',
      tradeName: 'Maria Doces Premium',
      slug: 'maria-doces-premium',
      personType: 'PJ' as const,
      document: '11.444.777/0001-61',
      timezone: 'America/Bahia',
      phone: '73999990000',
      actor: TEST_ACTOR,
    });

    expect(updated.tradeName).toBe('Maria Doces Premium');
    expect(updated.slug).toBe('maria-doces-premium');
    expect(updated.timezone).toBe('America/Bahia');
    expect(updated.phone).toBe('73999990000');
  });

  it('should publish store.updated event after save', async () => {
    const publishStoreUpdated = jest.fn<Promise<void>, [unknown]>();
    const publisher = {
      publishStoreCreated: jest.fn(),
      publishStoreUpdated,
    } as unknown as StoreEventsPublisher;
    const publishingUseCase = new UpdateStoreUseCase(
      storeRepo,
      detailRepo,
      publisher,
      createPassThroughUnitOfWork(),
    );

    const updated = await publishingUseCase.execute({
      id: storeId,
      vertical: 'Comércio',
      tradeName: 'Maria Doces Premium',
      slug: 'maria-doces-premium',
      personType: 'PJ' as const,
      document: '11.444.777/0001-61',
      timezone: 'America/Bahia',
      phone: '73999990000',
      actor: TEST_ACTOR,
    });

    expect(publishStoreUpdated).toHaveBeenCalledTimes(1);
    expect(publishStoreUpdated).toHaveBeenCalledWith(
      mapStoreToPlatformEvent(updated),
    );
  });

  it('keeps clinicStrand unchanged when a Clínica store is updated', async () => {
    const dto = await buildCreateStoreFixture(planRepo, subscriptionRepo, {
      vertical: 'Clínica',
      tradeName: 'Clínica Fisio',
      slug: 'clinica-fisio',
      clinicStrand: 'fisioterapia',
    });
    const created = await new CreateStoreUseCase(
      storeRepo,
      subscriptionRepo,
      planRepo,
      createPassThroughUnitOfWork(),
    ).execute(dto);

    const updated = await useCase.execute({
      id: created.store.id,
      tradeName: 'Clínica Fisio Centro',
      slug: 'clinica-fisio',
      personType: 'PJ',
      document: '11.444.777/0001-61',
      timezone: 'America/Sao_Paulo',
      actor: TEST_ACTOR,
    });

    expect(updated.clinicStrand).toBe('fisioterapia');
    expect(updated.tradeName).toBe('Clínica Fisio Centro');
  });

  it('should reject vertical change (FR-006)', async () => {
    await expect(
      useCase.execute({
        id: storeId,
        vertical: 'Clínica',
        tradeName: 'Maria Doces',
        slug: 'maria-doces',
        personType: 'PJ' as const,
        document: '11.444.777/0001-61',
        timezone: 'America/Sao_Paulo',
        actor: TEST_ACTOR,
      }),
    ).rejects.toBeInstanceOf(StoreImmutableFieldError);
  });
});
