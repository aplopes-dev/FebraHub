import i18n from '@/i18n';
import type { Category, Product } from '@/types';

export type SortOption = 'RELEVANCE' | 'PRICE_ASC' | 'PRICE_DESC' | 'BEST_SELLERS';

const SORT_KEYS: Record<SortOption, string> = {
  RELEVANCE: 'sort.relevance',
  PRICE_ASC: 'sort.priceAsc',
  PRICE_DESC: 'sort.priceDesc',
  BEST_SELLERS: 'sort.bestSellers',
};

export function getSortLabel(option: SortOption): string {
  return i18n.t(SORT_KEYS[option], { ns: 'search' });
}

/** @deprecated Use getSortLabel — kept for gradual migration */
export const SORT_LABELS: Record<SortOption, string> = {
  RELEVANCE: 'sort.relevance',
  PRICE_ASC: 'sort.priceAsc',
  PRICE_DESC: 'sort.priceDesc',
  BEST_SELLERS: 'sort.bestSellers',
};

export interface SearchFilters {
  sortBy: SortOption;
  minPrice: number | null;
  maxPrice: number | null;
  brand: string | null;
  minRating: number | null;
  freeShippingOnly: boolean;
  expressOnly: boolean;
}

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  sortBy: 'RELEVANCE',
  minPrice: null,
  maxPrice: null,
  brand: null,
  minRating: null,
  freeShippingOnly: false,
  expressOnly: false,
};

export function productBrand(product: Product): string {
  const name = product.title;
  if (/iPhone|MacBook|AirPods|Kindle/i.test(name)) return 'Apple';
  if (/Samsung|Galaxy/i.test(name)) return 'Samsung';
  if (/PlayStation/i.test(name)) return 'Sony';
  if (/Nintendo/i.test(name)) return 'Nintendo';
  return i18n.t('brand.other', { ns: 'search' });
}

export function brandsFromProducts(products: Product[]): string[] {
  return [...new Set(products.map(productBrand))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function categoryById(categoryId: string, categories: Category[]): Category | undefined {
  return categories.find((c) => c.id === categoryId);
}

export function filterAndSortProducts(
  products: Product[],
  query: string,
  filters: SearchFilters,
): Product[] {
  const q = query.trim();
  let result = products.filter((product) => {
    const matchesQuery =
      !q ||
      product.title.toLowerCase().includes(q.toLowerCase()) ||
      (product.category?.toLowerCase().includes(q.toLowerCase()) ?? false);
    const matchesMinPrice = filters.minPrice == null || product.amount >= filters.minPrice;
    const matchesMaxPrice = filters.maxPrice == null || product.amount <= filters.maxPrice;
    const matchesRating = filters.minRating == null || product.rating >= filters.minRating;
    const matchesShipping = !filters.freeShippingOnly || product.amount >= 99;
    const matchesExpress = !filters.expressOnly || product.full;
    const matchesBrand = filters.brand == null || productBrand(product) === filters.brand;
    return (
      matchesQuery &&
      matchesMinPrice &&
      matchesMaxPrice &&
      matchesRating &&
      matchesShipping &&
      matchesExpress &&
      matchesBrand
    );
  });

  switch (filters.sortBy) {
    case 'PRICE_ASC':
      result = [...result].sort((a, b) => a.amount - b.amount);
      break;
    case 'PRICE_DESC':
      result = [...result].sort((a, b) => b.amount - a.amount);
      break;
    case 'BEST_SELLERS':
      result = [...result].sort((a, b) => b.reviews - a.reviews);
      break;
    default:
      break;
  }

  return result;
}
