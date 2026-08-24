/** Aceita só dígitos e no máximo um separador decimal (`,` ou `.`). */
export function maskDecimalInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.,]/g, '');
  const sepIndex = cleaned.search(/[.,]/);
  if (sepIndex === -1) return cleaned;

  const sep = cleaned[sepIndex] ?? '';
  const intPart = cleaned.slice(0, sepIndex).replace(/[.,]/g, '');
  const fracPart = cleaned.slice(sepIndex + 1).replace(/[.,]/g, '');
  return `${intPart}${sep}${fracPart}`;
}

/**
 * No blur: se o valor for só 2 ou 3 dígitos (sem casas decimais), completa com `,00`.
 * Ex.: `70` → `70,00`, `175` → `175,00`.
 */
export function completeDecimalZeros(raw: string): string {
  const masked = maskDecimalInput(raw.trim());
  if (!masked) return '';

  const sepIndex = masked.search(/[.,]/);
  if (sepIndex === -1) {
    return /^\d{2,3}$/.test(masked) ? `${masked},00` : masked;
  }

  const intPart = masked.slice(0, sepIndex);
  const fracPart = masked.slice(sepIndex + 1);
  if (fracPart === '' && /^\d{2,3}$/.test(intPart)) {
    return `${intPart},00`;
  }

  return masked;
}
