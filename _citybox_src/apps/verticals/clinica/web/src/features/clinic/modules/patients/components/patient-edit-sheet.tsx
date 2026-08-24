'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { PatientForm } from './patient-form';
import { PatientFormSheetFrame } from './patient-form-sheet-frame';
import { getPatientMutationErrorMessage } from '../hooks/use-patient-mutations';
import { buildPatientFormValidationToastMessage } from '../lib/patient-form-validation';
import { usePatientFormWorkspace } from '../lib/use-patient-form-workspace';
import type { ClinicPatient } from '../types/clinic-patient';
import type { PatientFormValues } from '../types/patient-form';

export type PatientEditSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: ClinicPatient | null;
  isSubmitting?: boolean;
  onSubmit?: (patientId: string, values: PatientFormValues) => Promise<void>;
};

/** Sheet independente para edição de paciente — reutilizável em qualquer tela. */
export function PatientEditSheet({
  open,
  onOpenChange,
  patient,
  isSubmitting = false,
  onSubmit,
}: PatientEditSheetProps) {
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
  } = usePatientFormWorkspace({ open, patient });
  const [errorFocusToken, setErrorFocusToken] = useState(0);

  const handleSave = async () => {
    if (!patient) return;

    const result = await validate();
    if (!result.valid) {
      setErrorFocusToken((current) => current + 1);
      toast.error(buildPatientFormValidationToastMessage(result.errors));
      return;
    }

    try {
      await onSubmit?.(patient.id, getValues());
      onOpenChange(false);
    } catch (error) {
      const { message, field } = getPatientMutationErrorMessage(error);
      if (field) {
        setFieldError(field, message);
      }
    }
  };

  if (!patient) {
    return null;
  }

  return (
    <PatientFormSheetFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Editar paciente"
      isSubmitting={isSubmitting}
      saveLabel="Salvar alterações"
      onSave={() => void handleSave()}
    >
      <PatientForm
        key={patient.id}
        values={values}
        errors={errors}
        errorFocusToken={errorFocusToken}
        categories={categories}
        referralOrigins={referralOrigins}
        externalProfessionals={externalProfessionals}
        plans={plans}
        isPlansLoading={isPlansLoading}
        disabled={isSubmitting || isPlansLoading}
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
