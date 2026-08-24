import type { MemberRecord } from '../../../../domain/repositories/member.repository';

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
  static toVerticalMember(member: MemberRecord): PlatformStoreOwnerHttp {
    return {
      id: member.id,
      username: member.username,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      status: member.status,
      organizationRole: 'OWNER',
      organizationRoleLabel: 'Responsável',
      isOrganizationOwner: true,
      hasPassword: member.hasPassword,
      provisionalExpiresAt: member.provisionalExpiresAt?.toISOString() ?? null,
      disabledAt: member.disabledAt?.toISOString() ?? null,
      clinics: [],
    };
  }
}
