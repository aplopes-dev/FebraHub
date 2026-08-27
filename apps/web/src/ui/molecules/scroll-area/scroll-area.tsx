"use client";

import Box from "@mui/material/Box";
import type { BoxProps } from "@mui/material/Box";
import type { Theme } from "@mui/material/styles";

function scrollbarTrackColor(theme: Theme) {
  return theme.palette.mode === "dark"
    ? "rgba(255, 255, 255, 0.06)"
    : "rgba(31, 48, 69, 0.06)";
}

/** Thumb visível sobre `background.default` / cards — usa tokens do tema. */
function scrollbarThumbColor(theme: Theme) {
  return theme.palette.mode === "dark"
    ? "rgba(255, 255, 255, 0.32)"
    : theme.palette.text.secondary;
}

function scrollbarThumbColorHover(theme: Theme) {
  return theme.palette.mode === "dark"
    ? "rgba(255, 255, 255, 0.48)"
    : theme.palette.text.primary;
}

const scrollbarBaseSx = {
  overflowY: "auto",
  overflowX: "hidden",
  minHeight: 0,
  minWidth: 0,
  scrollbarWidth: "thin" as const,
  "&::-webkit-scrollbar": {
    width: 10,
    height: 10,
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: scrollbarTrackColor,
  },
};

/**
 * Estilos de scrollbar fino que só aparece no hover
 * (paridade com ScrollArea shadcn do `@/ui`).
 */
export const scrollAreaSx = {
  ...scrollbarBaseSx,
  scrollbarColor: "transparent transparent",
  transition: "scrollbar-color 0.15s ease",
  "&:hover": {
    scrollbarColor: (theme: Theme) =>
      `${scrollbarThumbColor(theme)} ${scrollbarTrackColor(theme)}`,
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "transparent",
  },
  "&::-webkit-scrollbar-thumb": {
    borderRadius: 999,
    backgroundColor: "transparent",
    border: "2px solid transparent",
    backgroundClip: "padding-box",
  },
  "&:hover::-webkit-scrollbar-thumb": {
    backgroundColor: scrollbarThumbColor,
    border: "2px solid transparent",
    backgroundClip: "padding-box",
  },
};

/** Scrollbar sempre visível quando há overflow — p/ rolagem de página inteira. */
export const scrollAreaAlwaysVisibleSx = {
  ...scrollbarBaseSx,
  scrollbarColor: (theme: Theme) =>
    `${scrollbarThumbColor(theme)} ${scrollbarTrackColor(theme)}`,
  "&::-webkit-scrollbar-thumb": {
    borderRadius: 999,
    backgroundColor: scrollbarThumbColor,
    border: "2px solid transparent",
    backgroundClip: "content-box",
    minHeight: 48,
  },
  "&:hover::-webkit-scrollbar-thumb": {
    backgroundColor: scrollbarThumbColorHover,
  },
};

export type ScrollAreaProps = BoxProps & {
  /** `hover` (padrão) esconde a barra até passar o mouse; `always` mantém visível. */
  scrollbarVisibility?: "hover" | "always";
};

/**
 * Área rolável com scrollbar estilizado (visível no hover).
 *
 * @example
 * <ScrollArea sx={{ flex: 1, maxHeight: 400 }}>
 *   {children}
 * </ScrollArea>
 */
export function ScrollArea({
  sx,
  scrollbarVisibility = "hover",
  ...props
}: ScrollAreaProps) {
  return (
    <Box
      sx={[
        scrollbarVisibility === "always" ? scrollAreaAlwaysVisibleSx : scrollAreaSx,
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    />
  );
}
