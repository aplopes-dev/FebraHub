import type { CommissionRule } from '../../../rules/domain/entities/commission-rule.entity';

/** Calcula comissão de aprovação de orçamento sobre `finalValueCents`. */
export function calculateBudgetApprovedCommissionCents(
  rule: CommissionRule,
  finalValueCents: number,
): number {
  if (finalValueCents <= 0) return 0;
  if (rule.paymentTrigger !== 'budget_approved') return 0;

  if (rule.commissionType === 'percentage') {
    const pct = rule.percentageValue ?? 0;
    return Math.max(0, Math.round((finalValueCents * pct) / 100));
  }

  return Math.max(0, rule.commissionValueCents ?? 0);
}

export function pickBudgetApprovedRule(
  rules: CommissionRule[],
): CommissionRule | null {
  return rules.find((rule) => rule.paymentTrigger === 'budget_approved') ?? null;
}
