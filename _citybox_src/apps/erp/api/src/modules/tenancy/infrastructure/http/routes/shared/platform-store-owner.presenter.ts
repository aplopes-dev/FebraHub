import type { MembershipDetail } from '../../../../domain/repositories/membership.repository.interface';

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
  static toVerticalMember(detail: MembershipDetail): PlatformStoreOwnerHttp {
    const { membership, user } = detail;
    const { firstName, lastName } = splitName(user.name ?? '');
    const email = user.email;
    const isOwner = membership.role === 'OWNER';

    return {
      id: membership.id,
      username: email ?? user.id,
      firstName,
      lastName,
      email,
      status: membership.active ? 'active' : 'disabled',
      organizationRole: membership.role,
      organizationRoleLabel: isOwner ? 'Responsável' : membership.role,
      isOrganizationOwner: isOwner,
      // ERP não rastreia hasPassword no User — o admin trata false como "Gerar senha".
      hasPassword: false,
      provisionalExpiresAt: null,
      disabledAt: membership.active ? null : membership.updatedAt.toISOString(),
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
