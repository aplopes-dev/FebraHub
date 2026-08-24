/** Máscaras de campos do formulário de imóveis (pt-BR). */

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatIntegerBR(digits: string): string {
  if (!digits) return '';
  const normalized = digits.replace(/^0+(?=\d)/, '') || '0';
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Digitação de custo único → "R$ 1.560.400" */
export function maskCostInput(raw: string): string {
  const digits = digitsOnly(raw).slice(0, 12);
  if (!digits) return '';
  return `R$ ${formatIntegerBR(digits)}`;
}

export function parseCostInput(raw: string): number {
  const digits = digitsOnly(raw);
  if (!digits) return 0;
  return Number(digits);
}

export function formatCostDisplay(value: number): string {
  if (!value) return 'R$ 0';
  return `R$ ${formatIntegerBR(String(Math.round(value)))}`;
}

/** CEP: 00000-000 */
export function maskZipCode(raw: string): string {
  const digits = digitsOnly(raw).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/** Área m² — só dígitos */
export function maskSqmInput(raw: string): string {
  return digitsOnly(raw).slice(0, 6);
}
