import { deriveStoreMemberStatus } from './store-member-status';

describe('deriveStoreMemberStatus', () => {
  const now = new Date('2026-07-10T12:00:00.000Z');

  it('returns inactive when disabledAt is set', () => {
    expect(
      deriveStoreMemberStatus({
        hasPassword: true,
        disabledAt: now,
        provisionalExpiresAt: null,
        now,
      }),
    ).toBe('inactive');
  });

  it('returns active when hasPassword and not disabled', () => {
    expect(
      deriveStoreMemberStatus({
        hasPassword: true,
        disabledAt: null,
        provisionalExpiresAt: null,
        now,
      }),
    ).toBe('active');
  });

  it('returns pending when awaiting first access', () => {
    expect(
      deriveStoreMemberStatus({
        hasPassword: false,
        disabledAt: null,
        provisionalExpiresAt: new Date('2026-07-17T12:00:00.000Z'),
        now,
      }),
    ).toBe('pending');
  });

  it('returns expired when provisional window passed', () => {
    expect(
      deriveStoreMemberStatus({
        hasPassword: false,
        disabledAt: null,
        provisionalExpiresAt: new Date('2026-07-01T12:00:00.000Z'),
        now,
      }),
    ).toBe('expired');
  });
});
