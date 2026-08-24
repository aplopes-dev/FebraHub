import { ProductFiscal } from '../domain/entities/product-fiscal.entity';
import {
  ProductFiscalRepository,
  type FiscalParameterListRow,
  type FiscalParameterTabCounts,
  type FiscalParametersListCriteria,
} from '../domain/repositories/product-fiscal.repository.interface';
import type { Product } from '../domain/entities/product.entity';
import type { ProductCategory } from '../domain/entities/product-category.entity';

export class InMemoryProductFiscalRepository extends ProductFiscalRepository {
  private fiscals = new Map<string, ProductFiscal>();
  private products = new Map<string, Product>();
  private categories = new Map<string, ProductCategory>();

  seedProduct(product: Product, category?: ProductCategory): void {
    this.products.set(product.id, product);
    if (category) this.categories.set(category.id, category);
  }

  findByProductId(
    organizationId: string,
    productId: string,
  ): Promise<ProductFiscal | null> {
    const found = [...this.fiscals.values()].find(
      (fiscal) =>
        fiscal.organizationId === organizationId &&
        fiscal.productId === productId,
    );
    return Promise.resolve(found ?? null);
  }

  list(
    organizationId: string,
    criteria: FiscalParametersListCriteria = {},
  ): Promise<FiscalParameterListRow[]> {
    const filtered = this.filterRows(organizationId, criteria);
    const sorted = this.sortRows(filtered, criteria.sort ?? 'name_asc');
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? sorted.length;
    return Promise.resolve(sorted.slice(skip, skip + take));
  }

  count(
    organizationId: string,
    criteria: Omit<FiscalParametersListCriteria, 'skip' | 'take' | 'sort'> = {},
  ): Promise<number> {
    return Promise.resolve(this.filterRows(organizationId, criteria).length);
  }

  countByTabs(organizationId: string): Promise<FiscalParameterTabCounts> {
    const rows = this.allRows(organizationId);
    return Promise.resolve({
      all: rows.length,
      pending: rows.filter((row) => !row.configured).length,
    });
  }

  upsert(fiscal: ProductFiscal): Promise<ProductFiscal> {
    this.fiscals.set(fiscal.id, fiscal);
    return Promise.resolve(fiscal);
  }

  private allRows(organizationId: string): FiscalParameterListRow[] {
    return [...this.products.values()]
      .filter(
        (product) =>
          product.organizationId === organizationId && !product.deletedAt,
      )
      .map((product) => {
        const fiscal = [...this.fiscals.values()].find(
          (row) =>
            row.organizationId === organizationId &&
            row.productId === product.id,
        );
        const category = this.categories.get(product.categoryId);
        return {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          imageUrl: product.imageUrl,
          categoryName: category?.name ?? '',
          configured: ProductFiscal.isConfigured(fiscal ?? null),
        };
      });
  }

  private filterRows(
    organizationId: string,
    criteria: FiscalParametersListCriteria,
  ): FiscalParameterListRow[] {
    const search = criteria.search?.trim().toLowerCase();
    const categoryFilter = criteria.category?.trim();
    const statuses = criteria.statuses;

    return this.allRows(organizationId).filter((row) => {
      if (criteria.tab === 'pending' && row.configured) return false;

      if (search) {
        const haystack =
          `${row.name} ${row.sku} ${row.categoryName}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      if (categoryFilter) {
        const product = this.products.get(row.productId);
        const matchesName =
          row.categoryName.toLowerCase() === categoryFilter.toLowerCase();
        const matchesId = product?.categoryId === categoryFilter;
        if (!matchesName && !matchesId) return false;
      }

      if (criteria.categories?.length) {
        const product = this.products.get(row.productId);
        const ok = criteria.categories.some((value) => {
          const normalized = value.trim().toLowerCase();
          return (
            row.categoryName.toLowerCase() === normalized ||
            product?.categoryId === value
          );
        });
        if (!ok) return false;
      }

      if (statuses?.length) {
        const status = row.configured ? 'configured' : 'pending';
        if (!statuses.includes(status)) return false;
      }

      return true;
    });
  }

  private sortRows(
    rows: FiscalParameterListRow[],
    sort: NonNullable<FiscalParametersListCriteria['sort']>,
  ): FiscalParameterListRow[] {
    const sorted = [...rows];
    sorted.sort((a, b) => {
      switch (sort) {
        case 'name_desc':
          return b.name.localeCompare(a.name, 'pt-BR');
        case 'category_asc':
          return a.categoryName.localeCompare(b.categoryName, 'pt-BR');
        case 'category_desc':
          return b.categoryName.localeCompare(a.categoryName, 'pt-BR');
        case 'name_asc':
        default:
          return a.name.localeCompare(b.name, 'pt-BR');
      }
    });
    return sorted;
  }
}
