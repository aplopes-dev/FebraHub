"use client";

import MuiMenu from "@mui/material/Menu";
import type { MenuProps as MuiMenuProps } from "@mui/material/Menu";

export type MenuProps = MuiMenuProps;

export function Menu(props: MenuProps) {
  return <MuiMenu {...props} />;
}
