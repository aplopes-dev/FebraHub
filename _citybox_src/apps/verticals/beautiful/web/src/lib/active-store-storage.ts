const STORE_KEY = 'citybox-beautiful-active-store';

export const ACTIVE_STORE_STORAGE_KEY = STORE_KEY;

export function clearActiveStoreStorage() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    // ignore
  }
}

export function readSavedActiveStore(): { id: string; name: string } | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id?: string; name?: string };
    if (!parsed?.id || !parsed?.name) return null;
    return { id: parsed.id, name: parsed.name };
  } catch {
    return null;
  }
}

export function persistActiveStore(id: string, name: string) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ id, name }));
}
