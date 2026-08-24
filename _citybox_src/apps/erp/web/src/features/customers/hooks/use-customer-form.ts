"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "@citybox/mui";
import { toSaveCustomerPayload } from "@/features/customers/api/customer.mapper";
import {
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
} from "@/features/customers/hooks/use-customer-mutations";
import { createEmptyCustomerFormValues } from "@/features/customers/services/customer.service";
import type { CustomerFormValues } from "@/features/customers/types/customer-form";

type UseCustomerFormOptions = {
  customerId?: string;
  initialValues?: CustomerFormValues;
  onSaved?: () => void;
};

export function useCustomerForm({
  customerId,
  initialValues,
  onSaved,
}: UseCustomerFormOptions = {}) {
  const initial = useMemo(
    () => initialValues ?? createEmptyCustomerFormValues(),
    [initialValues],
  );
  const [values, setValues] = useState<CustomerFormValues>(initial);
  const [baseline, setBaseline] = useState<CustomerFormValues>(initial);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);

  const createMutation = useCreateCustomerMutation();
  const updateMutation = useUpdateCustomerMutation();

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(baseline),
    [values, baseline],
  );

  const setField = useCallback(
    <K extends keyof CustomerFormValues>(
      key: K,
      value: CustomerFormValues[K],
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
      toast.error("Informe o nome do cliente.");
      return false;
    }

    const payload = toSaveCustomerPayload(values);
    const handlers = {
      onSuccess: () => {
        setBaseline(values);
        setHasSavedOnce(true);
        onSaved?.();
      },
    };

    if (customerId) {
      updateMutation.mutate({ id: customerId, payload }, handlers);
    } else {
      createMutation.mutate(payload, handlers);
    }

    return true;
  }, [customerId, values, onSaved, createMutation, updateMutation]);

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
