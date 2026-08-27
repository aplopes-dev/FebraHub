import type { SxProps, Theme } from "@mui/material/styles";

export const formSectionBorderRadius = 1;

/** Larguras da linha de composição — cabeçalho e células usam os mesmos tokens. */
export const compositionCol = {
  handle: 32,
  insumoMin: 260,
  optional: 56,
  quantity: 96,
  unitCost: 120,
  total: 96,
  remove: 32,
  gap: 2.5,
} as const;

/** Soma das colunas + gaps — abaixo disso a tabela rola no eixo X. */
export const compositionRowMinWidth = 800;

/** Grid layout for a section (title/description on the left, card contents on the right) */
export const formSectionGridSx: SxProps<Theme> = {
  display: "grid",
  gap: { xs: 3, lg: 4 },
  gridTemplateColumns: { lg: "minmax(12rem, 16rem) minmax(0, 1fr)" },
  alignItems: "start",
  minWidth: 0,
  width: "100%",
};

/**
 * Composição: título empilha até xl. Em 1280 o título à esquerda
 * rouba ~16rem e o Autocomplete do insumo some.
 */
export const formCompositionSectionGridSx: SxProps<Theme> = {
  display: "grid",
  gap: { xs: 2, xl: 4 },
  gridTemplateColumns: { xl: "minmax(12rem, 14rem) minmax(0, 1fr)" },
  alignItems: "start",
  minWidth: 0,
  width: "100%",
};

/** Card container for section fields */
export const formSectionBoxSx: SxProps<Theme> = {
  borderRadius: formSectionBorderRadius,
  border: 1,
  borderColor: "divider",
  bgcolor: "background.paper",
  p: 2.5,
  minWidth: 0,
};

/** Header text styling (title + description) */
export const formSectionHeaderSx: SxProps<Theme> = {
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
    lineHeight: 1.5,
  },
};
