import { describe, expect, it } from 'vitest';
import type { PatientTreatment } from '../types/patient-treatment';
import {
  applyPatientTreatmentOrder,
  mergeReorderedPatientTreatmentIds,
} from './reorder-patient-treatments';

function mockTreatment(id: string): PatientTreatment {
  return {
    id,
    patientId: 'pat-001',
    source: 'budget',
    status: 'active',
    description: `Tratamento ${id}`,
    valueCents: 10000,
  };
}

describe('applyPatientTreatmentOrder', () => {
  it('returns treatments unchanged when order is empty', () => {
    const treatments = [mockTreatment('a'), mockTreatment('b')];

    expect(applyPatientTreatmentOrder(treatments, [])).toEqual(treatments);
  });

  it('orders known ids and appends unknown ids at the end', () => {
    const treatments = [
      mockTreatment('a'),
      mockTreatment('b'),
      mockTreatment('c'),
      mockTreatment('d'),
    ];

    const result = applyPatientTreatmentOrder(treatments, ['c', 'a']);

    expect(result.map((item) => item.id)).toEqual(['c', 'a', 'b', 'd']);
  });
});

describe('mergeReorderedPatientTreatmentIds', () => {
  it('replaces a contiguous block with the new page order', () => {
    const allTreatmentIds = ['a', 'b', 'c', 'd', 'e'];
    const currentOrder = ['a', 'b', 'c', 'd', 'e'];
    const reorderedIds = ['b', 'a', 'c'];

    expect(
      mergeReorderedPatientTreatmentIds(currentOrder, allTreatmentIds, reorderedIds),
    ).toEqual(['b', 'a', 'c', 'd', 'e']);
  });

  it('uses allTreatmentIds when current order is empty', () => {
    const allTreatmentIds = ['a', 'b', 'c'];
    const reorderedIds = ['c', 'a', 'b'];

    expect(mergeReorderedPatientTreatmentIds([], allTreatmentIds, reorderedIds)).toEqual(
      reorderedIds,
    );
  });
});
