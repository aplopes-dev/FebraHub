import { DEFAULT_SESSION_USER, SESSION_PRESETS } from './session-presets';
import type { SessionState, SessionUser } from '../types';

const STORAGE_KEY = 'imoveis.session.v1';
const CHANGE_EVENT = 'imoveis-session-changed';

let cache: SessionState | null = null;
let hydratedFromStorage = false;
let clientBridgeReady = false;
let version = 0;

function cloneSession(state: SessionState): SessionState {
  return {
    user: { ...state.user, organization: { ...state.user.organization } },
  };
}

function createDefaultState(): SessionState {
  return cloneSession({ user: { ...DEFAULT_SESSION_USER } });
}

function readStorage(): SessionState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionState;
    if (!parsed?.user?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(state: SessionState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function notifyChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function ensureSessionHydrated(): void {
  if (typeof window === 'undefined' || !clientBridgeReady) {
    if (!cache) cache = createDefaultState();
    return;
  }
  if (hydratedFromStorage && cache) return;
  const fromStorage = readStorage();
  cache = fromStorage ? cloneSession(fromStorage) : createDefaultState();
  hydratedFromStorage = true;
  if (!fromStorage) writeStorage(cache);
}

export function getSessionFromStore(): SessionState {
  ensureSessionHydrated();
  return cache ?? createDefaultState();
}

export function getSessionUser(): SessionUser {
  return getSessionFromStore().user;
}

export function setSessionUser(user: SessionUser): SessionUser {
  ensureSessionHydrated();
  const next = cloneSession({ user: { ...user, organization: { ...user.organization } } });
  cache = next;
  writeStorage(next);
  version += 1;
  notifyChange();
  return next.user;
}

export function setSessionByPresetId(presetId: string): SessionUser | null {
  const preset = SESSION_PRESETS.find((p) => p.id === presetId);
  if (!preset) return null;
  return setSessionUser({ ...preset });
}

export function getSessionVersion(): number {
  return version;
}

export function subscribeSession(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = () => onStoreChange();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);

  // A hidratação só pode acontecer depois do primeiro paint (SSR = seed).
  // O bump de versão + notify avisa **todos** os subscribers, não só este.
  if (!clientBridgeReady) {
    queueMicrotask(() => {
      if (clientBridgeReady) return;
      clientBridgeReady = true;
      hydratedFromStorage = false;
      cache = null;
      ensureSessionHydrated();
      version += 1;
      notifyChange();
    });
  }

  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
