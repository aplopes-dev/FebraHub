'use client';

import type { SxProps, Theme } from '@mui/material/styles';
import { Box, Stack } from '@citybox/mui/atoms';
import { primarySoftShadow } from '@/theme/accent-styles';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import { listifyShadows } from '@/theme/tokens';

export type SegmentedControlItem<T extends string> = {
  id: T;
  label: string;
  /** Rótulo curto em telas estreitas (opcional). */
  shortLabel?: string;
};

type SegmentedControlProps<T extends string> = {
  items: readonly SegmentedControlItem<T>[];
  value: T;
  onChange: (value: T) => void;
  'aria-label': string;
  sx?: SxProps<Theme>;
};

/**
 * Controle segmentado — cantos moderados (não pill), full-width no mobile.
 */
export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  'aria-label': ariaLabel,
  sx,
}: SegmentedControlProps<T>) {
  return (
    <Stack
      direction="row"
      role="tablist"
      aria-label={ariaLabel}
      sx={(theme) => ({
        display: 'flex',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        alignItems: 'stretch',
        gap: 0.5,
        p: 0.5,
        borderRadius: '10px',
        bgcolor: listifyElevatedSurface(theme),
        boxShadow: theme.palette.mode === 'dark' ? 'none' : listifyShadows.xs,
        outline: '1px solid',
        outlineColor:
          theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.08)'
            : theme.palette.divider,
        outlineOffset: -1,
        ...(typeof sx === 'function' ? (sx(theme) as object) : (sx as object)),
      })}
    >
      {items.map((item) => {
        const selected = value === item.id;
        const short = item.shortLabel ?? item.label;
        return (
          <Box
            key={item.id}
            component="button"
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={item.label}
            onClick={() => onChange(item.id)}
            sx={{
              flex: 1,
              minWidth: 0,
              border: 0,
              cursor: 'pointer',
              px: { xs: 1, sm: 2 },
              py: { xs: 1, sm: 1.125 },
              minHeight: { xs: 40, sm: 36 },
              borderRadius: '8px',
              fontFamily: 'inherit',
              fontWeight: 500,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              lineHeight: 1.3,
              textAlign: 'center',
              whiteSpace: { xs: 'normal', sm: 'nowrap' },
              transition: 'background-color 0.15s, color 0.15s, box-shadow 0.15s',
              ...(selected
                ? {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    boxShadow: (theme: Theme) => primarySoftShadow(theme),
                  }
                : {
                    bgcolor: 'transparent',
                    color: 'text.secondary',
                    '&:hover': {
                      bgcolor: 'secondary.main',
                      color: 'text.primary',
                    },
                  }),
            }}
          >
            <Box
              component="span"
              sx={{ display: { xs: 'inline', sm: 'none' } }}
            >
              {short}
            </Box>
            <Box
              component="span"
              sx={{ display: { xs: 'none', sm: 'inline' } }}
            >
              {item.label}
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}
