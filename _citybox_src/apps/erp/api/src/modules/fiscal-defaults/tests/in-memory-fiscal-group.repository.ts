import {
  FiscalGroup,
  type FiscalTaxType,
} from '../domain/entities/fiscal-group.entity';
import {
  FiscalGroupRepository,
  type FiscalGroupProductRef,
} from '../domain/repositories/fiscal-group.repository.interface';

export class InMemoryFiscalGroupRepository extends FiscalGroupRepository {
  private readonly items = new Map<string, FiscalGroup>();
  /** Produtos que usam um grupo, por groupId — populado pelos testes. */
  private readonly productsByGroup = new Map<string, FiscalGroupProductRef[]>();

  listByOrganization(
    organizationId: string,
    taxType?: FiscalTaxType,
  ): Promise<FiscalGroup[]> {
    const found = [...this.items.values()].filter(
      (item) =>
        item.organizationId === organizationId &&
        (taxType === undefined || item.taxType === taxType),
    );
    return Promise.resolve(found);
  }

  findById(organizationId: string, id: string): Promise<FiscalGroup | null> {
    const found = this.items.get(id);
    return Promise.resolve(
      found && found.organizationId === organizationId ? found : null,
    );
  }

  save(group: FiscalGroup): Promise<FiscalGroup> {
    this.items.set(group.id, group);
    return Promise.resolve(group);
  }

  listProductsUsingGroup(
    _organizationId: string,
    groupId: string,
  ): Promise<FiscalGroupProductRef[]> {
    return Promise.resolve(this.productsByGroup.get(groupId) ?? []);
  }

  countProductsByGroup(
    organizationId: string,
    taxType: FiscalTaxType,
  ): Promise<Record<string, number>> {
    const groupIds = [...this.items.values()]
      .filter(
        (item) =>
          item.organizationId === organizationId && item.taxType === taxType,
      )
      .map((item) => item.id);
    const counts: Record<string, number> = {};
    for (const groupId of groupIds) {
      counts[groupId] = (this.productsByGroup.get(groupId) ?? []).length;
    }
    return Promise.resolve(counts);
  }

  deleteById(_organizationId: string, id: string): Promise<void> {
    this.items.delete(id);
    return Promise.resolve();
  }

  /** Helper de teste/seed. */
  seed(group: FiscalGroup): void {
    this.items.set(group.id, group);
  }

  seedProductsUsingGroup(
    groupId: string,
    products: FiscalGroupProductRef[],
  ): void {
    this.productsByGroup.set(groupId, products);
  }

  clear(): void {
    this.items.clear();
    this.productsByGroup.clear();
  }
}
