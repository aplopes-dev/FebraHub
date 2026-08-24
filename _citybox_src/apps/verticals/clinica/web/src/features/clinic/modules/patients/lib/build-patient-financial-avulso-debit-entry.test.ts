import { describe, expect, it } from 'vitest';
import {
  buildPatientFinancialAvulsoDebitEntry,
  buildPatientFinancialAvulsoDebitEntryName,
} from './build-patient-financial-avulso-debit-entry';
import {
  createEmptyPatientFinancialDebitTreatment,
  type PatientFinancialDebitFormValues,
} from '../types/patient-financial-debit-form';

describe('buildPatientFinancialAvulsoDebitEntryName', () => {
  it('combines treatment and patient names for avulso debits', () => {
    expect(
      buildPatientFinancialAvulsoDebitEntryName('Clareamento dental', 'Maria Silva'),
    ).toBe('Clareamento dental de Maria Silva');
  });
});

describe('buildPatientFinancialAvulsoDebitEntry', () => {
  it('uses the first treatment name when multiple treatments are present', () => {
    const values: PatientFinancialDebitFormValues = {
      patientId: 'pat-001',
      dueDate: new Date('2026-07-15T12:00:00'),
      observations: '',
      installmentValue: '',
      savedAttachments: [],
      attachments: [],
      treatments: [
        {
          ...createEmptyPatientFinancialDebitTreatment(),
          planId: 'plan-002',
          treatmentId: 'tr-004',
          treatmentName: 'Clareamento dental',
          value: 'R$ 890,00',
          professionalId: 'prof-001',
          toothNumber: 21,
        },
        {
          ...createEmptyPatientFinancialDebitTreatment(),
          planId: 'plan-001',
          treatmentId: 'tr-003',
          treatmentName: 'Restauração em resina',
          value: 'R$ 350,00',
          professionalId: 'prof-001',
          toothNumber: 16,
        },
      ],
    };

    const entry = buildPatientFinancialAvulsoDebitEntry(values, 'Maria Silva');

    expect(entry).toMatchObject({
      patientId: 'pat-001',
      date: '2026-07-15',
      name: 'Clareamento dental de Maria Silva',
      status: 'pending',
    });
    expect(entry?.valueCents).toBe(124000);
    expect(entry?.debitDetail?.treatments).toHaveLength(2);
    expect(entry?.debitDetail?.treatments[0]?.treatmentName).toBe('Clareamento dental');
  });
});
