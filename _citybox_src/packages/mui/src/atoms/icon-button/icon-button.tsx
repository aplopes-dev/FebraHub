"use client";

import MuiIconButton from "@mui/material/IconButton";
import type { IconButtonProps as MuiIconButtonProps } from "@mui/material/IconButton";

export type IconButtonProps = MuiIconButtonProps;

/** Thin wrapper MUI IconButton. */
export function IconButton(props: IconButtonProps) {
  return <MuiIconButton {...props} />;
}
