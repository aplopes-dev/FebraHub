import {
  buildOccupancyWindows,
  isRangeWithinWorkIntervals,
  weekdayIdFromDate,
} from './appointment-availability';
import { addMinutes } from './appointment-datetime';

describe('appointment-availability', () => {
  describe('weekdayIdFromDate', () => {
    it('maps Monday correctly', () => {
      expect(weekdayIdFromDate(new Date(2026, 7, 10, 9, 0))).toBe('mon');
    });

    it('maps Sunday correctly', () => {
      expect(weekdayIdFromDate(new Date(2026, 7, 9, 9, 0))).toBe('sun');
    });
  });

  describe('isRangeWithinWorkIntervals', () => {
    const morningAndAfternoon = [
      { startTime: '09:00', endTime: '12:00' },
      { startTime: '13:00', endTime: '18:00' },
    ];

    it('returns false when day has no intervals', () => {
      const start = new Date(2026, 7, 10, 9, 0);
      const end = new Date(2026, 7, 10, 9, 45);
      expect(isRangeWithinWorkIntervals(start, end, [])).toBe(false);
    });

    it('returns true when range fits inside one interval', () => {
      const start = new Date(2026, 7, 10, 9, 0);
      const end = new Date(2026, 7, 10, 9, 45);
      expect(isRangeWithinWorkIntervals(start, end, morningAndAfternoon)).toBe(
        true,
      );
    });

    it('returns false when range starts before work', () => {
      const start = new Date(2026, 7, 10, 8, 30);
      const end = new Date(2026, 7, 10, 9, 15);
      expect(isRangeWithinWorkIntervals(start, end, morningAndAfternoon)).toBe(
        false,
      );
    });

    it('returns false when range crosses lunch gap', () => {
      const start = new Date(2026, 7, 10, 11, 30);
      const end = new Date(2026, 7, 10, 13, 30);
      expect(isRangeWithinWorkIntervals(start, end, morningAndAfternoon)).toBe(
        false,
      );
    });

    it('returns false when range ends after work', () => {
      const start = new Date(2026, 7, 10, 17, 30);
      const end = new Date(2026, 7, 10, 18, 30);
      expect(isRangeWithinWorkIntervals(start, end, morningAndAfternoon)).toBe(
        false,
      );
    });

    it('returns false when range crosses midnight', () => {
      const start = new Date(2026, 7, 10, 23, 30);
      const end = new Date(2026, 7, 11, 0, 30);
      expect(
        isRangeWithinWorkIntervals(start, end, [
          { startTime: '09:00', endTime: '23:59' },
        ]),
      ).toBe(false);
    });
  });

  describe('buildOccupancyWindows', () => {
    it('builds sequential windows per service line', () => {
      const start = new Date(2026, 7, 10, 9, 0);
      const windows = buildOccupancyWindows(
        start,
        [
          { professionalId: 'a', duration: 60 },
          { professionalId: 'b', duration: 30 },
        ],
        addMinutes,
      );

      expect(windows).toHaveLength(2);
      expect(windows[0]).toMatchObject({
        professionalId: 'a',
        startAt: start,
      });
      expect(windows[0].endAt.getHours()).toBe(10);
      expect(windows[1].professionalId).toBe('b');
      expect(windows[1].startAt.getHours()).toBe(10);
      expect(windows[1].endAt.getHours()).toBe(10);
      expect(windows[1].endAt.getMinutes()).toBe(30);
    });
  });
});
