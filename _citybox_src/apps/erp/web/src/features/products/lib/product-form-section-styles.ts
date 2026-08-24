import type { SxProps, Theme } from "@mui/material/styles";

/**
 * Raio dos cards/boxes do formulário.
 * No `sx` do MUI, número multiplica `theme.shape.borderRadius`
 * (`1` = raio do tema, ex. 8px).
 */
export const productFormBorderRadius = 1;

/** Grid de seção do formulário de produto (título à esquerda, conteúdo à direita). */
export const productFormSectionGridSx: SxProps<Theme> = {
  display: "grid",
  gap: { xs: 3, lg: 5 },
  gridTemplateColumns: { lg: "minmax(16rem, 22rem) minmax(0, 1fr)" },
  alignItems: "start",
  minWidth: 0,
  width: "100%",
};

/** Grid split: conteúdo principal à esquerda, sidebar à direita (movimentação, transferência, compra). */
export const formSplitLayoutGridSx: SxProps<Theme> = {
  display: "grid",
  gap: 3,
  alignItems: "start",
  gridTemplateColumns: {
    lg: "minmax(0, 1fr) minmax(18rem, 24rem)",
  },
  minWidth: 0,
  width: "100%",
};

/** Card de conteúdo das seções do formulário de produto. */
export const productFormSectionBoxSx: SxProps<Theme> = {
  borderRadius: productFormBorderRadius,
  border: 1,
  borderColor: "divider",
  bgcolor: "background.paper",
  p: 2.5,
  minWidth: 0,
};

/** Cabeçalho textual de seção (título + descrição). */
export const productFormSectionHeaderSx: SxProps<Theme> = {
  pt: { lg: 0.5 },
  "& h2": {
    m: 0,
    fontSize: "1rem",
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
  "& p": {
    m: 0,
    mt: 0.5,
    fontSize: "0.875rem",
    color: "text.secondary",
  },
};
