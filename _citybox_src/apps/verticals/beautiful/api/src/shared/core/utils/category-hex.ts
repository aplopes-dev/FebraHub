export const DEFAULT_CATEGORY_HEX = '#3b82f6';

export const CATEGORY_HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

export function normalizeCategoryHex(value: string | undefined): string {
  const trimmed = (value ?? '').trim().toLowerCase();
  if (CATEGORY_HEX_REGEX.test(trimmed)) return trimmed;
  return DEFAULT_CATEGORY_HEX;
}
