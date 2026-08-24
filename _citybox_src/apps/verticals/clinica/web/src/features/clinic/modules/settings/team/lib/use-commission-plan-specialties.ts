'use client';

import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import { usePatientPlanOptions } from '@/features/clinic/modules/patients/lib/use-patient-plan-options';
import { clinicSettingsKeys } from '../../hooks/query-keys';
import { getClinicPlanById } from '../../services/clinic-plans.service';
import type { PlanSpecialtyItem } from '../../plans/types/clinic-plan-specialty';
import { COMMISSION_SCOPE_ALL } from '../types/commission';

function specialtyNameKey(name: string): string {
  return name.trim().toLocaleLowerCase('pt-BR');
}

/** Uma entrada por nome (case-insensitive); primeira ocorrência vence. */
export function dedupeSpecialtiesByName(
  specialties: PlanSpecialtyItem[],
): PlanSpecialtyItem[] {
  const byName = new Map<string, PlanSpecialtyItem>();
  for (const specialty of specialties) {
    const key = specialtyNameKey(specialty.name);
    if (!key || byName.has(key)) continue;
    byName.set(key, specialty);
  }
  return [...byName.values()].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR'),
  );
}

/**
 * Especialidades do plano selecionado.
 * Com `COMMISSION_SCOPE_ALL` (Plano = Todos), agrega especialidades de todos
 * os planos ativos e deduplica por nome.
 */
export function useCommissionPlanSpecialties(planId: string): {
  specialties: PlanSpecialtyItem[];
  isLoading: boolean;
} {
  const { storeId } = useStore();
  const isAllPlans = planId === COMMISSION_SCOPE_ALL;
  const { plans, isLoading: isPlansLoading } = usePatientPlanOptions();

  const planQuery = useQuery({
    queryKey: clinicSettingsKeys.plan(storeId, planId),
    queryFn: () => getClinicPlanById(storeId, planId),
    enabled: Boolean(storeId && planId && !isAllPlans),
  });

  const allPlanQueries = useQueries({
    queries: isAllPlans
      ? plans.map((plan) => ({
          queryKey: clinicSettingsKeys.plan(storeId, plan.id),
          queryFn: () => getClinicPlanById(storeId, plan.id),
          enabled: Boolean(storeId && plan.id),
        }))
      : [],
  });

  const allPlansLoadedKey = allPlanQueries
    .map((query) => `${query.dataUpdatedAt}:${query.data?.specialties.length ?? 0}`)
    .join('|');

  const specialties = useMemo((): PlanSpecialtyItem[] => {
    if (!planId) return [];
    if (!isAllPlans) {
      return planQuery.data?.specialties ?? [];
    }
    return dedupeSpecialtiesByName(
      allPlanQueries.flatMap((query) => query.data?.specialties ?? []),
    );
    // allPlansLoadedKey espelha o conteúdo carregado sem depender da ref do array
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ver allPlansLoadedKey
  }, [planId, isAllPlans, planQuery.data, allPlansLoadedKey]);

  const isLoadingAll =
    isAllPlans &&
    (isPlansLoading ||
      (plans.length > 0 && allPlanQueries.some((query) => query.isLoading)));

  return {
    specialties,
    isLoading: isAllPlans
      ? isLoadingAll
      : Boolean(planId) && planQuery.isLoading,
  };
}
