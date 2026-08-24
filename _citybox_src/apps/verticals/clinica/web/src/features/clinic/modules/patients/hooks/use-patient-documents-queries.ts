'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClinicaApiError } from '@/features/clinic/shared/api';
import { useStore } from '@/lib/store-context';
import {
  createPatientCertificate,
  deletePatientCertificate,
  listPatientCertificates,
} from '../services/patient-certificates.service';
import {
  createPatientContractEmission,
  deletePatientContractEmission,
  getPatientContractEmissionById,
  listPatientContractEmissions,
  updatePatientContractEmission,
} from '../services/patient-contract-emissions.service';
import {
  createPatientPrescription,
  deletePatientPrescription,
  getPatientPrescriptionById,
  listPatientPrescriptions,
  updatePatientPrescription,
} from '../services/patient-prescriptions.service';
import type { PatientCertificateFormValues } from '../types/patient-certificate';
import type { PatientContractEmissionFormValues } from '../types/patient-contract-emission';
import type {
  PatientCertificateListParams,
  PatientContractEmissionListParams,
  PatientPrescriptionListParams,
} from '../types/patient-documents-api';
import type { PatientPrescriptionFormValues } from '../types/patient-prescription';
import { certificateKeys, contractEmissionKeys, prescriptionKeys } from './query-keys';

export function usePatientContractEmissionsQuery(
  patientId: string | null,
  params: PatientContractEmissionListParams = {},
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: contractEmissionKeys.list(storeId ?? '', patientId ?? '', params),
    queryFn: () => listPatientContractEmissions(storeId!, patientId!, params),
    enabled: Boolean(storeId) && Boolean(patientId) && enabled,
    placeholderData: keepPreviousData,
  });
}

export function usePatientContractEmissionDetailQuery(
  patientId: string | null,
  contractId: string | null,
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: contractEmissionKeys.detail(storeId ?? '', patientId ?? '', contractId ?? ''),
    queryFn: () => getPatientContractEmissionById(storeId!, patientId!, contractId!),
    enabled: Boolean(storeId) && Boolean(patientId) && Boolean(contractId) && enabled,
  });
}

export function usePatientContractEmissionMutations(patientId: string | null) {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (!storeId || !patientId) return;
    void queryClient.invalidateQueries({
      queryKey: contractEmissionKeys.all(storeId, patientId),
    });
  };

  const createMutation = useMutation({
    mutationFn: (input: {
      values: PatientContractEmissionFormValues;
      responsibleName: string;
      budgetId?: string | null;
    }) =>
      createPatientContractEmission(
        storeId!,
        patientId!,
        input.values,
        input.responsibleName,
        input.budgetId,
      ),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: (input: {
      contractId: string;
      values: PatientContractEmissionFormValues;
      responsibleName: string;
    }) =>
      updatePatientContractEmission(
        storeId!,
        patientId!,
        input.contractId,
        input.values,
        input.responsibleName,
      ),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (contractId: string) =>
      deletePatientContractEmission(storeId!, patientId!, contractId),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deleteMutation };
}

export function usePatientPrescriptionsQuery(
  patientId: string | null,
  params: PatientPrescriptionListParams = {},
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: prescriptionKeys.list(storeId ?? '', patientId ?? '', params),
    queryFn: () => listPatientPrescriptions(storeId!, patientId!, params),
    enabled: Boolean(storeId) && Boolean(patientId) && enabled,
    placeholderData: keepPreviousData,
  });
}

export function usePatientPrescriptionDetailQuery(
  patientId: string | null,
  prescriptionId: string | null,
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: prescriptionKeys.detail(storeId ?? '', patientId ?? '', prescriptionId ?? ''),
    queryFn: () => getPatientPrescriptionById(storeId!, patientId!, prescriptionId!),
    enabled: Boolean(storeId) && Boolean(patientId) && Boolean(prescriptionId) && enabled,
  });
}

export function usePatientPrescriptionMutations(patientId: string | null) {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (!storeId || !patientId) return;
    void queryClient.invalidateQueries({
      queryKey: prescriptionKeys.all(storeId, patientId),
    });
  };

  const createMutation = useMutation({
    mutationFn: (input: {
      values: PatientPrescriptionFormValues;
      professionalName: string;
      clinicName?: string;
      council?: import('../lib/professional-council').ProfessionalCouncilSnapshot | null;
    }) =>
      createPatientPrescription(
        storeId!,
        patientId!,
        input.values,
        input.professionalName,
        input.clinicName,
        input.council,
      ),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: (input: {
      prescriptionId: string;
      values: PatientPrescriptionFormValues;
      professionalName: string;
      clinicName?: string;
    }) =>
      updatePatientPrescription(
        storeId!,
        patientId!,
        input.prescriptionId,
        input.values,
        input.professionalName,
        input.clinicName,
      ),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (prescriptionId: string) =>
      deletePatientPrescription(storeId!, patientId!, prescriptionId),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deleteMutation };
}

export function usePatientCertificatesQuery(
  patientId: string | null,
  params: PatientCertificateListParams = {},
  enabled = true,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: certificateKeys.list(storeId ?? '', patientId ?? '', params),
    queryFn: () => listPatientCertificates(storeId!, patientId!, params),
    enabled: Boolean(storeId) && Boolean(patientId) && enabled,
    placeholderData: keepPreviousData,
  });
}

export function usePatientCertificateMutations(patientId: string | null) {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (!storeId || !patientId) return;
    void queryClient.invalidateQueries({
      queryKey: certificateKeys.all(storeId, patientId),
    });
  };

  const createMutation = useMutation({
    mutationFn: (input: {
      values: PatientCertificateFormValues;
      professionalName: string;
      clinicName?: string;
      council?: import('../lib/professional-council').ProfessionalCouncilSnapshot | null;
    }) =>
      createPatientCertificate(
        storeId!,
        patientId!,
        input.values,
        input.professionalName,
        input.clinicName,
        input.council,
      ),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (certificateId: string) =>
      deletePatientCertificate(storeId!, patientId!, certificateId),
    onSuccess: invalidate,
  });

  return { createMutation, deleteMutation };
}

export function getPatientDocumentsMutationErrorMessage(error: unknown): string {
  if (error instanceof ClinicaApiError) {
    return error.message;
  }

  return 'Não foi possível salvar o documento. Tente novamente.';
}
