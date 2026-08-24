import {
  comercioThemeV1,
  comercioThemeV1Options,
} from "./presets/comercio-theme-v1";
import {
  comercioThemeV2,
  comercioThemeV2Options,
} from "./presets/comercio-theme-v2";
import type { ThemeOptions } from "@citybox/mui/theme";

/**
 * Presets disponíveis do ERP Comércio.
 * Troque `COMERCIO_THEME_PRESET` para comparar visualmente.
 *
 * - `v1` — app branco, coluna 2 `#F8FAFB` (tema original salvo)
 * - `v2` — app `#F8FAFB`, coluna 2 e header brancos
 */
export const COMERCIO_THEME_PRESET_OPTIONS = {
  v1: comercioThemeV1Options,
  v2: comercioThemeV2Options,
} as const satisfies Record<string, ThemeOptions>;

export const COMERCIO_THEME_PRESETS = {
  v1: comercioThemeV1,
  v2: comercioThemeV2,
} as const;

export type ComercioThemePreset = keyof typeof COMERCIO_THEME_PRESETS;

/** ← altere aqui para testar outro preset */
export const COMERCIO_THEME_PRESET: ComercioThemePreset = "v2";

/** Opções do preset ativo — usado em `AppProviders` (+ override de marca). */
export const comercioMuiThemeOptions =
  COMERCIO_THEME_PRESET_OPTIONS[COMERCIO_THEME_PRESET];

/** Tema estático do preset ativo (sem cor de marca dinâmica). */
export const comercioMuiTheme = COMERCIO_THEME_PRESETS[COMERCIO_THEME_PRESET];

export { comercioThemeV1, comercioThemeV2 };
