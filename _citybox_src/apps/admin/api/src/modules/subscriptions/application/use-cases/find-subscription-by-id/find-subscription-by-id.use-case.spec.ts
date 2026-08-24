import { randomUUID } from 'crypto';
import { FindSubscriptionByIdUseCase } from './find-subscription-by-id.use-case';
import { InMemorySubscriptionRepository } from '../../../tests/in-memory-subscription.repository';
import { SubscriptionNotFoundError } from '../../../domain/errors/subscription-not-found.error';
import { Subscription } from '../../../domain/entities/subscription.entity';

describe('FindSubscriptionByIdUseCase', () => {
  let useCase: FindSubscriptionByIdUseCase;
  let subRepo: InMemorySubscriptionRepository;

  beforeEach(() => {
    subRepo = new InMemorySubscriptionRepository();
    useCase = new FindSubscriptionByIdUseCase(subRepo);
  });

  it('should return subscription by id', async () => {
    const sub = Subscription.create({
      storeId: randomUUID(),
      planPriceId: randomUUID(),
      cycle: 'YEARLY',
      dayOfMonth: 10,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 86400000),
    });
    await subRepo.save(sub);

    const result = await useCase.execute({ id: sub.id });

    expect(result.id).toBe(sub.id);
    expect(result.cycle).toBe('YEARLY');
  });

  it('should throw SubscriptionNotFoundError when subscription does not exist', async () => {
    await expect(useCase.execute({ id: randomUUID() })).rejects.toThrow(
      SubscriptionNotFoundError,
    );
  });
});
