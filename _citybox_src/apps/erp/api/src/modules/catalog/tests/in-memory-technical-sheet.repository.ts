import { Product } from '../domain/entities/product.entity';
import { TechnicalSheet } from '../domain/entities/technical-sheet.entity';
import {
  TechnicalSheetRepository,
  type TechnicalSheetDetailView,
  type TechnicalSheetListRow,
  type TechnicalSheetsListCriteria,
  type TechnicalSheetTabCounts,
} from '../domain/repositories/technical-sheet.repository.interface';
import type { ProductCategory } from '../domain/entities/product-category.entity';

type SupplyMeta = {
  name: string;
  unit: string;
  unitCostCents: number;
  type: string;
  deletedAt: Date | null;
};

/** Fake em memória — lista product-centric (exclui supply / deleted). */
export class InMemoryTechnicalSheetRepository extends TechnicalSheetRepository {
  private sheets = new Map<string, TechnicalSheet>();
  private products = new Map<string, Product>();
  private categories = new Map<string, ProductCategory>();
  private supplyMeta = new Map<string, SupplyMeta>();

  seedProduct(product: Product, category?: ProductCategory): void {
    this.products.set(product.id, product);
    if (category) {
      this.categories.set(category.id, category);
    }
  }

  seedSupplyMeta(productId: string, meta: SupplyMeta): void {
    this.supplyMeta.set(productId, meta);
  }

  findByProductId(
    organizationId: string,
    productId: string,
  ): Promise<TechnicalSheet | null> {
    const found = [...this.sheets.values()].find(
      (sheet) =>
        sheet.organizationId === organizationId &&
        sheet.productId === productId,
    );
    return Promise.resolve(found ?? null);
  }

  async findDetailByProductId(
    organizationId: string,
    productId: string,
  ): Promise<TechnicalSheetDetailView | null> {
    const product = this.products.get(productId);
    if (!product || product.organizationId !== organizationId) {
      return null;
    }

    const category = this.categories.get(product.categoryId);
    const sheet = await this.findByProductId(organizationId, productId);

    const components = (sheet?.components ?? []).map((row) => {
      const meta = this.supplyMeta.get(row.componentProductId) ?? {
        name: row.componentProductId,
        unit: 'un',
        unitCostCents: 0,
        type: 'supply',
        deletedAt: null,
      };
      return {
        id: row.id,
        componentProductId: row.componentProductId,
        name: meta.name,
        unit: meta.unit,
        optional: row.optional,
        quantity: String(row.quantity),
        unitCostCents: meta.unitCostCents,
        sortOrder: row.sortOrder,
      };
    });

    const optionComponents = (sheet?.optionComponents ?? []).map((row) => {
      const meta = this.supplyMeta.get(row.componentProductId) ?? {
        name: row.componentProductId,
        unit: 'un',
        unitCostCents: 0,
        type: 'supply',
        deletedAt: null,
      };
      return {
        id: row.id,
        variationOptionId: row.variationOptionId,
        componentProductId: row.componentProductId,
        name: meta.name,
        unit: meta.unit,
        optional: row.optional,
        quantity: String(row.quantity),
        unitCostCents: meta.unitCostCents,
        sortOrder: row.sortOrder,
      };
    });

    const totalCostCents = components.reduce(
      (sum, row) => sum + Math.round(Number(row.quantity) * row.unitCostCents),
      0,
    );

    return {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      imageUrl: product.imageUrl,
      categoryName: category?.name ?? '',
      productionType: sheet?.productionType ?? 'automatic',
      maxRemovableComponents: sheet?.maxRemovableComponents ?? 0,
      markupPercent: sheet?.markupPercent ?? 0,
      currentPriceCents: product.basePriceCents,
      totalCostCents,
      hasSheet: sheet !== null,
      components,
      optionComponents,
      sheet,
    };
  }

  list(
    organizationId: string,
    criteria: TechnicalSheetsListCriteria = {},
  ): Promise<TechnicalSheetListRow[]> {
    const rows = this.filterRows(this.allRows(organizationId), criteria);
    const sorted = this.sortRows(rows, criteria.sort);
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? sorted.length;
    return Promise.resolve(sorted.slice(skip, skip + take));
  }

  count(
    organizationId: string,
    criteria: Omit<TechnicalSheetsListCriteria, 'skip' | 'take' | 'sort'> = {},
  ): Promise<number> {
    return Promise.resolve(
      this.filterRows(this.allRows(organizationId), criteria).length,
    );
  }

  countByTabs(organizationId: string): Promise<TechnicalSheetTabCounts> {
    const rows = this.allRows(organizationId);
    return Promise.resolve({
      all: rows.length,
      production: rows.filter(
        (row) => row.productionType === 'productive_process',
      ).length,
    });
  }

  upsert(sheet: TechnicalSheet): Promise<TechnicalSheet> {
    this.sheets.set(sheet.id, sheet);
    return Promise.resolve(sheet);
  }

  private allRows(organizationId: string): TechnicalSheetListRow[] {
    return [...this.products.values()]
      .filter(
        (product) =>
          product.organizationId === organizationId &&
          !product.deletedAt &&
          product.type !== 'supply',
      )
      .map((product) => {
        const sheet = [...this.sheets.values()].find(
          (item) =>
            item.organizationId === organizationId &&
            item.productId === product.id,
        );
        const category = this.categories.get(product.categoryId);
        return {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          imageUrl: product.imageUrl,
          categoryName: category?.name ?? '',
          productionType: sheet?.productionType ?? null,
          hasComposition: TechnicalSheet.hasComposition(sheet ?? null),
        };
      });
  }

  private filterRows(
    rows: TechnicalSheetListRow[],
    criteria: Omit<TechnicalSheetsListCriteria, 'skip' | 'take' | 'sort'>,
  ): TechnicalSheetListRow[] {
    let filtered = rows;

    if (criteria.tab === 'production') {
      filtered = filtered.filter(
        (row) => row.productionType === 'productive_process',
      );
    }

    if (criteria.productionTypes?.length) {
      const set = new Set(criteria.productionTypes);
      filtered = filtered.filter(
        (row) => row.productionType !== null && set.has(row.productionType),
      );
    }

    const search = criteria.search?.trim().toLowerCase();
    if (search) {
      filtered = filtered.filter(
        (row) =>
          row.name.toLowerCase().includes(search) ||
          row.sku.toLowerCase().includes(search),
      );
    }

    if (criteria.category?.trim()) {
      const needle = criteria.category.trim().toLowerCase();
      filtered = filtered.filter(
        (row) => row.categoryName.toLowerCase() === needle,
      );
    }

    if (criteria.categories?.length) {
      const set = new Set(
        criteria.categories.map((item) => item.trim().toLowerCase()),
      );
      filtered = filtered.filter((row) =>
        set.has(row.categoryName.toLowerCase()),
      );
    }

    return filtered;
  }

  private sortRows(
    rows: TechnicalSheetListRow[],
    sort: TechnicalSheetsListCriteria['sort'],
  ): TechnicalSheetListRow[] {
    const copy = [...rows];
    const localeCompare = (a: string, b: string) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

    switch (sort) {
      case 'name_desc':
        return copy.sort((a, b) => localeCompare(b.name, a.name));
      case 'category_asc':
        return copy.sort((a, b) =>
          localeCompare(a.categoryName, b.categoryName),
        );
      case 'category_desc':
        return copy.sort((a, b) =>
          localeCompare(b.categoryName, a.categoryName),
        );
      case 'name_asc':
      default:
        return copy.sort((a, b) => localeCompare(a.name, b.name));
    }
  }
}
