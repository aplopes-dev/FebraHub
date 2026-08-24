'use client';

import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Box } from '@citybox/mui/atoms';
import type { CalendarAppointment } from '../types';
import type {
  PositionedDayEvent,
  PositionedDayOverflow,
} from './calendar-day-layout';
import {
  AppointmentEventCard,
  densityFromHeight,
} from './appointment-event-card';
import { AppointmentPopover } from './appointment-hover-card';
import { SlotOverflowLabel } from './slot-overflow-chip';

type CalendarTimedEventsProps = {
  events: readonly PositionedDayEvent[];
  overflows?: readonly PositionedDayOverflow[];
  onEditAppointment: (appointment: CalendarAppointment) => void;
  /** Clique no badge "+N" → lista completa do horário. */
  onOpenOverflow?: (slotHour: number) => void;
};

/**
 * Cards absolutos na coluna do dia — altura = duração do compromisso.
 * Overflows: badge "+N" que abre a sheet de todos no período.
 */
export function CalendarTimedEvents({
  events,
  overflows = [],
  onEditAppointment,
  onOpenOverflow,
}: CalendarTimedEventsProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        pointerEvents: 'none',
        position: 'absolute',
        inset: 0,
        zIndex: 10,
      }}
    >
      {events.map((item) => {
        const density = densityFromHeight(item.height);
        const useSlotChip = density === 'xs';
        const insetX = 2;
        const leftPct = item.left * 100;
        const widthPct = item.width * 100;

        return (
          <Box
            key={item.appointment.id}
            sx={{
              pointerEvents: 'auto',
              position: 'absolute',
              top: item.top,
              height: item.height,
              left: `calc(${leftPct}% + ${insetX}px)`,
              width: `calc(${widthPct}% - ${insetX * 2}px)`,
              overflow: 'hidden',
            }}
          >
            <AppointmentPopover
              appointment={item.appointment}
              onEdit={onEditAppointment}
            >
              <Box
                component="button"
                type="button"
                title={item.appointment.title}
                onClick={(event) => event.stopPropagation()}
                sx={{
                  height: '100%',
                  width: '100%',
                  overflow: 'hidden',
                  border: 0,
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  borderRadius: '16px',
                  p: 0,
                  textAlign: 'left',
                  transition: 'opacity 0.15s',
                  '&:hover': { opacity: 0.95 },
                }}
              >
                <AppointmentEventCard
                  appointment={item.appointment}
                  variant={useSlotChip ? 'slot' : 'card'}
                  density={density}
                  compact={isMobile}
                  showDateAndKind
                  showEndTime
                />
              </Box>
            </AppointmentPopover>
          </Box>
        );
      })}

      {overflows.map((item, index) => {
        const insetX = 2;
        const leftPct = item.left * 100;
        const widthPct = item.width * 100;
        return (
          <Box
            key={`overflow-${item.slotHour}-${item.top}-${index}`}
            sx={{
              pointerEvents: 'auto',
              position: 'absolute',
              top: item.top,
              height: item.height,
              left: `calc(${leftPct}% + ${insetX}px)`,
              width: `calc(${widthPct}% - ${insetX * 2}px)`,
              borderRadius: '12px',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              border: '1px dashed',
              borderColor: 'primary.light',
              overflow: 'hidden',
            }}
          >
            <SlotOverflowLabel
              hiddenCount={item.hiddenCount}
              variant="timeline"
              onToggle={() => onOpenOverflow?.(item.slotHour)}
            />
          </Box>
        );
      })}
    </Box>
  );
}
