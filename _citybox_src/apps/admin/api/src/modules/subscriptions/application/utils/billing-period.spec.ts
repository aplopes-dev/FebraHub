import { calculateBillingPeriod } from './billing-period';

describe('calculateBillingPeriod', () => {
  describe('MONTHLY cycle', () => {
    it('should always set periodEnd to next month occurrence of dayOfMonth', () => {
      // Reference: July 3, dayOfMonth: 5 → August 5
      const reference = new Date(2026, 6, 3); // July 3
      const result = calculateBillingPeriod(reference, 5, 'MONTHLY');

      expect(result.periodStart).toEqual(reference);
      expect(result.periodEnd.getFullYear()).toBe(2026);
      expect(result.periodEnd.getMonth()).toBe(7); // August
      expect(result.periodEnd.getDate()).toBe(5);
    });

    it('should always set periodEnd to next month when dayOfMonth has already passed', () => {
      // Reference: July 14, dayOfMonth: 5 → August 5
      const reference = new Date(2026, 6, 14); // July 14
      const result = calculateBillingPeriod(reference, 5, 'MONTHLY');

      expect(result.periodStart).toEqual(reference);
      expect(result.periodEnd.getFullYear()).toBe(2026);
      expect(result.periodEnd.getMonth()).toBe(7); // August
      expect(result.periodEnd.getDate()).toBe(5);
    });

    it('should always set periodEnd to next month when dayOfMonth is today', () => {
      // Reference: July 5, dayOfMonth: 5 → August 5
      const reference = new Date(2026, 6, 5); // July 5
      const result = calculateBillingPeriod(reference, 5, 'MONTHLY');

      expect(result.periodStart).toEqual(reference);
      expect(result.periodEnd.getFullYear()).toBe(2026);
      expect(result.periodEnd.getMonth()).toBe(7); // August
      expect(result.periodEnd.getDate()).toBe(5);
    });

    it('should clamp dayOfMonth to last day of next month', () => {
      // Reference: January 15, dayOfMonth: 31 → February 28 (2026 not leap year)
      const reference = new Date(2026, 0, 15); // January 15
      const result = calculateBillingPeriod(reference, 31, 'MONTHLY');

      expect(result.periodEnd.getFullYear()).toBe(2026);
      expect(result.periodEnd.getMonth()).toBe(1); // February
      expect(result.periodEnd.getDate()).toBe(28);
    });

    it('should clamp day 31 when advancing from April to May', () => {
      // Reference: April 30, dayOfMonth: 31 → May 31 (May has 31 days)
      const reference = new Date(2026, 3, 30); // April 30
      const result = calculateBillingPeriod(reference, 31, 'MONTHLY');

      expect(result.periodEnd.getFullYear()).toBe(2026);
      expect(result.periodEnd.getMonth()).toBe(4); // May
      expect(result.periodEnd.getDate()).toBe(31);
    });

    it('should clamp day 29 when advancing to non-leap year February', () => {
      // Reference: January 31, 2026, dayOfMonth: 29 → February 28
      const reference = new Date(2026, 0, 31); // January 31
      const result = calculateBillingPeriod(reference, 29, 'MONTHLY');

      expect(result.periodEnd.getFullYear()).toBe(2026);
      expect(result.periodEnd.getMonth()).toBe(1); // February
      expect(result.periodEnd.getDate()).toBe(28);
    });

    it('should keep day 29 when advancing to leap year February', () => {
      // Reference: January 31, 2028, dayOfMonth: 29 → February 29
      const reference = new Date(2028, 0, 31); // January 31
      const result = calculateBillingPeriod(reference, 29, 'MONTHLY');

      expect(result.periodEnd.getFullYear()).toBe(2028);
      expect(result.periodEnd.getMonth()).toBe(1); // February
      expect(result.periodEnd.getDate()).toBe(29);
    });

    it('should handle day 1 (first of month)', () => {
      // Reference: July 14, dayOfMonth: 1 → August 1
      const reference = new Date(2026, 6, 14); // July 14
      const result = calculateBillingPeriod(reference, 1, 'MONTHLY');

      expect(result.periodEnd.getFullYear()).toBe(2026);
      expect(result.periodEnd.getMonth()).toBe(7); // August
      expect(result.periodEnd.getDate()).toBe(1);
    });
  });

  describe('YEARLY cycle', () => {
    it('should always set periodEnd to next year occurrence of dayOfMonth', () => {
      // Reference: July 14, dayOfMonth: 5, YEARLY → July 5, 2027
      const reference = new Date(2026, 6, 14); // July 14
      const result = calculateBillingPeriod(reference, 5, 'YEARLY');

      expect(result.periodStart).toEqual(reference);
      expect(result.periodEnd.getFullYear()).toBe(2027);
      expect(result.periodEnd.getMonth()).toBe(6); // July
      expect(result.periodEnd.getDate()).toBe(5);
    });

    it('should keep same month when dayOfMonth has not passed (YEARLY)', () => {
      // Reference: July 3, dayOfMonth: 5, YEARLY → July 5, 2027
      const reference = new Date(2026, 6, 3); // July 3
      const result = calculateBillingPeriod(reference, 5, 'YEARLY');

      expect(result.periodStart).toEqual(reference);
      expect(result.periodEnd.getFullYear()).toBe(2027);
      expect(result.periodEnd.getMonth()).toBe(6); // July
      expect(result.periodEnd.getDate()).toBe(5);
    });

    it('should clamp day 31 in yearly cycle (Feb → Feb)', () => {
      // Reference: February 15, 2028 (leap year), dayOfMonth: 29, YEARLY → Feb 29, 2029
      const reference = new Date(2028, 1, 15); // February 15, 2028
      const result = calculateBillingPeriod(reference, 29, 'YEARLY');

      expect(result.periodEnd.getFullYear()).toBe(2029);
      expect(result.periodEnd.getMonth()).toBe(1); // February
      expect(result.periodEnd.getDate()).toBe(28); // 2029 not leap year → clamped
    });
  });

  describe('edge cases', () => {
    it('should zero out hours/minutes/seconds in periodEnd', () => {
      const reference = new Date(2026, 6, 14, 15, 30, 45);
      const result = calculateBillingPeriod(reference, 5, 'MONTHLY');

      expect(result.periodEnd.getHours()).toBe(0);
      expect(result.periodEnd.getMinutes()).toBe(0);
      expect(result.periodEnd.getSeconds()).toBe(0);
      expect(result.periodEnd.getMilliseconds()).toBe(0);
    });

    it('should preserve reference date time in periodStart', () => {
      const reference = new Date(2026, 6, 14, 15, 30, 45);
      const result = calculateBillingPeriod(reference, 5, 'MONTHLY');

      expect(result.periodStart.getHours()).toBe(15);
      expect(result.periodStart.getMinutes()).toBe(30);
    });

    it('should not mutate the reference date', () => {
      const reference = new Date(2026, 6, 14, 15, 30);
      const originalTime = reference.getTime();
      calculateBillingPeriod(reference, 5, 'MONTHLY');

      expect(reference.getTime()).toBe(originalTime);
    });
  });
});
