import type { AuthSession } from './auth';

export function permissionsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  for (const p of b) {
    if (!setA.has(p)) return false;
  }
  return true;
}

export function sessionsEqual(a: AuthSession | null, b: AuthSession | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.user.name === b.user.name &&
    a.user.email === b.user.email &&
    a.expiresAt === b.expiresAt &&
    permissionsEqual(a.permissions ?? [], b.permissions ?? [])
  );
}

export function sessionToStatus(session: AuthSession | null): 'authenticated' | 'anonymous' {
  return session ? 'authenticated' : 'anonymous';
}
