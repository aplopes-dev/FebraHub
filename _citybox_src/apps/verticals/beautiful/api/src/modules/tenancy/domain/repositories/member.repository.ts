import type { OrganizationMemberRole } from '../organization-member-role';
import type { WorkIntervalRow } from '../../../../shared/domain/work-schedule/work-schedule.types';

export type StoreMembership = {
  storeId: string;
  storeName: string;
  role: string;
  permissions: string[];
};

export type MemberServiceRef = {
  id: string;
  name: string;
};

export type MemberRecord = {
  id: string;
  organizationId: string;
  keycloakSub: string;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: 'active' | 'disabled';
  organizationRole: OrganizationMemberRole;
  hasPassword: boolean;
  provisionalExpiresAt: Date | null;
  disabledAt: Date | null;
  memberships: StoreMembership[];
  /** Presente quando o membro é carregado com serviços. */
  serviceIds?: string[];
  services?: MemberServiceRef[];
};

export type CreateMemberData = {
  id?: string;
  organizationId: string;
  keycloakSub: string;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  phone?: string | null;
  hasPassword: boolean;
  organizationRole?: OrganizationMemberRole;
  stores: Array<{ storeId: string; role: string; permissions: string[] }>;
};

export type ListMembersFilter = {
  search?: string;
  status?: 'active' | 'disabled';
  /** Quando true, só papéis agendáveis (`profissional`). Ignorado se `role` for informado. */
  schedulable?: boolean;
  /** Papel exato na loja (`profissional` | `recepcao` | `gerente`; cargos antigos como `owner` ainda filtráveis). */
  role?: string;
};

export type UpdateMemberProfilePatch = {
  phone?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  status?: 'active' | 'disabled';
};

export type ReplaceStoreMembershipPatch = {
  role?: string;
  permissions?: string[];
};

export type WorkIntervalRowWithMember = WorkIntervalRow & {
  memberId: string;
};

export type ListWorkIntervalsFilter = {
  memberIds?: string[];
};

export abstract class MemberRepository {
  abstract findById(id: string): Promise<MemberRecord | null>;
  abstract findByUsername(username: string): Promise<MemberRecord | null>;
  abstract findByKeycloakSub(sub: string): Promise<MemberRecord | null>;
  abstract findActiveOwnerByStoreId(
    storeId: string,
  ): Promise<MemberRecord | null>;
  abstract create(data: CreateMemberData): Promise<MemberRecord>;
  abstract linkKeycloak(
    id: string,
    patch: { keycloakSub: string; username: string; hasPassword: boolean },
  ): Promise<MemberRecord | null>;
  abstract promoteToOwner(
    id: string,
    patch: { firstName: string; lastName: string; email: string | null },
  ): Promise<MemberRecord | null>;
  abstract markProvisionalPassword(id: string, expiresAt: Date): Promise<void>;
  abstract markPasswordSet(id: string): Promise<void>;

  abstract listByStoreId(
    storeId: string,
    filter?: ListMembersFilter,
  ): Promise<MemberRecord[]>;
  abstract findInStore(
    storeId: string,
    memberId: string,
  ): Promise<MemberRecord | null>;
  abstract findSchedulableByIds(
    storeId: string,
    ids: string[],
  ): Promise<MemberRecord[]>;
  abstract updateProfile(
    memberId: string,
    patch: UpdateMemberProfilePatch,
  ): Promise<MemberRecord | null>;
  abstract replaceStoreMembership(
    storeId: string,
    memberId: string,
    patch: ReplaceStoreMembershipPatch,
  ): Promise<void>;
  abstract replaceServiceIds(
    memberId: string,
    serviceIds: string[],
  ): Promise<void>;
  abstract findExistingServiceIds(
    storeId: string,
    ids: string[],
  ): Promise<string[]>;
  abstract findWorkIntervals(memberId: string): Promise<WorkIntervalRow[]>;
  abstract findWorkIntervalsForMembers(
    filter?: ListWorkIntervalsFilter,
  ): Promise<WorkIntervalRowWithMember[]>;
  abstract replaceWorkIntervals(
    memberId: string,
    intervals: WorkIntervalRow[],
  ): Promise<void>;
}

/** displayName = firstName + lastName — computado no presenter. */
export function memberDisplayName(member: MemberRecord): string {
  return `${member.firstName} ${member.lastName}`.trim();
}
