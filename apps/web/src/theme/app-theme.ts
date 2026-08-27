import { DEFAULT_BRAND_PALETTE } from "./brand-color";
import {
  themeV1,
  themeV1BrandColor,
  themeV1Dark,
  themeV1DarkOptions,
  themeV1Options,
} from "./presets/theme-v1";

/**
 * Tema do sistema — preset **v1** (design NodeX): casca escura, conteúdo
 * branco, sidebar dupla e container de conteúdo flutuante (inset).
 *
 * Este é o único preset do projeto. Os presets `v2` (identidade do front
 * Angular) e `v3` (cores do `v2` com a sidebar do `v1`) existiam só para
 * comparação na tela e foram removidos; a casca correspondente (sidebar de
 * coluna única e conteúdo full-bleed) saiu junto.
 */

/** Opções do tema — `AppProviders` aplica a cor de marca por cima. */
export const appThemeOptions = themeV1Options;

/** Sobreposição escura — aplicada por cima de `appThemeOptions`. */
export const appThemeDarkOptions = themeV1DarkOptions;

/** Cor de marca padrão — o padrão de quem ainda não escolheu a sua. */
export const appDefaultBrandColor: string = themeV1BrandColor;

/**
 * Degradê da marca padrão — o layout raiz o injeta no `<html>` para quem pinta
 * fora do MUI não piscar a cor chapada antes de o JS subir.
 */
export const appDefaultBrandGradient: string | undefined =
  DEFAULT_BRAND_PALETTE.gradient;

/** Temas prontos (com a cor de marca padrão, sem a dinâmica) — úteis em testes. */
export const appTheme = themeV1;
export const appThemeDark = themeV1Dark;
