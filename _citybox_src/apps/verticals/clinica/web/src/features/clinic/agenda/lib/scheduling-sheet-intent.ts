import type { SchedulingInitialData } from '../contexts/scheduling-sheet-context';

const STORAGE_KEY = 'clinic:scheduling-sheet-intent';

export function storeSchedulingSheetIntent(data: SchedulingInitialData): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function consumeSchedulingSheetIntent(): SchedulingInitialData | null {
  if (typeof window === 'undefined') return null;

  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  sessionStorage.removeItem(STORAGE_KEY);

  try {
    return JSON.parse(raw) as SchedulingInitialData;
  } catch {
    return null;
  }
}
