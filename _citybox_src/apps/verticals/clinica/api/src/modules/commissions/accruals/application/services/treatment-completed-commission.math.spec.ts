import { CommissionRule } from '../../../rules/domain/entities/commission-rule.entity';
import {
  calculateTreatmentCompletedCommissionCents,
  matchTreatmentCompletedRule,
  type TreatmentCompletedLineItem,
} from './treatment-completed-commission.math';

const STORE = 'store-1';
const MEMBER = 'member-1';

function item(
  overrides: Partial<TreatmentCompletedLineItem> = {},
): TreatmentCompletedLineItem {
  return {
    professionalId: MEMBER,
    professionalName: 'Dra. Ana',
    planId: 'plan-1',
    planName: 'Particular',
    treatmentId: 'tx-1',
    treatmentName: 'Extração 15',
    specialtyId: 'spec-1',
    specialtyName: 'Cirurgia',
    itemValueCents: 10_000,
    treatmentCostCents: 2000,
    ...overrides,
  };
}

function rule(
  overrides: Partial<{
    commissionType: 'percentage' | 'fixed_value';
    percentageValue: number | null;
    treatments: Array<{
      treatmentId: string;
      amountCents: number;
      treatmentValueCents: number;
    }>;
    planId: string | null;
    specialtyId: string | null;
  }> = {},
): CommissionRule {
  return CommissionRule.create({
    storeId: STORE,
    memberId: MEMBER,
    memberName: 'Dra. Ana',
    paymentTrigger: 'treatment_completed',
    commissionType: overrides.commissionType ?? 'percentage',
    percentageValue:
      overrides.percentageValue === undefined ? 20 : overrides.percentageValue,
    commissionValueCents: null,
    allowValueExceedsTreatment: false,
    planId: overrides.planId === undefined ? 'plan-1' : overrides.planId,
    specialtyId:
      overrides.specialtyId === undefined ? 'spec-1' : overrides.specialtyId,
    treatments: overrides.treatments ?? [],
  });
}

describe('treatment-completed-commission.math', () => {
  it('matches percentage rule by plan and specialty', () => {
    expect(matchTreatmentCompletedRule([rule()], item())?.commissionType).toBe(
      'percentage',
    );
    expect(
      matchTreatmentCompletedRule(
        [rule({ planId: 'other' })],
        item(),
      ),
    ).toBeNull();
  });

  it('prefers fixed_value with explicit treatment over percentage', () => {
    const pct = rule({ commissionType: 'percentage' });
    const fixed = rule({
      commissionType: 'fixed_value',
      percentageValue: null,
      treatments: [
        {
          treatmentId: 'tx-1',
          amountCents: 1300,
          treatmentValueCents: 10_000,
        },
      ],
    });
    expect(matchTreatmentCompletedRule([pct, fixed], item())?.id).toBe(
      fixed.id,
    );
  });

  it('calculates percentage on full treatment value', () => {
    expect(
      calculateTreatmentCompletedCommissionCents(rule(), item()),
    ).toBe(2000);
  });

  it('uses fixed amount without prorate', () => {
    const fixed = rule({
      commissionType: 'fixed_value',
      percentageValue: null,
      treatments: [
        {
          treatmentId: 'tx-1',
          amountCents: 1300,
          treatmentValueCents: 10_000,
        },
      ],
    });
    expect(calculateTreatmentCompletedCommissionCents(fixed, item())).toBe(
      1300,
    );
  });
});
