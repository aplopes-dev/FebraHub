import type { Session } from './auth';

/**
 * Ponte para código fora da árvore React (o `fetchWithSession`) pedir uma
 * sincronização de sessão sem duplicar a chamada que o provider já faz.
 */
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
