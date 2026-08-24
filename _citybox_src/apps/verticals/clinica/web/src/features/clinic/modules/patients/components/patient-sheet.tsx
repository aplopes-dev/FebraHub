'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { PatientForm } from './patient-form';
import { PatientFormSheetFrame } from './patient-form-sheet-frame';
import { getPatientMutationErrorMessage } from '../hooks/use-patient-mutations';
import { buildPatientFormValidationToastMessage } from '../lib/patient-form-validation';
import { usePatientFormWorkspace } from '../lib/use-patient-form-workspace';
import type { PatientFormValues } from '../types/patient-form';

type PatientSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting?: boolean;
  onSubmit?: (values: PatientFormValues) => Promise<void>;
};

export function PatientSheet({
  open,
  onOpenChange,
  isSubmitting = false,
  onSubmit,
}: PatientSheetProps) {
  const {
    values,
    errors,
    patch,
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
    isPlansLoading,
  } = usePatientFormWorkspace({ open });
  const [errorFocusToken, setErrorFocusToken] = useState(0);

  const handleSave = async () => {
    const result = await validate();
    if (!result.valid) {
      setErrorFocusToken((current) => current + 1);
      toast.error(buildPatientFormValidationToastMessage(result.errors));
      return;
    }

    try {
      await onSubmit?.(getValues());
      onOpenChange(false);
    } catch (error) {
      const { message, field } = getPatientMutationErrorMessage(error);
      if (field) {
        setFieldError(field, message);
      }
    }
  };

  return (
    <PatientFormSheetFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Novo paciente"
      isSubmitting={isSubmitting}
      saveLabel="Salvar paciente"
      onSave={() => void handleSave()}
    >
      <PatientForm
        values={values}
        errors={errors}
        errorFocusToken={errorFocusToken}
        categories={categories}
        referralOrigins={referralOrigins}
        externalProfessionals={externalProfessionals}
        plans={plans}
        isPlansLoading={isPlansLoading}
        disabled={isSubmitting}
        onPatch={patch}
        onCreateCategory={addCategory}
        onCreateReferralOrigin={addReferralOrigin}
        onCreateExternalProfessional={addExternalProfessional}
        onUpdateExternalProfessional={updateExternalProfessional}
        onDeleteExternalProfessional={deleteExternalProfessional}
      />
    </PatientFormSheetFrame>
  );
}
