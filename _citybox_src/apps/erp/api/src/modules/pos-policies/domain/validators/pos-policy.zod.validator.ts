import { z } from 'zod';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import type { PosPolicy } from '../entities/pos-policy.entity';

export class PosPolicyZodValidator implements Validator<PosPolicy> {
  private constructor() {}

  public static create(): PosPolicyZodValidator {
    return new PosPolicyZodValidator();
  }

  public validate(input: PosPolicy): void {
    try {
      this.getSchema().parse(input.props);
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const message = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating PosPolicy: ${message}`,
          externalMessage: message,
          context: PosPolicyZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating PosPolicy: ${err.message}`,
        externalMessage: 'Houve um erro ao validar as alçadas do PDV',
        context: PosPolicyZodValidator.name,
      });
    }
  }

  private getSchema() {
    return z.object({
      organizationId: z.string().uuid(),
      // 0 = todo desconto exige supervisor; 100 = nenhum exige. Fora dessa
      // faixa o número não significa nada.
      discountSupervisorAbovePercent: z.number().int().min(0).max(100),
      withdrawalSupervisorAboveCents: z.number().int().min(0),
      cancellationRequiresSupervisor: z.boolean(),
      refundRequiresSupervisor: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
    });
  }
}
