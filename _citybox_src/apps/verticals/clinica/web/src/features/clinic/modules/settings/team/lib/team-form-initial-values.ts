import type { TeamMember } from '@/features/shared/team';
import { createDefaultServiceHours } from '../data/mock-service-hours';
import type { TeamMemberSheetFormData } from '../types/team-invite';
import {
  createPermissionMapForRole,
  createPermissionMapFromIds,
} from './team-member-permissions';

export function createEmptyTeamMemberFormData(): TeamMemberSheetFormData {
  return {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    role: '',
    permissionValues: createPermissionMapForRole(''),
    serviceHours: createDefaultServiceHours(),
    commissionRules: [],
  };
}

export function createTeamMemberFormDataFromMember(
  member: TeamMember,
): TeamMemberSheetFormData {
  return {
    firstName: member.firstName,
    lastName: member.lastName,
    username: member.username,
    email: member.email ?? '',
    role: member.role,
    permissionValues: createPermissionMapFromIds(member.permissions),
    serviceHours: createDefaultServiceHours(),
    commissionRules: [],
  };
}
