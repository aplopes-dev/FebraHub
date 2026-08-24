import { formatCnpj, isValidCnpj, digitsOnly } from '@/features/shared/fiscal/cnpj';

export { formatCnpj, isValidCnpj };

const CEP_LENGTH = 8;
const PHONE_MAX_LENGTH = 11;

export function formatCep(value: string): string {
  const digits = digitsOnly(value).slice(0, CEP_LENGTH);

  if (digits.length <= 5) return digits;

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function formatPhone(value: string): string {
  const digits = digitsOnly(value).slice(0, PHONE_MAX_LENGTH);

  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function isValidCep(value: string): boolean {
  const digits = digitsOnly(value);
  return digits.length === CEP_LENGTH;
}

export function isValidEmail(value: string): boolean {
  if (!value.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export type ClinicSettingsValidationErrors = Partial<
  Record<'cnpj' | 'email' | 'cep', string>
>;

export function validateClinicSettingsFields(values: {
  cnpj: string;
  email: string;
  cep: string;
}): ClinicSettingsValidationErrors {
  const errors: ClinicSettingsValidationErrors = {};

  if (values.cnpj.trim() && !isValidCnpj(values.cnpj)) {
    errors.cnpj = 'CNPJ inválido.';
  }

  if (!isValidEmail(values.email)) {
    errors.email = 'Informe um e-mail válido.';
  }

  if (values.cep.trim() && !isValidCep(values.cep)) {
    errors.cep = 'CEP deve ter 8 dígitos.';
  }

  return errors;
}
