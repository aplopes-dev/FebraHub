"use client";

import MuiDivider from "@mui/material/Divider";
import type { DividerProps as MuiDividerProps } from "@mui/material/Divider";

export type DividerProps = MuiDividerProps;

export function Divider(props: DividerProps) {
  return <MuiDivider {...props} />;
}
