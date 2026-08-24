"use client";

import MuiFormControl from "@mui/material/FormControl";
import type { FormControlProps as MuiFormControlProps } from "@mui/material/FormControl";

export type FormControlProps = MuiFormControlProps;

export function FormControl(props: FormControlProps) {
  return <MuiFormControl {...props} />;
}
