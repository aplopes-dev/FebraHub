import type { TeamMemberEntity } from '../../../../domain/entities/team-member.entity';

/**
 * Shape compatível com `VerticalMember` do admin-api — o card do responsável
 * no admin consome estes campos sem adaptação extra.
 */
export type PlatformStoreOwnerHttp = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string | null;
  status: 'active' | 'disabled';
  organizationRole: string;
  organizationRoleLabel: string;
  isOrganizationOwner: boolean;
  hasPassword: boolean;
  provisionalExpiresAt: string | null;
  disabledAt: string | null;
  clinics: [];
};

export class PlatformStoreOwnerPresenter {
  static toVerticalMember(member: TeamMemberEntity): PlatformStoreOwnerHttp {
    const { firstName, lastName } = splitName(member.name);
    const username = member.username ?? member.email;

    return {
      id: member.id,
      username,
      firstName,
      lastName,
      email: member.email,
      status: member.active ? 'active' : 'disabled',
      organizationRole: 'OWNER',
      organizationRoleLabel: 'Responsável',
      isOrganizationOwner: true,
      hasPassword: member.hasPassword,
      provisionalExpiresAt: null,
      disabledAt: null,
      clinics: [],
    };
  }
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}
