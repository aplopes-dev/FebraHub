import { createAppTheme } from '@citybox/mui/theme';
import { BEAUTIFUL_THEME_PRESETS } from './theme-presets';

/** Fallback estático (login / telas sem loja) — Roxo Imperial. */
export const beautifulMuiThemeOptions = BEAUTIFUL_THEME_PRESETS.purple.light;

export const beautifulMuiTheme = createAppTheme(beautifulMuiThemeOptions);
