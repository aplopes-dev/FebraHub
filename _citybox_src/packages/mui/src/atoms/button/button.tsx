"use client";

import MuiButton from "@mui/material/Button";
import type { ButtonProps as MuiButtonProps } from "@mui/material/Button";
import type { ComponentProps } from "react";

export type ButtonProps = MuiButtonProps;

/**
 * Thin wrapper MUI Button.
 *
 * Cor padrão por variante (evita tudo ficar primary):
 * - `contained` → `primary` (CTA)
 * - `outlined` / `text` → `inherit` (neutro)
 *
 * Passe `color` explicitamente para forçar (ex.: `outlined` + `color="primary"`).
 */
export function Button({
  variant = "text",
  color,
  ...props
}: ButtonProps) {
  const resolvedColor =
    color ?? (variant === "contained" ? "primary" : "inherit");

  return <MuiButton variant={variant} color={resolvedColor} {...props} />;
}

export type ButtonComponentProps = ComponentProps<typeof Button>;
