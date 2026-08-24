'use client';

import { useQuery } from '@tanstack/react-query';
import type { LeadReminder } from '@/features/leads/types';
import { listReminders } from '../services/reminders-service';

export const remindersKeys = {
  all: ['reminders'] as const,
  list: (agentId?: string) => [...remindersKeys.all, agentId ?? 'all'] as const,
};

export function useRemindersQuery(agentId?: string) {
  return useQuery({
    queryKey: remindersKeys.list(agentId),
    queryFn: () => listReminders({ agentId }),
    /** Detecta lead novo (site/WhatsApp) enquanto o painel está aberto. */
    refetchInterval: 45_000,
    /** Intervalo já cobre novidades — focus não dispara novo round-trip. */
    refetchOnWindowFocus: false,
    staleTime: 20_000,
  });
}

/**
 * Compatível com o header e a sidebar de leads — dados de `GET /v1/reminders`.
 */
export function useLeadsReminders(agentId?: string): {
  reminders: readonly LeadReminder[];
  isLoading: boolean;
} {
  const query = useRemindersQuery(agentId);
  return {
    reminders: query.data ?? [],
    isLoading: query.isLoading,
  };
}
