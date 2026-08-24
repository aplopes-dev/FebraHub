import { describe, expect, it } from 'vitest';
import type { ClinicSettingsFormData } from '@/features/clinic/modules/settings/types/clinic-settings';
import type { PatientBudget } from '../types/patient-budget';
import {
  buildPatientBudgetPdf,
  buildPatientBudgetPdfFileName,
  mapClinicSettingsToBudgetPdfClinic,
} from './build-patient-budget-pdf';

function mockBudget(): PatientBudget {
  return {
    id: 'budget-1',
    patientId: 'patient-1',
    description: 'Plano de Procedimento de Maria',
    date: '2026-07-01',
    status: 'draft',
    responsible: 'Dr. Ana',
    observations: '',
    discount: { enabled: false, type: 'fixed', value: '' },
    installment: {
      enabled: false,
      downPayment: '',
      installmentsCount: '',
    },
    treatments: [
      {
        id: 'item-1',
        treatmentId: 'treatment-1',
        treatmentName: 'Limpeza',
        professionalId: 'prof-1',
        professionalName: 'Dr. Ana',
        planId: 'plan-1',
        planName: 'Particular',
        toothNumber: '11',
        valueCents: 15000,
      },
    ],
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

describe('mapClinicSettingsToBudgetPdfClinic', () => {
  it('maps logo, cnpj and phone fields for the PDF header', () => {
    const mapped = mapClinicSettingsToBudgetPdfClinic({
      ...mockClinicProfile(),
      logoUrl: '/api/proxy/clinica/v1/clinic-profile/logo?storeId=store-1',
    });

    expect(mapped.clinicName).toBe('Clínica Sorriso');
    expect(mapped.cnpj).toBe('12345678000199');
    expect(mapped.phone).toBe('7336211234');
    expect(mapped.mobile).toBe('73999887766');
    expect(mapped.logoUrl).toBe('/api/proxy/clinica/v1/clinic-profile/logo?storeId=store-1');
    expect(mapped.addressLine).toContain('Ilhéus');
  });
});

describe('buildPatientBudgetPdf', () => {
  it('generates a non-empty PDF blob with clinic details', async () => {
    const blob = await buildPatientBudgetPdf({
      budget: mockBudget(),
      patientName: 'Maria Silva',
      clinic: mapClinicSettingsToBudgetPdfClinic(mockClinicProfile()),
    });

    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });
});

describe('buildPatientBudgetPdfFileName', () => {
  it('builds a slugged file name with date', () => {
    expect(
      buildPatientBudgetPdfFileName(
        'Maria Silva',
        'Plano de Procedimento de Maria',
        '2026-07-01',
      ),
    ).toBe('orcamento-maria-silva-plano-de-procedimento-de-maria-2026-07-01.pdf');
  });
});
