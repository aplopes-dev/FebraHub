import type { IconName } from '@citybox/mui/icons';
import type { AgendaAppointment } from '@/features/agenda/types/agenda.types';

export type DashboardShortcut = {
  href: string;
  title: string;
  description: string;
  icon: IconName;
  allowed: boolean;
};

export type DashboardAppointmentStats = {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  noShow: number;
  next: AgendaAppointment | null;
  sortedAll: AgendaAppointment[];
};
