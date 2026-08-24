import { randomUUID } from 'crypto';
import { ListSubscriptionsUseCase } from './list-subscriptions.use-case';
import { InMemorySubscriptionRepository } from '../../../tests/in-memory-subscription.repository';
import {
  Subscription,
  SubscriptionCycle,
  SubscriptionStatus,
} from '../../../domain/entities/subscription.entity';

function createSub(
  overrides: { storeId?: string; status?: string; cycle?: string } = {},
) {
  return Subscription.create({
    storeId: overrides.storeId ?? randomUUID(),
    planPriceId: randomUUID(),
    cycle: (overrides.cycle as SubscriptionCycle) ?? 'MONTHLY',
    dayOfMonth: 5,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    ...(overrides.status
      ? { status: overrides.status as SubscriptionStatus }
      : {}),
  });
}

describe('ListSubscriptionsUseCase', () => {
  let useCase: ListSubscriptionsUseCase;
  let subRepo: InMemorySubscriptionRepository;

  beforeEach(() => {
    subRepo = new InMemorySubscriptionRepository();
    useCase = new ListSubscriptionsUseCase(subRepo);
  });

  it('should return paginated results', async () => {
    for (let i = 0; i < 5; i++) {
      await subRepo.save(createSub());
    }

    const result = await useCase.execute({ page: 1, perPage: 2 });

    expect(result.subscriptions).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(2);
    expect(result.totalPages).toBe(3);
  });

  it('should filter by status', async () => {
    await subRepo.save(createSub({ status: 'ACTIVE' }));
    await subRepo.save(createSub({ status: 'CANCELED' }));
    await subRepo.save(createSub({ status: 'ACTIVE' }));

    const result = await useCase.execute({ status: ['ACTIVE'] });

    expect(result.subscriptions).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should ignore invalid status values', async () => {
    await subRepo.save(createSub({ status: 'ACTIVE' }));

    const result = await useCase.execute({ status: ['INVALID'] });

    expect(result.subscriptions).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('should return empty result when no subscriptions exist', async () => {
    const result = await useCase.execute({});

    expect(result.subscriptions).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });
});
