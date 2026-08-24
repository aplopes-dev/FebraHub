import {
  parseListPage,
  parseListPerPage,
  parseSearch,
} from '../list-price-lists/list-price-lists.query';
import type {
  FiscalParameterSort,
  FiscalParameterStatus,
  FiscalParameterTab,
} from '../../../../domain/repositories/product-fiscal.repository.interface';

export { parseListPage, parseListPerPage, parseSearch };

const TABS = new Set<FiscalParameterTab>(['all', 'pending']);
const SORTS = new Set<FiscalParameterSort>([
  'name_asc',
  'name_desc',
  'category_asc',
  'category_desc',
]);
const STATUSES = new Set<FiscalParameterStatus>(['configured', 'pending']);

export function parseFiscalTab(value?: string): FiscalParameterTab {
  if (value && TABS.has(value as FiscalParameterTab)) {
    return value as FiscalParameterTab;
  }
  return 'all';
}

export function parseFiscalSort(value?: string): FiscalParameterSort {
  if (value && SORTS.has(value as FiscalParameterSort)) {
    return value as FiscalParameterSort;
  }
  return 'name_asc';
}

export function parseFiscalStatuses(
  value?: string | string[],
): FiscalParameterStatus[] | undefined {
  const raw = Array.isArray(value) ? value : value ? value.split(',') : [];
  const parsed = raw
    .map((item) => item.trim())
    .filter((item): item is FiscalParameterStatus =>
      STATUSES.has(item as FiscalParameterStatus),
    );
  return parsed.length > 0 ? parsed : undefined;
}

export function parseCategories(
  value?: string | string[],
): string[] | undefined {
  const raw = Array.isArray(value) ? value : value ? value.split(',') : [];
  const parsed = raw.map((item) => item.trim()).filter(Boolean);
  return parsed.length > 0 ? parsed : undefined;
}

export function parseCategory(value?: string): string | undefined {
  return parseSearch(value);
}
