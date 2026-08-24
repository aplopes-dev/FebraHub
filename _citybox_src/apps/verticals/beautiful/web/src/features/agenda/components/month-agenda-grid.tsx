'use client';

import { useMemo } from 'react';
import { alpha } from '@mui/material/styles';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import type { AgendaAppointment } from '../types/agenda.types';
import { getMonthGridCells } from '../utils/agenda-date';
import { AppointmentCard } from './appointment-card';

const MAX_VISIBLE = 3;

type MonthAgendaGridProps = {
  cursorDate: string;
  appointments: AgendaAppointment[];
  onSelectDay: (date: string) => void;
  onSelectAppointment?: (appointment: AgendaAppointment) => void;
};

export function MonthAgendaGrid({
  cursorDate,
  appointments,
  onSelectDay,
  onSelectAppointment,
}: MonthAgendaGridProps) {
  const cells = useMemo(() => getMonthGridCells(cursorDate), [cursorDate]);

  const byDate = useMemo(() => {
    const map = new Map<string, AgendaAppointment[]>();
    for (const apt of appointments) {
      const list = map.get(apt.date) ?? [];
      list.push(apt);
      map.set(apt.date, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [appointments]);

  // Headers Seg→Dom (grid starts Monday)
  const headers = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <Box
      sx={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 520,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        {headers.map((label) => (
          <Typography
            key={label}
            variant="caption"
            sx={{
              py: 1,
              textAlign: 'center',
              fontWeight: 700,
              color: 'text.secondary',
            }}
          >
            {label}
          </Typography>
        ))}
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(6, minmax(88px, 1fr))',
        }}
      >
        {cells.map((cell) => {
          const dayApts = byDate.get(cell.date) ?? [];
          const visible = dayApts.slice(0, MAX_VISIBLE);
          const overflow = dayApts.length - visible.length;

          return (
            <Box
              key={cell.date}
              component="button"
              type="button"
              onClick={() => onSelectDay(cell.date)}
              sx={{
                border: 'none',
                borderRight: '1px solid',
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: cell.isToday
                  ? (theme) => alpha(theme.palette.primary.main, 0.08)
                  : cell.inCurrentMonth
                    ? 'background.paper'
                    : 'action.hover',
                opacity: cell.inCurrentMonth ? 1 : 0.55,
                p: 0.75,
                textAlign: 'left',
                cursor: 'pointer',
                minHeight: 88,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                '&:hover': {
                  bgcolor: cell.isToday
                    ? (theme) => alpha(theme.palette.primary.main, 0.14)
                    : 'action.selected',
                },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: cell.isToday ? 800 : 600,
                  color: cell.isToday ? 'primary.main' : 'text.primary',
                  px: 0.25,
                }}
              >
                {Number(cell.date.slice(-2))}
              </Typography>

              <Stack spacing={0.4} sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {visible.map((apt) => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    density="compact"
                    onClick={onSelectAppointment}
                  />
                ))}
                {overflow > 0 ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ px: 0.5, fontWeight: 600 }}
                  >
                    +{overflow} mais
                  </Typography>
                ) : null}
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
