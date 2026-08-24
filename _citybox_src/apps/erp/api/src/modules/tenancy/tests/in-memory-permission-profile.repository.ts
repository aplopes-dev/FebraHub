import { PermissionProfile } from '../domain/entities/permission-profile.entity';
import {
  PermissionProfileRepository,
  type PermissionProfileListCriteria,
  type PermissionProfileListFilters,
} from '../domain/repositories/permission-profile.repository.interface';

export class InMemoryPermissionProfileRepository extends PermissionProfileRepository {
  readonly profiles = new Map<string, PermissionProfile>();

  async findById(
    organizationId: string,
    id: string,
  ): Promise<PermissionProfile | null> {
    const profile = this.profiles.get(id);
    if (!profile || profile.organizationId !== organizationId) return null;
    return profile;
  }

  async findBySystemKey(
    organizationId: string,
    systemKey: string,
  ): Promise<PermissionProfile | null> {
    for (const profile of this.profiles.values()) {
      if (
        profile.organizationId === organizationId &&
        profile.systemKey === systemKey &&
        !profile.deletedAt
      ) {
        return profile;
      }
    }
    return null;
  }

  async findAll(
    organizationId: string,
    criteria: PermissionProfileListCriteria,
  ): Promise<PermissionProfile[]> {
    const filtered = this.filter(organizationId, criteria);
    const skip = (criteria.page - 1) * criteria.perPage;
    return filtered.slice(skip, skip + criteria.perPage);
  }

  async count(
    organizationId: string,
    filters: PermissionProfileListFilters,
  ): Promise<number> {
    return this.filter(organizationId, filters).length;
  }

  async countMembershipsUsing(
    _organizationId: string,
    profileId: string,
  ): Promise<number> {
    return this.membershipCounts.get(profileId) ?? 0;
  }

  /** Contagens fictícias para testes de exclusão com membros vinculados. */
  readonly membershipCounts = new Map<string, number>();

  setMembershipCount(profileId: string, count: number): void {
    this.membershipCounts.set(profileId, count);
  }

  async save(profile: PermissionProfile): Promise<PermissionProfile> {
    this.profiles.set(profile.id, profile);
    return profile;
  }

  async softDelete(
    organizationId: string,
    id: string,
    deletedAt: Date,
  ): Promise<void> {
    const profile = await this.findById(organizationId, id);
    if (!profile) return;
    this.profiles.set(
      id,
      PermissionProfile.with(
        { ...profile.props, deletedAt, updatedAt: deletedAt },
        profile.id,
      ),
    );
  }

  clear(): void {
    this.profiles.clear();
    this.membershipCounts.clear();
  }

  private filter(
    organizationId: string,
    filters: PermissionProfileListFilters,
  ): PermissionProfile[] {
    const search = filters.search?.trim().toLowerCase();

    return [...this.profiles.values()]
      .filter((profile) => profile.organizationId === organizationId)
      .filter((profile) => (filters.activeOnly ? !profile.deletedAt : true))
      .filter((profile) => {
        if (!search) return true;
        const haystack = `${profile.name} ${profile.description}`.toLowerCase();
        return haystack.includes(search);
      })
      .sort((a, b) => {
        if (a.isSystem !== b.isSystem) return a.isSystem ? -1 : 1;
        return a.name.localeCompare(b.name, 'pt-BR');
      });
  }
}
