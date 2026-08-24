import { describe, expect, it } from 'vitest';
import type { PatientTreatment } from '../types/patient-treatment';
import {
  filterBudgetTreatmentsForDisplay,
  paginateTreatments,
} from './filter-patient-treatments';

function mockTreatment(status: PatientTreatment['status'], id: string): PatientTreatment {
  return {
    id,
    patientId: 'pat-001',
    source: 'budget',
    status,
    description: 'Tratamento',
    valueCents: 10000,
  };
}

describe('filterBudgetTreatmentsForDisplay', () => {
  const treatments = [
    mockTreatment('active', 't-1'),
    mockTreatment('finalized', 't-2'),
    mockTreatment('active', 't-3'),
  ];

  it('hides finalized treatments when showFinalized is false', () => {
    const result = filterBudgetTreatmentsForDisplay(treatments, false);

    expect(result.map((item) => item.id)).toEqual(['t-1', 't-3']);
  });

  it('includes only finalized treatments when showFinalized is true', () => {
    const result = filterBudgetTreatmentsForDisplay(treatments, true);

    expect(result.map((item) => item.id)).toEqual(['t-2']);
  });

  it('treats nutrition initialized ids as finalized for the toggle', () => {
    const nutritionTreatments = [
      mockTreatment('active', 'open'),
      mockTreatment('active', 'initialized'),
      mockTreatment('finalized', 'done'),
    ];
    const concluded = new Set(['initialized']);

    expect(
      filterBudgetTreatmentsForDisplay(nutritionTreatments, false, concluded).map(
        (item) => item.id,
      ),
    ).toEqual(['open']);

    expect(
      filterBudgetTreatmentsForDisplay(nutritionTreatments, true, concluded).map(
        (item) => item.id,
      ),
    ).toEqual(['initialized', 'done']);
  });
});

describe('paginateTreatments', () => {
  const items = Array.from({ length: 12 }, (_, index) => index + 1);

  it('returns the requested page slice', () => {
    const result = paginateTreatments(items, 2, 5);

    expect(result.items).toEqual([6, 7, 8, 9, 10]);
    expect(result.total).toBe(12);
    expect(result.totalPages).toBe(3);
  });

  it('returns empty items when there is no data', () => {
    const result = paginateTreatments([], 1, 5);

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(1);
  });
});
