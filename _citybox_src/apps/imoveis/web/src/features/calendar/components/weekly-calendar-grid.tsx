'use client';

import { useMemo } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { alpha } from '@mui/material/styles';
import { Box, IconButton, Stack, Typography } from '@citybox/mui/atoms';
import { Panel } from '@/components/ui/panel';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import { WEEK_DAY_NAMES } from '@/features/shared/utils/calendar';
import { addDaysIso } from '../services/calendar-service';
import type { CalendarAppointment } from '../types';
import {
  HOUR_HEIGHT,
  HOURS,
  formatHourLabel,
  hourOffsetPx,
  layoutDayEventsByDuration,
  timelineTotalHeight,
  type DayEventsLayout,
} from './calendar-day-layout';
import { CalendarTimedEvents } from './calendar-time-slot';
import { WEEK_GRID_MIN_WIDTH } from './calendar-grid-constants';

type WeeklyCalendarGridProps = {
  weekStart: string;
  selectedDate: string;
  appointments: readonly CalendarAppointment[];
  onWeekChange: (direction: -1 | 1) => void;
  onOpenSlotSheet: (date: string, hour: number) => void;
  onEditAppointment: (appointment: CalendarAppointment) => void;
};

function formatDayHeader(isoDate: string, index: number): string {
  const day = Number(isoDate.slice(8, 10));
  return `${WEEK_DAY_NAMES[index]} ${day}`;
}

const navButtonSx = {
  width: 32,
  height: 32,
  color: 'text.secondary',
  '&:hover': { bgcolor: 'secondary.main', color: 'text.primary' },
} as const;

/**
 * Grade da semana com altura natural. Só scroll X no mobile se a tela for estreita.
 * Sem scroll vertical na grade — a página rola.
 */
export function WeeklyCalendarGrid({
  weekStart,
  selectedDate,
  appointments,
  onWeekChange,
  onOpenSlotSheet,
  onEditAppointment,
}: WeeklyCalendarGridProps) {
  const hourHeight = HOUR_HEIGHT;
  const totalHeight = timelineTotalHeight(hourHeight);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDaysIso(weekStart, i)),
    [weekStart],
  );

  const layoutByDay = useMemo(() => {
    const map = new Map<string, DayEventsLayout>();
    for (const date of days) {
      map.set(
        date,
        layoutDayEventsByDuration(
          appointments.filter((item) => item.date === date),
          hourHeight,
        ),
      );
    }
    return map;
  }, [appointments, days, hourHeight]);

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
            aria-label="Semana anterior"
            size="small"
            onClick={() => onWeekChange(-1)}
            sx={navButtonSx}
          >
            <ChevronLeftIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            type="button"
            aria-label="Próxima semana"
            size="small"
            onClick={() => onWeekChange(1)}
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
          }}
        >
          {formatDayHeader(days[0], 0)} – {formatDayHeader(days[6], 6)}
        </Typography>
      </Stack>

      {/* Apenas scroll horizontal no mobile se a grade não couber. */}
      <Box
        sx={{
          width: '100%',
          overflowX: { xs: 'auto', lg: 'visible' },
          overflowY: 'visible',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Box sx={{ minWidth: { xs: WEEK_GRID_MIN_WIDTH, lg: '100%' } }}>
          <Box
            sx={{
              bgcolor: (theme) => listifyElevatedSurface(theme),
              display: 'grid',
              gridTemplateColumns: {
                xs: '40px repeat(7, minmax(96px, 1fr))',
                sm: '48px repeat(7, minmax(96px, 1fr))',
                lg: '48px repeat(7, minmax(0, 1fr))',
              },
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box />
            {days.map((date, index) => (
              <Typography
                key={date}
                sx={{
                  px: { xs: 0.25, sm: 0.5 },
                  py: 1,
                  textAlign: 'center',
                  fontSize: { xs: 10, sm: 12 },
                  fontWeight: 500,
                  color:
                    date === selectedDate ? 'primary.main' : 'text.secondary',
                }}
              >
                {formatDayHeader(date, index)}
              </Typography>
            ))}
          </Box>

          <Box
            sx={{
              position: 'relative',
              display: 'grid',
              height: totalHeight,
              gridTemplateColumns: {
                xs: '40px repeat(7, minmax(96px, 1fr))',
                sm: '48px repeat(7, minmax(96px, 1fr))',
                lg: '48px repeat(7, minmax(0, 1fr))',
              },
            }}
          >
            <Box sx={{ position: 'relative' }}>
              {HOURS.map((hour) => (
                <Box
                  key={hour}
                  component="button"
                  type="button"
                  aria-label={`Ver compromissos às ${formatHourLabel(hour)}`}
                  onClick={() => onOpenSlotSheet(selectedDate, hour)}
                  sx={{
                    position: 'absolute',
                    right: { xs: 2, sm: 6 },
                    border: 0,
                    bgcolor: 'transparent',
                    cursor: 'pointer',
                    fontSize: { xs: 9, sm: 11 },
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

            {days.map((date) => {
              const { events, overflows = [] } = layoutByDay.get(date) ?? {
                events: [],
                overflows: [],
              };

              return (
                <Box
                  key={date}
                  sx={{
                    position: 'relative',
                    minWidth: 0,
                    borderLeft: '1px solid',
                    borderColor: 'divider',
                    bgcolor:
                      date === selectedDate
                        ? (theme) => alpha(theme.palette.primary.main, 0.04)
                        : 'transparent',
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
                          bgcolor: (theme) =>
                            alpha(theme.palette.secondary.main, 0.4),
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
              );
            })}
          </Box>
        </Box>
      </Box>
    </Panel>
  );
}
