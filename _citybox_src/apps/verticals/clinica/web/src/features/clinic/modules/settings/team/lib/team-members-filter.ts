import type { TeamMember } from '@/features/shared/team';
import { resolveClinicTeamMemberStatus } from './clinic-team-member-status';
import type { TeamMemberStatusFilter } from './team-status-filter';

export function filterTeamMembersByStatus(
  members: TeamMember[],
  statusFilter: TeamMemberStatusFilter,
): TeamMember[] {
  if (statusFilter === 'all') {
    return members;
  }

  return members.filter(
    (member) => resolveClinicTeamMemberStatus(member) === statusFilter,
  );
}
