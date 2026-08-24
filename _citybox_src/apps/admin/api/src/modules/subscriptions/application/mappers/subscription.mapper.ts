import type { CreateSubscriptionDto } from '../dtos/subscription.dto';
import type { SubscriptionProps } from '../../domain/entities/subscription.entity';
import type { Optional } from '../../../../shared/core/types/optional.type';

export type CreateSubscriptionPropsInput = Optional<
  SubscriptionProps,
  'createdAt' | 'updatedAt' | 'status' | 'gatewaySubscriptionId' | 'canceledAt'
>;

export function mapCreateDtoToSubscriptionProps(
  dto: CreateSubscriptionDto,
): CreateSubscriptionPropsInput {
  return {
    storeId: dto.storeId ?? null,
    planPriceId: dto.planPriceId,
    cycle: dto.cycle as SubscriptionProps['cycle'],
    currentPeriodStart: new Date(dto.currentPeriodStart),
    currentPeriodEnd: new Date(dto.currentPeriodEnd),
    dayOfMonth: dto.dayOfMonth,
  };
}

export function toSubscriptionProps(
  input: CreateSubscriptionPropsInput,
  overrides: Pick<SubscriptionProps, 'createdAt' | 'updatedAt'>,
): SubscriptionProps {
  return {
    storeId: input.storeId ?? null,
    planPriceId: input.planPriceId,
    cycle: input.cycle,
    status: input.status ?? 'ACTIVE',
    currentPeriodStart: input.currentPeriodStart,
    currentPeriodEnd: input.currentPeriodEnd,
    dayOfMonth: input.dayOfMonth,
    gatewaySubscriptionId: input.gatewaySubscriptionId ?? null,
    canceledAt: input.canceledAt ?? null,
    ...overrides,
  };
}
