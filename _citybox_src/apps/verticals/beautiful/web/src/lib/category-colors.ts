/** Mapa legado id nomeado → hex (categorias seedadas / dados antigos). */
const LEGACY_NAMED_COLORS: Record<string, string> = {
  blue: '#0ea5e9',
  green: '#10b981',
  purple: '#8b5cf6',
  orange: '#f97316',
  red: '#ef4444',
  pink: '#ec4899',
  teal: '#14b8a6',
  amber: '#f59e0b',
  indigo: '#6366f1',
  lime: '#84cc16',
};

export const DEFAULT_CATEGORY_HEX = '#3b82f6';

const HEX6 = /^#[0-9A-Fa-f]{6}$/;

/**
 * Normaliza cor de categoria para `#rrggbb` lowercase.
 * Aceita hex ou id nomeado legado (`blue`, `teal`, …).
 */
export function normalizeCategoryHex(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return DEFAULT_CATEGORY_HEX;

  if (trimmed.startsWith('#')) {
    if (HEX6.test(trimmed)) return trimmed.toLowerCase();
    return DEFAULT_CATEGORY_HEX;
  }

  return LEGACY_NAMED_COLORS[trimmed.toLowerCase()] ?? DEFAULT_CATEGORY_HEX;
}

/** @deprecated Prefer `normalizeCategoryHex` — mantido para call sites existentes. */
export function colorFromCategoryId(
  colorId: string | null | undefined,
): string {
  return normalizeCategoryHex(colorId);
}
