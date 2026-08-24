import { CostCenter } from '../domain/entities/cost-center.entity';
import {
  CostCenterRepository,
  type CostCenterListCriteria,
  type CostCenterTabCounts,
} from '../domain/repositories/cost-center.repository.interface';

export class InMemoryCostCenterRepository extends CostCenterRepository {
  private readonly items = new Map<string, CostCenter>();

  async findById(
    organizationId: string,
    id: string,
  ): Promise<CostCenter | null> {
    const item = this.items.get(id);
    if (!item || item.organizationId !== organizationId) return null;
    return item;
  }

  async findByName(
    organizationId: string,
    name: string,
  ): Promise<CostCenter | null> {
    const needle = name.trim().toLowerCase();
    if (!needle) return null;

    for (const item of this.items.values()) {
      if (
        item.organizationId === organizationId &&
        item.name.toLowerCase() === needle
      ) {
        return item;
      }
    }
    return null;
  }

  async findAll(
    organizationId: string,
    criteria: CostCenterListCriteria = {},
  ): Promise<CostCenter[]> {
    return this.filter(organizationId, criteria);
  }

  async count(
    organizationId: string,
    criteria: Omit<CostCenterListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return this.filter(organizationId, criteria).length;
  }

  async countByTabs(organizationId: string): Promise<CostCenterTabCounts> {
    return {
      active: this.filter(organizationId, { tab: 'active' }).length,
      deleted: this.filter(organizationId, { tab: 'deleted' }).length,
    };
  }

  async save(costCenter: CostCenter): Promise<CostCenter> {
    this.items.set(costCenter.id, costCenter);
    return costCenter;
  }

  async softDelete(
    organizationId: string,
    id: string,
    deletedAt: Date,
  ): Promise<void> {
    const item = await this.findById(organizationId, id);
    if (!item) return;

    this.items.set(
      id,
      CostCenter.with(
        { ...item.props, deletedAt, updatedAt: deletedAt },
        item.id,
      ),
    );
  }

  async clearDeletedAt(
    organizationId: string,
    id: string,
    updatedAt: Date,
  ): Promise<void> {
    const item = await this.findById(organizationId, id);
    if (!item) return;

    this.items.set(
      id,
      CostCenter.with({ ...item.props, deletedAt: null, updatedAt }, item.id),
    );
  }

  private filter(
    organizationId: string,
    criteria: CostCenterListCriteria,
  ): CostCenter[] {
    const search = criteria.search?.trim().toLowerCase();
    const wantsDeleted = criteria.tab === 'deleted';

    let list = [...this.items.values()]
      .filter((item) => item.organizationId === organizationId)
      .filter((item) => (wantsDeleted ? !!item.deletedAt : !item.deletedAt))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    if (search) {
      list = list.filter((item) => item.name.toLowerCase().includes(search));
    }

    const skip = criteria.skip ?? 0;
    const take = criteria.take;
    return take === undefined
      ? list.slice(skip)
      : list.slice(skip, skip + take);
  }
}
