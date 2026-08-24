import { describe, expect, it } from 'vitest';
import type { PatientTreatment } from '../types/patient-treatment';
import { applyBudgetTreatmentEdits } from './apply-budget-treatment-edits';

function mockBudgetTreatment(id: string): PatientTreatment {
  return {
    id,
    patientId: 'pat-001',
    source: 'budget',
    status: 'active',
    description: 'Limpeza',
    valueCents: 10000,
  };
}

describe('applyBudgetTreatmentEdits', () => {
  it('returns treatments unchanged when there are no edits', () => {
    const treatments = [mockBudgetTreatment('a'), mockBudgetTreatment('b')];

    expect(applyBudgetTreatmentEdits(treatments, {})).toEqual(treatments);
  });

  it('applies diagnosis and observation only to budget treatments', () => {
    const treatments = [
      mockBudgetTreatment('a'),
      {
        ...mockBudgetTreatment('b'),
        source: 'standalone' as const,
      },
    ];

    const result = applyBudgetTreatmentEdits(treatments, {
      a: { diagnosis: 'Cárie', observation: 'Retorno em 7 dias' },
      b: { diagnosis: 'Ignorado', observation: 'Ignorado' },
    });

    expect(result[0]).toMatchObject({
      diagnosis: 'Cárie',
      observation: 'Retorno em 7 dias',
    });
    expect(result[1]).not.toHaveProperty('diagnosis');
  });
});
