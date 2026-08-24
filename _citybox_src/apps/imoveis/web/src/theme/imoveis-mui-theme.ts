/**
 * Tema MUI Imóveis — Design Guide Listify (Figma).
 *
 * Tokens canônicos em `./tokens` (cores, tipografia, spacing, shadows).
 * Preset em `./presets/imoveis-theme.ts`.
 */

export type { ThemeOptions } from '@citybox/mui/theme';
export {
  imoveisDarkPaletteOverrides,
  imoveisTheme,
  imoveisThemeOptions,
} from './presets/imoveis-theme';
export { imoveisSemanticPalette, imoveisSemanticPaletteDark } from './semantic-palette';
export {
  ACCENT_PALETTES,
  resolveAccentPalette,
  DEFAULT_ACCENT_COLOR_ID,
  type AccentColorId,
  type AccentPalette,
} from './accent-color';
export {
  listifyPopoverPaperSx,
  primaryButtonShadow,
  primaryGlowShadow,
  primaryHorizontalGradient,
  primarySoftShadow,
  primarySoftSurface,
  primaryVerticalGradient,
} from './accent-styles';
export * from './tokens';

import type { ThemeOptions } from '@citybox/mui/theme';
import { imoveisTheme, imoveisThemeOptions } from './presets/imoveis-theme';

/** Options do preset — usado em `AppProviders` (+ override de accent/mode). */
export const imoveisMuiThemeOptions: ThemeOptions = imoveisThemeOptions;

/** Tema estático light (sem accent dinâmico). */
export const imoveisMuiTheme = imoveisTheme;
