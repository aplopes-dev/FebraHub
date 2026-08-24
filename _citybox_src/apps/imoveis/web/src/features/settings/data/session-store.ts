/** Adapter — sessão única via `features/shared/session`. */
import { CURRENT_AGENT_ID } from '@/features/shared/constants/agents';
import { SESSION_PRESETS } from '@/features/shared/session/data/session-presets';
import {
  ensureSessionHydrated,
  getSessionUser,
  getSessionVersion,
  setSessionByPresetId,
  setSessionUser,
  subscribeSession,
} from '@/features/shared/session/data/session-store';
import type { SessionUser } from '@/features/shared/session/types';
import { getTeamMembersCache } from './team-members-cache';
import type { TeamUser, UserRole } from '../types';

function teamRoleToSessionRole(role: UserRole): SessionUser['role'] {
  if (role === 'admin') return 'ADMIN';
  if (role === 'assistant') return 'MANAGER';
  return 'AGENT';
}

function sessionUserFromTeamMember(member: TeamUser): SessionUser {
  const preset = SESSION_PRESETS.find((p) => p.id === member.id);
  return {
    id: member.id,
    name: member.name,
    initials: member.initials,
    email: member.email,
    role: preset?.role ?? teamRoleToSessionRole(member.role),
    organization: preset?.organization ?? SESSION_PRESETS[0].organization,
  };
}

export { ensureSessionHydrated, getSessionVersion, subscribeSession };

export function getSessionUserId(): string {
  ensureSessionHydrated();
  return getSessionUser().id || CURRENT_AGENT_ID;
}

export function setSessionUserId(userId: string): void {
  if (setSessionByPresetId(userId)) return;
  const member = getTeamMembersCache().find((m) => m.id === userId && m.active);
  if (member) setSessionUser(sessionUserFromTeamMember(member));
}
