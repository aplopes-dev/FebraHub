import { Branch } from '../domain/entities/branch.entity';
import {
  BranchRepository,
  type BranchListCriteria,
} from '../domain/repositories/branch.repository.interface';

export class InMemoryBranchRepository extends BranchRepository {
  readonly branches = new Map<string, Branch>();

  findById(organizationId: string, id: string): Promise<Branch | null> {
    const branch = this.branches.get(id);
    // Devolve a unidade mesmo excluída: quem decide o que fazer com o
    // `deletedAt` é o use case, como no repositório Prisma.
    return Promise.resolve(
      branch && branch.organizationId === organizationId ? branch : null,
    );
  }

  findByCode(organizationId: string, code: string): Promise<Branch | null> {
    const normalized = code.trim();
    const found = this.ofOrganization(organizationId).find(
      (branch) => branch.code === normalized,
    );
    return Promise.resolve(found ?? null);
  }

  findByDocument(
    organizationId: string,
    document: string,
  ): Promise<Branch | null> {
    const found = this.ofOrganization(organizationId).find(
      (branch) => branch.document === document,
    );
    return Promise.resolve(found ?? null);
  }

  findHeadquarters(organizationId: string): Promise<Branch | null> {
    const found = this.ofOrganization(organizationId).find(
      (branch) => branch.isHeadquarters && !branch.deletedAt,
    );
    return Promise.resolve(found ?? null);
  }

  findAll(
    organizationId: string,
    criteria: BranchListCriteria = {},
  ): Promise<Branch[]> {
    const filtered = this.filter(organizationId, criteria);
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? filtered.length;
    return Promise.resolve(filtered.slice(skip, skip + take));
  }

  count(
    organizationId: string,
    criteria: BranchListCriteria = {},
  ): Promise<number> {
    return Promise.resolve(this.filter(organizationId, criteria).length);
  }

  save(branch: Branch): Promise<Branch> {
    this.branches.set(branch.id, branch);
    return Promise.resolve(branch);
  }

  private ofOrganization(organizationId: string): Branch[] {
    return [...this.branches.values()].filter(
      (branch) => branch.organizationId === organizationId,
    );
  }

  private filter(
    organizationId: string,
    criteria: BranchListCriteria,
  ): Branch[] {
    const search = criteria.search?.trim().toLowerCase();
    const allowed = criteria.allowedBranchIds ?? null;

    return this.ofOrganization(organizationId)
      .filter((branch) => (criteria.includeDeleted ? true : !branch.deletedAt))
      .filter((branch) => (criteria.activeOnly ? branch.active : true))
      .filter((branch) => (allowed ? allowed.includes(branch.id) : true))
      .filter((branch) =>
        search
          ? [branch.code, branch.legalName, branch.tradeName ?? '']
              .join(' ')
              .toLowerCase()
              .includes(search)
          : true,
      )
      .sort((a, b) => a.code.localeCompare(b.code, 'pt-BR'));
  }

  clear(): void {
    this.branches.clear();
  }
}
