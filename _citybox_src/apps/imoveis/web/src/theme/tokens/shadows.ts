/**
 * Listify Design Guide — Shadows (Figma node 18:10484).
 * Valores CSS extraídos dos cards Shadow-xs … Shadow-3xl.
 */

export const listifyShadows = {
  none: 'none',
  xs: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
  sm: '0px 1px 3px 0px rgba(16, 24, 40, 0.1), 0px 1px 2px 0px rgba(16, 24, 40, 0.06)',
  md: '0px 4px 8px -2px rgba(16, 24, 40, 0.1), 0px 2px 4px -2px rgba(16, 24, 40, 0.06)',
  lg: '0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)',
  xl: '0px 20px 24px -4px rgba(16, 24, 40, 0.08), 0px 8px 8px -4px rgba(16, 24, 40, 0.03)',
  '2xl': '0px 24px 48px -12px rgba(16, 24, 40, 0.18)',
  '3xl': '0px 32px 64px -12px rgba(16, 24, 40, 0.14)',
} as const;

export type ListifyShadow = keyof typeof listifyShadows;

/**
 * Array `theme.shadows` (25 slots MUI).
 * Mapeamento: 1=xs, 2=sm, 4=md, 8=lg, 12=xl, 16=2xl, 24=3xl.
 */
export function buildListifyMuiShadows(): string[] {
  const s = listifyShadows;
  const shadows: string[] = Array.from({ length: 25 }, () => s.none);
  shadows[0] = s.none;
  shadows[1] = s.xs;
  shadows[2] = s.sm;
  shadows[3] = s.sm;
  shadows[4] = s.md;
  shadows[5] = s.md;
  shadows[6] = s.md;
  shadows[7] = s.lg;
  shadows[8] = s.lg;
  shadows[9] = s.lg;
  shadows[10] = s.xl;
  shadows[11] = s.xl;
  shadows[12] = s.xl;
  shadows[13] = s['2xl'];
  shadows[14] = s['2xl'];
  shadows[15] = s['2xl'];
  shadows[16] = s['2xl'];
  shadows[17] = s['3xl'];
  shadows[18] = s['3xl'];
  shadows[19] = s['3xl'];
  shadows[20] = s['3xl'];
  shadows[21] = s['3xl'];
  shadows[22] = s['3xl'];
  shadows[23] = s['3xl'];
  shadows[24] = s['3xl'];
  return shadows;
}
