import { describe, expect, it } from 'vitest';
import type { PatientTreatmentEvolution } from '../types/patient-treatment';
import {
  buildPatientEvolutionPdf,
  buildPatientEvolutionPdfFileName,
  mapClinicSettingsToEvolutionPdfClinic,
} from './build-patient-evolution-pdf';
import type { ClinicSettingsFormData } from '@/features/clinic/modules/settings/types/clinic-settings';

function mockEvolution(id: string, notes: string): PatientTreatmentEvolution {
  return {
    id,
    treatmentId: `treatment-${id}`,
    patientId: 'pat-001',
    source: 'budget',
    description: 'Limpeza',
    valueCents: 10000,
    finalizedAt: '2026-06-28T12:00:00.000Z',
    professionalName: 'Dr. Ana',
    evolutionNotes: notes,
    signatureStatus: 'unsigned',
  };
}

function mockClinicProfile(): ClinicSettingsFormData {
  return {
    clinicName: 'Clínica Sorriso',
    communicationsName: 'Sorriso Odontologia',
    cnpj: '12345678000199',
    responsible: 'Dr. Carlos',
    logoUrl: undefined,
    openingTime: '08:00',
    closingTime: '18:00',
    email: 'contato@sorriso.com',
    phone: '7336211234',
    mobile: '73999887766',
    cep: '45650000',
    street: 'Rua das Flores',
    number: '100',
    complement: '',
    neighborhood: 'Centro',
    city: 'Ilhéus',
    state: 'BA',
  };
}

describe('mapClinicSettingsToEvolutionPdfClinic', () => {
  it('maps clinic profile fields for the PDF header', () => {
    const mapped = mapClinicSettingsToEvolutionPdfClinic(mockClinicProfile());

    expect(mapped.clinicName).toBe('Clínica Sorriso');
    expect(mapped.cnpj).toBe('12345678000199');
    expect(mapped.phone).toBe('7336211234');
  });
});

describe('buildPatientEvolutionPdf', () => {
  it('generates a non-empty PDF blob for one evolution', async () => {
    const blob = await buildPatientEvolutionPdf({
      patientName: 'Maria Silva',
      evolutions: [mockEvolution('e-1', 'Evolução única')],
      clinic: mapClinicSettingsToEvolutionPdfClinic(mockClinicProfile()),
      issuedAt: new Date('2026-06-30T15:00:00.000Z'),
    });

    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('generates a larger PDF blob for multiple evolutions', async () => {
    const clinic = mapClinicSettingsToEvolutionPdfClinic(mockClinicProfile());
    const single = await buildPatientEvolutionPdf({
      patientName: 'Maria Silva',
      evolutions: [mockEvolution('e-1', 'Primeira')],
      clinic,
    });
    const multiple = await buildPatientEvolutionPdf({
      patientName: 'Maria Silva',
      evolutions: [
        mockEvolution('e-1', 'Primeira'),
        mockEvolution('e-2', 'Segunda evolução com mais conteúdo clínico.'),
      ],
      clinic,
    });

    expect(multiple.size).toBeGreaterThan(single.size);
  });
});

describe('buildPatientEvolutionPdfFileName', () => {
  it('builds a slugged file name with date', () => {
    expect(
      buildPatientEvolutionPdfFileName('Maria Silva', new Date('2026-06-30T12:00:00.000Z')),
    ).toBe('evolucao-maria-silva-2026-06-30.pdf');
  });
});
