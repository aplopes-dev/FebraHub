import { FinancialGroup } from '../domain/entities/financial-group.entity';
import {
  FinancialGroupRepository,
  type FinancialGroupListCriteria,
} from '../domain/repositories/financial-group.repository.interface';

export class InMemoryFinancialGroupRepository extends FinancialGroupRepository {
  readonly groups = new Map<string, FinancialGroup>();
  /** groupId → chartOfAccountIds (ativos) — preenchido pelos testes. */
  private readonly chartOfAccountLinks = new Map<string, Set<string>>();

  linkChartOfAccount(groupId: string, chartOfAccountId: string): void {
    const set = this.chartOfAccountLinks.get(groupId) ?? new Set();
    set.add(chartOfAccountId);
    this.chartOfAccountLinks.set(groupId, set);
  }

  unlinkChartOfAccount(groupId: string, chartOfAccountId: string): void {
    this.chartOfAccountLinks.get(groupId)?.delete(chartOfAccountId);
  }

  findById(organizationId: string, id: string): Promise<FinancialGroup | null> {
    const group = this.groups.get(id);
    // Devolve o grupo mesmo excluído: quem decide o que fazer com o
    // `deletedAt` é o use case, como no repositório Prisma.
    return Promise.resolve(
      group && group.organizationId === organizationId ? group : null,
    );
  }

  findByName(
    organizationId: string,
    name: string,
  ): Promise<FinancialGroup | null> {
    const needle = name.trim().toLowerCase();
    const found = this.ofOrganization(organizationId).find(
      (group) => group.name.toLowerCase() === needle,
    );
    return Promise.resolve(found ?? null);
  }

  findAll(
    organizationId: string,
    criteria: FinancialGroupListCriteria = {},
  ): Promise<FinancialGroup[]> {
    const filtered = this.filter(organizationId, criteria);
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? filtered.length;
    return Promise.resolve(filtered.slice(skip, skip + take));
  }

  count(
    organizationId: string,
    criteria: FinancialGroupListCriteria = {},
  ): Promise<number> {
    return Promise.resolve(this.filter(organizationId, criteria).length);
  }

  countChartOfAccounts(
    _organizationId: string,
    groupId: string,
  ): Promise<number> {
    return Promise.resolve(this.chartOfAccountLinks.get(groupId)?.size ?? 0);
  }

  save(group: FinancialGroup): Promise<FinancialGroup> {
    this.groups.set(group.id, group);
    return Promise.resolve(group);
  }

  private ofOrganization(organizationId: string): FinancialGroup[] {
    return [...this.groups.values()].filter(
      (group) => group.organizationId === organizationId,
    );
  }

  private filter(
    organizationId: string,
    criteria: FinancialGroupListCriteria,
  ): FinancialGroup[] {
    const search = criteria.search?.trim().toLowerCase();
    const tab = criteria.tab ?? 'active';

    return this.ofOrganization(organizationId)
      .filter((group) =>
        tab === 'deleted' ? group.deletedAt : !group.deletedAt,
      )
      .filter((group) => (criteria.type ? group.type === criteria.type : true))
      .filter((group) =>
        search ? group.name.toLowerCase().includes(search) : true,
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  clear(): void {
    this.groups.clear();
    this.chartOfAccountLinks.clear();
  }
}
