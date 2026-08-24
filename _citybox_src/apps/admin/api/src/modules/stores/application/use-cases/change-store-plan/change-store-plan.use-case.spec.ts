import { createPassThroughUnitOfWork } from '../../../../../shared/core/tests/pass-through-unit-of-work';
import { ChangeStorePlanUseCase } from './change-store-plan.use-case';
import { InMemoryStoreRepository } from '../../../tests/in-memory-store.repository';
import { InMemoryStoreDetailRepository } from '../../../tests/in-memory-store-detail.repository';
import { InMemorySubscriptionRepository } from '../../../../subscriptions/tests/in-memory-subscription.repository';
import { InMemoryPlanRepository } from '../../../../plans/tests/in-memory-plan.repository';
import { CreateStoreUseCase } from '../create-store/create-store.use-case';
import { createNoopStoreEventsPublisher } from '../../../tests/noop-store-events.publisher';
import { buildCreateStoreFixture } from '../../../tests/build-create-store-fixture';
import { Plan } from '../../../../plans/domain/entities/plan.entity';
import { PlanNotFoundError } from '../../../domain/errors/plan-not-found.error';
import { PlanVerticalMismatchError } from '../../../domain/errors/plan-vertical-mismatch.error';
import { StoreNotFoundError } from '../../../domain/errors/store-not-found.error';

const TEST_ACTOR = 'test.admin · test@citybox.local';

describe('ChangeStorePlanUseCase', () => {
  let storeRepo: InMemoryStoreRepository;
  let detailRepo: InMemoryStoreDetailRepository;
  let subscriptionRepo: InMemorySubscriptionRepository;
  let planRepo: InMemoryPlanRepository;
  let useCase: ChangeStorePlanUseCase;
  let storeId: string;
  let comercioPlanId: string;

  beforeEach(async () => {
    storeRepo = new InMemoryStoreRepository();
    detailRepo = new InMemoryStoreDetailRepository();
    subscriptionRepo = new InMemorySubscriptionRepository();
    planRepo = new InMemoryPlanRepository();

    const createStore = new CreateStoreUseCase(
      storeRepo,
      subscriptionRepo,
      planRepo,
      createPassThroughUnitOfWork(),
    );
    const dto = await buildCreateStoreFixture(planRepo, subscriptionRepo);
    comercioPlanId = dto.planId;
    const store = await createStore.execute(dto);
    storeId = store.store.id;

    useCase = new ChangeStorePlanUseCase(
      storeRepo,
      detailRepo,
      planRepo,
      subscriptionRepo,
      createNoopStoreEventsPublisher(),
      createPassThroughUnitOfWork(),
    );
  });

  it('updates the active subscription in place to the new plan', async () => {
    const newPlan = await planRepo.save(
      Plan.create({
        code: `comercio-pro-${crypto.randomUUID()}`,
        name: 'Comércio Pro',
        description: 'Plano intermediário Comércio',
        prices: [{ cycle: 'MONTHLY', priceCents: 19900 }],
        vertical: 'Comércio',
        tier: 'pro',
        maxNegocios: 10,
        maxUsers: 20,
      }),
    );
    subscriptionRepo.addPrice(
      newPlan.id,
      'MONTHLY',
      crypto.randomUUID(),
      19900,
    );

    const oldSubscription = await subscriptionRepo.findActiveByStoreId(storeId);

    await useCase.execute({
      id: storeId,
      planId: newPlan.id,
      billingCycle: 'MONTHLY',
      dueDay: 15,
      actor: TEST_ACTOR,
    });

    const subscription = await subscriptionRepo.findActiveByStoreId(storeId);
    expect(subscription?.id).toBe(oldSubscription?.id);
    expect(subscription?.dayOfMonth).toBe(15);
    expect(subscription?.priceCents).toBe(19900);
  });

  it('throws PlanVerticalMismatchError when the plan belongs to a different vertical', async () => {
    const clinicPlan = await planRepo.save(
      Plan.create({
        code: `clinica-${crypto.randomUUID()}`,
        name: 'Clínica Prata',
        description: 'Plano Clínica',
        prices: [{ cycle: 'MONTHLY', priceCents: 29900 }],
        vertical: 'Clínica',
        tier: 'prata',
        maxNegocios: 1,
        maxUsers: 5,
      }),
    );
    subscriptionRepo.addPrice(
      clinicPlan.id,
      'MONTHLY',
      crypto.randomUUID(),
      29900,
    );

    await expect(
      useCase.execute({
        id: storeId,
        planId: clinicPlan.id,
        billingCycle: 'MONTHLY',
        dueDay: 10,
        actor: TEST_ACTOR,
      }),
    ).rejects.toBeInstanceOf(PlanVerticalMismatchError);
  });

  it('throws PlanNotFoundError when the plan does not exist', async () => {
    await expect(
      useCase.execute({
        id: storeId,
        planId: '00000000-0000-4000-8000-000000000099',
        billingCycle: 'MONTHLY',
        dueDay: 10,
        actor: TEST_ACTOR,
      }),
    ).rejects.toBeInstanceOf(PlanNotFoundError);
  });

  it('throws StoreNotFoundError when the store does not exist', async () => {
    await expect(
      useCase.execute({
        id: '00000000-0000-4000-8000-000000000098',
        planId: comercioPlanId,
        billingCycle: 'MONTHLY',
        dueDay: 10,
        actor: TEST_ACTOR,
      }),
    ).rejects.toBeInstanceOf(StoreNotFoundError);
  });

  it('records an audit event for the plan change', async () => {
    await useCase.execute({
      id: storeId,
      planId: comercioPlanId,
      billingCycle: 'MONTHLY',
      dueDay: 20,
      actor: TEST_ACTOR,
    });

    const { items } = await detailRepo.listAuditEvents({ storeId });
    expect(items.some((e) => e.action.includes('Trocou o plano'))).toBe(true);
  });
});
