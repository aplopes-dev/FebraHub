import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository.interface';
import { Subscription } from '../../../domain/entities/subscription.entity';
import { ActiveSubscriptionConflictError } from '../../../domain/errors/active-subscription-conflict.error';
import type { CreateSubscriptionDto } from '../../dtos/subscription.dto';
import { mapCreateDtoToSubscriptionProps } from '../../mappers/subscription.mapper';

@Injectable()
export class CreateSubscriptionUseCase implements IUseCase<
  CreateSubscriptionDto,
  Subscription
> {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute(dto: CreateSubscriptionDto): Promise<Subscription> {
    const active = await this.subscriptionRepository.findActiveByStoreId(
      dto.storeId,
    );
    if (active) {
      throw new ActiveSubscriptionConflictError(
        CreateSubscriptionUseCase.name,
        dto.storeId,
      );
    }

    const subscription = Subscription.create(
      mapCreateDtoToSubscriptionProps(dto),
    );
    return this.subscriptionRepository.save(subscription);
  }
}
