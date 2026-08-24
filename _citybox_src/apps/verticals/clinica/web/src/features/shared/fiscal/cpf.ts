const CPF_LENGTH = 11;

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatCpf(value: string): string {
  const digits = digitsOnly(value).slice(0, CPF_LENGTH);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function hasRepeatedDigits(digits: string): boolean {
  return /^(\d)\1+$/.test(digits);
}

function isValidCpfDigits(digits: string): boolean {
  if (digits.length !== CPF_LENGTH || hasRepeatedDigits(digits)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== Number(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === Number(digits[10]);
}

export function isValidCpf(value: string): boolean {
  return isValidCpfDigits(digitsOnly(value));
}

export function normalizeCpfDigits(value: string): string {
  return digitsOnly(value).slice(0, CPF_LENGTH);
}

export function formatCpfDisplay(value: string): string {
  const digits = normalizeCpfDigits(value);
  if (digits.length !== CPF_LENGTH) return formatCpf(value);
  return formatCpf(digits);
}
