"use client";

import * as React from "react";
import { Input } from "../../atoms/input";

/** Converte reais em centavos inteiros, evitando erros de ponto flutuante. */
function toCents(value: number): number {
  return Math.round(value * 100);
}

/** Formata um valor em reais para exibição pt-BR (ex.: 1234.5 → "1.234,50"). */
export function formatBrlCurrency(value: number): string {
  return (toCents(value) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Interpreta o texto digitado como centavos (estilo caixa registradora) e
 * devolve o valor em reais. Ex.: "1.234" → 12.34, "5" → 0.05.
 */
export function parseBrlCurrency(value: string): number {
  const digits = value.replace(/\D/g, "");
  return digits ? Number.parseInt(digits, 10) / 100 : 0;
}

export interface CurrencyInputProps
  extends Omit<
    React.ComponentProps<"input">,
    "value" | "defaultValue" | "onChange" | "type"
  > {
  /** Valor em reais (ex.: 29.9 representa R$ 29,90). */
  value: number;
  onValueChange: (value: number) => void;
}

export function CurrencyInput({
  value,
  onValueChange,
  ...props
}: CurrencyInputProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(parseBrlCurrency(event.target.value));
  };

  return (
    <Input
      inputMode="decimal"
      value={formatBrlCurrency(value)}
      onChange={handleChange}
      {...props}
    />
  );
}
