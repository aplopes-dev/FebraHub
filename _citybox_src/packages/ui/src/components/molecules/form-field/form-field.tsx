"use client";

import * as React from "react";
import { Label } from "../../atoms/label";
import { Input } from "../../atoms/input";
import { cn } from "../../../lib/utils";

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function InputField({
  label,
  error,
  hint,
  required,
  className,
  id,
  ...props
}: InputFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId}>
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-hidden>
            *
          </span>
        )}
      </Label>
      <Input
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
