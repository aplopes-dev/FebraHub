import { z } from 'zod';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import type { Subscription } from '../entities/subscription.entity';

export class SubscriptionZodValidator implements Validator<Subscription> {
  private constructor() {}

  public static create(): SubscriptionZodValidator {
    return new SubscriptionZodValidator();
  }

  public validate(input: Subscription): void {
    try {
      this.getSchema().parse({
        id: input.id,
        storeId: input.props.storeId,
        planPriceId: input.props.planPriceId,
        cycle: input.props.cycle,
        status: input.props.status,
        currentPeriodStart: input.props.currentPeriodStart,
        currentPeriodEnd: input.props.currentPeriodEnd,
        dayOfMonth: input.props.dayOfMonth,
        createdAt: input.props.createdAt,
        updatedAt: input.props.updatedAt,
        clientName: input.props.clientName,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating Subscription ${input.id}: ${msg}`,
          externalMessage: msg,
          context: SubscriptionZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating Subscription: ${err.message}`,
        externalMessage: 'Houve um erro ao validar os dados da assinatura',
        context: SubscriptionZodValidator.name,
      });
    }
  }

  private getSchema() {
    return z.object({
      id: z.string().uuid(),
      storeId: z.string().uuid(),
      planPriceId: z.string().uuid(),
      cycle: z.enum(['MONTHLY', 'YEARLY']),
      status: z.enum(['ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED']),
      currentPeriodStart: z.date(),
      currentPeriodEnd: z.date(),
      dayOfMonth: z.number().int().min(1).max(31),
      createdAt: z.date(),
      updatedAt: z.date(),
      clientName: z.string().optional(),
    });
  }
}
