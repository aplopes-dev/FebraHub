"use client";

import { cn } from "@citybox/ui";

/** Máscara manual de telefone BR: (99) 99999-9999 (substitui use-mask-input). */
function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.replace(/^(\d{0,2})/, "($1");
  if (digits.length <= 7) return digits.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
  return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

interface PhoneFieldProps {
  id: string;
  label: string;
  helpText?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  primaryColor?: string;
}

export function PhoneField({
  id,
  label,
  helpText,
  required,
  value,
  onChange,
  error,
  primaryColor = "#3b82f6",
}: PhoneFieldProps) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-foreground mb-2">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      
      <input
        id={id}
        type="tel"
        inputMode="tel"
        placeholder="(00) 00000-0000"
        value={value}
        onChange={(e) => onChange(maskPhone(e.target.value))}
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
