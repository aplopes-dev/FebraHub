'use client';

import { Box, Stack } from '@citybox/mui/atoms';
import { primarySoftShadow } from '@/theme/accent-styles';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import { listifyShadows } from '@/theme/tokens';
import {
  CALENDAR_VIEW_MODE_LABEL,
  type CalendarViewMode,
} from '../types';

type CalendarViewToggleProps = {
  value: CalendarViewMode;
  onChange: (value: CalendarViewMode) => void;
};

const VIEW_OPTIONS: readonly CalendarViewMode[] = ['day', 'week', 'month'];

/** Segmented control Dia/Semana/Mês — full-width no mobile. */
export function CalendarViewToggle({ value, onChange }: CalendarViewToggleProps) {
  return (
    <Stack
      direction="row"
      spacing={0.5}
      role="group"
      aria-label="Visualização da agenda"
      sx={(theme) => ({
        width: { xs: '100%', sm: 'auto' },
        minWidth: 0,
        p: 0.5,
        borderRadius: '10px',
        bgcolor: listifyElevatedSurface(theme),
        boxShadow: listifyShadows.xs,
      })}
    >
      {VIEW_OPTIONS.map((mode) => {
        const selected = value === mode;
        return (
          <Box
            key={mode}
            component="button"
            type="button"
            aria-pressed={selected}
            aria-label={CALENDAR_VIEW_MODE_LABEL[mode]}
            onClick={() => onChange(mode)}
            sx={{
              flex: { xs: 1, sm: '0 0 auto' },
              minWidth: { xs: 0, sm: 72 },
              border: 0,
              cursor: 'pointer',
              px: { xs: 1, sm: 2 },
              py: { xs: 1, sm: 1 },
              minHeight: 36,
              borderRadius: '8px',
              fontFamily: 'inherit',
              fontWeight: 500,
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
              lineHeight: 1.4,
              textAlign: 'center',
              transition: 'background-color 0.15s, color 0.15s, box-shadow 0.15s',
              ...(selected
                ? {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    boxShadow: (theme) => primarySoftShadow(theme),
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
            {CALENDAR_VIEW_MODE_LABEL[mode]}
          </Box>
        );
      })}
    </Stack>
  );
}
