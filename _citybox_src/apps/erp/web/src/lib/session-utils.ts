import type { Session } from './auth';

/**
 * Compara os metadados públicos da sessão.
 *
 * O polling refaz a chamada a cada 2 min; sem esta comparação, cada resposta
 * criaria um objeto novo e re-renderizaria a árvore inteira à toa.
 */
export function sessionsEqual(a: Session | null, b: Session | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.user.name === b.user.name &&
    a.user.email === b.user.email &&
    a.user.username === b.user.username &&
    a.expiresAt === b.expiresAt
  );
}

export function sessionToStatus(
  session: Session | null,
): 'authenticated' | 'anonymous' {
  return session ? 'authenticated' : 'anonymous';
}
