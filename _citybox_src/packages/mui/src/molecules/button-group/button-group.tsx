"use client";

import MuiButtonGroup from "@mui/material/ButtonGroup";
import type { ButtonGroupProps as MuiButtonGroupProps } from "@mui/material/ButtonGroup";

export type ButtonGroupProps = MuiButtonGroupProps;

export function ButtonGroup(props: ButtonGroupProps) {
  return <MuiButtonGroup {...props} />;
}
