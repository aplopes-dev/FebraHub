"use client";

import TextField from "@mui/material/TextField";
import type { TextFieldProps } from "@mui/material/TextField";

export type InputProps = TextFieldProps;

/**
 * TextField MUI — padrão `variant="outlined"` com label flutuante quando
 * `label` é informado.
 */
export function Input({ variant = "outlined", ...props }: InputProps) {
  return <TextField variant={variant} {...props} />;
}
