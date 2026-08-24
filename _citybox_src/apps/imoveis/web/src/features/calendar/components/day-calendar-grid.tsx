'use client';

import { useMemo } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { alpha } from '@mui/material/styles';
import { Box, IconButton, Stack, Typography } from '@citybox/mui/atoms';
import { Panel } from '@/components/ui/panel';
import { MONTH_NAMES, WEEK_DAY_NAMES } from '@/features/shared/utils/calendar';
import type { CalendarAppointment } from '../types';
import {
  HOUR_HEIGHT,
  HOURS,
  formatHourLabel,
  hourOffsetPx,
  layoutDayEventsByDuration,
  timelineTotalHeight,
} from './calendar-day-layout';
import { CalendarTimedEvents } from './calendar-time-slot';

type DayCalendarGridProps = {
  date: string;
  appointments: readonly CalendarAppointment[];
  onDayChange: (direction: -1 | 1) => void;
  onOpenSlotSheet: (date: string, hour: number) => void;
  onEditAppointment: (appointment: CalendarAppointment) => void;
};

function formatDayTitle(isoDate: string): string {
  const dateObj = new Date(`${isoDate}T12:00:00`);
  const weekday = WEEK_DAY_NAMES[(dateObj.getDay() + 6) % 7];
  const day = dateObj.getDate();
  const month = MONTH_NAMES[dateObj.getMonth()];
  return `${weekday}, ${day} de ${month}`;
}

const navButtonSx = {
  width: 32,
  height: 32,
  color: 'text.secondary',
  '&:hover': { bgcolor: 'secondary.main', color: 'text.primary' },
} as const;

/**
 * Grade do dia com altura natural (HORA fixa). Sem scroll interno — a página rola.
 */
export function DayCalendarGrid({
  date,
  appointments,
  onDayChange,
  onOpenSlotSheet,
  onEditAppointment,
}: DayCalendarGridProps) {
  const hourHeight = HOUR_HEIGHT;
  const totalHeight = timelineTotalHeight(hourHeight);

  const { events, overflows } = useMemo(
    () =>
      layoutDayEventsByDuration(
        appointments.filter((item) => item.date === date),
        hourHeight,
      ),
    [appointments, date, hourHeight],
  );

  return (
    <Panel
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minWidth: 0,
        overflow: 'visible',
        p: 0,
        borderRadius: { xs: '14px', sm: '20px' },
      }}
    >
      <Stack
        direction="row"
        sx={{
          flexShrink: 0,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: { xs: 1.5, sm: 2.5 },
          py: 1,
          minWidth: 0,
        }}
      >
        <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center' }}>
          <IconButton
            type="button"
            aria-label="Dia anterior"
            size="small"
            onClick={() => onDayChange(-1)}
            sx={navButtonSx}
          >
            <ChevronLeftIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            type="button"
            aria-label="Próximo dia"
            size="small"
            onClick={() => onDayChange(1)}
            sx={navButtonSx}
          >
            <ChevronRightIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
        <Typography
          sx={{
            fontSize: { xs: 12, sm: 14 },
            fontWeight: 500,
            color: 'text.secondary',
            textAlign: 'right',
            minWidth: 0,
            flex: 1,
          }}
        >
          {formatDayTitle(date)}
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '48px minmax(0, 1fr)',
            sm: '56px minmax(0, 1fr)',
          },
          height: totalHeight,
          width: '100%',
        }}
      >
        <Box sx={{ position: 'relative' }}>
          {HOURS.map((hour) => (
            <Box
              key={hour}
              component="button"
              type="button"
              aria-label={`Ver compromissos às ${formatHourLabel(hour)}`}
              onClick={() => onOpenSlotSheet(date, hour)}
              sx={{
                position: 'absolute',
                right: { xs: 4, sm: 8 },
                border: 0,
                bgcolor: 'transparent',
                cursor: 'pointer',
                fontSize: { xs: 10, sm: 11 },
                lineHeight: 1,
                color: 'text.secondary',
                transform: 'translateY(-50%)',
                top: hourOffsetPx(hour, hourHeight),
                '&:hover': { color: 'text.primary' },
              }}
            >
              {formatHourLabel(hour)}
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            position: 'relative',
            minWidth: 0,
            borderLeft: '1px solid',
            borderColor: 'divider',
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
          }}
        >
          {HOURS.slice(0, -1).map((hour) => (
            <Box
              key={`${date}-${hour}`}
              component="button"
              type="button"
              aria-label={`Ver compromissos em ${date} às ${hour}h`}
              onClick={() => onOpenSlotSheet(date, hour)}
              sx={{
                position: 'absolute',
                insetInline: 0,
                zIndex: 0,
                border: 0,
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: 'transparent',
                cursor: 'pointer',
                top: hourOffsetPx(hour, hourHeight),
                height: hourHeight,
                transition: 'background-color 0.15s',
                '&:hover': {
                  bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.4),
                },
              }}
            />
          ))}

          <CalendarTimedEvents
            events={events}
            overflows={overflows}
            onEditAppointment={onEditAppointment}
            onOpenOverflow={(hour) => onOpenSlotSheet(date, hour)}
          />
        </Box>
      </Box>
    </Panel>
  );
}
