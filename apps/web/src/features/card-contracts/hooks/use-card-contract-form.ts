"use client";

import { useCallback, useState } from "react";
import { toast } from "@/ui";
import {
  createEmptyCardContractFormValues,
  toSaveCardContractPayload,
} from "@/features/card-contracts/api/card-contract.mapper";
import { useCreateCardContractMutation } from "@/features/card-contracts/hooks/use-card-contract-mutations";
import type { CardContractFormValues } from "@/features/card-contracts/types/card-contract";

type UseCardContractFormOptions = {
  onSaved?: () => void;
};

export function useCardContractForm({
  onSaved,
}: UseCardContractFormOptions = {}) {
  const [values, setValues] = useState<CardContractFormValues>(
    createEmptyCardContractFormValues,
  );
  const [baseline, setBaseline] = useState<CardContractFormValues>(
    createEmptyCardContractFormValues,
  );
  const [hasSavedOnce, setHasSavedOnce] = useState(false);

  const createMutation = useCreateCardContractMutation();

  const isDirty = JSON.stringify(values) !== JSON.stringify(baseline);

  function setField<K extends keyof CardContractFormValues>(
    key: K,
    value: CardContractFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const discard = useCallback(() => {
    setValues(baseline);
  }, [baseline]);

  const save = useCallback(() => {
    if (!values.provider.trim()) {
      toast.error("Informe o provedor do contrato.");
      return false;
    }

    const payload = toSaveCardContractPayload(values);
    createMutation.mutate(payload, {
      onSuccess: () => {
        setBaseline(values);
        setHasSavedOnce(true);
        onSaved?.();
      },
    });

    return true;
  }, [values, createMutation, onSaved]);

  return {
    values,
    setField,
    isDirty,
    hasSavedOnce,
    discard,
    save,
    isSaving: createMutation.isPending,
  };
}
