import type { CommissionRule } from '../../../rules/domain/entities/commission-rule.entity';
import {
  matchPlanSpecialtyTreatmentRule,
  type DebitReceivedLineItem,
} from './debit-received-commission.math';

export type TreatmentCompletedLineItem = Pick<
  DebitReceivedLineItem,
  | 'professionalId'
  | 'professionalName'
  | 'planId'
  | 'planName'
  | 'treatmentId'
  | 'treatmentName'
  | 'specialtyId'
  | 'specialtyName'
  | 'itemValueCents'
  | 'treatmentCostCents'
>;

export function matchTreatmentCompletedRule(
  rules: CommissionRule[],
  item: TreatmentCompletedLineItem,
  specialtyNameById: ReadonlyMap<string, string> = new Map(),
): CommissionRule | null {
  return matchPlanSpecialtyTreatmentRule(
    'treatment_completed',
    rules,
    item,
    specialtyNameById,
  );
}

/** Comissão sobre o valor cheio do tratamento (sem rateio de pagamento). */
export function calculateTreatmentCompletedCommissionCents(
  rule: CommissionRule,
  item: TreatmentCompletedLineItem,
): number {
  if (item.itemValueCents <= 0) return 0;

  if (rule.commissionType === 'percentage') {
    const pct = rule.percentageValue ?? 0;
    return Math.max(0, Math.round((item.itemValueCents * pct) / 100));
  }

  const treatmentRule = rule.treatments.find(
    (t) => t.treatmentId === item.treatmentId,
  );
  if (!treatmentRule) return 0;
  return Math.max(0, treatmentRule.amountCents);
}
