'use client';

import { useCallback, useState } from 'react';
import {
  createClinicContractFormFromTemplate,
  createEmptyClinicContractForm,
} from './clinic-contract-form-initial-values';
import type { ClinicContractTemplate } from '../types/clinic-contract';
import type {
  ClinicContractFormData,
  ClinicContractFormErrors,
  ClinicContractFormPatch,
} from '../types/clinic-contract-form';

function validateClinicContractForm(values: ClinicContractFormData): ClinicContractFormErrors {
  const errors: ClinicContractFormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Informe o nome do modelo.';
  }

  return errors;
}

export function useClinicContractForm() {
  const [values, setValues] = useState<ClinicContractFormData>(createEmptyClinicContractForm);
  const [errors, setErrors] = useState<ClinicContractFormErrors>({});

  const patch = useCallback((patchValues: ClinicContractFormPatch) => {
    setValues((current) => ({ ...current, ...patchValues }));

    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patchValues) as Array<keyof ClinicContractFormErrors>) {
        if (key in next) {
          delete next[key];
        }
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setValues(createEmptyClinicContractForm());
    setErrors({});
  }, []);

  const initializeFromTemplate = useCallback((template: ClinicContractTemplate) => {
    setValues(createClinicContractFormFromTemplate(template));
    setErrors({});
  }, []);

  const submit = useCallback(() => {
    const validationErrors = validateClinicContractForm(values);
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
    initializeFromTemplate,
    submit,
  };
}
