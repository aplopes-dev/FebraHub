import type { AuthSession } from './auth';

export type SessionBridge = {
  refresh: () => Promise<AuthSession | null>;
  patchUser: (user: Partial<AuthSession['user']>) => void;
};

let bridge: SessionBridge | null = null;

export function registerSessionBridge(next: SessionBridge | null) {
  bridge = next;
}

export function getSessionBridge(): SessionBridge | null {
  return bridge;
}
