import type { CommissionRule } from '../../../domain/entities/commission-rule.entity';

export function toCommissionRuleResponse(rule: CommissionRule) {
  return {
    id: rule.id,
    memberId: rule.memberId,
    memberName: rule.memberName,
    paymentTrigger: rule.paymentTrigger,
    commissionType: rule.commissionType,
    percentageValue: rule.percentageValue,
    commissionValueCents: rule.commissionValueCents,
    allowValueExceedsTreatment: rule.allowValueExceedsTreatment,
    planId: rule.planId,
    specialtyId: rule.specialtyId,
    treatments: rule.treatments.map((treatment) => ({
      treatmentId: treatment.treatmentId,
      amountCents: treatment.amountCents,
      treatmentValueCents: treatment.treatmentValueCents,
    })),
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  };
}

export class CommissionRulePresenter {
  static toHttp(rules: CommissionRule[]) {
    return { data: rules.map((rule) => toCommissionRuleResponse(rule)) };
  }
}
