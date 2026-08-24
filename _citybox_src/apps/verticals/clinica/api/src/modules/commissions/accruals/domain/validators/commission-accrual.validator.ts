import { z } from 'zod';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../../shared/core/utils/zod-utils';

const createAccrualSchema = z.object({
  memberId: z.string().uuid(),
  memberName: z.string().min(1),
  ruleId: z.string().uuid().nullable().optional(),
  paymentTrigger: z.enum([
    'treatment_completed',
    'debit_received',
    'budget_approved',
  ]),
  planName: z.string().optional(),
  specialtyName: z.string().optional(),
  treatmentName: z.string().min(1),
  patientName: z.string().min(1),
  paidValueCents: z.number().int().min(0),
  treatmentCostCents: z.number().int().min(0),
  installment: z.string().nullable().optional(),
  commissionCents: z.number().int().min(0),
  accruedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sourceFinancialEntryId: z.string().uuid().nullable().optional(),
  sourceBudgetId: z.string().uuid().nullable().optional(),
  sourcePatientTreatmentId: z.string().uuid().nullable().optional(),
});

export type CreateCommissionAccrualInput = z.infer<typeof createAccrualSchema>;

export class CommissionAccrualZodValidator {
  private constructor() {}

  static create(): CommissionAccrualZodValidator {
    return new CommissionAccrualZodValidator();
  }

  validate(input: CreateCommissionAccrualInput): CreateCommissionAccrualInput {
    try {
      return createAccrualSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating commission accrual: ${msg}`,
          externalMessage: msg,
          context: CommissionAccrualZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating commission accrual: ${err.message}`,
        externalMessage: 'Houve um erro ao validar o lançamento de comissão',
        context: CommissionAccrualZodValidator.name,
      });
    }
  }
}
