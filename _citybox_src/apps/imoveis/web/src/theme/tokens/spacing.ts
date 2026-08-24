/**
 * Listify Design Guide — Spacing & Border radius (Figma node 18:10484).
 * Base 4px: tema MUI `spacing: 4` → `theme.spacing(1) === '4px'`.
 */

/** Escala nomeada do guide (token → px). */
export const listifySpacingPx = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
  40: 160,
  48: 192,
  56: 224,
  64: 256,
} as const;

/** Fator do `createTheme({ spacing })` — 1 unidade = 4px. */
export const listifySpacingUnit = 4;

/**
 * Border radius do guide.
 * Cards / topbar do dashboard usam `2xl` (20px) como default de `shape.borderRadius`.
 */
export const listifyRadii = {
  xs: 4,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 30,
  full: 999,
} as const;

export type ListifyRadius = keyof typeof listifyRadii;
