"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "@citybox/mui";
import { useCreateProductionOrderMutation } from "@/features/production/hooks/use-production-mutations";
import type { ProductionOrderFormValues } from "@/features/production/types/production";

type UseProductionOrderFormOptions = {
  onCreated?: () => void;
};

function createEmptyValues(): ProductionOrderFormValues {
  return {
    productId: "",
    plannedQuantity: 1,
    sourceStockId: "",
    destinationStockId: "",
    expectedDate: "",
  };
}

export function useProductionOrderForm({
  onCreated,
}: UseProductionOrderFormOptions = {}) {
  const initial = useMemo(() => createEmptyValues(), []);
  const [values, setValues] = useState<ProductionOrderFormValues>(initial);
  const [baseline] = useState<ProductionOrderFormValues>(initial);
  const createMutation = useCreateProductionOrderMutation();

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(baseline),
    [values, baseline],
  );

  const setField = useCallback(
    <K extends keyof ProductionOrderFormValues>(
      key: K,
      value: ProductionOrderFormValues[K],
    ) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const submit = useCallback(() => {
    if (!values.productId) {
      toast.error("Selecione o produto a produzir.");
      return;
    }
    if (!values.plannedQuantity || values.plannedQuantity <= 0) {
      toast.error("Informe a quantidade a produzir.");
      return;
    }
    if (!values.sourceStockId || !values.destinationStockId) {
      toast.error("Selecione os estoques de origem e destino.");
      return;
    }
    if (!values.expectedDate) {
      toast.error("Selecione a data de previsão.");
      return;
    }

    createMutation.mutate(values, {
      onSuccess: () => onCreated?.(),
    });
  }, [values, onCreated, createMutation]);

  return {
    values,
    setField,
    isDirty,
    submit,
    isSubmitting: createMutation.isPending,
  };
}
