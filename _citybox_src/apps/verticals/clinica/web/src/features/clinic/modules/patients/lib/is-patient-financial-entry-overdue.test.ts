import { describe, expect, it } from 'vitest';
import type { PatientFinancialEntry } from '../types/patient-financial-entry';
import { isPatientFinancialEntryOverdue } from './is-patient-financial-entry-overdue';

const referenceDate = new Date('2026-07-01T12:00:00');

function entry(
  partial: Pick<PatientFinancialEntry, 'date' | 'status'>,
): PatientFinancialEntry {
  return {
    id: 'fin-test',
    patientId: 'pat-001',
    name: 'Teste',
    valueCents: 1000,
    ...partial,
  };
}

describe('isPatientFinancialEntryOverdue', () => {
  it('marca pendente com vencimento hoje', () => {
    expect(
      isPatientFinancialEntryOverdue(entry({ date: '2026-07-01', status: 'pending' }), referenceDate),
    ).toBe(true);
  });

  it('marca pendente com vencimento passado', () => {
    expect(
      isPatientFinancialEntryOverdue(entry({ date: '2026-06-30', status: 'pending' }), referenceDate),
    ).toBe(true);
  });

  it('não marca pendente com vencimento futuro', () => {
    expect(
      isPatientFinancialEntryOverdue(entry({ date: '2026-07-02', status: 'pending' }), referenceDate),
    ).toBe(false);
  });

  it('não marca recebido mesmo com vencimento passado', () => {
    expect(
      isPatientFinancialEntryOverdue(entry({ date: '2026-06-01', status: 'received' }), referenceDate),
    ).toBe(false);
  });
});
