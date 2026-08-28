"use client";

import type { ReactNode } from "react";
import { Box, Paper, Typography } from "@/ui";

export type PanelBlockProps = {
  title: ReactNode;
  /** Contexto no canto direito do cabeçalho: período, fonte, recorte. */
  corner?: ReactNode;
  children: ReactNode;
  /** Sem padding no corpo — para listas que desenham a própria divisória. */
  flush?: boolean;
  /** Altura máxima do corpo; o cabeçalho fica fixo e só o corpo rola. */
  maxBodyHeight?: number;
};

/**
 * O painel do hub — cabeçalho com título e contexto, corpo separado por traço.
 *
 * É o `Bloco` do web legado trazido para o design system novo. O contexto no
 * canto não é enfeite: um número sem dizer **de quando** e **de qual recorte**
 * é um número que a diretoria desconfia uma vez e nunca mais olha.
 */
export function PanelBlock({
  title,
  corner,
  children,
  flush,
  maxBodyHeight,
}: PanelBlockProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          px: 2,
          py: 1.25,
          borderBottom: 1,
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {corner ? (
          <Typography variant="caption" sx={{ color: "text.disabled", textAlign: "right" }}>
            {corner}
          </Typography>
        ) : null}
      </Box>

      <Box
        sx={{
          p: flush ? 0 : 2,
          ...(maxBodyHeight
            ? { maxHeight: maxBodyHeight, overflowY: "auto", minHeight: 0 }
            : {}),
        }}
      >
        {children}
      </Box>
    </Paper>
  );
}
