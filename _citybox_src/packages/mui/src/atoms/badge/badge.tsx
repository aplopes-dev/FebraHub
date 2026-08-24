"use client";

import MuiChip from "@mui/material/Chip";
import type { ChipProps as MuiChipProps } from "@mui/material/Chip";

export type BadgeProps = MuiChipProps;

/** Contador / etiqueta compacta (Chip MUI). */
export function Badge(props: BadgeProps) {
  return <MuiChip {...props} />;
}
