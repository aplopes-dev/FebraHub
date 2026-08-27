"use client";

import { useCallback, useMemo, useState } from "react";
import {
  areFiscalParametersFormValuesEqual,
  createEmptyFiscalParametersFormValues,
} from "@/features/fiscal-parameters/lib/fiscal-parameters-form-values";
import type { FiscalParametersFormValues } from "@/features/fiscal-parameters/types/fiscal-parameters";

type UseFiscalParametersFormOptions = {
  initialValues?: FiscalParametersFormValues;
  onSave?: (values: FiscalParametersFormValues) => Promise<void> | void;
};

export function useFiscalParametersForm(
  options: UseFiscalParametersFormOptions = {},
) {
  const initial =
    options.initialValues ?? createEmptyFiscalParametersFormValues();
  const [values, setValues] = useState<FiscalParametersFormValues>(initial);
  const [baseline, setBaseline] =
    useState<FiscalParametersFormValues>(initial);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = useMemo(
    () => !areFiscalParametersFormValuesEqual(values, baseline),
    [values, baseline],
  );

  const setField = useCallback(
    <K extends keyof FiscalParametersFormValues>(
      key: K,
      value: FiscalParametersFormValues[K],
    ) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const discard = useCallback(() => {
    setValues({ ...baseline });
  }, [baseline]);

  const save = useCallback(async () => {
    if (!options.onSave) {
      setBaseline({ ...values });
      setHasSavedOnce(true);
      return;
    }
    setIsSaving(true);
    try {
      await options.onSave(values);
      setBaseline({ ...values });
      setHasSavedOnce(true);
    } finally {
      setIsSaving(false);
    }
  }, [options, values]);

  return {
    values,
    setField,
    isDirty,
    hasSavedOnce,
    isSaving,
    discard,
    save,
  };
}
