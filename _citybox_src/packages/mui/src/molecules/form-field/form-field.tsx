"use client";

import type { ReactNode } from "react";
import { Input, type InputProps } from "../../atoms/input";

export type FormFieldProps = Omit<InputProps, "label" | "helperText"> & {
  /** Label flutuante do TextField outlined (não fica fora do campo). */
  label: ReactNode;
  helperText?: ReactNode;
  errorMessage?: ReactNode;
};

/**
 * Campo de formulário no padrão MUI:
 * `<TextField variant="outlined" label="…" />` com label flutuante.
 */
export function FormField({
  label,
  helperText,
  errorMessage,
  error,
  id,
  required,
  fullWidth = true,
  variant = "outlined",
  ...inputProps
}: FormFieldProps) {
  const hasError = Boolean(error || errorMessage);
  const fieldId =
    id ?? (typeof label === "string" ? `field-${label}` : undefined);
  const resolvedHelper =
    hasError && errorMessage != null ? errorMessage : helperText;

  return (
    <Input
      id={fieldId}
      label={label}
      variant={variant}
      error={hasError}
      required={required}
      fullWidth={fullWidth}
      helperText={resolvedHelper}
      {...inputProps}
    />
  );
}
