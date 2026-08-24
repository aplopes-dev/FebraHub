import { describe, expect, it } from 'vitest';
import {
  buildAgendaDateHref,
  formatPatientAppointmentStatus,
  formatPatientAppointmentWhen,
  getPatientAppointmentStatusTextClass,
  resolvePatientAppointmentProfessionalName,
} from './format-patient-appointment';

describe('formatPatientAppointmentWhen', () => {
  it('formata data e horário wall-clock da clínica', () => {
    expect(formatPatientAppointmentWhen('2026-07-29T14:30:00.000Z')).toBe(
      '29/07/2026 às 14:30',
    );
  });
});

describe('formatPatientAppointmentStatus', () => {
  it('rotula status conhecidos', () => {
    expect(formatPatientAppointmentStatus('scheduled')).toBe('Agendada');
    expect(formatPatientAppointmentStatus('confirmed', 'whatsapp')).toBe(
      'Confirmada por mensagem',
    );
    expect(formatPatientAppointmentStatus('cancelled_patient')).toBe(
      'Cancelada',
    );
    expect(formatPatientAppointmentStatus('cancelled_pro')).toBe('Cancelada');
  });
});

describe('getPatientAppointmentStatusTextClass', () => {
  it('mapeia cores por status', () => {
    expect(getPatientAppointmentStatusTextClass('scheduled')).toBe(
      'text-blue-600',
    );
    expect(getPatientAppointmentStatusTextClass('confirmed')).toBe(
      'text-emerald-600',
    );
    expect(getPatientAppointmentStatusTextClass('missed')).toBe('text-red-600');
    expect(getPatientAppointmentStatusTextClass('cancelled_pro')).toBe(
      'text-red-600',
    );
  });
});

describe('resolvePatientAppointmentProfessionalName', () => {
  it('preferename da API; senão mapa da equipe', () => {
    const map = new Map([['m1', 'Dra. Ana']]);
    expect(
      resolvePatientAppointmentProfessionalName('m1', 'Dr. API', map),
    ).toBe('Dr. API');
    expect(resolvePatientAppointmentProfessionalName('m1', '  ', map)).toBe(
      'Dra. Ana',
    );
    expect(resolvePatientAppointmentProfessionalName('x', null, map)).toBe(
      'Profissional não informado',
    );
  });
});

describe('buildAgendaDateHref', () => {
  it('monta deep-link com data da consulta', () => {
    expect(buildAgendaDateHref('2026-07-30T08:00:00.000Z')).toBe(
      '/agenda?date=2026-07-30',
    );
  });
});
