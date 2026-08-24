"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "@citybox/mui";
import {
  toCreateBranchPayload,
  toUpdateBranchPayload,
} from "@/features/branches/api/branch.mapper";
import {
  useCreateBranchMutation,
  useUpdateBranchMutation,
} from "@/features/branches/hooks/use-branch-mutations";
import {
  createEmptyBranchFormValues,
  documentLabel,
  type BranchAddress,
  type BranchFormValues,
} from "@/features/branches/types/branch";

type UseBranchFormOptions = {
  branchId?: string;
  initialValues?: BranchFormValues;
  onSaved?: () => void;
};

export function useBranchForm({
  branchId,
  initialValues,
  onSaved,
}: UseBranchFormOptions = {}) {
  const initial = useMemo(
    () => initialValues ?? createEmptyBranchFormValues(),
    [initialValues],
  );
  const [values, setValues] = useState<BranchFormValues>(initial);
  const [baseline, setBaseline] = useState<BranchFormValues>(initial);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);

  const createMutation = useCreateBranchMutation();
  const updateMutation = useUpdateBranchMutation();

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(baseline),
    [values, baseline],
  );

  const setField = useCallback(
    <Key extends keyof BranchFormValues>(
      key: Key,
      value: BranchFormValues[Key],
    ) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const setAddressField = useCallback(
    <Key extends keyof BranchAddress>(key: Key, value: BranchAddress[Key]) => {
      setValues((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }));
    },
    [],
  );

  const discard = useCallback(() => {
    setValues(baseline);
  }, [baseline]);

  const save = useCallback(() => {
    // Validar aqui evita que o usuário receba um 400/422 genérico depois de
    // preencher a tela inteira — a API exige código, documento e razão social.
    if (!values.code.trim()) {
      toast.error("Informe o código da unidade.");
      return false;
    }

    if (!values.legalName.trim()) {
      toast.error("Informe a razão social da unidade.");
      return false;
    }

    if (!values.document.trim()) {
      toast.error(`Informe o ${documentLabel(values.personType)} da unidade.`);
      return false;
    }

    const handlers = {
      onSuccess: () => {
        setBaseline(values);
        setHasSavedOnce(true);
        onSaved?.();
      },
    };

    if (branchId) {
      updateMutation.mutate(
        { id: branchId, payload: toUpdateBranchPayload(values) },
        handlers,
      );
    } else {
      createMutation.mutate(toCreateBranchPayload(values), handlers);
    }

    return true;
  }, [branchId, values, onSaved, createMutation, updateMutation]);

  return {
    values,
    setField,
    setAddressField,
    isDirty,
    hasSavedOnce,
    discard,
    save,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isEditing: Boolean(branchId),
  };
}

export type BranchFormApi = ReturnType<typeof useBranchForm>;
