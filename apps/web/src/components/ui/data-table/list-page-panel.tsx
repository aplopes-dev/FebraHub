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
 * Superfície padrão das listagens: o box branco que envolve toolbar, abas e
 * tabela (Figma NodeX, `Dashboard - Features` — o contêiner com traço
 * `Stroke/Primary` em volta do conteúdo da página).
 *
 * Quem separa o box do fundo é o contorno, porque box e fundo são brancos. A
 * tabela interna traz a própria borda para quando é usada solta (dentro de um
 * formulário, por exemplo); aqui ela é sempre desligada — dois contornos
 * concêntricos com 16px entre eles leem como erro de layout.
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
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          "& [data-datatable-surface]": {
            border: 0,
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Paper>
  );
}
