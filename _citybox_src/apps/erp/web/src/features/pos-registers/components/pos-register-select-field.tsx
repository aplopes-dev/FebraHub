"use client";

import { useState } from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@citybox/mui";
import type { PosRegisterOption } from "@/features/pos-registers/types/pos-register";

type PosRegisterSelectFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly PosRegisterOption[];
  /**
   * Texto da opção vazia **só no dropdown** (ex.: "Nenhum").
   * Não aparece no campo fechado — o label flutuante é o placeholder.
   */
  emptyOptionLabel?: string;
  disabled?: boolean;
  required?: boolean;
};

/** Select outlined com label flutuante — padrão dos formulários do ERP. */
export function PosRegisterSelectField({
  id,
  label,
  value,
  onChange,
  options,
  emptyOptionLabel,
  disabled,
  required,
}: PosRegisterSelectFieldProps) {
  const labelId = `${id}-label`;
  const [focused, setFocused] = useState(false);
  const hasValue = Boolean(value);
  /** Só entalha a borda / sobe o label com valor ou foco — evita o “buraco” branco. */
  const shrink = hasValue || focused;

  return (
    <FormControl fullWidth disabled={disabled} required={required}>
      <InputLabel id={labelId} shrink={shrink}>
        {label}
      </InputLabel>
      <Select
        labelId={labelId}
        id={id}
        label={label}
        value={value}
        displayEmpty
        notched={shrink}
        renderValue={(selected) => {
          if (!selected) return "";
          return (
            options.find((option) => option.id === selected)?.label ?? ""
          );
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => onChange(String(event.target.value))}
      >
        {emptyOptionLabel ? (
          <MenuItem value="">{emptyOptionLabel}</MenuItem>
        ) : null}
        {options.map((option) => (
          <MenuItem key={option.id} value={option.id}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
