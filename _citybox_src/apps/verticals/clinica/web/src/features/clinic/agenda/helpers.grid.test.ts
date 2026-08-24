import { describe, expect, it } from 'vitest';

import {
  getCalendarGridSpanMinutes,
  getClosingFooterHeightPx,
  getEventBlockStyle,
} from '@/features/clinic/agenda/helpers';
import type { IEvent } from '@/features/clinic/agenda/interfaces';

describe('agenda grid alignment', () => {
  it('uses 600 minutes for an 08:00–18:00 grid with hour rows 8–17', () => {
    const hours = Array.from({ length: 10 }, (_, index) => 8 + index);
    expect(getCalendarGridSpanMinutes(8 * 60, hours, 18 * 60)).toBe(600);
    expect(getClosingFooterHeightPx(8 * 60, hours, 18 * 60)).toBe(0);
  });

  it('adds footer height when closing is not on the hour boundary', () => {
    const hours = Array.from({ length: 11 }, (_, index) => 8 + index);
    expect(getClosingFooterHeightPx(8 * 60, hours, 18 * 60 + 30)).toBe(48);
  });

  it('positions a 17:45 appointment at the closing boundary, not at 18:45', () => {
    const hours = Array.from({ length: 10 }, (_, index) => 8 + index);
    const gridSpanMinutes = getCalendarGridSpanMinutes(8 * 60, hours, 18 * 60);

    const event: IEvent = {
      id: 1,
      startDate: '2026-08-11T17:45:00.000Z',
      endDate: '2026-08-11T18:00:00.000Z',
      title: 'Consulta',
      color: 'blue',
      description: '',
      user: { id: 'pro-1', name: 'Dr.', picturePath: null },
    };

    const style = getEventBlockStyle(event, new Date(2026, 7, 11), 0, 1, {
      from: 8,
      to: 18,
      fromMinutes: 8 * 60,
      toMinutes: 18 * 60,
      gridSpanMinutes,
    });

    expect(style.top).toBe('97.5%');
  });
});
