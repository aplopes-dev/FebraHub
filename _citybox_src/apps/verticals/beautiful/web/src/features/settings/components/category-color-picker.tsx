'use client';

import { Box, Stack, Typography } from '@citybox/mui/atoms';
import { normalizeCategoryHex } from '@/lib/category-colors';

type CategoryColorBadgeProps = {
  colorId: string | null | undefined;
  label?: string;
};

export function CategoryColorBadge({ colorId, label }: CategoryColorBadgeProps) {
  if (!colorId && !label) return null;
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      {colorId ? (
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: normalizeCategoryHex(colorId),
            flexShrink: 0,
          }}
        />
      ) : null}
      {label ? (
        <Typography variant="body2" sx={{ color: 'text.primary' }}>
          {label}
        </Typography>
      ) : null}
    </Stack>
  );
}
