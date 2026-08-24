import { ProductAddon } from '../domain/entities/product-addon.entity';
import {
  ProductAddonRepository,
  type ProductAddonListCriteria,
} from '../domain/repositories/product-addon.repository.interface';

export class InMemoryProductAddonRepository extends ProductAddonRepository {
  private addons = new Map<string, ProductAddon>();

  findById(organizationId: string, id: string): Promise<ProductAddon | null> {
    const addon = this.addons.get(id);
    return Promise.resolve(
      addon && addon.organizationId === organizationId ? addon : null,
    );
  }

  findByName(
    organizationId: string,
    name: string,
  ): Promise<ProductAddon | null> {
    const normalized = name.trim().toLowerCase();
    const found = [...this.addons.values()].find(
      (addon) =>
        addon.organizationId === organizationId &&
        !addon.isDeleted() &&
        addon.name.trim().toLowerCase() === normalized,
    );
    return Promise.resolve(found ?? null);
  }

  findAll(
    organizationId: string,
    criteria: ProductAddonListCriteria = {},
  ): Promise<ProductAddon[]> {
    const filtered = this.filter(organizationId, criteria);
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? filtered.length;
    return Promise.resolve(filtered.slice(skip, skip + take));
  }

  count(
    organizationId: string,
    criteria: Pick<ProductAddonListCriteria, 'activeOnly' | 'search'> = {},
  ): Promise<number> {
    return Promise.resolve(this.filter(organizationId, criteria).length);
  }

  save(addon: ProductAddon): Promise<ProductAddon> {
    this.addons.set(addon.id, addon);
    return Promise.resolve(addon);
  }

  private filter(
    organizationId: string,
    criteria: ProductAddonListCriteria,
  ): ProductAddon[] {
    const search = criteria.search?.trim().toLowerCase();
    const activeOnly = criteria.activeOnly !== false;

    return [...this.addons.values()]
      .filter((addon) => addon.organizationId === organizationId)
      .filter((addon) => (activeOnly ? !addon.isDeleted() : true))
      .filter((addon) =>
        search ? addon.name.toLowerCase().includes(search) : true,
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  clear(): void {
    this.addons.clear();
  }
}
