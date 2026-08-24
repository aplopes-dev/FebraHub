import {
  isTeamMemberRole,
  type TeamMemberRole,
} from '../entities/team-member.entity';
import { InvalidTeamMemberRoleError } from '../errors/invalid-team-member-role.error';

export function parseTeamMemberRole(
  context: string,
  value: string,
): TeamMemberRole {
  const normalized = value?.trim().toLowerCase() ?? '';
  if (!isTeamMemberRole(normalized)) {
    throw new InvalidTeamMemberRoleError(context, value);
  }
  return normalized;
}
