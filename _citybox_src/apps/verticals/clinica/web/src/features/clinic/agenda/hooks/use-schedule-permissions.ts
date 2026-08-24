'use client';

import { useCan } from '@/features/clinic/permissions';
import { useStore } from '@/lib/store-context';

/** Gates CASL da agenda + memberId do usuário na clínica ativa. */
export function useSchedulePermissions() {
  const { memberId } = useStore();
  const canViewMenu = useCan('access', 'Schedule');
  const canAttend = useCan('update', 'Schedule');
  const canViewAll = useCan('read', 'Schedule');
  const canCreateForOthers = useCan('create', 'Schedule');
  const canDelete = useCan('delete', 'Schedule');

  return {
    memberId,
    canViewMenu,
    canAttend,
    canViewAll,
    canCreateForOthers,
    canDelete,
    canCreateScheduling: canAttend || canCreateForOthers,
  };
}
