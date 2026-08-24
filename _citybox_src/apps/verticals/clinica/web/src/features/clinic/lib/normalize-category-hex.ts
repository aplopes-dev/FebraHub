/** Mapa legado id nomeado → hex (categorias seedadas / dados antigos). */
const LEGACY_NAMED_COLORS: Record<string, string> = {
  blue: '#3b82f6',
  sky: '#0ea5e9',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  emerald: '#10b981',
  green: '#22c55e',
  lime: '#84cc16',
  yellow: '#eab308',
  amber: '#f59e0b',
  orange: '#f97316',
  red: '#ef4444',
  rose: '#f43f5e',
  pink: '#ec4899',
  fuchsia: '#d946ef',
  purple: '#a855f7',
  violet: '#8b5cf6',
  indigo: '#6366f1',
  navy: '#1d4ed8',
  slate: '#64748b',
  brown: '#a16207',
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

export function isValidCategoryHex(value: string): boolean {
  return HEX6.test(value.trim());
}
