import { describe, expect, it } from 'vitest';
import { resolveClinicWeekRange } from './resolve-clinic-week-range';

describe('resolveClinicWeekRange', () => {
  it('returns Monday through Saturday for a mid-week reference date', () => {
    expect(resolveClinicWeekRange(new Date(2026, 7, 19))).toEqual({
      startDate: '2026-08-17',
      endDate: '2026-08-22',
    });
  });

  it('ends on Saturday when reference date is Sunday', () => {
    expect(resolveClinicWeekRange(new Date(2026, 7, 23))).toEqual({
      startDate: '2026-08-17',
      endDate: '2026-08-22',
    });
  });

  it('starts on Monday when reference date is Saturday', () => {
    expect(resolveClinicWeekRange(new Date(2026, 7, 22))).toEqual({
      startDate: '2026-08-17',
      endDate: '2026-08-22',
    });
  });
});
