'use client';

import { useMemo } from 'react';
import { Box, Stack, Typography } from '@citybox/mui/atoms';
import type { AgendaAppointment, AgendaProfessional } from '../types/agenda.types';
import { timeToMinutes, todayIso } from '../utils/agenda-date';
import {
  isWorkingHourSlot,
  useProfessionalsWorkSchedulesQuery,
} from '../hooks/use-professionals-work-schedules';
import { AppointmentCard } from './appointment-card';
import { AgendaNowIndicator } from './agenda-now-indicator';

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
const HOUR_HEIGHT = 72;

type DayAgendaGridProps = {
  date: string;
  appointments: AgendaAppointment[];
  professionals: AgendaProfessional[];
  onSelectAppointment?: (appointment: AgendaAppointment) => void;
  onEmptySlotClick?: (professionalId: string, hour: number) => void;
};

function hourLabels(): number[] {
  return Array.from(
    { length: DAY_END_HOUR - DAY_START_HOUR },
    (_, i) => DAY_START_HOUR + i,
  );
}

export function DayAgendaGrid({
  date,
  appointments,
  professionals,
  onSelectAppointment,
  onEmptySlotClick,
}: DayAgendaGridProps) {
  const hours = hourLabels();
  const totalHeight = hours.length * HOUR_HEIGHT;

  const professionalIds = useMemo(
    () => professionals.map((p) => p.id),
    [professionals],
  );

  const { schedulesByProfessionalId, isLoading: loadingSchedules } =
    useProfessionalsWorkSchedulesQuery(professionalIds);

  const scheduleReady = !loadingSchedules;

  const dayAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.date === date)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [appointments, date],
  );

  const byProfessional = useMemo(() => {
    const map = new Map<string, AgendaAppointment[]>();
    for (const pro of professionals) {
      map.set(pro.id, []);
    }
    for (const apt of dayAppointments) {
      const list = map.get(apt.professionalId);
      if (list) list.push(apt);
    }
    return map;
  }, [dayAppointments, professionals]);

  if (professionals.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Nenhum profissional ativo para exibir. Ajuste o filtro ou cadastre
          membros com papel Profissional em Equipe.
        </Typography>
      </Box>
    );
  }

  const gridColumns = `56px repeat(${professionals.length}, minmax(160px, 1fr))`;
  const gridMinWidth = 56 + professionals.length * 160;
  const showNowIndicator = date === todayIso();

  return (
    <Box sx={{ overflow: 'auto', flex: 1, minHeight: 500 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: gridColumns,
          minWidth: gridMinWidth,
          position: 'sticky',
          top: 0,
          zIndex: 4,
        }}
      >
        {/* Header — fundo sólido (sticky: action.hover é transparente e “vaza” o grid) */}
        <Box
          sx={{
            position: 'relative',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? theme.palette.grey[900]
                : theme.palette.grey[100],
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              transform: 'translateY(50%)',
              textAlign: 'center',
              fontWeight: 600,
              fontSize: 11,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
              zIndex: 1,
            }}
          >
            {String(DAY_START_HOUR).padStart(2, '0')}:00
          </Typography>
        </Box>
        {professionals.map((pro) => (
          <Box
            key={pro.id}
            sx={{
              borderBottom: '1px solid',
              borderLeft: '1px solid',
              borderColor: 'divider',
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? theme.palette.grey[900]
                  : theme.palette.grey[100],
              px: 1.5,
              py: 1.25,
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: pro.color,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {pro.name}
              </Typography>
            </Stack>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: gridColumns,
          minWidth: gridMinWidth,
        }}
      >
        {/* Time gutter — rótulo na linha da hora (não no centro da faixa) */}
        <Box sx={{ position: 'relative', height: totalHeight }}>
          {hours.map((hour, index) => (
            <Box
              key={hour}
              sx={{
                position: 'relative',
                height: HOUR_HEIGHT,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              {index !== 0 ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    transform: 'translateY(-50%)',
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: 11,
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                    bgcolor: 'background.paper',
                  }}
                >
                  {String(hour).padStart(2, '0')}:00
                </Typography>
              ) : null}
            </Box>
          ))}
        </Box>

        {/* Professional columns */}
        {professionals.map((pro) => {
          const columnApts = byProfessional.get(pro.id) ?? [];
          return (
            <Box
              key={pro.id}
              sx={{
                position: 'relative',
                height: totalHeight,
                borderLeft: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              {hours.map((hour) => {
                const available = isWorkingHourSlot(
                  schedulesByProfessionalId,
                  pro.id,
                  date,
                  hour,
                  scheduleReady,
                );
                const canClick = Boolean(onEmptySlotClick) && available;

                return (
                  <Box
                    key={hour}
                    component={canClick ? 'button' : 'div'}
                    type={canClick ? 'button' : undefined}
                    onClick={
                      canClick
                        ? () => onEmptySlotClick?.(pro.id, hour)
                        : undefined
                    }
                    aria-disabled={!available}
                    sx={{
                      display: 'block',
                      width: '100%',
                      height: HOUR_HEIGHT,
                      m: 0,
                      p: 0,
                      border: 'none',
                      borderBottom: '1px dashed',
                      borderColor: 'divider',
                      borderRadius: 0,
                      bgcolor: available ? 'transparent' : 'action.disabledBackground',
                      cursor: canClick ? 'pointer' : 'not-allowed',
                      opacity: available ? 1 : 0.72,
                      transition: 'background-color 0.15s',
                      '&:hover': canClick
                        ? { bgcolor: 'action.hover' }
                        : undefined,
                    }}
                  />
                );
              })}

              {columnApts.map((apt) => {
                const startMin = timeToMinutes(apt.startTime);
                const endMin = timeToMinutes(apt.endTime);
                const top =
                  ((startMin - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT;
                const height = Math.max(
                  ((endMin - startMin) / 60) * HOUR_HEIGHT - 4,
                  28,
                );

                return (
                  <Box
                    key={apt.id}
                    sx={{
                      position: 'absolute',
                      left: 4,
                      right: 4,
                      top,
                      height,
                      zIndex: 1,
                    }}
                  >
                    <AppointmentCard
                      appointment={apt}
                      density="comfortable"
                      onClick={onSelectAppointment}
                    />
                  </Box>
                );
              })}
            </Box>
          );
        })}

        {showNowIndicator ? (
          <AgendaNowIndicator
            firstVisibleHour={DAY_START_HOUR}
            lastVisibleHour={DAY_END_HOUR}
            hourHeight={HOUR_HEIGHT}
            gutterWidth={56}
          />
        ) : null}
      </Box>
    </Box>
  );
}
