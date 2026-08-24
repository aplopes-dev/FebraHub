"use client";

import type { ReactNode } from "react";
import MuiAutocomplete, {
  type AutocompleteProps as MuiAutocompleteProps,
} from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

export type AutocompleteProps<
  Value,
  Multiple extends boolean | undefined = false,
  DisableClearable extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false,
> = Omit<
  MuiAutocompleteProps<Value, Multiple, DisableClearable, FreeSolo>,
  "renderInput"
> & {
  /** Label flutuante do TextField outlined. */
  label?: ReactNode;
  placeholder?: string;
  helperText?: ReactNode;
  error?: boolean;
  errorMessage?: ReactNode;
  /** Substitui o TextField padrão (label/placeholder/erro ignorados). */
  renderInput?: MuiAutocompleteProps<
    Value,
    Multiple,
    DisableClearable,
    FreeSolo
  >["renderInput"];
};

/**
 * Autocomplete MUI com TextField outlined por padrão (paridade com FormField / Select).
 */
export function Autocomplete<
  Value,
  Multiple extends boolean | undefined = false,
  DisableClearable extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false,
>({
  label,
  placeholder,
  helperText,
  error,
  errorMessage,
  renderInput,
  fullWidth = true,
  ...props
}: AutocompleteProps<Value, Multiple, DisableClearable, FreeSolo>) {
  const hasError = Boolean(error || errorMessage);
  const resolvedHelper =
    hasError && errorMessage != null ? errorMessage : helperText;

  return (
    <MuiAutocomplete
      fullWidth={fullWidth}
      {...props}
      renderInput={
        renderInput ??
        ((params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            error={hasError}
            helperText={resolvedHelper}
          />
        ))
      }
    />
  );
}
