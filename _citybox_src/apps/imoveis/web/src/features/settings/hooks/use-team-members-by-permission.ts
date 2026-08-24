'use client';

import { useMemo } from 'react';
import { useCurrentAgentId } from '@/features/shared/session/hooks/use-current-agent-id';
import { useSessionUser } from '@/features/shared/session/hooks/use-session';
import { createEmptyBooleanMap } from '@citybox/imoveis-permissions';
import type { PermissionKey, TeamUser, UserRole } from '../types';
import { useAgentProfileQuery, useTeamMembersQuery } from './use-settings-queries';

/**
 * Corretores designáveis para um módulo (ativo + flag de permissão no mapa).
 * Admin sempre entra em qualquer lista de designação.
 */
function isAssignableForPermission(
  member: TeamUser,
  permission: PermissionKey,
): boolean {
  if (!member.active) return false;
  if (member.permissions?.[permission] === true) return true;
  // Mapa incompleto/legado: cargos de corretor entram em leads/transações.
  if (permission === 'leads' || permission === 'transactions') {
    if (member.role === 'admin' || member.role === 'broker' || member.role === 'affiliated') {
      return true;
    }
  }
  return false;
}

export function useTeamMembersByPermission(permission: PermissionKey) {
  const query = useTeamMembersQuery();

  const members = useMemo((): readonly TeamUser[] => {
    const list = query.data ?? [];
    return list.filter((member) =>
      isAssignableForPermission(member, permission),
    );
  }, [permission, query.data]);

  return {
    members,
    isPending: query.isPending,
    isError: query.isError,
  };
}

/**
 * Sempre inclui o corretor da sessão, mesmo se a listagem de equipe falhar
 * (ex.: 403 legado) ou o mapa de permissões do row estiver vazio.
 */
function ensureSelfInList(
  members: readonly TeamUser[],
  self: TeamUser | null,
): readonly TeamUser[] {
  if (!self?.id) return members;
  if (members.some((m) => m.id === self.id)) return members;
  return [self, ...members];
}

function synthesizeSelfTeamUser(
  agentId: string,
  opts: {
    name?: string;
    email?: string;
    phone?: string;
    initials?: string;
    role?: UserRole;
  },
): TeamUser {
  const name = opts.name?.trim() || 'Eu';
  const initials =
    opts.initials?.trim() ||
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') ||
    'EU';

  return {
    id: agentId,
    name,
    email: opts.email?.trim() || '',
    phone: opts.phone?.trim() || '',
    role: opts.role ?? 'broker',
    initials,
    active: true,
    permissions: {
      ...createEmptyBooleanMap(),
      leads: true,
      properties: true,
      calendar: true,
      transactions: true,
    },
    mustChangePassword: false,
  };
}

/** Corretores designáveis em leads (`permissions.leads` + eu da sessão). */
export function useAssignableLeadAgents() {
  return useAssignableAgents('leads');
}

/** Corretores em negócios / filtros de transação. */
export function useAssignableTransactionAgents() {
  return useAssignableAgents('transactions');
}

function useAssignableAgents(permission: PermissionKey) {
  const query = useTeamMembersQuery();
  const agentId = useCurrentAgentId();
  const sessionUser = useSessionUser();
  const { data: profile } = useAgentProfileQuery(
    agentId || undefined,
    Boolean(agentId),
  );

  const members = useMemo((): readonly TeamUser[] => {
    const list = query.data ?? [];
    const filtered = list.filter((member) =>
      isAssignableForPermission(member, permission),
    );

    if (!agentId) return filtered;

    // Preferir linha real da equipe (mesmo sem flag leads no mapa).
    const selfRow = list.find((m) => m.id === agentId && m.active);
    if (selfRow) {
      return ensureSelfInList(filtered, selfRow);
    }

    // Listagem vazia/erro: sintetiza a partir do perfil/sessão.
    const self = synthesizeSelfTeamUser(agentId, {
      name: profile?.name || sessionUser.name,
      email: profile?.email || sessionUser.email,
      phone: profile?.phone || '',
      initials: profile?.initials || sessionUser.initials,
      role: 'broker',
    });
    return ensureSelfInList(filtered, self);
  }, [
    agentId,
    permission,
    profile?.email,
    profile?.initials,
    profile?.name,
    profile?.phone,
    query.data,
    sessionUser.email,
    sessionUser.initials,
    sessionUser.name,
  ]);

  // Pending só enquanto não temos nem equipe nem agentId para fallback.
  const isPending = query.isPending && members.length === 0;

  return {
    members,
    isPending,
    isError: query.isError && members.length === 0,
  };
}
