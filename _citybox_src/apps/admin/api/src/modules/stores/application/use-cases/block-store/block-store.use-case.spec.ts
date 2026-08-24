import { createPassThroughUnitOfWork } from '../../../../../shared/core/tests/pass-through-unit-of-work';
import { BlockStoreUseCase } from './block-store.use-case';
import { createNoopStoreEventsPublisher } from '../../../tests/noop-store-events.publisher';
import { CreateStoreUseCase } from '../create-store/create-store.use-case';
import { InMemoryStoreRepository } from '../../../tests/in-memory-store.repository';
import { InMemoryStoreDetailRepository } from '../../../tests/in-memory-store-detail.repository';
import { InMemorySubscriptionRepository } from '../../../../subscriptions/tests/in-memory-subscription.repository';
import { InMemoryPlanRepository } from '../../../../plans/tests/in-memory-plan.repository';
import { buildCreateStoreFixture } from '../../../tests/build-create-store-fixture';

const TEST_ACTOR = 'test.admin · test@citybox.local';

describe('BlockStoreUseCase', () => {
  let useCase: BlockStoreUseCase;
  let storeRepo: InMemoryStoreRepository;
  let detailRepo: InMemoryStoreDetailRepository;
  let subscriptionRepo: InMemorySubscriptionRepository;
  let planRepo: InMemoryPlanRepository;
  let createStore: CreateStoreUseCase;

  beforeEach(() => {
    storeRepo = new InMemoryStoreRepository();
    subscriptionRepo = new InMemorySubscriptionRepository();
    planRepo = new InMemoryPlanRepository();
    detailRepo = new InMemoryStoreDetailRepository();
    useCase = new BlockStoreUseCase(
      storeRepo,
      detailRepo,
      createNoopStoreEventsPublisher(),
      createPassThroughUnitOfWork(),
    );
    createStore = new CreateStoreUseCase(
      storeRepo,
      subscriptionRepo,
      planRepo,
      createPassThroughUnitOfWork(),
    );
  });

  it('should block store', async () => {
    const dto = await buildCreateStoreFixture(planRepo, subscriptionRepo);
    const created = await createStore.execute(dto);

    const blocked = await useCase.execute({
      id: created.store.id,
      actor: TEST_ACTOR,
    });
    expect(blocked.status).toBe('BLOCKED');
  });

  it('should be idempotent when already blocked', async () => {
    const dto = await buildCreateStoreFixture(planRepo, subscriptionRepo);
    const created = await createStore.execute(dto);

    await useCase.execute({ id: created.store.id, actor: TEST_ACTOR });
    const second = await useCase.execute({
      id: created.store.id,
      actor: TEST_ACTOR,
    });
    expect(second.status).toBe('BLOCKED');
  });
});
