import type { Session } from './auth';

export type SessionBridge = {
  refresh: () => Promise<Session | null>;
  patchUser: (user: Partial<Session['user']>) => void;
};

let bridge: SessionBridge | null = null;

export function registerSessionBridge(next: SessionBridge | null) {
  bridge = next;
}

export function getSessionBridge(): SessionBridge | null {
  return bridge;
}
