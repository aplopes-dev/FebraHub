import { CommissionRule } from '../../../rules/domain/entities/commission-rule.entity';
import {
  calculateBudgetApprovedCommissionCents,
  pickBudgetApprovedRule,
} from './budget-approved-commission.math';

const STORE = 'store-1';
const MEMBER = 'member-1';

function rule(
  overrides: Partial<{
    commissionType: 'percentage' | 'fixed_value';
    percentageValue: number | null;
    commissionValueCents: number | null;
    paymentTrigger: 'budget_approved' | 'debit_received';
  }> = {},
): CommissionRule {
  return CommissionRule.create({
    storeId: STORE,
    memberId: MEMBER,
    memberName: 'Dra. Ana',
    paymentTrigger: overrides.paymentTrigger ?? 'budget_approved',
    commissionType: overrides.commissionType ?? 'percentage',
    percentageValue:
      overrides.percentageValue === undefined
        ? 15
        : overrides.percentageValue,
    commissionValueCents:
      overrides.commissionValueCents === undefined
        ? null
        : overrides.commissionValueCents,
    allowValueExceedsTreatment: false,
    planId: null,
    specialtyId: null,
    treatments: [],
  });
}

describe('budget-approved-commission.math', () => {
  it('calculates percentage on finalValueCents', () => {
    expect(calculateBudgetApprovedCommissionCents(rule(), 10_000)).toBe(1500);
  });

  it('uses fixed commissionValueCents', () => {
    expect(
      calculateBudgetApprovedCommissionCents(
        rule({
          commissionType: 'fixed_value',
          percentageValue: null,
          commissionValueCents: 2500,
        }),
        10_000,
      ),
    ).toBe(2500);
  });

  it('returns 0 for non-budget rules or non-positive base', () => {
    expect(
      calculateBudgetApprovedCommissionCents(
        rule({ paymentTrigger: 'debit_received' }),
        10_000,
      ),
    ).toBe(0);
    expect(calculateBudgetApprovedCommissionCents(rule(), 0)).toBe(0);
  });

  it('picks the budget_approved rule from a list', () => {
    const budget = rule();
    const other = rule({ paymentTrigger: 'debit_received' });
    expect(pickBudgetApprovedRule([other, budget])?.id).toBe(budget.id);
    expect(pickBudgetApprovedRule([other])).toBeNull();
  });
});
