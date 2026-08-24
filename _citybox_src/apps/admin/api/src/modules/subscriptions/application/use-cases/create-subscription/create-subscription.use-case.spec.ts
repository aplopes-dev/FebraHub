import { CreateSubscriptionUseCase } from './create-subscription.use-case';
import { InMemorySubscriptionRepository } from '../../../tests/in-memory-subscription.repository';
import { ActiveSubscriptionConflictError } from '../../../domain/errors/active-subscription-conflict.error';

describe('CreateSubscriptionUseCase', () => {
  let useCase: CreateSubscriptionUseCase;
  let subRepo: InMemorySubscriptionRepository;

  beforeEach(() => {
    subRepo = new InMemorySubscriptionRepository();
    useCase = new CreateSubscriptionUseCase(subRepo);
  });

  it('should create a subscription when no active one exists', async () => {
    const storeId = '550e8400-e29b-41d4-a716-446655440000';
    const planPriceId = '550e8400-e29b-41d4-a716-446655440001';

    const result = await useCase.execute({
      storeId,
      planPriceId,
      cycle: 'MONTHLY',
      dayOfMonth: 5,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    });

    expect(result.id).toBeDefined();
    expect(result.storeId).toBe(storeId);
    expect(result.planPriceId).toBe(planPriceId);
    expect(result.status).toBe('ACTIVE');

    const active = await subRepo.findActiveByStoreId(storeId);
    expect(active).not.toBeNull();
    expect(active?.id).toBe(result.id);
  });

  it('should throw ActiveSubscriptionConflictError when store already has active subscription', async () => {
    const storeId = '550e8400-e29b-41d4-a716-446655440000';
    const planPriceId = '550e8400-e29b-41d4-a716-446655440001';

    // Create first subscription
    await useCase.execute({
      storeId,
      planPriceId,
      cycle: 'MONTHLY',
      dayOfMonth: 5,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    });

    // Try to create another subscription
    await expect(
      useCase.execute({
        storeId,
        planPriceId,
        cycle: 'MONTHLY',
        dayOfMonth: 10,
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      }),
    ).rejects.toThrow(ActiveSubscriptionConflictError);
  });
});
