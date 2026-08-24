import { z } from 'zod';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../../shared/core/utils/zod-utils';
import { parseMemberId } from '../../../shared/domain/commission-member.utils';

export { parseMemberId };

const treatmentSchema = z.object({
  treatmentId: z.string().min(1),
  amountCents: z.number().int().min(0),
  treatmentValueCents: z.number().int().min(0),
});

const ruleSchema = z
  .object({
    paymentTrigger: z.enum([
      'treatment_completed',
      'debit_received',
      'budget_approved',
    ]),
    commissionType: z.enum(['percentage', 'fixed_value']),
    percentageValue: z.number().min(0).max(100).nullable().optional(),
    commissionValueCents: z.number().int().min(0).nullable().optional(),
    allowValueExceedsTreatment: z.boolean().optional(),
    planId: z.string().min(1).nullable().optional(),
    specialtyId: z.string().min(1).nullable().optional(),
    treatments: z.array(treatmentSchema).optional(),
  })
  .superRefine((rule, ctx) => {
    if (rule.commissionType === 'percentage' && rule.percentageValue == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'percentageValue é obrigatório para comissão percentual',
        path: ['percentageValue'],
      });
    }
    // Valor fixo em orçamento aprovado usa commissionValueCents global.
    // Valor fixo em tratamento concluído / débito recebido usa treatments[].amountCents.
    if (
      rule.commissionType === 'fixed_value' &&
      rule.paymentTrigger === 'budget_approved' &&
      rule.commissionValueCents == null
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'commissionValueCents é obrigatório para comissão de valor fixo',
        path: ['commissionValueCents'],
      });
    }
  });

const replaceRulesSchema = z.object({
  memberName: z.string().min(1),
  rules: z.array(ruleSchema),
});

export type CommissionRuleInput = z.infer<typeof ruleSchema>;
export type ReplaceCommissionRulesInput = z.infer<typeof replaceRulesSchema>;

export class CommissionRuleZodValidator {
  private constructor() {}

  static create(): CommissionRuleZodValidator {
    return new CommissionRuleZodValidator();
  }

  validate(input: ReplaceCommissionRulesInput): ReplaceCommissionRulesInput {
    try {
      return replaceRulesSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating commission rules: ${msg}`,
          externalMessage: msg,
          context: CommissionRuleZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating commission rules: ${err.message}`,
        externalMessage: 'Houve um erro ao validar as regras de comissão',
        context: CommissionRuleZodValidator.name,
      });
    }
  }
}
