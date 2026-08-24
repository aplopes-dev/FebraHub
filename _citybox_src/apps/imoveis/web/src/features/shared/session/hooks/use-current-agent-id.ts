'use client';

import { useStore } from '@/lib/store-context';
import { useSessionUser } from '@/features/shared/session/hooks/use-session';
import { CURRENT_AGENT_ID } from '@/features/shared/constants/agents';

/**
 * agentId do corretor na loja ativa (TeamMember.agentId via members/me).
 * Vazio enquanto a loja carrega ou se não houver membership — nunca usa o
 * mock legado (`ana-helena`) em listagens (escondia a agenda real).
 */
export function useCurrentAgentId(): string {
  const { agentId, loading } = useStore();
  const sessionUser = useSessionUser();
  if (agentId) return agentId;
  if (loading) return '';
  // Só fallback de sessão se já foi sincronizado (não o preset mock inicial).
  const sessionId = sessionUser.id?.trim() ?? '';
  if (sessionId && sessionId !== CURRENT_AGENT_ID) return sessionId;
  return '';
}
