'use client';

import type { ChangeEvent } from 'react';
import { Box, Stack } from '@citybox/mui/atoms';
import { settingsFieldLabelSx } from '@/features/settings/lib/settings-muted';
import { normalizeCategoryHex } from '@/lib/category-colors';

type CategoryColorFieldProps = {
  id?: string;
  value: string;
  onChange: (hex: string) => void;
  label?: string;
  disabled?: boolean;
};

/** Campo de cor por saturação (`input type="color"`). Valor sempre `#rrggbb`. */
export function CategoryColorField({
  id = 'category-color',
  value,
  onChange,
  label = 'Cor',
  disabled = false,
}: CategoryColorFieldProps) {
  const hex = normalizeCategoryHex(value);

  return (
    <Stack spacing={0.75}>
      <Box
        component="label"
        htmlFor={id}
        sx={settingsFieldLabelSx()}
      >
        {label}
      </Box>
      <Box
        component="input"
        id={id}
        type="color"
        value={hex}
        disabled={disabled}
        aria-label={label}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(normalizeCategoryHex(event.target.value))
        }
        sx={{
          width: 40,
          height: 40,
          cursor: disabled ? 'default' : 'pointer',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          p: 0.5,
          bgcolor: 'transparent',
        }}
      />
    </Stack>
  );
}
