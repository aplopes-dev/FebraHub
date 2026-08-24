/**
 * Estado “lido” dos lembretes do header — client-only (localStorage).
 * Fingerprint inclui descrição/total para reaparecer se o card mudar.
 */

const STORAGE_KEY = 'imoveis.reminders.read.v1';
const CHANGE_EVENT = 'imoveis-reminders-read-changed';

export type ReminderReadFingerprintInput = {
  kind: string;
  title: string;
  description: string;
  totalPeople?: number;
  /** Diferencia cards iguais (ex.: vários “Novo lead”). */
  href?: string;
};

let readVersion = 0;

export function reminderFingerprint(
  item: ReminderReadFingerprintInput,
): string {
  return [
    item.kind,
    item.title,
    item.description,
    String(item.totalPeople ?? 0),
    item.href ?? '',
  ].join('|');
}

function readSet(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is string => typeof v === 'string'));
  } catch {
    return new Set();
  }
}

function writeSet(next: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    readVersion += 1;
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // ignore quota / private mode
  }
}

export function isReminderRead(item: ReminderReadFingerprintInput): boolean {
  return readSet().has(reminderFingerprint(item));
}

export function markReminderRead(item: ReminderReadFingerprintInput): void {
  markRemindersRead([item]);
}

export function markRemindersRead(
  items: readonly ReminderReadFingerprintInput[],
): void {
  if (items.length === 0) return;
  const next = readSet();
  let changed = false;
  for (const item of items) {
    const key = reminderFingerprint(item);
    if (next.has(key)) continue;
    next.add(key);
    changed = true;
  }
  if (changed) writeSet(next);
}

export function getRemindersReadVersion(): number {
  // Lê o storage para hidratar; version monotônico força re-render no write.
  void readSet();
  return readVersion;
}

export function subscribeRemindersRead(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => onStoreChange();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
