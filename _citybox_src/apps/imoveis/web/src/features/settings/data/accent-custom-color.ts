import type { AccentPalette } from '@/theme/accent-color';

/** Hex de 6 dígitos com `#` — ex.: `#FF8415`. */
export type CustomAccentHex = `#${string}`;

const CUSTOM_HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

type Rgb = { r: number; g: number; b: number };

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function normalizeAccentHex(value: string): CustomAccentHex | null {
  const trimmed = value.trim();
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  if (!CUSTOM_HEX_PATTERN.test(withHash)) return null;
  return withHash.toUpperCase() as CustomAccentHex;
}

export function isCustomAccentHex(value: unknown): value is CustomAccentHex {
  return typeof value === 'string' && CUSTOM_HEX_PATTERN.test(value);
}

export function hexToRgb(hex: CustomAccentHex): Rgb {
  const raw = hex.slice(1);
  return {
    r: parseInt(raw.slice(0, 2), 16),
    g: parseInt(raw.slice(2, 4), 16),
    b: parseInt(raw.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b]
    .map((channel) => clampByte(channel).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

function mixRgb(base: Rgb, target: Rgb, amount: number): Rgb {
  const t = Math.max(0, Math.min(1, amount));
  return {
    r: base.r + (target.r - base.r) * t,
    g: base.g + (target.g - base.g) * t,
    b: base.b + (target.b - base.b) * t,
  };
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastTextForRgb(rgb: Rgb): string {
  /** Preto só sobre accents bem claros (âmbar / pastéis); caso contrário branco. */
  return relativeLuminance(rgb) > 0.55 ? '#1A1608' : '#FFFFFF';
}

/** Deriva escala MUI `primary` a partir de um hex escolhido pelo usuário. */
export function buildAccentPaletteFromHex(
  hex: CustomAccentHex,
  mode: 'light' | 'dark' = 'light',
): AccentPalette {
  const base = hexToRgb(hex);
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  const main = rgbToHex(base);
  const light = rgbToHex(mixRgb(base, white, mode === 'dark' ? 0.22 : 0.38));
  const dark = rgbToHex(mixRgb(base, black, mode === 'dark' ? 0.18 : 0.22));

  return {
    main,
    light,
    dark,
    contrastText: contrastTextForRgb(base),
  };
}

const CUSTOM_ACCENT_ATTR = 'data-accent-custom';

/** Tokens `--primary*` usados por Tailwind utilities e TopLoader. */
export function applyCustomAccentCssVariables(
  hex: CustomAccentHex,
  mode: 'light' | 'dark' = 'light',
): void {
  if (typeof document === 'undefined') return;
  const palette = buildAccentPaletteFromHex(hex, mode);
  const root = document.documentElement;
  const softMix = mode === 'dark' ? 0.28 : 0.92;
  const softBase = hexToRgb(hex);
  const softTarget = mode === 'dark' ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
  const soft = rgbToHex(mixRgb(softBase, softTarget, softMix));

  root.setAttribute(CUSTOM_ACCENT_ATTR, hex);
  root.style.setProperty('--primary', palette.main);
  root.style.setProperty('--primary-foreground', palette.contrastText);
  root.style.setProperty('--primary-soft', soft);
  root.style.setProperty('--primary-soft-foreground', palette.main);
  root.style.setProperty('--ring', palette.main);
  root.style.setProperty('--chart-revenue', palette.main);
  root.style.setProperty('--sidebar-primary', palette.main);
  root.style.setProperty('--sidebar-primary-foreground', palette.contrastText);
  root.style.setProperty('--sidebar-ring', palette.main);
}

export function clearCustomAccentCssVariables(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.removeAttribute(CUSTOM_ACCENT_ATTR);
  for (const key of [
    '--primary',
    '--primary-foreground',
    '--primary-soft',
    '--primary-soft-foreground',
    '--ring',
    '--chart-revenue',
    '--sidebar-primary',
    '--sidebar-primary-foreground',
    '--sidebar-ring',
  ]) {
    root.style.removeProperty(key);
  }
}

export function readCustomAccentHexFromDom(): CustomAccentHex | null {
  if (typeof document === 'undefined') return null;
  const value = document.documentElement.getAttribute(CUSTOM_ACCENT_ATTR);
  return isCustomAccentHex(value) ? value : null;
}
