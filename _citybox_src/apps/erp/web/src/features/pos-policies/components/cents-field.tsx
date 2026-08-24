"use client";

import { FormField } from "@citybox/mui";

type CentsFieldProps = {
  id: string;
  label: string;
  /** Valor em **centavos** — a mesma unidade da API e do PDV. */
  value: number;
  onChange: (cents: number) => void;
  helperText?: string;
  disabled?: boolean;
};

/** `12345` → `R$ 123,45`. */
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Campo de dinheiro no comportamento de caixa registradora: os dígitos entram
 * pelos centavos e o campo reescreve a máscara inteira.
 *
 * É o mesmo comportamento do `PdvMoneyField` no app do PDV, de propósito — o
 * número configurado aqui é lido lá, e duas convenções de digitação para o
 * mesmo valor produzem "configurei R$ 500 e o caixa entendeu R$ 5".
 */
export function CentsField({
  id,
  label,
  value,
  onChange,
  helperText,
  disabled,
}: CentsFieldProps) {
  return (
    <FormField
      id={id}
      label={label}
      value={formatCents(value)}
      helperText={helperText}
      disabled={disabled}
      slotProps={{ htmlInput: { inputMode: "numeric" } }}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "").slice(0, 12);
        onChange(digits ? Number(digits) : 0);
      }}
    />
  );
}
