'use client';

import { Badge } from '@citybox/mui/atoms';
import type { AppointmentStatus } from '../types/agenda.types';
import { APPOINTMENT_STATUS_VISUAL } from '../utils/agenda-status';

type AppointmentStatusBadgeProps = {
  status: AppointmentStatus;
  size?: 'small' | 'medium';
};

export function AppointmentStatusBadge({
  status,
  size = 'small',
}: AppointmentStatusBadgeProps) {
  const visual = APPOINTMENT_STATUS_VISUAL[status];
  return (
    <Badge
      size={size}
      label={visual.label}
      color={visual.color}
      variant="filled"
      sx={{ fontWeight: 600 }}
    />
  );
}
