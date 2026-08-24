const STORAGE_PREFIX = 'clinic-tasks-ignored-cancelled';

function storageKey(storeId: string): string {
  return `${STORAGE_PREFIX}:${storeId}`;
}

export function readIgnoredCancelledTaskIds(storeId: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.sessionStorage.getItem(storageKey(storeId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

export function writeIgnoredCancelledTaskIds(
  storeId: string,
  ids: ReadonlySet<string>,
): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(
    storageKey(storeId),
    JSON.stringify([...ids]),
  );
}

export function addIgnoredCancelledTaskId(
  storeId: string,
  taskId: string,
): Set<string> {
  const next = readIgnoredCancelledTaskIds(storeId);
  next.add(taskId);
  writeIgnoredCancelledTaskIds(storeId, next);
  return next;
}
