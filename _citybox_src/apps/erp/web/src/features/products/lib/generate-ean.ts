/**
 * Calcula o dígito verificador EAN (GS1) para o corpo sem o check digit.
 * Posições 1-indexed da esquerda: ímpar ×1, par ×3.
 */
function computeEanCheckDigit(body: string): string {
  let sum = 0;
  for (let index = 0; index < body.length; index += 1) {
    const digit = Number(body[index]);
    const position = index + 1;
    sum += position % 2 === 0 ? digit * 3 : digit;
  }
  return String((10 - (sum % 10)) % 10);
}

function randomDigits(length: number): string {
  let result = "";
  for (let index = 0; index < length; index += 1) {
    result += String(Math.floor(Math.random() * 10));
  }
  return result;
}

/** Gera um EAN-13 válido (12 dígitos + check digit). */
export function generateEan13(): string {
  const body = randomDigits(12);
  return `${body}${computeEanCheckDigit(body)}`;
}

/** Gera um EAN-8 válido (7 dígitos + check digit). */
export function generateEan8(): string {
  const body = randomDigits(7);
  return `${body}${computeEanCheckDigit(body)}`;
}
