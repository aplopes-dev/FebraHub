"use client";

import type { ReactNode } from "react";
import Paper from "@mui/material/Paper";
import type { PaperProps } from "@mui/material/Paper";
import { surfaceBorderRadius } from "@/theme/surface-styles";

export type ListPagePanelProps = {
  children: ReactNode;
  /** Estilos extras no Paper (mesclados após o padrão). */
  sx?: PaperProps["sx"];
};

/**
 * Superfície padrão das listagens MUI do ERP Comércio
 * (mesmo shell de Produtos: Paper sem elevação, padding e flex fill).
 *
 * A tabela interna (`DataTable`) já traz a borda outlined — não adicione
 * `border` neste painel para evitar contorno duplo.
 */
export function ListPagePanel({ children, sx }: ListPagePanelProps) {
  return (
    <Paper
      elevation={0}
      sx={[
        {
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          gap: 3,
          p: 2,
          borderRadius: surfaceBorderRadius,
          bgcolor: "background.paper",
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Paper>
  );
}
