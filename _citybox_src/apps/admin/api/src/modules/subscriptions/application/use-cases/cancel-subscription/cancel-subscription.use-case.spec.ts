import { randomUUID } from 'crypto';
import { CancelSubscriptionUseCase } from './cancel-subscription.use-case';
import { InMemorySubscriptionRepository } from '../../../tests/in-memory-subscription.repository';
import { SubscriptionNotFoundError } from '../../../domain/errors/subscription-not-found.error';
import { Subscription } from '../../../domain/entities/subscription.entity';

describe('CancelSubscriptionUseCase', () => {
  let useCase: CancelSubscriptionUseCase;
  let subRepo: InMemorySubscriptionRepository;

  beforeEach(() => {
    subRepo = new InMemorySubscriptionRepository();
    useCase = new CancelSubscriptionUseCase(subRepo);
  });

  it('should cancel an active subscription', async () => {
    const sub = Subscription.create({
      storeId: randomUUID(),
      planPriceId: randomUUID(),
      cycle: 'MONTHLY',
      dayOfMonth: 5,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    });
    await subRepo.save(sub);

    const result = await useCase.execute({ id: sub.id });

    expect(result.status).toBe('CANCELED');
    expect(result.canceledAt).toBeInstanceOf(Date);
  });

  it('should throw SubscriptionNotFoundError when subscription does not exist', async () => {
    await expect(useCase.execute({ id: randomUUID() })).rejects.toThrow(
      SubscriptionNotFoundError,
    );
  });

  it('should not change already canceled subscription', async () => {
    const sub = Subscription.create({
      storeId: randomUUID(),
      planPriceId: randomUUID(),
      cycle: 'MONTHLY',
      dayOfMonth: 5,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    });
    sub.cancel();
    const canceledAt = sub.canceledAt;
    await subRepo.save(sub);

    const result = await useCase.execute({ id: sub.id });

    expect(result.status).toBe('CANCELED');
    expect(result.canceledAt).toBe(canceledAt);
  });
});
