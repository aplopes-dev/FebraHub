export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function hasRepeatedDigits(digits: string): boolean {
  return /^(\d)\1+$/.test(digits);
}

function isValidCpfDigits(digits: string): boolean {
  if (digits.length !== 11 || hasRepeatedDigits(digits)) {
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
  return isValidCpfDigits(onlyDigits(value));
}

export function normalizeCpf(value: string): string {
  return onlyDigits(value);
}
