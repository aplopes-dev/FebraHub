import {
  SYSTEM_PERMISSION_PROFILES,
  SYSTEM_PROFILE_ADMINISTRADOR,
} from '../../../shared/infra/http/permissions/fine-to-coarse';
import { Membership } from '../domain/entities/membership.entity';
import { Organization } from '../domain/entities/organization.entity';
import { PermissionProfile } from '../domain/entities/permission-profile.entity';
import type { BranchRepository } from '../domain/repositories/branch.repository.interface';
import type { MembershipRepository } from '../domain/repositories/membership.repository.interface';
import {
  OrganizationRepository,
  type OrganizationSummary,
} from '../domain/repositories/organization.repository.interface';
import { InMemoryMembershipRepository } from './in-memory-membership.repository';

export class InMemoryOrganizationRepository extends OrganizationRepository {
  readonly organizations = new Map<string, Organization>();
  /** Perfis de sistema seedados em `createWithOwner` (espelha o Prisma). */
  readonly permissionProfiles = new Map<string, PermissionProfile>();

  /**
   * Vínculo e filiais vivem nos outros repositórios: `createWithOwner` e
   * `findAllByUser` cruzam as três tabelas no Prisma, e o fake precisa cruzar
   * as três coleções para não mentir sobre o que o use case enxerga.
   */
  constructor(
    private readonly membershipRepository: MembershipRepository,
    private readonly branchRepository: BranchRepository,
  ) {
    super();
  }

  findById(id: string): Promise<Organization | null> {
    return Promise.resolve(this.organizations.get(id) ?? null);
  }

  findByDocument(document: string): Promise<Organization | null> {
    const found = [...this.organizations.values()].find(
      (organization) =>
        organization.document === document && !organization.deletedAt,
    );
    return Promise.resolve(found ?? null);
  }

  findByPlatformStoreId(platformStoreId: string): Promise<Organization | null> {
    const found = [...this.organizations.values()].find(
      (organization) => organization.platformStoreId === platformStoreId,
    );
    return Promise.resolve(found ?? null);
  }

  async createWithOwner(
    organization: Organization,
    ownerUserId: string,
  ): Promise<{ organization: Organization; membership: Membership }> {
    this.organizations.set(organization.id, organization);

    let adminProfileId: string | null = null;
    for (const seed of SYSTEM_PERMISSION_PROFILES) {
      const profile = PermissionProfile.create({
        organizationId: organization.id,
        name: seed.name,
        description: seed.description,
        isSystem: seed.isSystem,
        systemKey: seed.systemKey,
        permissionIds: seed.permissionIds,
      });
      this.permissionProfiles.set(profile.id, profile);
      if (this.membershipRepository instanceof InMemoryMembershipRepository) {
        this.membershipRepository.registerPermissionProfile({
          id: profile.id,
          name: profile.name,
          systemKey: profile.systemKey,
          permissionIds: [...profile.permissionIds],
        });
      }
      if (seed.systemKey === SYSTEM_PROFILE_ADMINISTRADOR) {
        adminProfileId = profile.id;
      }
    }

    const membership = await this.membershipRepository.save(
      Membership.create({
        organizationId: organization.id,
        userId: ownerUserId,
        role: 'OWNER',
        active: true,
        permissionProfileId: adminProfileId,
      }),
    );

    return { organization, membership };
  }

  save(organization: Organization): Promise<Organization> {
    this.organizations.set(organization.id, organization);
    return Promise.resolve(organization);
  }

  async findAllByUser(userId: string): Promise<OrganizationSummary[]> {
    const summaries: OrganizationSummary[] = [];

    for (const organization of this.organizations.values()) {
      if (organization.deletedAt) continue;

      const membership = await this.membershipRepository.findByUser(
        organization.id,
        userId,
      );
      if (!membership || !membership.active) continue;

      summaries.push({
        organization,
        role: membership.role,
        branchCount: await this.branchRepository.count(organization.id, {}),
      });
    }

    return summaries;
  }

  clear(): void {
    this.organizations.clear();
    this.permissionProfiles.clear();
  }
}
