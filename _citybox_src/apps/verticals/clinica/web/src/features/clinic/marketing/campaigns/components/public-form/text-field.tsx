"use client";

import { cn } from "@citybox/ui";

interface TextFieldProps {
  id: string;
  label: string;
  helpText?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  primaryColor?: string;
}

export function TextField({
  id,
  label,
  helpText,
  required,
  value,
  onChange,
  error,
  primaryColor = "#3b82f6",
}: TextFieldProps) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-foreground mb-2">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={helpText || error ? `${id}-description` : undefined}
        style={{
          "--focus-color": primaryColor,
        } as React.CSSProperties}
        className={cn(
          "w-full px-4 py-3 rounded-lg border bg-background",
          "text-base transition-colors duration-200",
          "placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-offset-0",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-destructive focus:ring-destructive"
            : "border-input focus:ring-[var(--focus-color)]"
        )}
      />
      
      {(helpText || error) && (
        <p
          id={`${id}-description`}
          className={cn(
            "mt-2 text-sm",
            error ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {error || helpText}
        </p>
      )}
    </div>
  );
}
