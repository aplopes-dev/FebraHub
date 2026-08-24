import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import {
  CommissionRule,
  type CommissionRuleTreatmentProps,
} from '../../../domain/entities/commission-rule.entity';
import { CommissionRuleRepository } from '../../../domain/repositories/commission-rule.repository.interface';
import { CommissionBudgetApprovedDuplicateError } from '../../../domain/errors/commission-budget-approved-duplicate.error';
import { CommissionFixedValueExceedsTreatmentError } from '../../../domain/errors/commission-fixed-value-exceeds-treatment.error';
import {
  CommissionRuleZodValidator,
  parseMemberId,
} from '../../../domain/validators/commission-rule.validator';
import type {
  CommissionRuleInputDto,
  ReplaceCommissionRulesDto,
} from '../../dtos/commission-rule.dto';

function ruleIdentityKey(rule: CommissionRuleInputDto): string {
  if (rule.paymentTrigger === 'budget_approved') {
    return 'budget_approved';
  }
  return [
    rule.paymentTrigger,
    rule.commissionType,
    rule.planId ?? '',
    rule.specialtyId ?? '',
  ].join('|');
}

/** Última regra com a mesma identidade prevalece (sobrescreve, não duplica). */
function dedupeRulesByIdentity(
  rules: CommissionRuleInputDto[],
): CommissionRuleInputDto[] {
  const byKey = new Map<string, CommissionRuleInputDto>();
  const order: string[] = [];
  for (const rule of rules) {
    const key = ruleIdentityKey(rule);
    if (!byKey.has(key)) order.push(key);
    byKey.set(key, rule);
  }
  return order.map((key) => byKey.get(key)!);
}

@Injectable()
export class ReplaceCommissionRulesUseCase
  implements IUseCase<ReplaceCommissionRulesDto, CommissionRule[]>
{
  private readonly validator = CommissionRuleZodValidator.create();

  constructor(private readonly ruleRepository: CommissionRuleRepository) {}

  async execute(dto: ReplaceCommissionRulesDto): Promise<CommissionRule[]> {
    const memberId = parseMemberId(dto.memberId);
    const validated = this.validator.validate({
      memberName: dto.memberName,
      rules: dto.rules,
    });

    const budgetApprovedCount = validated.rules.filter(
      (rule) => rule.paymentTrigger === 'budget_approved',
    ).length;
    if (budgetApprovedCount > 1) {
      throw new CommissionBudgetApprovedDuplicateError(
        ReplaceCommissionRulesUseCase.name,
        memberId,
      );
    }

    const dedupedRules = dedupeRulesByIdentity(validated.rules);

    const entities = dedupedRules.map((rule) =>
      this.buildRule(dto.storeId, memberId, validated.memberName.trim(), rule),
    );

    return this.ruleRepository.replaceAll(
      dto.storeId,
      memberId,
      validated.memberName.trim(),
      entities,
    );
  }

  private buildRule(
    storeId: string,
    memberId: string,
    memberName: string,
    rule: CommissionRuleInputDto,
  ): CommissionRule {
    const isBudgetApproved = rule.paymentTrigger === 'budget_approved';
    const planId = isBudgetApproved ? null : rule.planId ?? null;
    const specialtyId = isBudgetApproved ? null : rule.specialtyId ?? null;
    const allowValueExceedsTreatment = rule.allowValueExceedsTreatment ?? false;
    const treatments: CommissionRuleTreatmentProps[] = isBudgetApproved
      ? []
      : (rule.treatments ?? []).map((treatment) => ({
          treatmentId: treatment.treatmentId,
          amountCents: treatment.amountCents,
          treatmentValueCents: treatment.treatmentValueCents,
        }));

    if (rule.commissionType === 'fixed_value' && !allowValueExceedsTreatment) {
      for (const treatment of treatments) {
        if (treatment.amountCents > treatment.treatmentValueCents) {
          throw new CommissionFixedValueExceedsTreatmentError(
            ReplaceCommissionRulesUseCase.name,
            treatment.treatmentId,
          );
        }
      }
    }

    return CommissionRule.create({
      storeId,
      memberId,
      memberName,
      paymentTrigger: rule.paymentTrigger,
      commissionType: rule.commissionType,
      percentageValue: rule.percentageValue ?? null,
      commissionValueCents: rule.commissionValueCents ?? null,
      allowValueExceedsTreatment,
      planId,
      specialtyId,
      treatments,
    });
  }
}
