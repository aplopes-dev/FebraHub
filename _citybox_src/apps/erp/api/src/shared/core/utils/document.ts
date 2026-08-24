/**
 * Validação de CPF e CNPJ (dígitos verificadores).
 *
 * Mantido local em vez de dependência: o algoritmo é fechado pela Receita e não
 * muda — não vale ampliar a superfície de supply chain por ~40 linhas estáveis.
 */

export const PERSON_TYPES = ['PF', 'PJ'] as const;
export type PersonTypeValue = (typeof PERSON_TYPES)[number];

const CPF_LENGTH = 11;
const CNPJ_LENGTH = 14;

/** Remove tudo que não for dígito. É a forma canônica de persistência. */
export function normalizeDocument(document: string): string {
  return document.replace(/\D/g, '');
}

/**
 * Dígito verificador por soma ponderada módulo 11 — mesma mecânica em CPF e
 * CNPJ, mudando só os pesos.
 */
function checkDigit(
  digits: readonly number[],
  weights: readonly number[],
): number {
  const sum = digits.reduce(
    (total, digit, index) => total + digit * weights[index],
    0,
  );
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function toDigits(value: string): number[] {
  return [...value].map(Number);
}

/** Sequências como 111.111.111-11 passam no módulo 11, mas são inválidas. */
function hasOnlyRepeatedDigits(value: string): boolean {
  return new Set(value).size === 1;
}

export function isValidCpf(document: string): boolean {
  const value = normalizeDocument(document);
  if (value.length !== CPF_LENGTH || hasOnlyRepeatedDigits(value)) return false;

  const digits = toDigits(value);
  const first = checkDigit(digits.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (first !== digits[9]) return false;

  const second = checkDigit(
    digits.slice(0, 10),
    [11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  return second === digits[10];
}

export function isValidCnpj(document: string): boolean {
  const value = normalizeDocument(document);
  if (value.length !== CNPJ_LENGTH || hasOnlyRepeatedDigits(value))
    return false;

  const digits = toDigits(value);
  const first = checkDigit(
    digits.slice(0, 12),
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  if (first !== digits[12]) return false;

  const second = checkDigit(
    digits.slice(0, 13),
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  return second === digits[13];
}

/** PF exige CPF válido; PJ exige CNPJ válido. */
export function isValidDocument(
  personType: PersonTypeValue,
  document: string,
): boolean {
  return personType === 'PF' ? isValidCpf(document) : isValidCnpj(document);
}
