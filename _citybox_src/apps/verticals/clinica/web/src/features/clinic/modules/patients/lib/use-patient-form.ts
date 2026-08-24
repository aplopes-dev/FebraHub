'use client';

import { useCallback, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFormState } from 'react-hook-form';
import { PATIENT_FORM_INITIAL_VALUES } from './patient-form-initial-values';
import { patientFormSchema } from './patient-form.schema';
import {
  mapZodIssuesToPatientFormErrors,
  type PatientFormValidationResult,
} from './patient-form-validation';
import type { PatientFormErrors, PatientFormValues } from '../types/patient-form';

function mapFieldErrors(
  errors: ReturnType<typeof useForm<PatientFormValues>>['formState']['errors'],
): PatientFormErrors {
  const mapped: PatientFormErrors = {};
  for (const key of Object.keys(errors) as Array<keyof PatientFormValues>) {
    const message = errors[key]?.message;
    if (typeof message === 'string') {
      mapped[key] = message;
    }
  }
  return mapped;
}

export function usePatientForm() {
  const { watch, setValue, reset: resetForm, trigger, setError, getValues, control } =
    useForm<PatientFormValues>({
      resolver: zodResolver(patientFormSchema),
      defaultValues: PATIENT_FORM_INITIAL_VALUES,
      mode: 'onSubmit',
    });

  const { errors: formErrors } = useFormState({ control });

  const values = watch();

  const errors = useMemo(() => mapFieldErrors(formErrors), [formErrors]);

  const patch = useCallback(
    (partial: Partial<PatientFormValues>) => {
      for (const [key, value] of Object.entries(partial) as Array<
        [keyof PatientFormValues, PatientFormValues[keyof PatientFormValues]]
      >) {
        setValue(key, value, { shouldDirty: true, shouldValidate: false });
      }
    },
    [setValue],
  );

  const reset = useCallback(() => {
    resetForm(PATIENT_FORM_INITIAL_VALUES);
  }, [resetForm]);

  const initialize = useCallback(
    (next: PatientFormValues) => {
      resetForm(next);
    },
    [resetForm],
  );

  const validate = useCallback(async (): Promise<PatientFormValidationResult> => {
    const isValid = await trigger();
    if (isValid) {
      return { valid: true };
    }

    const parsed = patientFormSchema.safeParse(getValues());
    if (!parsed.success) {
      return { valid: false, errors: mapZodIssuesToPatientFormErrors(parsed.error) };
    }

    return { valid: false, errors: mapFieldErrors(formErrors) };
  }, [formErrors, getValues, trigger]);

  const setFieldError = useCallback(
    (field: keyof PatientFormValues, message: string) => {
      setError(field, { message });
    },
    [setError],
  );

  return {
    values,
    errors,
    patch,
    reset,
    initialize,
    validate,
    setFieldError,
    getValues,
  };
}
