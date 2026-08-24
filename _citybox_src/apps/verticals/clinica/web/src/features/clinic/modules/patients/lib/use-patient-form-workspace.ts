'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store-context';
import { mapClinicPatientToFormValues } from './map-clinic-patient-to-form-values';
import { usePatientCategories } from './use-patient-categories';
import { usePatientReferralOrigins } from './use-patient-referral-origins';
import { usePatientExternalProfessionals } from './use-patient-external-professionals';
import { usePatientForm } from './use-patient-form';
import { usePatientPlanOptions } from './use-patient-plan-options';
import { usePatientDetailQuery } from '../hooks/use-patient-detail-query';
import type { ClinicPatient } from '../types/clinic-patient';

type UsePatientFormWorkspaceOptions = {
  open: boolean;
  patient?: ClinicPatient | null;
};

export function usePatientFormWorkspace({ open, patient = null }: UsePatientFormWorkspaceOptions) {
  const { storeId } = useStore();
  const { values, errors, patch, reset, initialize, validate, setFieldError, getValues } =
    usePatientForm();
  const { categories, addCategory } = usePatientCategories();
  const { referralOrigins, addReferralOrigin } = usePatientReferralOrigins();
  const { externalProfessionals, addExternalProfessional, updateExternalProfessional, deleteExternalProfessional } =
    usePatientExternalProfessionals();
  const { plans, defaultPlanId, isLoading: isPlansLoading } = usePatientPlanOptions();
  const isEditing = patient !== null;
  const detailQuery = usePatientDetailQuery(
    storeId,
    patient?.id ?? null,
    open && isEditing,
  );

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }

    if (!isEditing) {
      reset();
    }
  }, [isEditing, open, reset]);

  useEffect(() => {
    if (!open || !isEditing || !detailQuery.data) {
      return;
    }

    initialize(detailQuery.data.form);
  }, [detailQuery.data, initialize, isEditing, open]);

  useEffect(() => {
    if (!open || isEditing || isPlansLoading || !defaultPlanId || values.planId) {
      return;
    }

    patch({ planId: defaultPlanId });
  }, [defaultPlanId, isEditing, isPlansLoading, open, patch, values.planId]);

  useEffect(() => {
    if (!open || isEditing || categories.length === 0 || values.categoryId) {
      return;
    }

    const defaultCategory =
      categories.find((category) => category.isProtected) ?? categories[0];
    if (defaultCategory) {
      patch({ categoryId: defaultCategory.id });
    }
  }, [categories, isEditing, open, patch, values.categoryId]);

  useEffect(() => {
    if (!open || !isEditing || !patient || detailQuery.data || detailQuery.isLoading) {
      return;
    }

    initialize(mapClinicPatientToFormValues(patient, plans));
  }, [
    detailQuery.data,
    detailQuery.isLoading,
    initialize,
    isEditing,
    open,
    patient,
    plans,
  ]);

  return {
    values,
    errors,
    patch,
    reset,
    initialize,
    validate,
    setFieldError,
    getValues,
    categories,
    addCategory,
    referralOrigins,
    addReferralOrigin,
    externalProfessionals,
    addExternalProfessional,
    updateExternalProfessional,
    deleteExternalProfessional,
    plans,
    isPlansLoading: isPlansLoading || (isEditing && detailQuery.isLoading),
    isEditing,
  };
}
