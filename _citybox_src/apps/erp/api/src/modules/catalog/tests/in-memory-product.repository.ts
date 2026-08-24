import { Product } from '../domain/entities/product.entity';
import {
  ProductRepository,
  type ProductListCriteria,
  type ProductTabCounts,
} from '../domain/repositories/product.repository.interface';

/** Fake em memória — espelha as regras de filtro/ordenação do repositório Prisma. */
export class InMemoryProductRepository extends ProductRepository {
  private products = new Map<string, Product>();

  findById(organizationId: string, id: string): Promise<Product | null> {
    const product = this.products.get(id);
    return Promise.resolve(
      product && product.organizationId === organizationId ? product : null,
    );
  }

  findBySku(organizationId: string, sku: string): Promise<Product | null> {
    const normalized = sku.trim().toLowerCase();
    const found = [...this.products.values()].find(
      (product) =>
        product.organizationId === organizationId &&
        product.sku.toLowerCase() === normalized,
    );
    return Promise.resolve(found ?? null);
  }

  findAll(
    organizationId: string,
    criteria: ProductListCriteria = {},
  ): Promise<Product[]> {
    const filtered = this.applyCriteria(organizationId, criteria);
    const sorted = this.applySort(filtered, criteria.sort);
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? sorted.length;
    return Promise.resolve(sorted.slice(skip, skip + take));
  }

  count(
    organizationId: string,
    criteria: ProductListCriteria = {},
  ): Promise<number> {
    return Promise.resolve(this.applyCriteria(organizationId, criteria).length);
  }

  countByCategoryId(
    organizationId: string,
    categoryId: string,
  ): Promise<number> {
    return Promise.resolve(
      [...this.products.values()].filter(
        (product) =>
          product.organizationId === organizationId &&
          product.categoryId === categoryId,
      ).length,
    );
  }

  countByUnitOfMeasureId(
    organizationId: string,
    unitOfMeasureId: string,
  ): Promise<number> {
    return Promise.resolve(
      [...this.products.values()].filter(
        (product) =>
          product.organizationId === organizationId &&
          product.unitOfMeasureId === unitOfMeasureId,
      ).length,
    );
  }

  countByTabs(
    organizationId: string,
    branchId?: string | null,
  ): Promise<ProductTabCounts> {
    const branchCriteria = branchId ? { branchId } : {};

    return Promise.all([
      this.count(organizationId, { tab: 'all', ...branchCriteria }),
      this.count(organizationId, { tab: 'with_variants', ...branchCriteria }),
      this.count(organizationId, { tab: 'supplies', ...branchCriteria }),
      this.count(organizationId, { tab: 'deleted', ...branchCriteria }),
    ]).then(([all, with_variants, supplies, deleted]) => ({
      all,
      with_variants,
      supplies,
      deleted,
    }));
  }

  save(product: Product): Promise<Product> {
    this.products.set(product.id, product);
    return Promise.resolve(product);
  }

  softDeleteMany(organizationId: string, ids: string[]): Promise<number> {
    let affected = 0;
    for (const id of ids) {
      const product = this.products.get(id);
      if (
        !product ||
        product.organizationId !== organizationId ||
        product.isDeleted()
      ) {
        continue;
      }
      product.softDelete();
      affected += 1;
    }
    return Promise.resolve(affected);
  }

  private applyCriteria(
    organizationId: string,
    criteria: ProductListCriteria,
  ): Product[] {
    return [...this.products.values()].filter((product) => {
      if (product.organizationId !== organizationId) return false;

      const tab = criteria.tab ?? 'all';
      if (tab === 'deleted' && !product.isDeleted()) return false;
      if (tab !== 'deleted' && product.isDeleted()) return false;
      if (tab === 'with_variants' && !product.hasVariants) return false;
      if (tab === 'supplies' && product.type !== 'supply') return false;

      const search = criteria.search?.trim().toLowerCase();
      if (search) {
        const haystack = `${product.name} ${product.sku}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      if (criteria.types?.length && !criteria.types.includes(product.type)) {
        return false;
      }

      if (criteria.variants === 'with' && !product.hasVariants) return false;
      if (criteria.variants === 'without' && product.hasVariants) return false;

      if (
        criteria.categoryIds?.length &&
        !criteria.categoryIds.includes(product.categoryId)
      ) {
        return false;
      }

      // Recorte por unidade: espelha o `some` do Prisma sobre ProductBranch.
      if (criteria.branchId && !product.branchIds.includes(criteria.branchId)) {
        return false;
      }

      if (criteria.trackStock === true && !product.trackStock) {
        return false;
      }

      if (
        typeof criteria.availableOnErp === 'boolean' &&
        product.availableOnErp !== criteria.availableOnErp
      ) {
        return false;
      }

      if (
        typeof criteria.availableOnPdv === 'boolean' &&
        product.availableOnPdv !== criteria.availableOnPdv
      ) {
        return false;
      }

      return true;
    });
  }

  private applySort(
    products: Product[],
    sort: ProductListCriteria['sort'],
  ): Product[] {
    const sorted = [...products];
    sorted.sort((a, b) => {
      switch (sort) {
        case 'name_desc':
          return b.name.localeCompare(a.name, 'pt-BR');
        case 'price_asc':
          return a.basePriceCents - b.basePriceCents;
        case 'price_desc':
          return b.basePriceCents - a.basePriceCents;
        // stock_* ainda não têm fonte (módulo Estoque não existe) → cai em nome
        default:
          return a.name.localeCompare(b.name, 'pt-BR');
      }
    });
    return sorted;
  }

  /** Helper de teste. */
  getAll(): Product[] {
    return [...this.products.values()];
  }

  clear(): void {
    this.products.clear();
  }
}
