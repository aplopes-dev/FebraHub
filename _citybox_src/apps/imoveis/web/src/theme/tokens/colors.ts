/**
 * Listify Design Guide — Color (Figma node 18:9940).
 * Fonte: https://www.figma.com/design/dhQwr2HQbnIAlRrdQWfDud
 */

export const listifyPrimary = {
  0: '#fff9f3',
  25: '#ffe6d0',
  50: '#ffcea1',
  100: '#ffb573',
  200: '#ff9d44',
  /** Primary brand — botões / nav ativo */
  300: '#ff8415',
} as const;

export const listifySecondary = {
  0: '#E7E7E7',
  25: '#D5D5D5',
  50: '#ABABAB',
  100: '#808081',
  200: '#565657',
  300: '#2C2C2D',
} as const;

export const listifyGreyscale = {
  0: '#F8FAFB',
  25: '#F6F8FA',
  50: '#ECEFF3',
  100: '#DFE1E7',
  200: '#C1C7D0',
  300: '#A4ACB9',
  400: '#818898',
  500: '#666D80',
  600: '#36394A',
  700: '#272835',
  800: '#1A1B25',
  900: '#0D0D12',
} as const;

export const listifySuccess = {
  0: '#EFFEFA',
  25: '#DDF3EF',
  50: '#9EE1D4',
  100: '#40C4AA',
  200: '#28806F',
  300: '#184E44',
} as const;

export const listifyError = {
  0: '#FFF0F3',
  25: '#FADBE1',
  50: '#ED8296',
  100: '#DF1C41',
  200: '#96132C',
  300: '#710E21',
} as const;

export const listifyWarning = {
  0: '#FFF6E0',
  25: '#FAEDCC',
  50: '#FCDA83',
  100: '#FFBE4C',
  200: '#966422',
  300: '#5C3D1F',
} as const;

export const listifySky = {
  0: '#F0FBFF',
  25: '#D1F0FA',
  50: '#7EDDF1',
  100: '#33CFFF',
  200: '#116B97',
  300: '#0C4E6E',
} as const;

export const listifyAdditional = {
  white: '#FFFFFF',
  black: '#000000',
} as const;

/** Alias semânticos usados no app (canvas, texto, superfícies). */
export const listifySemantic = {
  canvas: listifyGreyscale[0],
  surfaceMuted: listifyGreyscale[25],
  paper: listifyAdditional.white,
  textPrimary: listifyGreyscale[800],
  textSecondary: listifyGreyscale[400],
  textMuted: listifyGreyscale[500],
  border: listifyGreyscale[100],
  divider: listifyGreyscale[50],
} as const;
