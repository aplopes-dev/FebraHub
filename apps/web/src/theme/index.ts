/**
 * Tema do app: preset MUI, cor de marca e tokens de superfície.
 *
 * O design system (`@/ui/theme`) fornece `createAppTheme` e os tokens base;
 * aqui mora só o que é identidade deste sistema. Importe por este barrel:
 * `import { appThemeOptions } from "@/theme"`.
 */
export {
  appDefaultBrandColor,
  appDefaultBrandGradient,
  appTheme,
  appThemeDark,
  appThemeDarkOptions,
  appThemeOptions,
} from "./app-theme";

export { brandFillHoverSx, brandFillSx } from "./brand-fill";

export {
  BRAND_COLOR_OPTIONS,
  DEFAULT_BRAND_COLOR,
  DEFAULT_BRAND_PALETTE,
  GOLD_BRAND_COLOR,
  isBrandColor,
  resolveBrandPalette,
  type BrandColorOption,
  type BrandPalette,
} from "./brand-color";

export {
  BRAND_COLOR_CHANGED_EVENT,
  BRAND_COLOR_STORAGE_KEY,
  persistBrandColor,
  readDefaultBrandColor,
  readStoredBrandColor,
  subscribeBrandColor,
} from "./brand-color-store";

export {
  DEFAULT_THEME_MODE,
  THEME_MODE_COOKIE,
  parseThemeMode,
  type ThemeMode,
} from "./theme-mode";
export { ThemeModeProvider, useThemeMode } from "./theme-mode-context";

export { semanticPalette } from "./semantic-palette";
export { surfaceBorderRadius } from "./surface-styles";
