export function normalizeDigits(value: string): string {
  return value.replace(/\D/g, '');
}

const CPF_MAX_LENGTH = 11;
const PHONE_MAX_LENGTH = 11;

export function maskPatientCpf(value: string): string {
  const digits = normalizeDigits(value).slice(0, CPF_MAX_LENGTH);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function maskPatientPhone(value: string): string {
  const digits = normalizeDigits(value).slice(0, PHONE_MAX_LENGTH);

  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatPatientPhone(phone: string): string {
  const digits = normalizeDigits(phone);
  if (digits.length === 0) return phone;
  return maskPatientPhone(digits);
}

export function formatPatientCpf(cpf: string): string {
  const digits = normalizeDigits(cpf);
  if (digits.length === 0) return cpf;
  return maskPatientCpf(digits);
}

export function formatPatientHeaderContactLine(phone: string, cpf: string): string {
  const parts: string[] = [];

  if (normalizeDigits(phone).length > 0) {
    parts.push(formatPatientPhone(phone));
  }

  if (normalizeDigits(cpf).length > 0) {
    parts.push(`CPF: ${formatPatientCpf(cpf)}`);
  }

  return parts.join(' - ');
}

export function maskDigitsOnly(value: string, maxLength = 20): string {
  return normalizeDigits(value).slice(0, maxLength);
}

export function maskCpfCnpj(value: string): string {
  const digits = normalizeDigits(value).slice(0, 14);

  if (digits.length <= 11) {
    return maskPatientCpf(digits);
  }

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}
