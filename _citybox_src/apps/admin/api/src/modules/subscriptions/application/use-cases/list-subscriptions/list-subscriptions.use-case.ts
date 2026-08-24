import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import {
  SubscriptionRepository,
  type SubscriptionListCriteria,
} from '../../../domain/repositories/subscription.repository.interface';
import type {
  Subscription,
  SubscriptionStatus,
} from '../../../domain/entities/subscription.entity';
import type { ListSubscriptionsDto } from '../../dtos/subscription.dto';

export interface ListSubscriptionsResult {
  subscriptions: Subscription[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

const VALID_STATUS: SubscriptionStatus[] = [
  'ACTIVE',
  'TRIALING',
  'PAST_DUE',
  'CANCELED',
];

@Injectable()
export class ListSubscriptionsUseCase implements IUseCase<
  ListSubscriptionsDto,
  ListSubscriptionsResult
> {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute({
    page = 1,
    perPage = 20,
    storeId,
    planPriceId,
    status,
  }: ListSubscriptionsDto): Promise<ListSubscriptionsResult> {
    const skip = (page - 1) * perPage;
    const criteria: SubscriptionListCriteria = {
      skip,
      take: perPage,
      storeId,
      planPriceId,
      status: this.normalizeStatus(status),
    };

    const [subscriptions, total] = await Promise.all([
      this.subscriptionRepository.findAll(criteria),
      this.subscriptionRepository.count(criteria),
    ]);

    return {
      subscriptions,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
    };
  }

  private normalizeStatus(status?: string[]): SubscriptionStatus[] | undefined {
    if (!status?.length) return undefined;
    const valid = status.filter((value): value is SubscriptionStatus =>
      VALID_STATUS.includes(value as SubscriptionStatus),
    );
    return valid.length ? valid : undefined;
  }
}
