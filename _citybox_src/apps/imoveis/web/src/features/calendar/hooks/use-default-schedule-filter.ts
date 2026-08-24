'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store-context';
import type { ScheduleListFilter } from '../types';

/**
 * Admin / dono da loja veem a agenda da equipe por padrão (`all`).
 * Corretor / afiliado / assistente veem só a própria (`mine`).
 */
export function useDefaultScheduleFilter(): ScheduleListFilter {
  const { storeId, accessibleStores, loading } = useStore();
  return useMemo(() => {
    if (loading) return 'mine';
    const store = accessibleStores.find((s) => s.id === storeId);
    if (!store) return 'mine';
    if (store.role === 'admin' || store.isOrganizationOwner) return 'all';
    return 'mine';
  }, [accessibleStores, loading, storeId]);
}

export function useIsStoreWideCalendarViewer(): boolean {
  return useDefaultScheduleFilter() === 'all';
}
