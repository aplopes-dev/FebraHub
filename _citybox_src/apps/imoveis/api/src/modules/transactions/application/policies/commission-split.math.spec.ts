import {
  buildCommissionSplit,
  isSplitValid,
  sumSplitPercents,
} from './commission-split.math';

describe('commission-split.math', () => {
  it('sums percents including others', () => {
    expect(
      sumSplitPercents({
        agencyPercent: 40,
        captorPercent: 30,
        sellerPercent: 20,
        others: [{ percent: 10 }],
      }),
    ).toBe(100);
  });

  it('validates 100%', () => {
    expect(
      isSplitValid({ agencyPercent: 40, captorPercent: 30, sellerPercent: 30 }),
    ).toBe(true);
    expect(
      isSplitValid({ agencyPercent: 40, captorPercent: 30, sellerPercent: 20 }),
    ).toBe(false);
  });

  it('builds amounts from gross and commission %', () => {
    const split = buildCommissionSplit(1_000_000, 6, {
      agencyPercent: 40,
      captorPercent: 30,
      sellerPercent: 30,
    });
    expect(split.totalCommissionCents).toBe(60_000);
    expect(split.agencyAmountCents).toBe(24_000);
    expect(split.captorAmountCents).toBe(18_000);
    expect(split.sellerAmountCents).toBe(18_000);
  });
});
