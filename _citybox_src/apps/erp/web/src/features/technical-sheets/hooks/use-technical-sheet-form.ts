"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  areTechnicalSheetFormValuesEqual,
  createEmptyTechnicalSheetFormValues,
} from "@/features/technical-sheets/lib/technical-sheet-form-values";
import type { TechnicalSheetFormValues } from "@/features/technical-sheets/types/technical-sheet";

type UseTechnicalSheetFormOptions = {
  initialValues?: TechnicalSheetFormValues;
  onSave?: (values: TechnicalSheetFormValues) => Promise<void> | void;
};

export function useTechnicalSheetForm(
  options: UseTechnicalSheetFormOptions = {},
) {
  const initial =
    options.initialValues ?? createEmptyTechnicalSheetFormValues();
  const [values, setValues] = useState<TechnicalSheetFormValues>(initial);
  const [baseline, setBaseline] = useState<TechnicalSheetFormValues>(initial);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const onSaveRef = useRef(options.onSave);
  onSaveRef.current = options.onSave;

  const isDirty = useMemo(
    () => !areTechnicalSheetFormValuesEqual(values, baseline),
    [values, baseline],
  );

  const setField = useCallback(
    <K extends keyof TechnicalSheetFormValues>(
      key: K,
      value: TechnicalSheetFormValues[K],
    ) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const discard = useCallback(() => {
    setValues({ ...baseline });
  }, [baseline]);

  const save = useCallback(async () => {
    const onSave = onSaveRef.current;
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(values);
      setBaseline({ ...values });
      setHasSavedOnce(true);
    } finally {
      setIsSaving(false);
    }
  }, [values]);

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
