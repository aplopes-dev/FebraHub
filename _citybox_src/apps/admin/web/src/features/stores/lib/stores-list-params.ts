import type { FilterValues, DatePresetFilterValue, CheckboxFilterValue } from '@citybox/ui/organisms';
import type { StoreStatus, Vertical } from '../types';
import type { StoresListParams } from '../api/stores-api';

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDateBounds(
  preset: string | null,
  date: Date | null | undefined,
): { from: string; to: string } | null {
  if (!preset) return null;

  const today = new Date();
  const todayStr = toDateStr(today);

  switch (preset) {
    case 'hoje':
      return { from: todayStr, to: todayStr };
    case 'esta-semana': {
      const from = new Date(today);
      from.setDate(today.getDate() - today.getDay());
      return { from: toDateStr(from), to: todayStr };
    }
    case 'este-mes': {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: toDateStr(from), to: todayStr };
    }
    case 'data-especifica': {
      if (!date) return null;
      const dateStr = toDateStr(date);
      return { from: dateStr, to: dateStr };
    }
    default:
      return null;
  }
}

export function buildStoresListParams(
  apiSearch?: string,
  filters?: FilterValues,
): StoresListParams {
  const verticalValues = ((filters?.vertical as CheckboxFilterValue) ?? []) as Vertical[];
  const statusValues = ((filters?.status as CheckboxFilterValue) ?? []) as StoreStatus[];
  const dateVal = (filters?.date as DatePresetFilterValue) ?? { preset: null };
  const dateBounds = getDateBounds(dateVal.preset, dateVal.date as Date | null | undefined);

  return {
    perPage: 100,
    search: apiSearch,
    vertical: verticalValues.length ? verticalValues : undefined,
    status: statusValues.length ? statusValues : undefined,
    createdFrom: dateBounds?.from,
    createdTo: dateBounds?.to,
  };
}
