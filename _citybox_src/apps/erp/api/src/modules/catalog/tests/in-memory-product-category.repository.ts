import { ProductCategory } from '../domain/entities/product-category.entity';
import {
  ProductCategoryRepository,
  type ProductCategoryListCriteria,
  type ProductCategoryWithProductCount,
} from '../domain/repositories/product-category.repository.interface';

export class InMemoryProductCategoryRepository extends ProductCategoryRepository {
  private categories = new Map<string, ProductCategory>();
  private productCounts = new Map<string, number>();

  /** Helper de teste — simula `_count.products` do Prisma. */
  setProductCount(categoryId: string, count: number): void {
    this.productCounts.set(categoryId, count);
  }

  findById(
    organizationId: string,
    id: string,
  ): Promise<ProductCategory | null> {
    const category = this.categories.get(id);
    return Promise.resolve(
      category && category.organizationId === organizationId ? category : null,
    );
  }

  findByName(
    organizationId: string,
    name: string,
  ): Promise<ProductCategory | null> {
    const normalized = name.trim().toLowerCase();
    const found = [...this.categories.values()].find(
      (category) =>
        category.organizationId === organizationId &&
        category.name.trim().toLowerCase() === normalized,
    );
    return Promise.resolve(found ?? null);
  }

  findAll(
    organizationId: string,
    criteria: ProductCategoryListCriteria = {},
  ): Promise<ProductCategory[]> {
    const filtered = this.filter(organizationId, criteria);
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? filtered.length;
    return Promise.resolve(filtered.slice(skip, skip + take));
  }

  findAllWithProductCounts(
    organizationId: string,
    criteria: ProductCategoryListCriteria = {},
  ): Promise<ProductCategoryWithProductCount[]> {
    const filtered = this.filter(organizationId, criteria);
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? filtered.length;

    return Promise.resolve(
      filtered.slice(skip, skip + take).map((category) => ({
        category,
        productCount: this.productCounts.get(category.id) ?? 0,
      })),
    );
  }

  count(
    organizationId: string,
    criteria: Pick<ProductCategoryListCriteria, 'activeOnly' | 'search'> = {},
  ): Promise<number> {
    return Promise.resolve(this.filter(organizationId, criteria).length);
  }

  save(category: ProductCategory): Promise<ProductCategory> {
    this.categories.set(category.id, category);
    return Promise.resolve(category);
  }

  delete(organizationId: string, id: string): Promise<void> {
    const category = this.categories.get(id);
    if (category && category.organizationId === organizationId) {
      this.categories.delete(id);
      this.productCounts.delete(id);
    }
    return Promise.resolve();
  }

  private filter(
    organizationId: string,
    criteria: ProductCategoryListCriteria,
  ): ProductCategory[] {
    const search = criteria.search?.trim().toLowerCase();

    return [...this.categories.values()]
      .filter((category) => category.organizationId === organizationId)
      .filter((category) => (criteria.activeOnly ? category.active : true))
      .filter((category) =>
        search ? category.name.toLowerCase().includes(search) : true,
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  clear(): void {
    this.categories.clear();
    this.productCounts.clear();
  }
}
