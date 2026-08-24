'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store-context';
import { useAuthSession } from '@/lib/session-context';
import {
  getSessionUserId,
  setSessionUserId,
} from '../data/session-store';
import {
  useAgentProfileQuery,
  useTeamMembersQuery,
} from '../hooks/use-settings-queries';
import { setSessionUser } from '@/features/shared/session/data/session-store';
import type { SessionUser } from '@/features/shared/session/types';
import type { UserRole } from '../types';
import { initialsFromName } from '../data/settings-store';

function teamRoleToSessionRole(role: string): SessionUser['role'] {
  if (role === 'admin') return 'ADMIN';
  if (role === 'assistant') return 'MANAGER';
  return 'AGENT';
}

/**
 * Alinha a sessão mock legada ao agente Keycloak da loja ativa.
 * Sem isso, o header e o "Você" da equipe leem o preset `ana-helena`.
 */
export function SessionAgentSync() {
  const { status } = useAuthSession();
  const { agentId, storeId, accessibleStores, loading: storeLoading } = useStore();
  const teamQuery = useTeamMembersQuery(
    status === 'authenticated' && Boolean(storeId),
  );
  const members = teamQuery.data ?? [];
  const { data: profile } = useAgentProfileQuery(
    agentId || undefined,
    status === 'authenticated' && Boolean(agentId) && Boolean(storeId),
  );

  useEffect(() => {
    if (status !== 'authenticated' || storeLoading || !agentId) return;

    const member = members.find((m) => m.id === agentId && m.active);
    if (member) {
      if (getSessionUserId() !== agentId) {
        setSessionUserId(agentId);
      }
      return;
    }

    const store = accessibleStores.find((s) => s.id === storeId);
    const role = (store?.role ?? 'broker') as UserRole;
    const name = profile?.name?.trim() || '';
    const email = profile?.email?.trim() || '';
    const initials =
      profile?.initials?.trim() ||
      (name ? initialsFromName(name) : '—');

    // Broker sem listagem de equipe: sessão a partir do agentId + perfil.
    if (teamQuery.isFetched || profile) {
      if (getSessionUserId() === agentId) return;
      setSessionUser({
        id: agentId,
        name: name || 'Usuário',
        initials,
        email,
        role: teamRoleToSessionRole(role),
        organization: {
          id: storeId || 'store',
          name: store?.name || 'Loja',
          type: 'AGENCY',
        },
      });
    }
  }, [
    accessibleStores,
    agentId,
    members,
    profile,
    status,
    storeId,
    storeLoading,
    teamQuery.isFetched,
  ]);

  return null;
}
