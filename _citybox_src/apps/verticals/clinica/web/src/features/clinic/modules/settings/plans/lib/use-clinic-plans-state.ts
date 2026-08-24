'use client';

import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useStore } from '@/lib/store-context';
import { toastClinicaMutationError } from '@/features/clinic/shared/api';
import { isClinicaInUseConflict } from '../../components/resource-in-use-dialog';
import { clinicSettingsKeys } from '../../hooks/query-keys';
import {
  createClinicPlan,
  deleteClinicPlan,
  getClinicPlanById,
  listClinicPlans,
  updateClinicPlan,
  updateClinicPlanStatus,
} from '../../services/clinic-plans.service';
import type { ClinicPlan } from '../types/clinic-plan';
import type { ClinicPlanSheetSuccessPayload } from '../types/clinic-plan-form';
import type { PlanSpecialtyItem } from '../types/clinic-plan-specialty';

function toUpsertPayload(payload: ClinicPlanSheetSuccessPayload) {
  return {
    name: payload.name,
    status: payload.status,
    isDefault: payload.isDefault ?? false,
    treatmentInit: payload.treatmentInit,
    specialties: payload.specialties,
  };
}

export function useClinicPlansState() {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const [planSheetOpen, setPlanSheetOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ClinicPlan | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [inUseMessage, setInUseMessage] = useState<string | null>(null);

  const plansQuery = useQuery({
    queryKey: clinicSettingsKeys.plans(storeId),
    queryFn: () => listClinicPlans(storeId),
    enabled: Boolean(storeId),
  });

  const invalidatePlans = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: clinicSettingsKeys.plans(storeId),
    });
  }, [queryClient, storeId]);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setPlanSheetOpen(open);
    if (!open) {
      setEditingPlan(null);
    }
  }, []);

  const openNewPlan = useCallback(() => {
    setEditingPlan(null);
    setPlanSheetOpen(true);
  }, []);

  const openEditPlan = useCallback(
    async (plan: ClinicPlan) => {
      if (!storeId) {
        toast.error('Selecione uma loja para editar o plano.');
        return;
      }

      setIsLoadingEdit(true);
      try {
        const detail = await getClinicPlanById(storeId, plan.id);
        setEditingPlan(detail);
        setPlanSheetOpen(true);
      } catch (error) {
        toastClinicaMutationError(error, 'Não foi possível carregar o plano.');
      } finally {
        setIsLoadingEdit(false);
      }
    },
    [storeId],
  );

  const loadDefaultSpecialties = useCallback(async (): Promise<PlanSpecialtyItem[]> => {
    if (!storeId) return [];

    const plans = plansQuery.data ?? [];
    const defaultPlan = plans.find((plan) => plan.isDefault && plan.status === 'active');
    if (!defaultPlan) {
      toast.error('Não há plano padrão ativo para copiar os procedimentos.');
      return [];
    }

    try {
      const detail = await getClinicPlanById(storeId, defaultPlan.id);
      return detail.specialties;
    } catch (error) {
      toastClinicaMutationError(error, 'Não foi possível carregar o plano padrão.');
      return [];
    }
  }, [plansQuery.data, storeId]);

  const savePlan = useCallback(
    async (payload: ClinicPlanSheetSuccessPayload): Promise<boolean> => {
      if (!storeId) {
        toast.error('Selecione uma loja para salvar o plano.');
        return false;
      }

      setIsSavingPlan(true);
      try {
        const upsertPayload = toUpsertPayload(payload);

        if (payload.planId) {
          await updateClinicPlan(storeId, payload.planId, upsertPayload);
          toast.success('Plano atualizado com sucesso.');
        } else {
          await createClinicPlan(storeId, upsertPayload);
          toast.success('Plano criado com sucesso.');
        }

        await invalidatePlans();
        return true;
      } catch (error) {
        toastClinicaMutationError(error, 'Não foi possível salvar o plano.');
        return false;
      } finally {
        setIsSavingPlan(false);
      }
    },
    [invalidatePlans, storeId],
  );

  const deletePlan = useCallback(
    async (plan: ClinicPlan) => {
      if (!storeId) {
        toast.error('Selecione uma loja para excluir o plano.');
        return;
      }

      try {
        await deleteClinicPlan(storeId, plan.id);
        await invalidatePlans();
        toast.success('Plano excluído com sucesso.');
      } catch (error) {
        if (isClinicaInUseConflict(error)) {
          setInUseMessage(error.message);
          return;
        }
        toastClinicaMutationError(error, 'Não foi possível excluir o plano.');
      }
    },
    [invalidatePlans, storeId],
  );

  const togglePlanStatus = useCallback(
    async (plan: ClinicPlan, active: boolean) => {
      if (!storeId) {
        toast.error('Selecione uma loja para alterar o status do plano.');
        return;
      }

      try {
        await updateClinicPlanStatus(storeId, plan.id, active);
        await invalidatePlans();
        toast.success(active ? 'Plano ativado.' : 'Plano desativado.');
      } catch (error) {
        toastClinicaMutationError(
          error,
          'Não foi possível alterar o status do plano.',
        );
      }
    },
    [invalidatePlans, storeId],
  );

  return {
    plans: plansQuery.data ?? [],
    isLoading: plansQuery.isLoading,
    loadError: plansQuery.error,
    retryLoad: () => plansQuery.refetch(),
    planSheetOpen,
    editingPlan,
    isLoadingEdit,
    isSavingPlan,
    openNewPlan,
    openEditPlan,
    handleSheetOpenChange,
    savePlan,
    loadDefaultSpecialties,
    deletePlan,
    togglePlanStatus,
    inUseMessage,
    clearInUseMessage: () => setInUseMessage(null),
  };
}
