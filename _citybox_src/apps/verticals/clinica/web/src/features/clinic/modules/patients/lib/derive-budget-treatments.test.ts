import { describe, expect, it } from 'vitest';
import { EMPTY_PATIENT_BUDGET_INSTALLMENT } from '../types/patient-budget-form';
import type { PatientBudget } from '../types/patient-budget';
import { deriveBudgetTreatments } from './derive-budget-treatments';
import { buildBudgetTreatmentId } from './patient-treatment-ui';

function mockBudget(overrides: Partial<PatientBudget> & Pick<PatientBudget, 'id' | 'status'>): PatientBudget {
  return {
    patientId: 'pat-001',
    date: '2026-06-01',
    description: 'Orçamento teste',
    finalValueCents: 10000,
    responsibleId: '',
    responsible: '',
    observations: '',
    discount: null,
    installment: EMPTY_PATIENT_BUDGET_INSTALLMENT,
    treatments: [
      {
        id: 'bt-1',
        toothNumber: 11,
        treatmentId: 'tr-1',
        treatmentName: 'Limpeza',
        professionalId: '',
        professionalName: '',
        planId: 'plan-1',
        planName: 'Plano',
        valueCents: 10000,
      },
    ],
    ...overrides,
  };
}

describe('deriveBudgetTreatments', () => {
  it('returns only approved budget treatment items', () => {
    const budgets = [
      mockBudget({ id: 'bud-approved', status: 'approved' }),
      mockBudget({ id: 'bud-draft', status: 'draft' }),
    ];

    const result = deriveBudgetTreatments(budgets, new Set());

    expect(result).toHaveLength(1);
    expect(result[0]?.budgetId).toBe('bud-approved');
    expect(result[0]?.source).toBe('budget');
    expect(result[0]?.status).toBe('active');
  });

  it('marks finalized treatments when id is in the set', () => {
    const budgets = [mockBudget({ id: 'bud-approved', status: 'approved' })];
    const finalizedId = buildBudgetTreatmentId('bud-approved', 'bt-1');

    const result = deriveBudgetTreatments(budgets, new Set([finalizedId]));

    expect(result[0]?.status).toBe('finalized');
    expect(result[0]?.id).toBe(finalizedId);
  });
});
