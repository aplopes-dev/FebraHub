"use client";

import Box from "@mui/material/Box";
import type { BoxProps } from "@mui/material/Box";

export type KbdProps = Omit<BoxProps, "component">;

/**
 * Tecla de atalho. Usada no gatilho da busca e no rodapé do command palette.
 * Herda a fonte do tema (nada de `monospace`, que destoa do resto do shell).
 */
export function Kbd({ sx, ...props }: KbdProps) {
  return (
    <Box
      component="kbd"
      sx={[
        (theme) => ({
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 20,
          height: 20,
          px: 0.625,
          borderRadius: "6px",
          border: "1px solid",
          borderColor: "divider",
          bgcolor:
            theme.palette.mode === "dark"
              ? "transparent"
              : "background.paper",
          boxShadow:
            theme.palette.mode === "dark"
              ? "none"
              : "0 1px 0 rgba(15, 23, 42, 0.04)",
          fontFamily: "inherit",
          fontSize: 11,
          fontWeight: 600,
          lineHeight: 1,
          color: "text.secondary",
          userSelect: "none",
        }),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    />
  );
}
