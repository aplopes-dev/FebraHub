const CNPJ_LENGTH = 14;

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatCnpj(value: string): string {
  const digits = digitsOnly(value).slice(0, CNPJ_LENGTH);

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

function hasRepeatedDigits(digits: string): boolean {
  return /^(\d)\1+$/.test(digits);
}

function isValidCnpjDigits(digits: string): boolean {
  if (digits.length !== CNPJ_LENGTH || hasRepeatedDigits(digits)) {
    return false;
  }

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    sum += Number(digits[i]) * weights1[i]!;
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== Number(digits[12])) return false;

  sum = 0;
  for (let i = 0; i < 13; i += 1) {
    sum += Number(digits[i]) * weights2[i]!;
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  return digit2 === Number(digits[13]);
}

export function isValidCnpj(value: string): boolean {
  return isValidCnpjDigits(digitsOnly(value));
}

export function normalizeCnpjDigits(value: string): string {
  return digitsOnly(value).slice(0, CNPJ_LENGTH);
}

export function formatCnpjDisplay(value: string): string {
  const digits = normalizeCnpjDigits(value);
  if (digits.length !== CNPJ_LENGTH) return formatCnpj(value);
  return formatCnpj(digits);
}
