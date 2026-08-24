/**
 * Listify Design Guide — Typography (Figma node 18:9983).
 * Fonte: Manrope — Medium (500) / Light (300). Letter-spacing headings ≈ -2%.
 */

export const listifyFontFamily =
  'var(--font-app-sans), "Manrope", system-ui, sans-serif';

/** Tracking Figma `-2` em headings ≈ -2% do tamanho. */
const HEADING_TRACKING = '-0.02em';

export const listifyTypographyScale = {
  h1: {
    fontSize: 48,
    fontWeight: 500,
    lineHeight: 1.2,
    letterSpacing: HEADING_TRACKING,
  },
  h2: {
    fontSize: 40,
    fontWeight: 500,
    lineHeight: 1.2,
    letterSpacing: HEADING_TRACKING,
  },
  h3: {
    fontSize: 32,
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: HEADING_TRACKING,
  },
  h4: {
    fontSize: 24,
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: HEADING_TRACKING,
  },
  h5: {
    fontSize: 20,
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: HEADING_TRACKING,
  },
  h6: {
    fontSize: 18,
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: HEADING_TRACKING,
  },
  /** Body Large / Medium */
  bodyLarge: {
    fontSize: 18,
    fontWeight: 500,
    lineHeight: 1.55,
    letterSpacing: 0,
  },
  /** Body Large / Regular (Light) */
  bodyLargeRegular: {
    fontSize: 18,
    fontWeight: 300,
    lineHeight: 1.55,
    letterSpacing: 0,
  },
  /** Body Medium / Medium → MUI body1 */
  bodyMedium: {
    fontSize: 16,
    fontWeight: 500,
    lineHeight: 1.6,
    letterSpacing: 0,
  },
  /** Body Medium / Regular */
  bodyMediumRegular: {
    fontSize: 16,
    fontWeight: 300,
    lineHeight: 1.6,
    letterSpacing: 0,
  },
  /** Body Small / Medium → MUI body2 */
  bodySmall: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.55,
    letterSpacing: 0,
  },
  /** Body Small / Regular */
  bodySmallRegular: {
    fontSize: 14,
    fontWeight: 300,
    lineHeight: 1.55,
    letterSpacing: 0,
  },
  /** Body XSmall / Medium → MUI caption */
  bodyXSmall: {
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1.55,
    letterSpacing: 0,
  },
  /** Body XSmall / Regular */
  bodyXSmallRegular: {
    fontSize: 12,
    fontWeight: 300,
    lineHeight: 1.55,
    letterSpacing: 0,
  },
} as const;
