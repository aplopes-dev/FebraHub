import { describe, expect, it } from 'vitest';
import { buildPatientCertificatePdf } from './build-patient-certificate-pdf';

const profile = {
  councilType: 'CRM' as const,
  councilNumber: '12345',
  councilUf: 'BA',
  displayName: 'Dr. Ana',
};

const patientAddress = {
  zipCode: '45654000',
  street: 'Rua das Flores',
  streetNumber: '100',
  complement: 'Sala 2',
  neighborhood: 'Centro',
  city: 'Ilhéus',
  state: 'BA',
};

describe('buildPatientCertificatePdf', () => {
  it('generates a PDF blob for days certificate', async () => {
    const blob = await buildPatientCertificatePdf({
      patientName: 'Maria Silva',
      patientCpf: '12345678901',
      patientAddress,
      clinicName: 'Clínica Teste',
      professionalName: 'Dr. Ana',
      professionalProfile: profile,
      type: 'days',
      issuedDate: '2026-07-01',
      daysCount: '3',
      startTime: '',
      endTime: '',
      cid: 'J00',
    });

    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('generates a PDF blob for attendance certificate', async () => {
    const blob = await buildPatientCertificatePdf({
      patientName: 'Maria Silva',
      patientCpf: '12345678901',
      patientAddress,
      clinicName: 'Clínica Teste',
      professionalName: 'Dr. Ana',
      professionalProfile: profile,
      type: 'attendance',
      issuedDate: '2026-07-01',
      daysCount: '',
      startTime: '09:00',
      endTime: '10:30',
      cid: '',
    });

    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });
});
