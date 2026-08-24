'use client';

import { useMemo } from 'react';
import {
  defineAbilityFor,
  type AppAbility,
} from '@citybox/beautiful-permissions';
import { useSession } from '@/lib/session-context';
import { useStore } from '@/lib/store-context';

/**
 * Ability CASL da loja ativa — mesma `defineAbilityFor` da API.
 * Fonte: permissões do `members/me` na loja selecionada + flag de OWNER.
 */
export function useAbility(): AppAbility | undefined {
  const { session } = useSession();
  const { storeId, stores } = useStore();

  return useMemo(() => {
    if (!session?.user) return undefined;
    const active = stores.find((s) => s.id === storeId);
    return defineAbilityFor({
      userId: session.user.email ?? session.user.name ?? 'unknown',
      permissions: active?.permissions ?? [],
      isOrganizationOwner: active?.isOrganizationOwner === true,
    });
  }, [session?.user, storeId, stores]);
}
