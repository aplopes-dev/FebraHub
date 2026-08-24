import {
  formatAppointmentDate,
  formatAppointmentTime,
  civilDateStartInBahia,
  civilDateEndExclusiveInBahia,
} from './appointment-datetime.policy';

describe('AppointmentDatetimePolicy', () => {
  it('formata date e time em America/Bahia', () => {
    const instant = new Date('2026-07-29T13:30:00.000-03:00');
    expect(formatAppointmentDate(instant)).toBe('2026-07-29');
    expect(formatAppointmentTime(instant)).toBe('13:30');
  });

  it('civilDateStartInBahia e endExclusive', () => {
    const start = civilDateStartInBahia('2026-07-29');
    const end = civilDateEndExclusiveInBahia('2026-07-29');
    expect(formatAppointmentDate(start)).toBe('2026-07-29');
    expect(formatAppointmentTime(start)).toBe('00:00');
    expect(formatAppointmentDate(end)).toBe('2026-07-30');
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
  });
});
