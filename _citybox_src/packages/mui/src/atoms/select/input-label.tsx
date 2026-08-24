"use client";

import MuiInputLabel from "@mui/material/InputLabel";
import type { InputLabelProps as MuiInputLabelProps } from "@mui/material/InputLabel";

export type InputLabelProps = MuiInputLabelProps;

export function InputLabel(props: InputLabelProps) {
  return <MuiInputLabel {...props} />;
}
