import { addMinutes } from 'date-fns';
import type {
  CalendarAppointmentItem,
  CalendarScheduleItem,
} from '@/features/clinic/agenda/api/types';
import { resolveAppointmentCategoryColor } from '@/features/clinic/agenda/lib/appointment-category-colors';
import {
  clinicDateTimeToIso,
  parseClinicDateTimeIso,
} from '@/features/clinic/agenda/lib/clinic-datetime';
import type { IEvent } from '@/features/clinic/agenda/interfaces';
import type { TBadgeVariant, TEventColor } from '@/features/clinic/agenda/types';

const EVENT_COLORS: readonly TEventColor[] = [
  'blue',
  'green',
  'red',
  'yellow',
  'purple',
  'orange',
  'gray',
];

const CANCELLED_OR_MISSED_STATUSES = new Set([
  'missed',
  'cancelled_patient',
  'cancelled_pro',
]);

/** Valor de UI — `confirmed_whatsapp` não existe no Prisma; é `confirmed` + source. */
export type UiAppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'confirmed_whatsapp'
  | 'cancelled_patient'
  | 'cancelled_pro'
  | 'in_progress'
  | 'missed'
  | 'finished'
  | 'patient_waiting';

export function isCancelledOrMissedAppointmentStatus(
  status: string | null | undefined,
): boolean {
  return status != null && CANCELLED_OR_MISSED_STATUSES.has(status);
}

export function isConfirmedAppointmentStatus(
  status: string | null | undefined,
): boolean {
  return status === 'confirmed' || status === 'confirmed_whatsapp';
}

export function toUiAppointmentStatus(
  status: string | null | undefined,
  confirmationSource?: 'manual' | 'whatsapp' | null,
): UiAppointmentStatus {
  if (status === 'confirmed' && confirmationSource === 'whatsapp') {
    return 'confirmed_whatsapp';
  }
  return (status as UiAppointmentStatus) || 'scheduled';
}

export function fromUiAppointmentStatus(uiStatus: string): {
  status: 'scheduled' | 'confirmed' | 'cancelled_patient' | 'cancelled_pro' | 'in_progress' | 'missed' | 'finished' | 'patient_waiting';
  confirmationSource: 'manual' | 'whatsapp' | null;
} {
  if (uiStatus === 'confirmed_whatsapp') {
    return { status: 'confirmed', confirmationSource: 'whatsapp' };
  }
  if (uiStatus === 'confirmed') {
    return { status: 'confirmed', confirmationSource: 'manual' };
  }
  return {
    status: uiStatus as Exclude<UiAppointmentStatus, 'confirmed_whatsapp'>,
    confirmationSource: null,
  };
}

/** Rótulo de status na UI. */
export function getAppointmentStatusDisplayLabel(
  status: string | null | undefined,
  confirmationSource?: 'manual' | 'whatsapp' | null,
): string {
  const ui = toUiAppointmentStatus(status, confirmationSource);
  const labels: Record<string, string> = {
    scheduled: 'Agendada',
    confirmed: 'Confirmada',
    confirmed_whatsapp: 'Confirmada por mensagem',
    in_progress: 'Em Atendimento',
    patient_waiting: 'Paciente aguardando',
    finished: 'Finalizada',
    missed: 'Falta',
    cancelled_patient: 'Cancelada pelo paciente',
    cancelled_pro: 'Cancelada pelo profissional',
  };
  return labels[ui] || status || '';
}

function hashColor(str: string): TEventColor {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffff;
  }
  return EVENT_COLORS[hash % EVENT_COLORS.length];
}

