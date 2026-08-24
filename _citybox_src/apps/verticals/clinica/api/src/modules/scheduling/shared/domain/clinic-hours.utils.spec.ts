import {
  appointmentWallClockMinutes,
  isAppointmentWithinClinicHours,
} from './clinic-hours.utils';

describe('clinic-hours.utils', () => {
  it('extracts wall-clock minutes from UTC-literal appointment dates', () => {
    expect(
      appointmentWallClockMinutes(new Date('2026-08-11T19:00:00.000Z')),
    ).toBe(19 * 60);
  });

  it('accepts appointments fully inside clinic hours', () => {
    expect(
      isAppointmentWithinClinicHours(
        new Date('2026-08-11T08:00:00.000Z'),
        new Date('2026-08-11T08:30:00.000Z'),
        '08:00',
        '18:00',
      ),
    ).toBe(true);

    expect(
      isAppointmentWithinClinicHours(
        new Date('2026-08-11T17:30:00.000Z'),
        new Date('2026-08-11T18:00:00.000Z'),
        '08:00',
        '18:00',
      ),
    ).toBe(true);
  });

  it('rejects appointments starting before opening or ending after closing', () => {
    expect(
      isAppointmentWithinClinicHours(
        new Date('2026-08-11T07:45:00.000Z'),
        new Date('2026-08-11T08:15:00.000Z'),
        '08:00',
        '18:00',
      ),
    ).toBe(false);

    expect(
      isAppointmentWithinClinicHours(
        new Date('2026-08-11T19:00:00.000Z'),
        new Date('2026-08-11T19:30:00.000Z'),
        '08:00',
        '18:00',
      ),
    ).toBe(false);

    expect(
      isAppointmentWithinClinicHours(
        new Date('2026-08-11T17:45:00.000Z'),
        new Date('2026-08-11T18:15:00.000Z'),
        '08:00',
        '18:00',
      ),
    ).toBe(false);
  });
});
