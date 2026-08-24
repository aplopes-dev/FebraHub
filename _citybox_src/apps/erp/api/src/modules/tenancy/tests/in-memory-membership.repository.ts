import { Membership } from '../domain/entities/membership.entity';
import type { UserRepository } from '../domain/repositories/user.repository.interface';
import {
  MembershipRepository,
  type MembershipDetail,
  type MembershipListCriteria,
  type MembershipPermissionProfileSummary,
} from '../domain/repositories/membership.repository.interface';

export class InMemoryMembershipRepository extends MembershipRepository {
  readonly memberships = new Map<string, Membership>();
  readonly branchAccess = new Map<string, string[]>();
  /** Resumos de perfil opcionais — espelha o include do Prisma. */
  readonly permissionProfiles = new Map<
    string,
    MembershipPermissionProfileSummary
  >();

  /** Precisa do repositório de usuários porque `MembershipDetail` junta os dois. */
  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<MembershipDetail | null> {
    const membership = this.memberships.get(id);
    if (!membership || membership.organizationId !== organizationId)
      return null;
    return this.toDetail(membership);
  }

  findByUser(
    organizationId: string,
    userId: string,
  ): Promise<Membership | null> {
    const found = [...this.memberships.values()].find(
      (membership) =>
        membership.organizationId === organizationId &&
        membership.userId === userId,
    );
    return Promise.resolve(found ?? null);
  }

  async findByPdvCode(
    organizationId: string,
    code: string,
  ): Promise<MembershipDetail | null> {
    const normalized = code.trim();
    if (!normalized) return null;
    const found = [...this.memberships.values()].find(
      (membership) =>
        membership.organizationId === organizationId &&
        membership.active &&
        membership.pdvCode === normalized &&
        membership.pdvPinHash !== null,
    );
    if (!found) return null;
    return this.toDetail(found);
  }

  async findAll(
    organizationId: string,
    criteria: MembershipListCriteria = {},
  ): Promise<MembershipDetail[]> {
    const details = await this.details(organizationId, criteria);
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? details.length;
    return details.slice(skip, skip + take);
  }

  async count(
    organizationId: string,
    criteria: MembershipListCriteria = {},
  ): Promise<number> {
    const details = await this.details(organizationId, criteria);
    return details.length;
  }

  countActiveOwners(organizationId: string): Promise<number> {
    const owners = [...this.memberships.values()].filter(
      (membership) =>
        membership.organizationId === organizationId &&
        membership.isOwner &&
        membership.active,
    );
    return Promise.resolve(owners.length);
  }

  async findActiveOwner(
    organizationId: string,
  ): Promise<MembershipDetail | null> {
    const owners = [...this.memberships.values()]
      .filter(
        (membership) =>
          membership.organizationId === organizationId &&
          membership.isOwner &&
          membership.active,
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const first = owners[0];
    if (!first) return null;
    return this.toDetail(first);
  }

  save(membership: Membership): Promise<Membership> {
    this.memberships.set(membership.id, membership);
    return Promise.resolve(membership);
  }

  /** Registra resumo de perfil para `MembershipDetail` (seed de createWithOwner). */
  registerPermissionProfile(summary: MembershipPermissionProfileSummary): void {
    this.permissionProfiles.set(summary.id, summary);
  }

  delete(organizationId: string, id: string): Promise<void> {
    const membership = this.memberships.get(id);
    if (membership && membership.organizationId === organizationId) {
      this.memberships.delete(id);
      this.branchAccess.delete(id);
    }
    return Promise.resolve();
  }

  replaceBranchAccess(
    organizationId: string,
    membershipId: string,
    branchIds: string[],
  ): Promise<void> {
    const membership = this.memberships.get(membershipId);
    if (membership && membership.organizationId === organizationId) {
      this.branchAccess.set(membershipId, [...branchIds]);
    }
    return Promise.resolve();
  }

  private async details(
    organizationId: string,
    criteria: MembershipListCriteria,
  ): Promise<MembershipDetail[]> {
    const search = criteria.search?.trim().toLowerCase();
    const scoped = [...this.memberships.values()]
      .filter((membership) => membership.organizationId === organizationId)
      .filter((membership) => (criteria.activeOnly ? membership.active : true))
      .filter((membership) =>
        criteria.isSeller === undefined
          ? true
          : membership.isSeller === criteria.isSeller,
      );

    const details: MembershipDetail[] = [];
    for (const membership of scoped) {
      const detail = await this.toDetail(membership);
      if (!detail) continue;
      const haystack = `${detail.user.name ?? ''} ${detail.user.email ?? ''}`
        .trim()
        .toLowerCase();
      if (search && !haystack.includes(search)) continue;
      details.push(detail);
    }

    return details.sort((a, b) =>
      (a.user.name ?? '').localeCompare(b.user.name ?? '', 'pt-BR'),
    );
  }

  private async toDetail(
    membership: Membership,
  ): Promise<MembershipDetail | null> {
    const user = await this.userRepository.findById(membership.userId);
    if (!user) return null;

    const permissionProfile = membership.permissionProfileId
      ? (this.permissionProfiles.get(membership.permissionProfileId) ?? null)
      : null;

    return {
      membership,
      user,
      branchIds: [...(this.branchAccess.get(membership.id) ?? [])],
      permissionProfile,
    };
  }

  clear(): void {
    this.memberships.clear();
    this.branchAccess.clear();
    this.permissionProfiles.clear();
  }
}
