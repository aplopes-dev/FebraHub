"use client";

import Box from "@mui/material/Box";
import type { BoxProps } from "@mui/material/Box";
import type { Theme } from "@mui/material/styles";

/**
 * Estilos de scrollbar fino que só aparece no hover
 * (paridade com ScrollArea shadcn do `@citybox/ui`).
 */
export const scrollAreaSx = {
  overflowY: "auto",
  overflowX: "hidden",
  minHeight: 0,
  minWidth: 0,
  scrollbarWidth: "thin" as const,
  scrollbarColor: "transparent transparent",
  transition: "scrollbar-color 0.15s ease",
  "&:hover": {
    scrollbarColor: (theme: Theme) =>
      theme.palette.mode === "dark"
        ? "rgba(255, 255, 255, 0.14) transparent"
        : "rgba(0, 0, 0, 0.14) transparent",
  },
  "&::-webkit-scrollbar": {
    width: 8,
    height: 8,
  },
  "&::-webkit-scrollbar-track": {
    background: "transparent",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "transparent",
    borderRadius: 999,
    border: "2px solid transparent",
    backgroundClip: "padding-box",
  },
  "&:hover::-webkit-scrollbar-thumb": {
    backgroundColor: (theme: Theme) =>
      theme.palette.mode === "dark"
        ? "rgba(255, 255, 255, 0.10)"
        : "rgba(0, 0, 0, 0.10)",
  },
};

export type ScrollAreaProps = BoxProps;

/**
 * Área rolável com scrollbar estilizado (visível no hover).
 *
 * @example
 * <ScrollArea sx={{ flex: 1, maxHeight: 400 }}>
 *   {children}
 * </ScrollArea>
 */
export function ScrollArea({ sx, ...props }: ScrollAreaProps) {
  return (
    <Box
      sx={[scrollAreaSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      {...props}
    />
  );
}
