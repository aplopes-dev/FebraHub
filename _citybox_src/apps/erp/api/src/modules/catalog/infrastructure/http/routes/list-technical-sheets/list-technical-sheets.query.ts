import {
  parseListPage,
  parseListPerPage,
  parseSearch,
} from '../list-price-lists/list-price-lists.query';
import {
  parseCategories,
  parseCategory,
} from '../list-fiscal-parameters/list-fiscal-parameters.query';
import type {
  TechnicalSheetListTab,
  TechnicalSheetSort,
} from '../../../../domain/repositories/technical-sheet.repository.interface';
import type { ProductionType } from '../../../../domain/entities/technical-sheet.entity';
import { PRODUCTION_TYPES } from '../../../../domain/entities/technical-sheet.entity';

export {
  parseListPage,
  parseListPerPage,
  parseSearch,
  parseCategories,
  parseCategory,
};

const TABS = new Set<TechnicalSheetListTab>(['all', 'production']);
const SORTS = new Set<TechnicalSheetSort>([
  'name_asc',
  'name_desc',
  'category_asc',
  'category_desc',
]);

export function parseTechnicalSheetTab(value?: string): TechnicalSheetListTab {
  if (value && TABS.has(value as TechnicalSheetListTab)) {
    return value as TechnicalSheetListTab;
  }
  return 'all';
}

export function parseTechnicalSheetSort(value?: string): TechnicalSheetSort {
  if (value && SORTS.has(value as TechnicalSheetSort)) {
    return value as TechnicalSheetSort;
  }
  return 'name_asc';
}

export function parseProductionTypes(
  value?: string | string[],
): ProductionType[] | undefined {
  const raw = Array.isArray(value) ? value : value ? value.split(',') : [];
  const parsed = raw
    .map((item) => item.trim())
    .filter((item): item is ProductionType =>
      (PRODUCTION_TYPES as readonly string[]).includes(item),
    );
  return parsed.length > 0 ? parsed : undefined;
}
