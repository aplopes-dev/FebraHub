'use client';

import { Input } from '@citybox/ui/atoms';
import { cn } from '@citybox/ui';

/** Aceita só dígitos e formata como HH:mm enquanto digita (máx. 4 dígitos). */
export function formatTypedClinicTime(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

type ClinicTimeFieldProps = {
  id?: string;
  value: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  onChange: (value: string) => void;
};

/**
 * Evita o picker nativo `type="time"` fora da viewport no tablet/mobile
 * (ex.: sheet em 768×1024).
 *
 * &lt;lg: input numérico digitável (HH:mm).
 * lg+: input nativo type="time".
 */
export function ClinicTimeField({
  id,
  value,
  disabled = false,
  invalid = false,
  className,
  onChange,
}: ClinicTimeFieldProps) {
  return (
    <>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="00:00"
        value={value}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={cn('w-full lg:hidden', className)}
        onChange={(event) => onChange(formatTypedClinicTime(event.target.value))}
      />
      <Input
        id={id ? `${id}-desktop` : undefined}
        type="time"
        value={value}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={cn('hidden w-full lg:flex', className)}
        onChange={(event) => onChange(event.target.value)}
      />
    </>
  );
}
