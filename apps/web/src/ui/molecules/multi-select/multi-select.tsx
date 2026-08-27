"use client";

import type { ReactNode, SyntheticEvent } from "react";
import Chip from "@mui/material/Chip";
import { Autocomplete } from "../autocomplete";

export type MultiSelectOption = {
  value: string;
  label: string;
};

export type MultiSelectProps = {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  label?: ReactNode;
  placeholder?: string;
  helperText?: ReactNode;
  error?: boolean;
  errorMessage?: ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  /** Máximo de chips exibidos antes de agrupar em "+N". */
  limitTags?: number;
};

/**
 * Seleção múltipla com chips — API amigável sobre Autocomplete `multiple`.
 */
export function MultiSelect({
  options,
  value,
  onChange,
  label,
  placeholder = "Selecionar…",
  helperText,
  error,
  errorMessage,
  disabled,
  fullWidth = true,
  limitTags = 3,
}: MultiSelectProps) {
  const selected = options.filter((option) => value.includes(option.value));

  function handleChange(
    _event: SyntheticEvent,
    next: MultiSelectOption[],
  ) {
    onChange(next.map((option) => option.value));
  }

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      options={options}
      value={selected}
      onChange={handleChange}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, selectedOption) =>
        option.value === selectedOption.value
      }
      label={label}
      placeholder={selected.length === 0 ? placeholder : undefined}
      helperText={helperText}
      error={error}
      errorMessage={errorMessage}
      disabled={disabled}
      fullWidth={fullWidth}
      limitTags={limitTags}
      renderValue={(tagValue, getItemProps) =>
        tagValue.map((option, index) => {
          const { key, ...itemProps } = getItemProps({ index });
          return (
            <Chip
              key={key}
              label={option.label}
              {...itemProps}
            />
          );
        })
      }
    />
  );
}
