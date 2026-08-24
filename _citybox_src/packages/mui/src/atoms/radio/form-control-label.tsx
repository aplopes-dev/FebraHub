"use client";

import MuiFormControlLabel from "@mui/material/FormControlLabel";
import type { FormControlLabelProps as MuiFormControlLabelProps } from "@mui/material/FormControlLabel";

export type FormControlLabelProps = MuiFormControlLabelProps;

export function FormControlLabel(props: FormControlLabelProps) {
  return <MuiFormControlLabel {...props} />;
}
