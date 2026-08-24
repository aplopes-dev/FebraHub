import { ServiceHoursZodValidator } from '../domain/service-hours.validator';
import { createDefaultServiceHours } from '../domain/service-hours.types';

describe('ServiceHoursZodValidator', () => {
  const validator = ServiceHoursZodValidator.create();

  it('accepts default service hours', () => {
    const config = createDefaultServiceHours();
    expect(validator.validate(config)).toEqual(config);
  });

  it('rejects enabled day with end before start', () => {
    const config = createDefaultServiceHours();
    config.weekSchedule.mon = {
      enabled: true,
      startTime: '18:00',
      endTime: '08:00',
    };

    expect(() => validator.validate(config)).toThrow();
  });

  it('rejects consultation minutes outside allowed range', () => {
    const config = createDefaultServiceHours();
    config.defaultConsultationMinutes = 7;

    expect(() => validator.validate(config)).toThrow();
  });

  it('rejects lunch break with invalid interval when enabled', () => {
    const config = createDefaultServiceHours();
    config.fixedLunchBreak = {
      enabled: true,
      startTime: '13:00',
      endTime: '12:00',
    };

    expect(() => validator.validate(config)).toThrow();
  });
});
