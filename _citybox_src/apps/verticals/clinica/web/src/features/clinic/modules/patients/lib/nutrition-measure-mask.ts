/**
 * Máscaras das medidas corporais da nutrição.
 *
 * Perimetria formata durante a digitação (os dois últimos dígitos são as casas
 * decimais); adipometria aceita a digitação livre e só completa no blur.
 */

/** `5` → `0,05`; `325` → `3,25`; `3250` → `32,50`. */
export function maskDigitsToDecimal(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d{3})/, '');
  if (!digits) return '';

  const padded = digits.padStart(3, '0');
  return `${padded.slice(0, -2)},${padded.slice(-2)}`;
}

/** Completa as casas decimais das medidas corporais: `8` → `8,00`; `8,5` → `8,50`. */
export function completeTwoDecimals(raw: string): string {
  const value = raw.trim();
  if (!value) return '';

  const [intPart = '', fracPart = ''] = value.replace('.', ',').split(',');
  const integers = intPart.replace(/\D/g, '') || '0';
  const decimals = fracPart.replace(/\D/g, '').padEnd(2, '0').slice(0, 2);

  return `${integers},${decimals}`;
}
