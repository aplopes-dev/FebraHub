"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "@/ui";
import { toSaveCarrierPayload } from "@/features/carriers/api/carrier.mapper";
import {
  useCreateCarrierMutation,
  useUpdateCarrierMutation,
} from "@/features/carriers/hooks/use-carrier-mutations";
import { createEmptyCarrierFormValues } from "@/features/carriers/services/carrier.service";
import type { CarrierFormValues } from "@/features/carriers/types/carrier";

type UseCarrierFormOptions = {
  carrierId?: string;
  initialValues?: CarrierFormValues;
  onSaved?: () => void;
};

export function useCarrierForm({
  carrierId,
  initialValues,
  onSaved,
}: UseCarrierFormOptions = {}) {
  const initial = useMemo(
    () => initialValues ?? createEmptyCarrierFormValues(),
    [initialValues],
  );
  const [values, setValues] = useState<CarrierFormValues>(initial);
  const [baseline, setBaseline] = useState<CarrierFormValues>(initial);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);

  const createMutation = useCreateCarrierMutation();
  const updateMutation = useUpdateCarrierMutation();

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(baseline),
    [values, baseline],
  );

  const setField = useCallback(
    <K extends keyof CarrierFormValues>(
      key: K,
      value: CarrierFormValues[K],
    ) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const discard = useCallback(() => {
    setValues(baseline);
  }, [baseline]);

  const save = useCallback(() => {
    if (!values.tradeName.trim()) {
      toast.error("Informe o nome fantasia da transportadora.");
      return false;
    }

    // O documento é obrigatório na API (e validado como CPF/CNPJ): avisar
    // aqui evita que o usuário receba um 422 genérico depois de preencher tudo.
    if (!values.document.trim()) {
      toast.error("Informe o CNPJ ou CPF da transportadora.");
      return false;
    }

    const payload = toSaveCarrierPayload(values);
    const handlers = {
      onSuccess: () => {
        setBaseline(values);
        setHasSavedOnce(true);
        onSaved?.();
      },
    };

    if (carrierId) {
      updateMutation.mutate({ id: carrierId, payload }, handlers);
    } else {
      createMutation.mutate(payload, handlers);
    }

    return true;
  }, [carrierId, values, onSaved, createMutation, updateMutation]);

  return {
    values,
    setField,
    isDirty,
    hasSavedOnce,
    discard,
    save,
    isSaving: createMutation.isPending || updateMutation.isPending,
  };
}
