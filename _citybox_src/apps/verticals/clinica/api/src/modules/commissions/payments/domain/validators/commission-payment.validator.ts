import { z } from 'zod';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../../shared/core/utils/zod-utils';

const createPaymentSchema = z.object({
  memberId: z.string().uuid(),
  accrualIds: z.array(z.string().uuid()).min(1),
  description: z.string().min(1),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  accountId: z.string().uuid(),
  paymentMethod: z.string().min(1),
  discountCents: z.number().int().min(0).optional(),
  observation: z.string().nullable().optional(),
});

export type CreateCommissionPaymentInput = z.infer<typeof createPaymentSchema>;

export class CommissionPaymentZodValidator {
  private constructor() {}

  static create(): CommissionPaymentZodValidator {
    return new CommissionPaymentZodValidator();
  }

  validate(input: CreateCommissionPaymentInput): CreateCommissionPaymentInput {
    try {
      return createPaymentSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating commission payment: ${msg}`,
          externalMessage: msg,
          context: CommissionPaymentZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating commission payment: ${err.message}`,
        externalMessage: 'Houve um erro ao validar o pagamento de comissão',
        context: CommissionPaymentZodValidator.name,
      });
    }
  }
}
