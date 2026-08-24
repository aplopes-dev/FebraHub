import { describe, expect, it } from 'vitest';
import type { TeamMember } from '@/features/shared/team';
import { resolveClinicTeamMemberStatus } from './clinic-team-member-status';

function member(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id: '1',
    username: 'ana',
    firstName: 'Ana',
    lastName: 'Silva',
    name: 'Ana Silva',
    role: 'professional',
    roleLabel: 'Profissional',
    permissions: [],
    hasPassword: true,
    status: 'active',
    disabledAt: null,
    provisionalExpiresAt: null,
    ...overrides,
  };
}

describe('resolveClinicTeamMemberStatus', () => {
  it('returns inactive when disabledAt is set', () => {
    expect(
      resolveClinicTeamMemberStatus(
        member({ disabledAt: '2026-07-01T00:00:00.000Z', hasPassword: true, status: 'active' }),
      ),
    ).toBe('inactive');
  });

  it('returns expired when provisional password is past due', () => {
    expect(
      resolveClinicTeamMemberStatus(
        member({
          hasPassword: false,
          status: 'pending',
          provisionalExpiresAt: '2020-01-01T00:00:00.000Z',
        }),
      ),
    ).toBe('expired');
  });

  it('returns pending when awaiting first access within deadline', () => {
    expect(
      resolveClinicTeamMemberStatus(
        member({
          hasPassword: false,
          status: 'pending',
          provisionalExpiresAt: '2099-01-01T00:00:00.000Z',
        }),
      ),
    ).toBe('pending');
  });

  it('returns active when enabled with password', () => {
    expect(resolveClinicTeamMemberStatus(member())).toBe('active');
  });
});
