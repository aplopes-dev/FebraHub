import type { ScheduleListFilter } from '../types';

/** v2: admin/dono passa a defaultar em `all` (mine da v1 escondia a agenda da loja). */
export const FILTER_STORAGE_KEY = 'imoveis.calendar.listFilter.v2';
export const FILTER_CHANGE_EVENT = 'imoveis-calendar-filter-changed';

export function readStoredFilter(
  defaultFilter: ScheduleListFilter = 'mine',
): ScheduleListFilter {
  if (typeof window === 'undefined') return defaultFilter;
  try {
    const value = window.localStorage.getItem(FILTER_STORAGE_KEY);
    if (value === 'assigned' || value === 'mine' || value === 'all') return value;
    return defaultFilter;
  } catch {
    return defaultFilter;
  }
}

export function subscribeFilter(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => onStoreChange();
  window.addEventListener(FILTER_CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(FILTER_CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function writeStoredFilter(filter: ScheduleListFilter): void {
  try {
    window.localStorage.setItem(FILTER_STORAGE_KEY, filter);
    window.dispatchEvent(new Event(FILTER_CHANGE_EVENT));
  } catch {
    // ignore
  }
}
