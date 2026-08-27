"use client";

/**
 * Compat: reexporta `NumberSpinner` com a API antiga do `NumberInput`
 * (`minValue`/`maxValue`/`onValueChange(number)`).
 */
import type { SxProps, Theme } from "@mui/material/styles";
import {
  NumberSpinner,
  type NumberSpinnerProps,
} from "../number-spinner/number-spinner";

export type NumberInputProps = {
  label?: string;
  description?: string;
  value?: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  disabled?: boolean;
  id?: string;
  onValueChange?: (value: number) => void;
  "aria-label"?: string;
  sx?: SxProps<Theme>;
  size?: NumberSpinnerProps["size"];
  error?: boolean;
};

export function NumberInput({
  label,
  value = 0,
  minValue,
  maxValue,
  step = 1,
  disabled = false,
  id,
  onValueChange,
  "aria-label": ariaLabel,
  sx,
  size,
  error,
}: NumberInputProps) {
  return (
    <NumberSpinner
      id={id}
      label={label}
      value={value}
      min={minValue}
      max={maxValue}
      step={step}
      disabled={disabled}
      size={size}
      error={error}
      sx={sx}
      aria-label={ariaLabel}
      onValueChange={(next) => {
        onValueChange?.(next ?? minValue ?? 0);
      }}
    />
  );
}

