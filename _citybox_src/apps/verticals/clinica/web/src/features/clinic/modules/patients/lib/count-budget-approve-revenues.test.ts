import { describe, expect, it } from 'vitest';
import { countBudgetApproveRevenues } from './count-budget-approve-revenues';
import { EMPTY_PATIENT_BUDGET_INSTALLMENT } from '../types/patient-budget-form';

describe('countBudgetApproveRevenues', () => {
  it('counts one revenue per treatment when installment is off', () => {
    expect(
      countBudgetApproveRevenues({
        treatmentsCount: 3,
        installment: EMPTY_PATIENT_BUDGET_INSTALLMENT,
      }),
    ).toBe(3);
  });

  it('counts down payment plus installments when installment is on', () => {
    expect(
      countBudgetApproveRevenues({
        treatmentsCount: 3,
        installment: {
          enabled: true,
          downPayment: 'R$ 100,00',
          installmentsCount: '4',
        },
      }),
    ).toBe(5);
  });

  it('omits down payment line when entrada is zero', () => {
    expect(
      countBudgetApproveRevenues({
        treatmentsCount: 2,
        installment: {
          enabled: true,
          downPayment: 'R$ 0,00',
          installmentsCount: '3',
        },
      }),
    ).toBe(3);
  });
});
