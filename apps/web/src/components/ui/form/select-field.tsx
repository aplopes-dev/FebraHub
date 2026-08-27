"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

export type SelectFieldOption = {
  value: string;
  label: string;
};

export type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectFieldOption[];
  helperText?: ReactNode;
  /** Texto exibido quando não há valor. Adiciona a opção vazia no menu. */
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  /** Mostra uma bolinha com a cor do `value` (usado na cor da marca). */
  withColorSwatch?: boolean;
};

function ColorSwatch({ color }: { color: string }) {
  return (
    <Box
      aria-hidden
      component="span"
      sx={{
        width: 14,
        height: 14,
        borderRadius: "50%",
        bgcolor: color,
        flexShrink: 0,
      }}
    />
  );
}

/**
 * Select outlined com label flutuante — paridade com `FormField`.
 *
 * Com `placeholder`, o label fica sempre encolhido (`shrink` + `notched`):
 * sem isso, label e placeholder ocupariam a mesma linha e se sobreporiam.
 */
export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  helperText,
  placeholder,
  disabled,
  required,
  withColorSwatch = false,
}: SelectFieldProps) {
  const labelId = `${id}-label`;
  const hasPlaceholder = Boolean(placeholder);

  return (
    <FormControl fullWidth disabled={disabled} required={required}>
      <InputLabel id={labelId} shrink={hasPlaceholder ? true : undefined}>
        {label}
      </InputLabel>
      <Select
        labelId={labelId}
        id={id}
        label={label}
        value={value}
        displayEmpty={hasPlaceholder}
        notched={hasPlaceholder ? true : undefined}
        onChange={(event) => onChange(String(event.target.value))}
        renderValue={(selected) => {
          const current = options.find((option) => option.value === selected);
          if (!current) {
            return (
              <Box component="span" sx={{ color: "text.disabled" }}>
                {placeholder ?? ""}
              </Box>
            );
          }
          if (!withColorSwatch) return current.label;

          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ColorSwatch color={current.value} />
              {current.label}
            </Box>
          );
        }}
      >
        {hasPlaceholder ? (
          <MenuItem value="">
            <em>{placeholder}</em>
          </MenuItem>
        ) : null}
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {withColorSwatch ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ColorSwatch color={option.value} />
                {option.label}
              </Box>
            ) : (
              option.label
            )}
          </MenuItem>
        ))}
      </Select>
      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  );
}
