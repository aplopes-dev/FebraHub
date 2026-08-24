import type { ClinicTeamMemberStatus } from './clinic-team-member-status';

export type TeamMemberStatusToggleMode = 'activate' | 'deactivate';

export function getTeamMemberStatusToggleMode(
  status: ClinicTeamMemberStatus,
): TeamMemberStatusToggleMode {
  return status === 'active' ? 'deactivate' : 'activate';
}
