import {
  brazilCivilYmd,
  endDateCivilYmd,
  isCampaignPeriodExpired,
} from './campaign-period.utils';

describe('campaign-period.utils', () => {
  it('reads endDate calendar day from yyyy-MM-dd (UTC midnight)', () => {
    expect(endDateCivilYmd(new Date('2026-07-17'))).toEqual({
      y: 2026,
      m: 7,
      d: 17,
    });
  });

  it('reads Brazil civil day around midnight BRT', () => {
    // 2026-07-17 00:00 BRT = 03:00 UTC
    expect(brazilCivilYmd(new Date('2026-07-17T03:00:00.000Z'))).toEqual({
      y: 2026,
      m: 7,
      d: 17,
    });
    // 2026-07-16 23:59 BRT = 02:59 UTC next calendar UTC day
    expect(brazilCivilYmd(new Date('2026-07-17T02:59:00.000Z'))).toEqual({
      y: 2026,
      m: 7,
      d: 16,
    });
  });

  it('expires at 00:00 BRT of the end date day', () => {
    const endDate = new Date('2026-07-17');

    expect(
      isCampaignPeriodExpired(endDate, new Date('2026-07-17T02:59:59.999Z')),
    ).toBe(false);
    expect(
      isCampaignPeriodExpired(endDate, new Date('2026-07-17T03:00:00.000Z')),
    ).toBe(true);
    expect(
      isCampaignPeriodExpired(endDate, new Date('2026-07-17T15:00:00.000Z')),
    ).toBe(true);
    expect(
      isCampaignPeriodExpired(endDate, new Date('2026-07-18T00:00:00.000Z')),
    ).toBe(true);
  });
});
