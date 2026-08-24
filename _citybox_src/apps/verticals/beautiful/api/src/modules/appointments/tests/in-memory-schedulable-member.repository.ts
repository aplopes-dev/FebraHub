import type {
  CreateMemberData,
  ListMembersFilter,
  ListWorkIntervalsFilter,
  MemberRecord,
  MemberRepository,
  ReplaceStoreMembershipPatch,
  UpdateMemberProfilePatch,
  WorkIntervalRowWithMember,
} from '../../tenancy/domain/repositories/member.repository';
import type { WorkIntervalRow } from '../../../shared/domain/work-schedule/work-schedule.types';
import { isSchedulableStoreRole } from '../../tenancy/domain/store-role.catalog';

/** In-memory MemberRepository suficiente para testes de appointments. */
export class InMemorySchedulableMemberRepository implements MemberRepository {
  items: MemberRecord[] = [];
  workIntervalsByMemberId: Record<string, WorkIntervalRow[]> = {};
  knownServices: Array<{ storeId: string; id: string }> = [];

  private clone(member: MemberRecord): MemberRecord {
    return {
      ...member,
      memberships: member.memberships.map((m) => ({ ...m })),
      serviceIds: member.serviceIds ? [...member.serviceIds] : undefined,
      services: member.services?.map((s) => ({ ...s })),
    };
  }

  seedSchedulable(opts: {
    id: string;
    storeId: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }): MemberRecord {
    const record: MemberRecord = {
      id: opts.id,
      organizationId: 'org-1',
      keycloakSub: `kc-${opts.id}`,
      username: `user-${opts.id.slice(0, 8)}`,
      email: null,
      firstName: opts.firstName ?? 'Ana',
      lastName: opts.lastName ?? 'Silva',
      phone: null,
      status: 'active',
      organizationRole: 'COLLABORATOR',
      hasPassword: true,
      provisionalExpiresAt: null,
      disabledAt: null,
      memberships: [
        {
          storeId: opts.storeId,
          storeName: 'Loja',
          role: opts.role ?? 'profissional',
          permissions: [],
        },
      ],
      serviceIds: [],
      services: [],
    };
    this.items.push(record);
    return this.clone(record);
  }

  async findById(id: string): Promise<MemberRecord | null> {
    return this.items.find((m) => m.id === id) ?? null;
  }
  async findByUsername(): Promise<MemberRecord | null> {
    return null;
  }
  async findByKeycloakSub(): Promise<MemberRecord | null> {
    return null;
  }
  async findActiveOwnerByStoreId(): Promise<MemberRecord | null> {
    return null;
  }
  async create(data: CreateMemberData): Promise<MemberRecord> {
    const record: MemberRecord = {
      id: data.id ?? crypto.randomUUID(),
      organizationId: data.organizationId,
      keycloakSub: data.keycloakSub,
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? null,
      status: 'active',
      organizationRole: data.organizationRole ?? 'COLLABORATOR',
      hasPassword: data.hasPassword,
      provisionalExpiresAt: null,
      disabledAt: null,
      memberships: data.stores.map((s) => ({
        storeId: s.storeId,
        storeName: 'Loja',
        role: s.role,
        permissions: s.permissions,
      })),
    };
    this.items.push(record);
    return this.clone(record);
  }
  async linkKeycloak(): Promise<MemberRecord | null> {
    return null;
  }
  async promoteToOwner(): Promise<MemberRecord | null> {
    return null;
  }
  async markProvisionalPassword(): Promise<void> {}
  async markPasswordSet(): Promise<void> {}
  async listByStoreId(
    storeId: string,
    filter?: ListMembersFilter,
  ): Promise<MemberRecord[]> {
    return this.items.filter((m) => {
      const membership = m.memberships.find((x) => x.storeId === storeId);
      if (!membership) return false;
      if (filter?.schedulable && !isSchedulableStoreRole(membership.role)) {
        return false;
      }
      return true;
    });
  }
  async findInStore(
    storeId: string,
    memberId: string,
  ): Promise<MemberRecord | null> {
    const member = this.items.find((m) => m.id === memberId);
    if (!member?.memberships.some((x) => x.storeId === storeId)) return null;
    return this.clone(member);
  }
  async findSchedulableByIds(
    storeId: string,
    ids: string[],
  ): Promise<MemberRecord[]> {
    return this.items.filter((m) => {
      if (!ids.includes(m.id) || m.status !== 'active') return false;
      const membership = m.memberships.find((x) => x.storeId === storeId);
      return membership ? isSchedulableStoreRole(membership.role) : false;
    });
  }
  async updateProfile(
    memberId: string,
    patch: UpdateMemberProfilePatch,
  ): Promise<MemberRecord | null> {
    const member = this.items.find((m) => m.id === memberId);
    if (!member) return null;
    Object.assign(member, patch);
    return this.clone(member);
  }
  async replaceStoreMembership(
    storeId: string,
    memberId: string,
    patch: ReplaceStoreMembershipPatch,
  ): Promise<void> {
    const member = this.items.find((m) => m.id === memberId);
    if (!member) return;
    member.memberships = member.memberships.map((m) =>
      m.storeId === storeId
        ? {
            ...m,
            ...(patch.role !== undefined ? { role: patch.role } : {}),
            ...(patch.permissions !== undefined
              ? { permissions: [...patch.permissions] }
              : {}),
          }
        : m,
    );
  }
  async replaceServiceIds(): Promise<void> {}
  async findExistingServiceIds(
    storeId: string,
    ids: string[],
  ): Promise<string[]> {
    return this.knownServices
      .filter((s) => s.storeId === storeId && ids.includes(s.id))
      .map((s) => s.id);
  }
  async findWorkIntervals(memberId: string): Promise<WorkIntervalRow[]> {
    return this.workIntervalsByMemberId[memberId] ?? [];
  }
  async findWorkIntervalsForMembers(
    filter?: ListWorkIntervalsFilter,
  ): Promise<WorkIntervalRowWithMember[]> {
    const ids = filter?.memberIds ?? Object.keys(this.workIntervalsByMemberId);
    return ids.flatMap((memberId) =>
      (this.workIntervalsByMemberId[memberId] ?? []).map((row) => ({
        ...row,
        memberId,
      })),
    );
  }
  async replaceWorkIntervals(
    memberId: string,
    intervals: WorkIntervalRow[],
  ): Promise<void> {
    this.workIntervalsByMemberId[memberId] = intervals;
  }
}