/** Mapeia cor de categoria (nome `blue` ou hex `#3b82f6`) para token visual do calendário. */
export function colorFromCategoryColor(color: string): TEventColor {
  const trimmed = color.trim().toLowerCase();
  if ((EVENT_COLORS as readonly string[]).includes(trimmed)) {
    return trimmed as TEventColor;
  }

  const hex = resolveAppointmentCategoryColor(color).toLowerCase();
  if (
    hex.includes('3b82f6') ||
    hex.includes('0ea5e9') ||
    hex.includes('06b6d4') ||
    hex.includes('2563eb') ||
    hex.includes('14b8a6') ||
    hex.includes('0891b2') ||
    hex.includes('6366f1') ||
    hex.includes('1d4ed8')
  ) {
    return 'blue';
  }
  if (
    hex.includes('10b981') ||
    hex.includes('16a34a') ||
    hex.includes('22c55e') ||
    hex.includes('84cc16')
  ) {
    return 'green';
  }
  if (
    hex.includes('ef4444') ||
    hex.includes('dc2626') ||
    hex.includes('f87171') ||
    hex.includes('ec4899') ||
    hex.includes('f43f5e') ||
    hex.includes('d946ef')
  ) {
    return 'red';
  }
  if (
    hex.includes('f59e0b') ||
    hex.includes('eab308') ||
    hex.includes('fbbf24') ||
    hex.includes('a16207')
  ) {
    return 'yellow';
  }
  if (
    hex.includes('8b5cf6') ||
    hex.includes('7c3aed') ||
    hex.includes('a855f7')
  ) {
    return 'purple';
  }
  if (hex.includes('f97316') || hex.includes('ea580c') || hex.includes('fb923c')) {
    return 'orange';
  }
  if (hex.includes('64748b') || hex.includes('6b7280') || hex.includes('71717a')) {
    return 'gray';
  }
  // Categoria Particular (seed) e padrão da paleta: azul, não cinza.
  return 'blue';
}

/** Cor visual do card no calendário por status: agendada azul; confirmada verde; cancelada/falta vermelho. */
export function resolveCalendarEventColor(
  event: Pick<IEvent, 'color' | 'appointmentStatus'>,
  badgeVariant: TBadgeVariant,
): TEventColor | `${TEventColor}-dot` {
  if (isCancelledOrMissedAppointmentStatus(event.appointmentStatus)) {
    return 'red';
  }
  if (isConfirmedAppointmentStatus(event.appointmentStatus)) {
    return 'green';
  }
  if (
    event.appointmentStatus == null ||
    event.appointmentStatus === 'scheduled'
  ) {
    return badgeVariant === 'dot' ? 'blue-dot' : 'blue';
  }
  return badgeVariant === 'dot' ? `${event.color}-dot` : event.color;
}

export function appointmentToEvent(item: CalendarAppointmentItem): IEvent {
  const startDate = parseClinicDateTimeIso(item.date);
  const endDate = addMinutes(startDate, item.durationMin);

  const color = isCancelledOrMissedAppointmentStatus(item.status)
    ? 'red'
    : isConfirmedAppointmentStatus(item.status)
      ? 'green'
      : item.status === 'scheduled'
        ? 'blue'
        : item.category
          ? colorFromCategoryColor(item.category.color)
          : hashColor(item.professionalId);

  return {
    id: item.id as unknown as number,
    startDate: item.date,
    endDate: clinicDateTimeToIso(endDate),
    title: item.patient.name,
    color,
    description: item.observations ?? '',
    user: {
      id: item.professional.id,
      name: item.professional.name,
      picturePath: null,
    },
    eventType: 'appointment',
    appointmentStatus: item.status,
    categoryId: item.categoryId,
    category: item.category,
    rawAppointment: item,
  };
}

export function commitmentToEvent(item: CalendarScheduleItem): IEvent {
  return {
    id: item.id as unknown as number,
    startDate: item.startDate,
    endDate: item.endDate,
    title: item.title,
    color: item.availability === 'available' ? 'green' : 'gray',
    description: item.description ?? '',
    user: {
      id: item.professionalId,
      name: '',
      picturePath: null,
    },
    eventType: 'commitment',
    rawCommitment: item,
  };
}

export function calendarResponseToEvents(
  appointments: CalendarAppointmentItem[],
  schedules: CalendarScheduleItem[],
): IEvent[] {
  return [
    ...appointments.map(appointmentToEvent),
    ...schedules.map(commitmentToEvent),
  ];
}
