"use client";

import MuiSelect from "@mui/material/Select";
import type { SelectProps as MuiSelectProps } from "@mui/material/Select";

export type SelectProps = MuiSelectProps;

export function Select(props: SelectProps) {
  return <MuiSelect {...props} />;
}
