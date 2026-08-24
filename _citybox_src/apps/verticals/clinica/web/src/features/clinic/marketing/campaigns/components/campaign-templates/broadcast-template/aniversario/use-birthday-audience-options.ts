'use client';

import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import { clinicSettingsKeys } from '@/features/clinic/modules/settings/hooks/query-keys';
import {
  getClinicPlanById,
  listClinicPlans,
} from '@/features/clinic/modules/settings/services/clinic-plans.service';

export function useBirthdayAudienceOptions() {
  const { storeId } = useStore();

  const plansQuery = useQuery({
    queryKey: clinicSettingsKeys.plans(storeId ?? ''),
    queryFn: () => listClinicPlans(storeId!),
    enabled: Boolean(storeId),
  });

  const activePlans = useMemo(
    () => (plansQuery.data ?? []).filter((plan) => plan.status === 'active'),
    [plansQuery.data],
  );

  const detailQueries = useQueries({
    queries: activePlans.map((plan) => ({
      queryKey: [...clinicSettingsKeys.plans(storeId ?? ''), plan.id] as const,
      queryFn: () => getClinicPlanById(storeId!, plan.id),
      enabled: Boolean(storeId) && activePlans.length > 0,
    })),
  });

  const planOptions = useMemo(
    () => activePlans.map((plan) => ({ value: plan.id, label: plan.name })),
    [activePlans],
  );

  const specialtyOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const q of detailQueries) {
      for (const specialty of q.data?.specialties ?? []) {
        map.set(specialty.id, specialty.name);
      }
    }
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }, [detailQueries]);

  const genderOptions = [
    { value: 'female', label: 'Feminino' },
    { value: 'male', label: 'Masculino' },
    { value: 'other', label: 'Outro' },
  ];

  return {
    planOptions,
    specialtyOptions,
    genderOptions,
    isLoading: plansQuery.isLoading || detailQueries.some((q) => q.isLoading),
  };
}
