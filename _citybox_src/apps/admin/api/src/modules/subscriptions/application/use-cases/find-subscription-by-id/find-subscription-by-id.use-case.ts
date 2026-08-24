import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.interface';
import { Subscription } from '../../../domain/entities/subscription.entity';
import { SubscriptionNotFoundError } from '../../../domain/errors/subscription-not-found.error';
import type { FindSubscriptionByIdDto } from '../../dtos/subscription.dto';

@Injectable()
export class FindSubscriptionByIdUseCase implements IUseCase<
  FindSubscriptionByIdDto,
  Subscription
> {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute({ id }: FindSubscriptionByIdDto): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findById(id);
    if (!subscription) {
      throw new SubscriptionNotFoundError(FindSubscriptionByIdUseCase.name, id);
    }
    return subscription;
  }
}
