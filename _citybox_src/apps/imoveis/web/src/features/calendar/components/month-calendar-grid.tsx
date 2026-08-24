'use client';

import { useMemo } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { alpha } from '@mui/material/styles';
import { Box, IconButton, Stack, Typography } from '@citybox/mui/atoms';
import { Panel } from '@/components/ui/panel';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import {
  WEEK_DAY_NAMES,
  getMonthGridCells,
  getMonthLabel,
  type MonthRef,
} from '@/features/shared/utils/calendar';
import { primarySoftShadow } from '@/theme/accent-styles';
import type { CalendarAppointment } from '../types';
import { AppointmentEventCard } from './appointment-event-card';
import { AppointmentPopover } from './appointment-hover-card';
import { SlotOverflowLabel } from './slot-overflow-chip';

/** Cards visíveis no mês (desktop); o restante vira badge “+N” → sheet do dia. */
const MAX_VISIBLE_EVENTS = 2;

type MonthCalendarGridProps = {
  month: MonthRef;
  selectedDate: string;
  appointments: readonly CalendarAppointment[];
  onMonthChange: (direction: -1 | 1) => void;
  onOpenDaySheet: (isoDate: string) => void;
  onEditAppointment: (appointment: CalendarAppointment) => void;
};

const navButtonSx = {
  width: 32,
  height: 32,
  color: 'text.secondary',
  '&:hover': { bgcolor: 'secondary.main', color: 'text.primary' },
} as const;

/**
 * Grade do mês com altura natural por célula. Sem scroll interno — a página rola.
 */
export function MonthCalendarGrid({
  month,
  selectedDate,
  appointments,
  onMonthChange,
  onOpenDaySheet,
  onEditAppointment,
}: MonthCalendarGridProps) {
  const cells = useMemo(() => getMonthGridCells(month), [month]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>();
    for (const item of appointments) {
      const list = map.get(item.date) ?? [];
      list.push(item);
      map.set(item.date, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [appointments]);

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
          py: { xs: 1, sm: 1.5 },
          minWidth: 0,
        }}
      >
        <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center' }}>
          <IconButton
            type="button"
            aria-label="Mês anterior"
            size="small"
            onClick={() => onMonthChange(-1)}
            sx={navButtonSx}
          >
            <ChevronLeftIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            type="button"
            aria-label="Próximo mês"
            size="small"
            onClick={() => onMonthChange(1)}
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
          {getMonthLabel(month)}
        </Typography>
      </Stack>

      <Box
        sx={{
          bgcolor: (theme) => listifyElevatedSurface(theme),
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {WEEK_DAY_NAMES.map((name) => (
          <Typography
            key={name}
            sx={{
              px: { xs: 0.25, sm: 1 },
              py: { xs: 1, sm: 1.5 },
              textAlign: 'center',
              fontSize: { xs: 10, sm: 12 },
              fontWeight: 500,
              color: 'text.secondary',
            }}
          >
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
              {name.charAt(0)}
            </Box>
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              {name}
            </Box>
          </Typography>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gridTemplateRows: {
            xs: 'repeat(6, minmax(56px, auto))',
            sm: 'repeat(6, minmax(96px, auto))',
          },
        }}
      >
        {cells.map((cell) => {
          const dayEvents = eventsByDate.get(cell.date) ?? [];
          const visible = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
          const hiddenCount = Math.max(0, dayEvents.length - MAX_VISIBLE_EVENTS);
          const isSelected = cell.date === selectedDate;

          return (
            <Box
              key={cell.date}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                minWidth: 0,
                gap: { xs: 0.25, sm: 0.5 },
                borderRight: '1px solid',
                borderBottom: '1px solid',
                borderColor: 'divider',
                p: { xs: 0.5, sm: 1 },
                ...(!cell.inMonth
                  ? {
                      bgcolor: (theme) =>
                        alpha(theme.palette.secondary.dark, 0.5),
                    }
                  : {}),
                ...(isSelected
                  ? {
                      bgcolor: (theme) =>
                        alpha(theme.palette.primary.main, 0.06),
                    }
                  : {}),
              }}
            >
              <Box
                component="button"
                type="button"
                onClick={() => onOpenDaySheet(cell.date)}
                aria-label={`Ver compromissos de ${cell.date}`}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: { xs: 22, sm: 24 },
                  height: { xs: 22, sm: 24 },
                  flexShrink: 0,
                  alignSelf: 'flex-start',
                  border: 0,
                  cursor: 'pointer',
                  borderRadius: '6px',
                  fontSize: { xs: 11, sm: 12 },
                  fontWeight: 500,
                  transition: 'background-color 0.15s, color 0.15s',
                  ...(isSelected
                    ? {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        boxShadow: (theme) => primarySoftShadow(theme),
                        '&:hover': { bgcolor: 'primary.main' },
                      }
                    : {
                        bgcolor: 'transparent',
                        color: cell.inMonth ? 'text.primary' : 'text.secondary',
                        '&:hover': { bgcolor: 'secondary.main' },
                      }),
                }}
              >
                {cell.day}
              </Box>

              {/* Mobile: badge de contagem → sheet do dia */}
              <Box
                sx={{
                  display: { xs: 'flex', sm: 'none' },
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  minHeight: 0,
                }}
              >
                {dayEvents.length > 0 ? (
                  <Box
                    component="button"
                    type="button"
                    onClick={() => onOpenDaySheet(cell.date)}
                    aria-label={`${dayEvents.length} compromisso(s)`}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 18,
                      height: 18,
                      px: 0.5,
                      border: 0,
                      borderRadius: 999,
                      cursor: 'pointer',
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      fontSize: 10,
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1,
                    }}
                  >
                    {dayEvents.length > 9 ? '9+' : dayEvents.length}
                  </Box>
                ) : null}
              </Box>

              {/* Desktop: até 2 cards + “+N mais” (sheet com todos) */}
              <Box
                sx={{
                  display: { xs: 'none', sm: 'flex' },
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: 0.5,
                  flexShrink: 0,
                  width: '100%',
                }}
              >
                {visible.map((appointment) => (
                  <Box key={appointment.id} sx={{ flexShrink: 0, width: '100%' }}>
                    <AppointmentPopover
                      appointment={appointment}
                      onEdit={onEditAppointment}
                      side="top"
                    >
                      <Box
                        component="button"
                        type="button"
                        title={appointment.leadName ?? appointment.title}
                        onClick={(event) => event.stopPropagation()}
                        sx={{
                          width: '100%',
                          overflow: 'hidden',
                          border: 0,
                          bgcolor: 'transparent',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          p: 0,
                          textAlign: 'left',
                        }}
                      >
                        <AppointmentEventCard
                          appointment={appointment}
                          variant="slot"
                          compact
                          density="xs"
                          showEndTime={false}
                        />
                      </Box>
                    </AppointmentPopover>
                  </Box>
                ))}
                {hiddenCount > 0 ? (
                  <Box
                    sx={{
                      flexShrink: 0,
                      minHeight: 22,
                      borderRadius: '8px',
                      bgcolor: (theme) =>
                        alpha(theme.palette.primary.main, 0.08),
                      border: '1px dashed',
                      borderColor: 'primary.light',
                    }}
                  >
                    <SlotOverflowLabel
                      hiddenCount={hiddenCount}
                      variant="month"
                      onToggle={() => onOpenDaySheet(cell.date)}
                    />
                  </Box>
                ) : null}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Panel>
  );
}
