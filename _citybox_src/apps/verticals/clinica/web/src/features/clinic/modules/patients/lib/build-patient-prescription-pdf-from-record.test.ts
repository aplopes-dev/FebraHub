import { describe, expect, it } from 'vitest';
import { buildPatientPrescriptionPdfFromRecord } from './build-patient-prescription-pdf-from-record';
import type { PatientPrescriptionRecord } from '../types/patient-prescription';

const prescription: PatientPrescriptionRecord = {
  id: 'rx-1',
  patientId: 'patient-1',
  patientName: 'Maria Silva',
  professionalId: 'prof-1',
  professionalName: 'Dr. Ana',
  councilType: 'CRO',
  councilNumber: '12345',
  councilUf: 'BA',
  clinicName: 'Clínica Teste',
  issuedDate: '2026-07-01',
  issuedAt: '2026-07-01T11:47:00.000Z',
  items: [
    {
      id: 'item-1',
      name: 'Dipirona 500mg',
      quantity: '1',
      measure: 'Caixa',
      posology: '1 comprimido a cada 8 horas',
      notes: '',
    },
  ],
};

describe('buildPatientPrescriptionPdfFromRecord', () => {
  it('generates a non-empty PDF blob from a stored record', async () => {
    const blob = await buildPatientPrescriptionPdfFromRecord(prescription);

    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });
});
