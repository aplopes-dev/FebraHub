'use client';

import { useCallback, useState } from 'react';
import {
  createClinicPlanFormFromPlan,
  createEmptyClinicPlanForm,
} from './clinic-plan-form-initial-values';
import type { ClinicPlan } from '../types/clinic-plan';
import type {
  ClinicPlanFormData,
  ClinicPlanFormErrors,
  ClinicPlanFormPatch,
} from '../types/clinic-plan-form';

type SubmitOptions = {
  isEditing?: boolean;
  step?: 'initial' | 'configure';
};

function validateClinicPlanForm(
  values: ClinicPlanFormData,
  options: SubmitOptions = {},
): ClinicPlanFormErrors {
  const errors: ClinicPlanFormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Informe o nome do plano.';
  }

  if (
    options.step !== 'configure' &&
    !options.isEditing &&
    !values.treatmentInit
  ) {
    errors.treatmentInit = 'Selecione uma opção de configuração inicial dos procedimentos.';
  }

  return errors;
}

export function useClinicPlanForm() {
  const [values, setValues] = useState<ClinicPlanFormData>(createEmptyClinicPlanForm);
  const [errors, setErrors] = useState<ClinicPlanFormErrors>({});

  const patch = useCallback((patchValues: ClinicPlanFormPatch) => {
    setValues((current) => ({ ...current, ...patchValues }));

    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patchValues) as Array<keyof ClinicPlanFormErrors>) {
        if (key in next) {
          delete next[key];
        }
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setValues(createEmptyClinicPlanForm());
    setErrors({});
  }, []);

  const initializeFromPlan = useCallback((plan: ClinicPlan) => {
    setValues(createClinicPlanFormFromPlan(plan));
    setErrors({});
  }, []);

  const validateInitial = useCallback(
    (options: SubmitOptions = {}) => {
      const validationErrors = validateClinicPlanForm(values, { ...options, step: 'initial' });
      setErrors(validationErrors);
      return Object.keys(validationErrors).length === 0;
    },
    [values],
  );

  const submit = useCallback((options: SubmitOptions = {}) => {
    const validationErrors = validateClinicPlanForm(values, {
      ...options,
      step: options.step ?? 'configure',
    });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }

    setErrors({});
    return true;
  }, [values]);

  return {
    values,
    errors,
    patch,
    reset,
    initializeFromPlan,
    validateInitial,
    submit,
  };
}
