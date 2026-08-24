/**
 * Máscaras e formatação de campos (pt-BR) para o Beautiful Web.
 */

/** Retorna apenas os dígitos numéricos de uma string. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Formata telefone/WhatsApp BR: (00) 0000-0000 ou (00) 00000-0000.
 * Aceita apenas números no input e limita a 11 dígitos.
 */
export function formatPhoneBR(value: string): string {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Formata CEP BR: 00000-000.
 * Aceita apenas números no input e limita a 8 dígitos.
 */
export function formatCepBR(value: string): string {
  const digits = digitsOnly(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Máscara progressiva de moeda BRL em tempo de digitação (ex.: "4500" -> "45,00").
 */
export function maskCurrencyInput(raw: string): string {
  const digits = digitsOnly(raw);
  if (!digits) return '';
  const cents = Number.parseInt(digits, 10);
  const reais = cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(reais);
}

/** Converte string mascarada de moeda (ex.: "45,00") em valor numérico em reais (ex.: 45). */
export function parseCurrencyInput(raw: string): number {
  const digits = digitsOnly(raw);
  if (!digits) return 0;
  return Number.parseInt(digits, 10) / 100;
}

/** Formata valor numérico em reais para a string mascarada de input (ex.: 45 -> "45,00"). */
export function formatCurrencyInput(value: number): string {
  if (value === undefined || value === null || Number.isNaN(value) || value <= 0) return '';
  const cents = Math.round(value * 100);
  return maskCurrencyInput(String(cents));
}


