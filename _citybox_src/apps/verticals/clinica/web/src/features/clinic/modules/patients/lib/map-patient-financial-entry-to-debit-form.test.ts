import { describe, expect, it } from 'vitest';
import {
  canEditPatientFinancialEntry,
  mapPatientFinancialEntryToDebitFormValues,
} from './map-patient-financial-entry-to-debit-form';
import { createEmptyPatientFinancialDebitTreatment } from '../types/patient-financial-debit-form';
import type { PatientFinancialEntry } from '../types/patient-financial-entry';

const editableEntry: PatientFinancialEntry = {
  id: 'fin-edit',
  patientId: 'pat-001',
  date: '2026-07-20',
  name: 'Limpeza e profilaxia de Maria Silva',
  valueCents: 22000,
  status: 'pending',
  debitDetail: {
    observations: 'Observação teste',
    treatments: [
      {
        ...createEmptyPatientFinancialDebitTreatment(),
        planId: 'plan-001',
        treatmentId: 'tr-002',
        treatmentName: 'Limpeza e profilaxia',
        value: 'R$ 220,00',
        professionalId: 'prof-001',
        toothNumber: 36,
      },
    ],
  },
};

describe('mapPatientFinancialEntryToDebitFormValues', () => {
  it('maps debit detail back to form values', () => {
    const formValues = mapPatientFinancialEntryToDebitFormValues(editableEntry, 'pat-001');

    expect(formValues).toMatchObject({
      patientId: 'pat-001',
      observations: 'Observação teste',
    });
    expect(formValues.dueDate).toEqual(new Date('2026-07-20T12:00:00'));
    expect(formValues.treatments[0]?.treatmentName).toBe('Limpeza e profilaxia');
  });

  it('maps installment without treatments using entry value', () => {
    const entry: PatientFinancialEntry = {
      id: 'fin-budget',
      patientId: 'pat-001',
      date: '2026-07-01',
      name: '1/3 — Aparelho ortodôntico fixo metálico',
      valueCents: 100000,
      status: 'pending',
    };

    const formValues = mapPatientFinancialEntryToDebitFormValues(entry, 'pat-001');
    expect(formValues.treatments).toEqual([]);
    expect(formValues.installmentValue).toContain('1.000,00');
  });
});

describe('canEditPatientFinancialEntry', () => {
  it('allows editing any pending debit', () => {
    expect(canEditPatientFinancialEntry(editableEntry)).toBe(true);
    expect(
      canEditPatientFinancialEntry({
        ...editableEntry,
        status: 'received',
        receivedAt: '2026-07-20',
      }),
    ).toBe(false);
    expect(
      canEditPatientFinancialEntry({
        id: 'fin-budget',
        patientId: 'pat-001',
        date: '2026-07-01',
        name: 'Entrada — Aparelho ortodôntico fixo metálico',
        valueCents: 150000,
        status: 'pending',
      }),
    ).toBe(true);
  });
});
