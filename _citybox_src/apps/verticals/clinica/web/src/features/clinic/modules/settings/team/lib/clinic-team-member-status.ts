import type { TeamMember } from '@/features/shared/team';

/**
 * Status de equipe na vertical clinic (inclui soft-delete e convite expirado).
 * O shared só expõe `active` | `pending`; clinic deriva o restante dos campos
 * `disabledAt` / `provisionalExpiresAt`.
 */
export type ClinicTeamMemberStatus =
  | 'active'
  | 'pending'
  | 'inactive'
  | 'expired';

export function resolveClinicTeamMemberStatus(
  member: TeamMember,
): ClinicTeamMemberStatus {
  if (member.disabledAt) {
    return 'inactive';
  }

  if (!member.hasPassword) {
    if (member.provisionalExpiresAt) {
      const expires = Date.parse(member.provisionalExpiresAt);
      if (!Number.isNaN(expires) && expires < Date.now()) {
        return 'expired';
      }
    }
    return 'pending';
  }

  return 'active';
}
