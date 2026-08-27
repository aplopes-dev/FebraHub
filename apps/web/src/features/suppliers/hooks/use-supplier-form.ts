"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "@/ui";
import { toSaveSupplierPayload } from "@/features/suppliers/api/supplier.mapper";
import {
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
} from "@/features/suppliers/hooks/use-supplier-mutations";
import { createEmptySupplierFormValues } from "@/features/suppliers/services/supplier.service";
import type { SupplierFormValues } from "@/features/suppliers/types/supplier";

type UseSupplierFormOptions = {
  supplierId?: string;
  initialValues?: SupplierFormValues;
  onSaved?: () => void;
};

export function useSupplierForm({
  supplierId,
  initialValues,
  onSaved,
}: UseSupplierFormOptions = {}) {
  const initial = useMemo(
    () => initialValues ?? createEmptySupplierFormValues(),
    [initialValues],
  );
  const [values, setValues] = useState<SupplierFormValues>(initial);
  const [baseline, setBaseline] = useState<SupplierFormValues>(initial);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);

  const createMutation = useCreateSupplierMutation();
  const updateMutation = useUpdateSupplierMutation();

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(baseline),
    [values, baseline],
  );

  const setField = useCallback(
    <K extends keyof SupplierFormValues>(
      key: K,
      value: SupplierFormValues[K],
    ) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const discard = useCallback(() => {
    setValues(baseline);
  }, [baseline]);

  const save = useCallback(() => {
    if (!values.name.trim()) {
      toast.error("Informe o nome do fornecedor.");
      return false;
    }

    // O documento é obrigatório na API (e validado como CPF/CNPJ): avisar aqui
    // evita que o usuário receba um 422 genérico depois de preencher tudo.
    if (!values.document.trim()) {
      toast.error("Informe o CNPJ ou CPF do fornecedor.");
      return false;
    }

    const payload = toSaveSupplierPayload(values);
    const handlers = {
      onSuccess: () => {
        setBaseline(values);
        setHasSavedOnce(true);
        onSaved?.();
      },
    };

    if (supplierId) {
      updateMutation.mutate({ id: supplierId, payload }, handlers);
    } else {
      createMutation.mutate(payload, handlers);
    }

    return true;
  }, [supplierId, values, onSaved, createMutation, updateMutation]);

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
