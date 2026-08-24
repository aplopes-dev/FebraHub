'use client';

import { useMemo } from 'react';
import { alpha } from '@mui/material/styles';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import type { AgendaAppointment } from '../types/agenda.types';
import {
  pad2,
  parseIsoDate,
  todayIso,
  weekdayShortFromIso,
  weekDates,
} from '../utils/agenda-date';
import { useCurrentClock } from '../hooks/use-current-clock';
import { AppointmentCard } from './appointment-card';

type WeekAgendaGridProps = {
  cursorDate: string;
  appointments: AgendaAppointment[];
  onSelectDay: (date: string) => void;
  onSelectAppointment?: (appointment: AgendaAppointment) => void;
};

export function WeekAgendaGrid({
  cursorDate,
  appointments,
  onSelectDay,
  onSelectAppointment,
}: WeekAgendaGridProps) {
  const days = useMemo(() => weekDates(cursorDate), [cursorDate]);
  const today = todayIso();
  const now = useCurrentClock();
  const nowLabel = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;

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

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: 'repeat(7, minmax(0, 1fr))',
        },
        // Uma linha com altura limitada — sem isso a grade cresce e o scroll sobe à página
        gridTemplateRows: {
          xs: 'auto',
          md: 'minmax(0, 1fr)',
        },
        alignItems: 'stretch',
        flex: 1,
        minHeight: 0,
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
      }}
    >
      {days.map((date) => {
        const dayApts = byDate.get(date) ?? [];
        const isToday = date === today;
        const dayNum = parseIsoDate(date).getDate();

        return (
          <Box
            key={date}
            sx={{
              borderRightStyle: 'solid',
              borderRightWidth: { md: 1, xs: 0 },
              borderBottomStyle: 'solid',
              borderBottomWidth: { md: 0, xs: 1 },
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              // minHeight: 0 é obrigatório para grid item permitir overflow interno
              minHeight: { xs: 220, md: 0 },
              maxHeight: { xs: 320, md: '100%' },
              height: { md: '100%' },
              overflow: 'hidden',
              bgcolor: isToday
                ? (theme) => alpha(theme.palette.primary.main, 0.08)
                : 'background.paper',
              '&:last-child': { borderRightWidth: 0 },
            }}
          >
            <Box
              component="button"
              type="button"
              onClick={() => onSelectDay(date)}
              sx={{
                border: 'none',
                bgcolor: 'transparent',
                cursor: 'pointer',
                px: 1.25,
                py: 1,
                textAlign: 'left',
                borderBottom: '1px solid',
                borderColor: 'divider',
                flexShrink: 0,
                '&:hover': {
                  bgcolor: isToday
                    ? (theme) => alpha(theme.palette.primary.main, 0.06)
                    : 'action.hover',
                },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: isToday ? 'primary.main' : 'text.secondary',
                  display: 'block',
                }}
              >
                {weekdayShortFromIso(date)}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: isToday ? 800 : 700,
                  color: isToday ? 'primary.main' : 'text.primary',
                  lineHeight: 1.2,
                }}
              >
                {dayNum}
              </Typography>
            </Box>

            {/* Scroll vertical isolado nesta coluna */}
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                overscrollBehavior: 'contain',
                p: 1,
              }}
            >
              <Stack spacing={0.5}>
                {dayApts.map((apt) => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    density="compact"
                    onClick={onSelectAppointment}
                  />
                ))}
                {dayApts.length === 0 ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ px: 0.5, pt: 1 }}
                  >
                    Sem horários
                  </Typography>
                ) : null}
              </Stack>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
