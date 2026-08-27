import type { Theme } from "@/ui/theme";

/**
 * Superfície preenchida com a marca.
 *
 * O MUI só aplica o degradê nos componentes que o tema conhece (botão
 * contained, chip filled); telas que pintam a marca à mão — o avatar de um
 * banco, o item selecionado de um toggle — usam este helper para não ficarem
 * chapadas no meio de uma interface metálica.
 *
 * `backgroundColor` continua sendo a cor de verdade: o degradê é um
 * `background-image` por cima, então uma marca sem degradê (qualquer cor
 * chapada do catálogo) cai na cor sozinha, sem ramo especial.
 *
 * @example
 * <Box sx={[brandFillSx, { width: 48, height: 48 }]} />
 */
export function brandFillSx(theme: Theme) {
  return {
    backgroundColor: theme.palette.primary.main,
    backgroundImage: theme.palette.primary.gradient ?? "none",
    color: theme.palette.primary.contrastText,
  } as const;
}

/** O mesmo preenchimento sob o cursor. */
export function brandFillHoverSx(theme: Theme) {
  return {
    backgroundColor: theme.palette.primary.dark,
    backgroundImage:
      theme.palette.primary.gradientHover ??
      theme.palette.primary.gradient ??
      "none",
    color: theme.palette.primary.contrastText,
  } as const;
}
