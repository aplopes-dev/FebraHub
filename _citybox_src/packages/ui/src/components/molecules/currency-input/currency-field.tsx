"use client";

import * as React from "react";
import { Label } from "../../atoms/label";
import { cn } from "../../../lib/utils";
import { CurrencyInput, type CurrencyInputProps } from "./currency-input";

export interface CurrencyFieldProps extends CurrencyInputProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function CurrencyField({
  label,
  error,
  hint,
  required,
  className,
  id,
  ...props
}: CurrencyFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId}>
        {label}
        {required && (
          <span className="ml-1 text-destructive" aria-hidden>
            *
          </span>
        )}
      </Label>
      <CurrencyInput
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
        }
        className={cn(
          error && "border-destructive focus-visible:ring-destructive",
          className,
        )}
        {...props}
      />
      {hint && !error && (
        <p id={`${fieldId}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${fieldId}-error`}
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}
