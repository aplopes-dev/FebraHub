import { describe, expect, it } from 'vitest';
import {
  appointmentToEvent,
  fromUiAppointmentStatus,
  getAppointmentStatusDisplayLabel,
  isCancelledOrMissedAppointmentStatus,
  isConfirmedAppointmentStatus,
  resolveCalendarEventColor,
  toUiAppointmentStatus,
} from './calendar-transform';
import type { CalendarAppointmentItem } from '@/features/clinic/agenda/api/types';

function baseAppointment(
  overrides: Partial<CalendarAppointmentItem> = {},
): CalendarAppointmentItem {
  return {
    id: 'appt-1',
    patientId: 'p1',
    professionalId: 'pro-1',
    date: '2026-07-22T10:00:00.000Z',
    durationMin: 30,
    status: 'scheduled',
    categoryId: null,
    category: null,
    observations: null,
    returnOption: null,
    returnDate: null,
    returnReason: null,
    createdAt: '2026-07-01T10:00:00.000Z',
    patient: { id: 'p1', name: 'Ana' },
    professional: { id: 'pro-1', name: 'Dr. B' },
    ...overrides,
  };
}

describe('calendar-transform cancelled/missed color', () => {
  it('detects cancelled and missed statuses', () => {
    expect(isCancelledOrMissedAppointmentStatus('missed')).toBe(true);
    expect(isCancelledOrMissedAppointmentStatus('cancelled_patient')).toBe(
      true,
    );
    expect(isCancelledOrMissedAppointmentStatus('cancelled_pro')).toBe(true);
    expect(isCancelledOrMissedAppointmentStatus('finished')).toBe(false);
  });

  it('forces red color for missed appointments', () => {
    const event = appointmentToEvent(
      baseAppointment({
        status: 'missed',
        category: { id: 'c1', name: 'Geral', color: '#3b82f6' },
      }),
    );
    expect(event.color).toBe('red');
    expect(resolveCalendarEventColor(event, 'dot')).toBe('red');
    expect(resolveCalendarEventColor(event, 'colored')).toBe('red');
  });

  it('forces green for confirmed (manual) appointments', () => {
    const event = appointmentToEvent(
      baseAppointment({
        status: 'confirmed',
        confirmationSource: 'manual',
        category: { id: 'c1', name: 'Geral', color: '#3b82f6' },
      }),
    );
    expect(isConfirmedAppointmentStatus(event.appointmentStatus)).toBe(true);
    expect(event.color).toBe('green');
    expect(resolveCalendarEventColor(event, 'dot')).toBe('green');
    expect(resolveCalendarEventColor(event, 'colored')).toBe('green');
  });

  it('forces green for WhatsApp-confirmed appointments', () => {
    const event = appointmentToEvent(
      baseAppointment({
        status: 'confirmed',
        confirmationSource: 'whatsapp',
        category: { id: 'c1', name: 'Geral', color: '#3b82f6' },
      }),
    );
    expect(event.color).toBe('green');
    expect(resolveCalendarEventColor(event, 'colored')).toBe('green');
  });

  it('keeps category color for scheduled appointments', () => {
    const event = appointmentToEvent(
      baseAppointment({
        status: 'scheduled',
        category: { id: 'c1', name: 'Geral', color: '#3b82f6' },
      }),
    );
    expect(event.color).toBe('blue');
    expect(resolveCalendarEventColor(event, 'dot')).toBe('blue-dot');
  });

  it('forces blue for scheduled regardless of category color', () => {
    const event = appointmentToEvent(
      baseAppointment({
        status: 'scheduled',
        category: { id: 'c1', name: 'Retorno', color: 'teal' },
      }),
    );
    expect(event.color).toBe('blue');
    expect(resolveCalendarEventColor(event, 'colored')).toBe('blue');
  });

  it('maps named category color from seed (Particular = blue) to blue card', () => {
    const event = appointmentToEvent(
      baseAppointment({
        status: 'scheduled',
        category: { id: 'c1', name: 'Particular', color: 'blue' },
      }),
    );
    expect(event.color).toBe('blue');
    expect(resolveCalendarEventColor(event, 'colored')).toBe('blue');
  });

  it('maps palette hex colors that are not in the short calendar token set', () => {
    expect(
      appointmentToEvent(
        baseAppointment({
          status: 'in_progress',
          category: { id: 'c1', name: 'Indigo', color: '#6366f1' },
        }),
      ).color,
    ).toBe('blue');
    expect(
      appointmentToEvent(
        baseAppointment({
          status: 'in_progress',
          category: { id: 'c1', name: 'Teal', color: '#14b8a6' },
        }),
      ).color,
    ).toBe('blue');
    expect(
      appointmentToEvent(
        baseAppointment({
          status: 'in_progress',
          category: { id: 'c1', name: 'Pink', color: '#ec4899' },
        }),
      ).color,
    ).toBe('red');
  });

  it('labels WhatsApp confirmation as Confirmada por mensagem', () => {
    expect(getAppointmentStatusDisplayLabel('confirmed', 'whatsapp')).toBe(
      'Confirmada por mensagem',
    );
    expect(getAppointmentStatusDisplayLabel('confirmed', 'manual')).toBe(
      'Confirmada',
    );
    expect(getAppointmentStatusDisplayLabel('confirmed', null)).toBe(
      'Confirmada',
    );
  });

  it('maps UI status confirmed_whatsapp to API confirmed + whatsapp', () => {
    expect(toUiAppointmentStatus('confirmed', 'whatsapp')).toBe(
      'confirmed_whatsapp',
    );
    expect(fromUiAppointmentStatus('confirmed_whatsapp')).toEqual({
      status: 'confirmed',
      confirmationSource: 'whatsapp',
    });
    expect(fromUiAppointmentStatus('confirmed')).toEqual({
      status: 'confirmed',
      confirmationSource: 'manual',
    });
  });
});
