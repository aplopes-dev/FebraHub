import {
  ACCENT_COLOR_IDS,
  DEFAULT_ACCENT_COLOR_ID,
  isAccentColorId,
  isCustomAccentHex,
  type AccentColorId,
  type AccentColorValue,
} from '@/features/settings/data/accent-presets';
import { buildAccentPaletteFromHex } from '@/features/settings/data/accent-custom-color';
import { listifyPrimary } from './tokens/colors';

/**
 * Accent → MUI `palette.primary`.
 * Default `orange` = Listify Primary/300 `#ff8415` (+ escala do guide).
 */

export type AccentPalette = {
  main: string;
  light: string;
  dark: string;
  contrastText: string;
};

export const ACCENT_PALETTES = {
  orange: {
    main: listifyPrimary[300],
    light: listifyPrimary[100],
    dark: listifyPrimary[200],
    contrastText: '#FFFFFF',
  },
  amber: {
    main: '#e8a017',
    light: '#f0bc4a',
    dark: '#b57a0f',
    contrastText: '#1A1608',
  },
  rose: {
    main: '#e11d48',
    light: '#f0436a',
    dark: '#be123c',
    contrastText: '#FFFFFF',
  },
  blue: {
    main: '#2563eb',
    light: '#3b82f6',
    dark: '#1d4ed8',
    contrastText: '#FFFFFF',
  },
  teal: {
    main: '#0d9488',
    light: '#14b8a6',
    dark: '#0f766e',
    contrastText: '#FFFFFF',
  },
  violet: {
    main: '#7c3aed',
    light: '#8b5cf6',
    dark: '#6d28d9',
    contrastText: '#FFFFFF',
  },
  green: {
    main: '#16a34a',
    light: '#22c55e',
    dark: '#15803d',
    contrastText: '#FFFFFF',
  },
} as const satisfies Record<AccentColorId, AccentPalette>;

/**
 * Texto sobre o `main` do accent.
 * Antes forçávamos preto no dark — sumia em fundo primary fraco/escuro e em
 * usos de `primary.contrastText` fora de botão filled.
 */
function contrastOnAccent(hex: string): string {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return '#FFFFFF';
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  const channel = (c: number) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  const luminance =
    0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  return luminance > 0.55 ? '#1A1608' : '#FFFFFF';
}

export function resolveAccentPalette(
  value: AccentColorValue = DEFAULT_ACCENT_COLOR_ID,
  mode: 'light' | 'dark' = 'light',
): AccentPalette {
  if (isCustomAccentHex(value)) {
    return buildAccentPaletteFromHex(value, mode);
  }

  const base =
    ACCENT_PALETTES[value] ?? ACCENT_PALETTES[DEFAULT_ACCENT_COLOR_ID];

  return {
    ...base,
    contrastText: contrastOnAccent(base.main),
  };
}

export function isAccentColorIdKnown(value: unknown): value is AccentColorId {
  return isAccentColorId(value);
}

export { DEFAULT_ACCENT_COLOR_ID };
export type { AccentColorId, AccentColorValue };
