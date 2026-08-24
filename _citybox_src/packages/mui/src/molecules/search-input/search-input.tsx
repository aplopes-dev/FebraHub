"use client";

import InputAdornment from "@mui/material/InputAdornment";
import { Icon } from "../../icons/icon";
import { Input, type InputProps } from "../../atoms/input";

export type SearchInputProps = Omit<InputProps, "type"> & {
  /** Placeholder padrão de busca. */
  placeholder?: string;
};

export function SearchInput({
  placeholder = "Buscar…",
  slotProps,
  ...props
}: SearchInputProps) {
  return (
    <Input
      type="search"
      placeholder={placeholder}
      slotProps={{
        ...slotProps,
        input: {
          ...slotProps?.input,
          startAdornment: (
            <InputAdornment position="start">
              <Icon name="search" variant="linear" size={18} />
            </InputAdornment>
          ),
        },
      }}
      {...props}
    />
  );
}
