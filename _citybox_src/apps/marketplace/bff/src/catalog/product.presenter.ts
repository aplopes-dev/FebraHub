import { money, moneyOrNull } from '../common/money.js';

/** Linha de Product com a Category incluída (include: { category: true }). */
export interface ProductRow {
  id: string;
  name: string;
  imageUrl: string;
  price: unknown;
  originalPrice: unknown | null;
  discountPercent: number | null;
  rating: unknown;
  reviewCount: number;
  isFreeShipping: boolean;
  isExpress: boolean;
  brand: string | null;
  specs: unknown;
  categoryId: string;
  category: { id: string; name: string };
}

/** Molda Product (+Category) no shape ApiProduct do contrato. */
export function toApiProduct(row: ProductRow) {
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.imageUrl,
    price: money(row.price as never),
    originalPrice: moneyOrNull(row.originalPrice as never),
    discountPercent: row.discountPercent,
    rating: Number(row.rating),
    reviewCount: row.reviewCount,
    isFreeShipping: row.isFreeShipping,
    isExpress: row.isExpress,
    category: row.category.name,
    categoryId: row.categoryId,
    brand: row.brand ?? undefined,
    specs: (row.specs as Record<string, string> | null) ?? undefined,
  };
}

export const PRODUCT_INCLUDE = { category: true } as const;
