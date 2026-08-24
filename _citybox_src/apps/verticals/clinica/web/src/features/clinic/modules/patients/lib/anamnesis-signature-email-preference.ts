const STORAGE_PREFIX = 'citybox.clinic.skip-anamnesis-email-prompt:';

function storageKey(patientId: string): string {
  return `${STORAGE_PREFIX}${patientId}`;
}

export function shouldSkipAnamnesisEmailPrompt(patientId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(storageKey(patientId)) === '1';
  } catch {
    return false;
  }
}

export function setSkipAnamnesisEmailPrompt(patientId: string, skip: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (skip) {
      window.localStorage.setItem(storageKey(patientId), '1');
    } else {
      window.localStorage.removeItem(storageKey(patientId));
    }
  } catch {
    // Preferência local — falha silenciosa (quota / private mode).
  }
}
