'use client';

import { useSyncExternalStore } from 'react';
import {
  ensureSessionHydrated,
  getSessionFromStore,
  getSessionVersion,
  subscribeSession,
} from '../data/session-store';
import type { SessionState, SessionUser } from '../types';

export function useSession(): SessionState {
  const revision = useSyncExternalStore(
    subscribeSession,
    () => getSessionVersion(),
    () => 0,
  );

  ensureSessionHydrated();
  void revision;
  return getSessionFromStore();
}

export function useSessionUser(): SessionUser {
  return useSession().user;
}
