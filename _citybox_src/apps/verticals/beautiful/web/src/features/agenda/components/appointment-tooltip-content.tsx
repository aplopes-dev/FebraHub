'use client';

import { Box, Stack, Typography, Divider } from '@citybox/mui/atoms';
import type { AgendaAppointment } from '../types/agenda.types';
import { formatCurrencyBRL } from '../utils/agenda-date';
import { AppointmentStatusBadge } from './appointment-status-badge';

type AppointmentTooltipContentProps = {
  appointment: AgendaAppointment;
};

/** Conteúdo do tooltip / popover de detalhes do atendimento. */
export function AppointmentTooltipContent({
  appointment,
}: AppointmentTooltipContentProps) {
  return (
    <Box sx={{ p: 0.5, maxWidth: 260 }}>
      <Stack spacing={0.75}>
        <Stack
          direction="row"
          sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {appointment.clientName}
          </Typography>
          <AppointmentStatusBadge status={appointment.status} />
        </Stack>

        <Typography variant="caption" color="text.secondary">
          {appointment.clientPhone}
        </Typography>

        <Divider />

        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {appointment.serviceName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {appointment.startTime} – {appointment.endTime} ·{' '}
          {appointment.professionalName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatCurrencyBRL(appointment.totalPrice)}
        </Typography>

        {appointment.clientNotes ? (
          <>
            <Divider />
            <Typography variant="caption" color="text.secondary">
              Obs.: {appointment.clientNotes}
            </Typography>
          </>
        ) : null}
      </Stack>
    </Box>
  );
}
