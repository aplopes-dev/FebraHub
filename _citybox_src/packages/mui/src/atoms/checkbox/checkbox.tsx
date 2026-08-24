"use client";

import MuiCheckbox from "@mui/material/Checkbox";
import type { CheckboxProps as MuiCheckboxProps } from "@mui/material/Checkbox";

export type CheckboxProps = MuiCheckboxProps;

export function Checkbox(props: CheckboxProps) {
  return <MuiCheckbox {...props} />;
}
