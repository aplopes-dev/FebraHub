'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import { clinicSettingsKeys } from '../../settings/hooks/query-keys';
import { getClinicPlanById } from '../../settings/services/clinic-plans.service';
import { getBudgetTreatmentsForPlan } from '../data/mock-budget-treatments';
import { mapPlanToBudgetTreatmentOptions } from './map-plan-to-budget-treatment-options';

export function usePatientPlanTreatments(planId: string): {
  treatments: ReturnType<typeof getBudgetTreatmentsForPlan>;
  isLoading: boolean;
} {
  const { storeId, clinicStrand } = useStore();

  const planQuery = useQuery({
    queryKey: clinicSettingsKeys.plan(storeId, planId),
    queryFn: () => getClinicPlanById(storeId, planId),
    enabled: Boolean(storeId && planId),
  });

  const treatments = useMemo(() => {
    if (!planId) {
      return [];
    }

    if (planQuery.data) {
      const fromApi = mapPlanToBudgetTreatmentOptions(planQuery.data, clinicStrand);
      if (fromApi.length > 0) {
        return fromApi;
      }
    }

    return getBudgetTreatmentsForPlan(planId);
  }, [planId, planQuery.data, clinicStrand]);

  return {
    treatments,
    isLoading: Boolean(planId) && planQuery.isLoading,
  };
}
