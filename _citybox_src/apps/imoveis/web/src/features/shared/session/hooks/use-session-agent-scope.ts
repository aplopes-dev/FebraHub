'use client';

import { useCurrentAgentId } from '@/features/shared/session/hooks/use-current-agent-id';
import { useStore } from '@/lib/store-context';

/**
 * Escopo de listagem no painel: sempre o corretor da sessão.
 * A API também força o agentId; o web envia para cache React Query isolado
 * e para não disparar query antes do membership resolver (evita flash da loja).
 */
export function useSessionAgentScope(): {
  agentId: string;
  storeId: string;
  /** false enquanto loja/agentId não estão prontos — não buscar listas ainda. */
  ready: boolean;
} {
  const agentId = useCurrentAgentId();
  const { storeId, loading } = useStore();
  const ready = Boolean(storeId) && Boolean(agentId) && !loading;
  return {
    agentId,
    storeId: storeId ?? '',
    ready,
  };
}
