import { nextDemoSlotStart } from './clinic-store-seeder';

describe('nextDemoSlotStart', () => {
  it('returns next São Paulo calendar day at 09:00 wall-clock (T09:00Z)', () => {
    // 2026-07-27 15:00 UTC = 12:00 BRT → next day 09:00 wall-clock
    const start = nextDemoSlotStart(new Date('2026-07-27T15:00:00.000Z'));
    expect(start.toISOString()).toBe('2026-07-28T09:00:00.000Z');
  });
});
