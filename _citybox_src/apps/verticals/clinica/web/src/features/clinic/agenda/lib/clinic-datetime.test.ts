import { describe, expect, it } from 'vitest';
import {
  buildClinicDateTimeIso,
  clinicDateTimeToIso,
  formatClinicDateFromIso,
  formatClinicTimeFromIso,
  parseClinicDateTimeIso,
} from './clinic-datetime';

describe('clinic-datetime', () => {
  it('formatClinicTimeFromIso mantém 15:00 sem shift de fuso', () => {
    expect(formatClinicTimeFromIso('2026-07-09T15:00:00.000Z')).toBe('15:00');
  });

  it('parseClinicDateTimeIso posiciona no grid com hora wall-clock', () => {
    const date = parseClinicDateTimeIso('2026-07-09T15:00:00.000Z');
    expect(date.getHours()).toBe(15);
    expect(date.getMinutes()).toBe(0);
    expect(date.getDate()).toBe(9);
  });

  it('round-trip grid → ISO', () => {
    const parsed = parseClinicDateTimeIso('2026-07-09T15:30:00.000Z');
    expect(clinicDateTimeToIso(parsed)).toBe('2026-07-09T15:30:00.000Z');
  });

  it('formatClinicDateFromIso extrai yyyy-MM-dd', () => {
    expect(formatClinicDateFromIso('2026-07-09T15:00:00.000Z')).toBe('2026-07-09');
  });

  it('buildClinicDateTimeIso monta payload da API', () => {
    expect(buildClinicDateTimeIso('2026-07-09', '15:00')).toBe(
      '2026-07-09T15:00:00.000Z',
    );
  });
});
