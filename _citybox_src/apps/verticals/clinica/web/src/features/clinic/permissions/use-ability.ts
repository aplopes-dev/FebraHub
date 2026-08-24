'use client';

import { useMemo } from 'react';
import {
  defineAbilityFor,
  type AppAbility,
} from '@citybox/clinica-permissions';
import { useSession } from '@/lib/session-context';
import { useStore } from '@/lib/store-context';

/**
 * Ability CASL da clínica ativa — mesma `defineAbilityFor` da API.
 * Fonte: permissões do `members/me` na loja selecionada + flag de OWNER.
 */
export function useAbility(): AppAbility | undefined {
  const { session } = useSession();
  const { storeId, accessibleStores } = useStore();

  return useMemo(() => {
    if (!session?.user) return undefined;
    const active = accessibleStores.find((s) => s.id === storeId);
    return defineAbilityFor({
      userId: session.user.email ?? session.user.name ?? 'unknown',
      permissions: active?.permissions ?? [],
      isOrganizationOwner: active?.isOrganizationOwner === true,
    });
  }, [accessibleStores, session?.user, storeId]);
}
