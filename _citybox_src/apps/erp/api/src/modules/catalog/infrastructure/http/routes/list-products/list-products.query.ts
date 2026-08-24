import type { ProductType } from '../../../../domain/entities/product.entity';
import {
  PRODUCT_LIST_TABS,
  PRODUCT_SORT_OPTIONS,
  PRODUCT_STOCK_FILTERS,
  type ProductListTab,
  type ProductSortOption,
  type ProductStockFilter,
  type ProductVariantsFilter,
} from '../../../../domain/repositories/product.repository.interface';

const PRODUCT_TYPE_VALUES: readonly string[] = [
  'simple',
  'collection',
  'supply',
];

const VARIANTS_VALUES: readonly string[] = ['all', 'with', 'without'];

/** Aceita `?x=a,b` e `?x=a&x=b` — as duas formas que o front pode mandar. */
export function parseCsvParam(
  value: string | string[] | undefined,
): string[] | undefined {
  if (value === undefined) return undefined;
  const list = (Array.isArray(value) ? value : [value])
    .flatMap((entry) => entry.split(','))
    .map((entry) => entry.trim())
    .filter(Boolean);
  return list.length > 0 ? list : undefined;
}

export function parseTab(value?: string): ProductListTab | undefined {
  return (PRODUCT_LIST_TABS as readonly string[]).includes(value ?? '')
    ? (value as ProductListTab)
    : undefined;
}

export function parseSort(value?: string): ProductSortOption | undefined {
  return (PRODUCT_SORT_OPTIONS as readonly string[]).includes(value ?? '')
    ? (value as ProductSortOption)
    : undefined;
}

export function parseStockFilter(
  value?: string,
): ProductStockFilter | undefined {
  return (PRODUCT_STOCK_FILTERS as readonly string[]).includes(value ?? '')
    ? (value as ProductStockFilter)
    : undefined;
}

export function parseTypes(
  value: string | string[] | undefined,
): ProductType[] | undefined {
  const list = parseCsvParam(value)?.filter((entry) =>
    PRODUCT_TYPE_VALUES.includes(entry),
  );
  return list?.length ? (list as ProductType[]) : undefined;
}

export function parseVariants(
  value?: string,
): ProductVariantsFilter | undefined {
  return VARIANTS_VALUES.includes(value ?? '')
    ? (value as ProductVariantsFilter)
    : undefined;
}

/** Number() de string vazia é 0 — por isso o guard explícito. */
export function parsePositiveInt(value?: string): number | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : undefined;
}

/** Query boolean: só `true`/`1`/`false`/`0` — omitido = undefined (sem filtro). */
export function parseOptionalBoolean(value?: string): boolean | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  return undefined;
}
