'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ClinicaApiError } from '@/features/clinic/shared/api';
import { invalidateClinicDashboardQueries } from '@/features/clinic/modules/dashboard/lib/invalidate-clinic-dashboard-queries';
import {
  createPatient,
  updatePatient,
  updatePatientStatus,
} from '../services/patients.service';
import { patientKeys } from './query-keys';
import type { PatientFormValues } from '../types/patient-form';

export function usePatientMutations(storeId: string | null) {
  const queryClient = useQueryClient();

  const invalidatePatients = () => {
    if (!storeId) return;
    void queryClient.invalidateQueries({ queryKey: patientKeys.lists(storeId) });
  };

  const invalidatePatientDetail = (patientId: string) => {
    if (!storeId) return;
    void queryClient.invalidateQueries({ queryKey: patientKeys.detail(storeId, patientId) });
  };

  const createMutation = useMutation({
    mutationFn: (values: PatientFormValues) => createPatient(storeId!, values),
    onSuccess: () => invalidatePatients(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ patientId, values }: { patientId: string; values: PatientFormValues }) =>
      updatePatient(storeId!, patientId, values),
    onSuccess: (_data, variables) => {
      invalidatePatients();
      invalidatePatientDetail(variables.patientId);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      patientId,
      status,
    }: {
      patientId: string;
      status: 'active' | 'inactive';
    }) => updatePatientStatus(storeId!, patientId, status),
    onSuccess: (_data, variables) => {
      invalidatePatients();
      invalidatePatientDetail(variables.patientId);
      invalidateClinicDashboardQueries(queryClient);
    },
  });

  return { createMutation, updateMutation, updateStatusMutation };
}

export function getPatientMutationErrorMessage(
  error: unknown,
  field?: 'cpf',
): { message: string; field?: 'cpf' } {
  if (error instanceof ClinicaApiError) {
    if (error.status === 409 && field === 'cpf') {
      return { message: 'Este CPF já está cadastrado para outro paciente nesta clínica.', field: 'cpf' };
    }
    if (error.status === 409) {
      return { message: 'Este CPF já está cadastrado para outro paciente nesta clínica.', field: 'cpf' };
    }
    if (error.status === 422) {
      return { message: 'Verifique os dados informados e tente novamente.' };
    }
    return { message: error.message };
  }
  return { message: 'Não foi possível salvar o paciente. Tente novamente.' };
}
