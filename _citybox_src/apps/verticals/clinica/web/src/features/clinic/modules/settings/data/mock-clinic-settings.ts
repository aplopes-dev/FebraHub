import type { ClinicSettingsFormData } from '../types/clinic-settings';

export const MOCK_CLINIC_SETTINGS: ClinicSettingsFormData = {
  clinicName: '',
  cnpj: '',
  communicationsName: '',
  responsible: '',
  logoUrl: undefined,
  openingTime: '08:00',
  closingTime: '18:00',
  email: '',
  phone: '',
  mobile: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

export function createInitialClinicSettings(storeName?: string): ClinicSettingsFormData {
  return {
    ...MOCK_CLINIC_SETTINGS,
    clinicName: storeName ?? '',
  };
}
