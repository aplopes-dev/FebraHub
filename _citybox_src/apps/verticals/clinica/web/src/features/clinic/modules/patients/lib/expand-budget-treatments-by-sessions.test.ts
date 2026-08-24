import { describe, expect, it } from 'vitest';
import type { PatientBudgetTreatmentItem } from '../types/patient-budget-form';
import {
  expandBudgetTreatmentsBySessions,
  formatBudgetTreatmentListName,
} from './expand-budget-treatments-by-sessions';

function baseItem(
  overrides: Partial<PatientBudgetTreatmentItem> = {},
): PatientBudgetTreatmentItem {
  return {
    id: 'base-1',
    toothNumber: 0,
    locationType: 'none',
    locationLabel: '',
    treatmentId: 't1',
    treatmentName: 'RPG',
    professionalId: 'p1',
    professionalName: 'Ana',
    planId: 'plan1',
    planName: 'Particular',
    valueCents: 20_000,
    sessionIndex: null,
    sessionTotal: null,
    ...overrides,
  };
}

describe('expandBudgetTreatmentsBySessions', () => {
  it('com 1 sessão gera uma linha sem sessionIndex/Total', () => {
    const result = expandBudgetTreatmentsBySessions([baseItem()], 1);
    expect(result).toHaveLength(1);
    expect(result[0]?.sessionIndex).toBeNull();
    expect(result[0]?.sessionTotal).toBeNull();
    expect(result[0]?.valueCents).toBe(20_000);
    expect(formatBudgetTreatmentListName(result[0]!)).toBe('RPG');
  });

  it('com N≥2 gera N linhas com 1/N … N/N e mesmo valor unitário', () => {
    const result = expandBudgetTreatmentsBySessions([baseItem()], 5);
    expect(result).toHaveLength(5);
    expect(result.map((item) => item.sessionIndex)).toEqual([1, 2, 3, 4, 5]);
    expect(result.every((item) => item.sessionTotal === 5)).toBe(true);
    expect(result.every((item) => item.valueCents === 20_000)).toBe(true);
    expect(formatBudgetTreatmentListName(result[0]!)).toBe('RPG - 1/5');
    expect(formatBudgetTreatmentListName(result[4]!)).toBe('RPG - 5/5');
    expect(result.reduce((sum, item) => sum + item.valueCents, 0)).toBe(100_000);
  });

  it('expande cada linha-base independentemente', () => {
    const result = expandBudgetTreatmentsBySessions(
      [baseItem({ id: 'a', treatmentName: 'A' }), baseItem({ id: 'b', treatmentName: 'B' })],
      2,
    );
    expect(result).toHaveLength(4);
    expect(formatBudgetTreatmentListName(result[0]!)).toBe('A - 1/2');
    expect(formatBudgetTreatmentListName(result[1]!)).toBe('A - 2/2');
    expect(formatBudgetTreatmentListName(result[2]!)).toBe('B - 1/2');
    expect(formatBudgetTreatmentListName(result[3]!)).toBe('B - 2/2');
  });
});

describe('formatBudgetTreatmentListName', () => {
  it('não sufixa 1/1 nem total null', () => {
    expect(
      formatBudgetTreatmentListName({
        treatmentName: 'Pilates',
        sessionIndex: 1,
        sessionTotal: 1,
      }),
    ).toBe('Pilates');
    expect(
      formatBudgetTreatmentListName({
        treatmentName: 'Pilates',
        sessionIndex: null,
        sessionTotal: null,
      }),
    ).toBe('Pilates');
  });
});
