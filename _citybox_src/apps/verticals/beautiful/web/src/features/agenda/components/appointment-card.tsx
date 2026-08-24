'use client';

import {
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
  Tooltip,
} from '@citybox/mui/atoms';
import type { AgendaAppointment } from '../types/agenda.types';
import { APPOINTMENT_STATUS_VISUAL } from '../utils/agenda-status';
import { AppointmentTooltipContent } from './appointment-tooltip-content';

type AppointmentCardProps = {
  appointment: AgendaAppointment;
  /** Densidade visual: mês/semana (compact) ou dia (comfortable). */
  density?: 'compact' | 'comfortable';
  onClick?: (appointment: AgendaAppointment) => void;
};

export function AppointmentCard({
  appointment,
  density = 'compact',
  onClick,
}: AppointmentCardProps) {
  const visual = APPOINTMENT_STATUS_VISUAL[appointment.status];
  const compact = density === 'compact';
  const contentPy = compact ? 0.4 : 0.75;
  const contentPx = compact ? 0.75 : 1;

  return (
    <Tooltip
      title={<AppointmentTooltipContent appointment={appointment} />}
      arrow
      placement="top"
      enterDelay={200}
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: 3,
            border: '1px solid',
            borderColor: 'divider',
            p: 1,
            maxWidth: 300,
          },
        },
        arrow: {
          sx: { color: 'background.paper' },
        },
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: '100%',
          bgcolor: visual.softBg,
          color: visual.softFg ?? 'common.white',
          borderRadius: 1,
          overflow: 'hidden',
          transition: 'filter 0.15s, transform 0.15s',
          '&:hover': {
            filter: 'brightness(0.92)',
            transform: 'translateY(-1px)',
          },
        }}
      >
        <CardActionArea
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(appointment);
          }}
          sx={{
            alignItems: 'stretch',
            justifyContent: 'flex-start',
            color: 'inherit',
          }}
        >
          <CardContent
            sx={{
              px: contentPx,
              py: contentPy,
              '&:last-child': { pb: contentPy },
              minWidth: 0,
            }}
          >
            <Stack spacing={compact ? 0 : 0.25} sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  color: 'common.white',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {appointment.startTime} {appointment.clientName}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'common.white',
                  opacity: compact ? 0.85 : 0.9,
                  fontSize: compact ? '0.65rem' : undefined,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {appointment.serviceName}
              </Typography>
            </Stack>
          </CardContent>
        </CardActionArea>
      </Card>
    </Tooltip>
  );
}
