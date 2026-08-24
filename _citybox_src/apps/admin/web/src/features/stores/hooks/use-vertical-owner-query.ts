'use client';

import { useQuery } from '@tanstack/react-query';
import { storesKeys } from '../api/query-keys';
import { getVerticalOwner } from '../api/stores-api';

/**
 * Responsável da loja lido na vertical.
 *
 * `enabled` é obrigatório na prática: para loja cuja equipe é do platform, a rota
 * `vertical-team/owner` recusa a chamada — chamar assim mesmo só produziria erro de tela.
 */
export function useVerticalOwnerQuery(id: string, options?: { enabled?: boolean }) {
  const query = useQuery({
    queryKey: storesKeys.verticalOwner(id),
    queryFn: () => getVerticalOwner(id),
    enabled: (options?.enabled ?? true) && Boolean(id),
  });

  return {
    // `null` cobre tanto "ainda carregando" quanto "loja sem responsável" — quem consome
    // precisa olhar `isPending`/`error` antes, senão anuncia ausência durante a carga.
    owner: query.data ?? null,
    isPending: query.isPending,
    error: query.error,
  };
}
