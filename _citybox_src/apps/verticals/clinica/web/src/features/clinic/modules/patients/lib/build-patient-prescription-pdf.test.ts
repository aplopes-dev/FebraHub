import { describe, expect, it } from 'vitest';
import { buildPatientPrescriptionPdf } from './build-patient-prescription-pdf';
import type { PrescriptionItem } from '../types/patient-prescription';

const items: PrescriptionItem[] = [
  {
    id: 'item-1',
    name: 'Dipirona 500mg',
    quantity: '1',
    measure: 'Caixa',
    posology: '1 comprimido a cada 8 horas',
    notes: '',
  },
];

describe('buildPatientPrescriptionPdf', () => {
  it('generates a non-empty PDF blob', async () => {
    const blob = await buildPatientPrescriptionPdf({
      patientName: 'Maria Silva',
      clinicName: 'Clínica Teste',
      professionalName: 'Dr. Ana',
      professionalProfile: {
        councilType: 'CRM',
        councilNumber: '12345',
        councilUf: 'BA',
        displayName: 'Dr. Ana',
      },
      issuedDate: '2026-07-01',
      items,
    });

    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });
});
