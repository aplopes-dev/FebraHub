import { describe, expect, it } from 'vitest';
import {
  addMonthsToLocalDate,
  buildBudgetApproveInstallmentSchedule,
  redistributeBudgetApproveInstallmentValues,
} from './budget-approve-installment-schedule';

describe('buildBudgetApproveInstallmentSchedule', () => {
  it('builds N rows with monthly due dates and exact sum', () => {
    const base = new Date(2026, 7, 20);
    const rows = buildBudgetApproveInstallmentSchedule({
      balanceCents: 10_000,
      installmentsCount: 3,
      baseDueDate: base,
    });

    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.index)).toEqual([1, 2, 3]);
    expect(rows.map((row) => row.valueCents)).toEqual([3333, 3333, 3334]);
    expect(rows[0]?.dueDate).toEqual(new Date(2026, 7, 20));
    expect(rows[1]?.dueDate).toEqual(new Date(2026, 8, 20));
    expect(rows[2]?.dueDate).toEqual(new Date(2026, 9, 20));
  });
});

describe('redistributeBudgetApproveInstallmentValues', () => {
  it('keeps total when increasing one installment', () => {
    expect(
      redistributeBudgetApproveInstallmentValues({
        valuesCents: [2500, 2500, 2500, 2500],
        changedIndex: 0,
        nextValueCents: 4000,
        totalCents: 10_000,
      }),
    ).toEqual([4000, 2000, 2000, 2000]);
  });

  it('keeps total when decreasing one installment', () => {
    expect(
      redistributeBudgetApproveInstallmentValues({
        valuesCents: [4000, 2000, 2000, 2000],
        changedIndex: 0,
        nextValueCents: 1000,
        totalCents: 10_000,
      }),
    ).toEqual([1000, 3000, 3000, 3000]);
  });

  it('forces single installment to the total', () => {
    expect(
      redistributeBudgetApproveInstallmentValues({
        valuesCents: [5000],
        changedIndex: 0,
        nextValueCents: 9999,
        totalCents: 5000,
      }),
    ).toEqual([5000]);
  });
});

describe('addMonthsToLocalDate', () => {
  it('clamps day for shorter months', () => {
    expect(addMonthsToLocalDate(new Date(2026, 0, 31), 1)).toEqual(
      new Date(2026, 1, 28),
    );
  });
});
