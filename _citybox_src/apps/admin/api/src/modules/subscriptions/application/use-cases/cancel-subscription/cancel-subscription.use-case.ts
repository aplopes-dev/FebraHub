import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.interface';
import { Subscription } from '../../../domain/entities/subscription.entity';
import { SubscriptionNotFoundError } from '../../../domain/errors/subscription-not-found.error';
import type { CancelSubscriptionDto } from '../../dtos/subscription.dto';

@Injectable()
export class CancelSubscriptionUseCase implements IUseCase<
  CancelSubscriptionDto,
  Subscription
> {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute({ id }: CancelSubscriptionDto): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findById(id);
    if (!subscription) {
      throw new SubscriptionNotFoundError(CancelSubscriptionUseCase.name, id);
    }

    if (subscription.status !== 'CANCELED') {
      subscription.cancel();
      await this.subscriptionRepository.save(subscription);
    }

    return subscription;
  }
}
