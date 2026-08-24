import type { TeamUser } from '../types';

const CHANGE_EVENT = 'imoveis-team-members-changed';

let cache: readonly TeamUser[] | null = null;
let version = 0;

function notifyChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function setTeamMembersCache(members: readonly TeamUser[]): void {
  cache = members.map((member) => ({
    ...member,
    permissions: { ...member.permissions },
  }));
  version += 1;
  notifyChange();
}

export function getTeamMembersCache(): readonly TeamUser[] {
  return cache ?? [];
}

/** `false` enquanto a listagem da API não chegou (usar fallback da sessão). */
export function isTeamCacheLoaded(): boolean {
  return cache !== null;
}

export function findTeamMember(agentId: string): TeamUser | null {
  return getTeamMembersCache().find((member) => member.id === agentId) ?? null;
}

export function getTeamCacheVersion(): number {
  return version;
}

export function subscribeTeamCache(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => onStoreChange();
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}
