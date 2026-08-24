'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import { clinicSettingsKeys } from '../../settings/hooks/query-keys';
import { MOCK_CLINIC_PLANS } from '../../settings/plans/data/mock-clinic-plans';
import { listClinicPlans } from '../../settings/services/clinic-plans.service';
import type { ClinicPlan } from '../../settings/plans/types/clinic-plan';
import { resolveDefaultPlanId } from '../lib/resolve-default-plan-id';

export function usePatientPlanOptions(): {
  plans: ClinicPlan[];
  defaultPlanId: string;
  isLoading: boolean;
} {
  const { storeId } = useStore();

  const plansQuery = useQuery({
    queryKey: clinicSettingsKeys.plans(storeId),
    queryFn: () => listClinicPlans(storeId),
    enabled: Boolean(storeId),
  });

  const plans = useMemo(() => {
    const source = (plansQuery.data?.length ?? 0) > 0 ? plansQuery.data! : MOCK_CLINIC_PLANS;
    return source.filter((plan) => plan.status === 'active');
  }, [plansQuery.data]);

  const defaultPlanId = useMemo(() => resolveDefaultPlanId(plans), [plans]);

  return {
    plans,
    defaultPlanId,
    isLoading: plansQuery.isLoading,
  };
}
