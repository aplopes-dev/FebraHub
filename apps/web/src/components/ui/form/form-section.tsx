"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  formSectionBoxSx,
  formSectionGridSx,
  formSectionHeaderSx,
} from "@/components/ui/form/form-section-styles";

export type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

/**
 * Seção de formulário full-page: título/descrição à esquerda, card de campos
 * à direita. Padrão das telas de Configurações e dos cadastros do ERP.
 */
export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <Box component="section" sx={formSectionGridSx}>
      <Box component="header" sx={formSectionHeaderSx}>
        <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {description ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {description}
          </Typography>
        ) : null}
      </Box>
      <Box
        sx={{
          ...formSectionBoxSx,
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

/** Grid de 12 colunas usado dentro do card das seções. */
export const formFieldGridSx = {
  display: "grid",
  gridTemplateColumns: "repeat(12, 1fr)",
  gap: 2,
  minWidth: 0,
} as const;

/**
 * Largura de um campo dentro do `formFieldGridSx`.
 * `columns` vale de `md` para cima; `smColumns` (opcional) ajusta o `sm`.
 */
export function formFieldSpanSx(columns: number, smColumns?: number) {
  return {
    gridColumn: {
      xs: "span 12",
      sm: `span ${smColumns ?? columns}`,
      md: `span ${columns}`,
    },
  };
}
